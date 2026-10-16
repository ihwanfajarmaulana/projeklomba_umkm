// Smoke test matriks rute.
//
// Tujuan: satu perintah yang menjawab "apakah aplikasinya masih hidup?" —
// setiap rute penting mengembalikan status dan isi yang benar. Berbeda dari
// scripts/verify-*.ps1 yang menembus Server Action dan database, di sini cukup
// permintaan HTTP biasa, jadi bisa dijalankan di environment apa pun (termasuk
// CI Linux) tanpa Docker, Supabase, atau dependency baru.
//
// Yang diperiksa:
//
//   1. Anonim      — halaman publik merender, 404 memakai UI kustom.
//   2. Penjaga     — rute terproteksi mengalihkan ke /login?next=... (diputus
//                    oleh proxy, jadi tidak butuh sesi).
//   3. Per peran   — dengan sesi seed asli, dashboard tiap peran terbuka dan
//                    halaman peran lain tidak bocor.
//
// Pemakaian:
//
//   npm run smoke                     # semua pemeriksaan
//   SMOKE_BASE_URL=http://host:3000 npm run smoke
//   SMOKE_NO_DATA=1 npm run smoke     # lewati halaman berdata (mis. di CI
//                                     # tanpa Supabase sungguhan)
//   SMOKE_NO_AUTH=1 npm run smoke     # lewati bagian peran
//
// Kredensial diambil dari .env.local (URL + publishable key) dan dari akun
// seed di supabase/seed.sql. Tidak ada rahasia yang dicetak.

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ------------------------------------------------------------------ config ---

// 127.0.0.1, bukan "localhost": Node di Windows kadang memilih ::1 sementara
// server hanya mendengarkan IPv4, yang muncul sebagai ECONNREFUSED palsu.
const BASE = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const SKIP_DATA = process.env.SMOKE_NO_DATA === "1";
const SKIP_AUTH = process.env.SMOKE_NO_AUTH === "1";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "kolab12345";

// ------------------------------------------------------------------ .env.local ---

/**
 * Parser .env.local seadanya. Cukup untuk `KEY=value` dan `KEY="value"`, dan
 * sengaja tidak mengeksekusi apa pun — nilainya tidak pernah dicetak.
 */
function loadEnvLocal() {
  const path = fileURLToPath(new URL("../.env.local", import.meta.url));
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

const envFile = loadEnvLocal();
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || envFile.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  envFile.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";
const canAuthenticate = Boolean(supabaseUrl && supabaseKey) && !SKIP_AUTH;

// ------------------------------------------------------------------ http ---

/**
 * HTTP GET yang tidak pernah melempar. `redirect: "manual"` supaya pengalihan
 * terlihat sebagai 307 + Location, bukan diikuti diam-diam menjadi 200.
 */
async function get(path, cookie) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  try {
    const response = await fetch(`${BASE}${path}`, {
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
    });
    const body = await response.text();
    return {
      status: response.status,
      location: response.headers.get("location") ?? "",
      title: (body.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "").trim(),
      body,
    };
  } catch (error) {
    return { status: 0, location: "", title: "", body: "", error: String(error) };
  }
}

/** Tunggu sampai server menjawab, karena `next dev` mengompilasi saat request pertama. */
async function waitForServer(timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const probe = await get("/login");
    if (probe.status > 0) return true;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

// ------------------------------------------------------------------ auth ---

function cookieName() {
  if (process.env.SMOKE_COOKIE_NAME) return process.env.SMOKE_COOKIE_NAME;
  const host = new URL(supabaseUrl).hostname; // 127.0.0.1 -> "127"
  return `sb-${host.split(".")[0]}-auth-token`;
}

/**
 * Membangun cookie sesi SSR dari token GoTrue, sama seperti
 * scripts/sign-in-as.ps1: `base64-` + base64(JSON sesi). Hanya bentuk inilah
 * yang dikenali @supabase/ssr.
 */
async function signIn(email) {
  let response;
  try {
    response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: supabaseKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: PASSWORD }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    const code = error?.cause?.code ?? error?.name ?? "unknown";
    throw new Error(`tidak bisa menghubungi GoTrue di ${supabaseUrl} (${code})`);
  }
  const token = await response.json();
  if (!token.access_token) {
    throw new Error(
      `gagal masuk sebagai ${email}: ${token.error_description ?? token.msg ?? response.status}`,
    );
  }
  const session = JSON.stringify({
    access_token: token.access_token,
    token_type: token.token_type,
    expires_in: token.expires_in,
    expires_at: token.expires_at,
    refresh_token: token.refresh_token,
    user: token.user,
  });
  return `${cookieName()}=base64-${Buffer.from(session, "utf8").toString("base64")}`;
}

/**
 * Apakah GoTrue lokal hidup? Dipakai untuk memutuskan melewati bagian peran
 * dengan jujur, bukan menandainya gagal: smoke test tidak boleh merah hanya
 * karena Docker/Supabase belum dinyalakan.
 */
async function gotrueReachable() {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseKey },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ matriks ---

// Halaman publik. `data: true` menandai yang membaca database, jadi dilewati
// saat SMOKE_NO_DATA=1 (di CI tanpa Supabase sungguhan).
const PUBLIC = [
  { path: "/", expect: 200, body: "UMKM naik kelas", data: true },
  { path: "/influencers", expect: 200, body: "Cari Kreator", data: true },
  { path: "/insights", expect: 200, body: "Wawasan Harga", data: true },
  { path: "/login", expect: 200, body: "Masuk ke" },
  { path: "/signup", expect: 200, body: "Buat akun" },
  {
    path: "/halaman-tidak-ada-xyz",
    expect: 404,
    body: "Halaman tidak ditemukan",
  },
];

// Rute terproteksi: proxy mengalihkan tanpa sesi, sebelum halaman dirender.
const GUARDS = [
  "/dashboard",
  "/dashboard/influencer",
  "/dashboard/riwayat",
  "/admin",
  "/admin/kasus",
  "/booking/1",
  "/review/1",
];

// Peran seed. `pages` harus terbuka; `forbidden` harus TIDAK memperlihatkan
// penanda peran lain (isi peran lain bocor kalau penanda itu ditemukan).
const ROLES = [
  {
    label: "umkm",
    email: "budi@kolab.id",
    pages: [
      { path: "/dashboard", title: "Dashboard UMKM" },
      { path: "/dashboard/riwayat" },
      { path: "/influencers", body: "Cari Kreator" },
    ],
    forbidden: [{ path: "/admin", marker: "Dashboard Admin" }],
  },
  {
    label: "influencer",
    email: "rara@kolab.id",
    pages: [{ path: "/dashboard/influencer", title: "Dashboard Kreator" }],
    forbidden: [{ path: "/dashboard", marker: "Dashboard UMKM" }],
  },
  {
    label: "admin",
    email: "admin@kolab.id",
    pages: [
      { path: "/admin", title: "Dashboard Admin" },
      { path: "/admin/kasus" },
    ],
    forbidden: [],
  },
];

// ------------------------------------------------------------------ laporan ---

let checks = 0;
let failures = 0;

function report(label, ok, detail) {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label.padEnd(26)} ${detail}`);
}

function locationPath(location) {
  if (!location) return "";
  try {
    const url = new URL(location, BASE);
    return `${url.pathname}${url.search}`;
  } catch {
    return location;
  }
}

// ------------------------------------------------------------------ jalan ---

async function main() {
  console.log("Kolab.id — smoke test matriks rute");
  console.log(`base: ${BASE}`);
  if (SKIP_DATA) console.log("(SMOKE_NO_DATA=1: halaman berdata dilewati)");
  if (SKIP_AUTH) console.log("(bagian peran dilewati)");
  console.log("");

  if (!(await waitForServer())) {
    console.error(`Server tidak menjawab di ${BASE}. Jalankan \`npm run dev\` dulu.`);
    process.exit(2);
  }

  // 1. Anonim.
  console.log("Anonim");
  for (const check of PUBLIC) {
    if (check.data && SKIP_DATA) continue;
    const result = await get(check.path);
    const ok =
      result.status === check.expect &&
      (!check.body || result.body.includes(check.body));
    report(
      `GET ${check.path}`,
      ok,
      `${result.status}${check.body ? ` body~"${check.body}"` : ""}${
        result.error ? ` ${result.error}` : ""
      }`,
    );
  }

  // 2. Penjaga rute (tanpa sesi).
  console.log("");
  console.log("Penjaga rute (tanpa sesi)");
  for (const path of GUARDS) {
    const result = await get(path);
    const expected = `/login?next=${encodeURIComponent(path)}`;
    const actual = locationPath(result.location);
    report(`GET ${path}`, result.status === 307 && actual === expected, `${result.status} -> ${actual}`);
  }

  // 3. Per peran.
  const authReady = canAuthenticate && (await gotrueReachable());
  if (authReady) {
    console.log("");
    console.log("Per peran");
    for (const role of ROLES) {
      let cookie;
      try {
        cookie = await signIn(role.email);
      } catch (error) {
        report(`masuk ${role.label}`, false, String(error.message ?? error));
        continue;
      }
      console.log(`  — ${role.label} (${role.email})`);

      for (const page of role.pages) {
        const result = await get(page.path, cookie);
        const ok =
          result.status === 200 &&
          (!page.title || result.title.includes(page.title)) &&
          (!page.body || result.body.includes(page.body));
        report(
          `GET ${page.path}`,
          ok,
          `${result.status}${page.title ? ` title~"${page.title}"` : ""}`,
        );
      }

      for (const deny of role.forbidden) {
        const result = await get(deny.path, cookie);
        // Boleh 200 (pengalihan sisi klien) atau 307; yang penting isi peran
        // lain tidak pernah terkirim.
        const ok = !result.body.includes(deny.marker);
        report(
          `GET ${deny.path} (ditolak)`,
          ok,
          `${result.status} tanpa "${deny.marker}"`,
        );
      }
    }
  } else {
    const reason = SKIP_AUTH
      ? "SMOKE_NO_AUTH=1"
      : !canAuthenticate
        ? "URL/key Supabase tidak ditemukan"
        : `GoTrue tidak terjangkau di ${supabaseUrl}; jalankan \`npx supabase start\` untuk ikut memeriksa peran`;
    console.log("");
    console.log(`Per peran: dilewati (${reason}).`);
  }

  console.log("");
  if (failures === 0) {
    console.log(`LULUS — ${checks} pemeriksaan.`);
    process.exit(0);
  }
  console.log(`GAGAL — ${failures} dari ${checks} pemeriksaan.`);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
