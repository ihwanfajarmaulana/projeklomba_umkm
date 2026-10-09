"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  DASHBOARD_BY_ROLE,
  getUser,
  getUserContext,
  requireInfluencer,
  requireParty,
  requireRole,
  requireUmkm,
} from "@/lib/auth";
import { getBookingById, hasReviewed } from "@/lib/data/bookings";
import { getAdminCase, getDisputeForBooking } from "@/lib/data/disputes";
import type { DisputeDecision } from "@/lib/data/disputes";
import type { AuthFormState } from "@/lib/form-state";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import type { Booking, OfferType, PartyRole } from "@/lib/types";
import { BRIEF_MAX, BRIEF_MIN } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Bentuk hasil form                                                  */
/*                                                                  */
/* Every action below reports failure by *returning* a value, never by */
/* throwing. A Server Action that throws renders the error boundary,  */
/* which tells a visitor nothing about which field was wrong. A       */
/* returned error is bound to the form by useActionState and rendered  */
/* next to the input.                                                  */
/* ------------------------------------------------------------------ */

const failed = (error: string): AuthFormState => ({ error, notice: null });

/** DEMO_PASSWORD is the credential supabase/seed.sql writes into its rows. */
const DEMO_PASSWORD = "kolab12345";

/**
 * Where to send a caller who just signed in.
 *
 * Only same-origin paths are honoured, and `//host` is rejected outright: a
 * value like `//evil.example` is a protocol-relative URL, so passing it to
 * redirect() would bounce a freshly authenticated visitor off-site. The
 * session cookie is the prize, and it is not SameSite=strict.
 */
function safeNext(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

/* ------------------------------------------------------------------ */
/* Masuk                                                              */
/* ------------------------------------------------------------------ */

export async function signIn(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return failed("Isi email dan kata sandi dulu.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // GoTrue reports an unconfirmed address as a failed credential check. Saying
  // "wrong password" there would send the visitor round a loop they cannot
  // escape, so the two are told apart.
  if (error) {
    if (/not confirmed|email not confirmed/i.test(error.message)) {
      return failed(
        "Alamat ini belum dikonfirmasi. Cek email kamu untuk tautan konfirmasi.",
      );
    }
    return failed("Email atau kata sandi tidak cocok.");
  }

  if (!data.user) return failed("Email atau kata sandi tidak cocok.");

  // Read the profile through the client that just signed in, rather than
  // calling requireUser() and going back to the cookie store: the session was
  // established moments ago in this same request, and re-reading cookies to
  // prove it we already have would be a second, weaker source of truth.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");
  redirect(next ?? DASHBOARD_BY_ROLE[profile.role]);
}

/* ------------------------------------------------------------------ */
/* Masuk lewat Google                                                 */
/* ------------------------------------------------------------------ */

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();

  // Derived from the request rather than configured, so the local stack and a
  // deployed one both land on an address Supabase has been told to allow.
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin ?? "http://127.0.0.1:3000"}/auth/callback` },
  });

  if (error || !data.url) redirect("/login?gagal=1");
  // An absolute URL: the provider is a different origin, and redirect() is
  // built for exactly this.
  redirect(data.url);
}

/* ------------------------------------------------------------------ */
/* Daftar                                                             */
/* ------------------------------------------------------------------ */

export async function signUp(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (fullName.length < 2) return failed("Tulis namamu lengkap.");
  if (!email.includes("@")) return failed("Alamat email belum benar.");
  if (password.length < 8) {
    return failed("Kata sandi minimal 8 karakter.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    if (/already registered|already been registered/i.test(error.message)) {
      return failed("Email ini sudah punya akun. Coba masuk.");
    }
    return failed("Pendaftaran gagal. Coba lagi sebentar.");
  }

  // GoTrue issues a session straight away when confirmations are off, which is
  // the local configuration. When they are on, `data.session` is null and the
  // address has to be confirmed before any session can exist.
  if (!data.session) {
    if (process.env.NODE_ENV === "production") {
      return {
        error: null,
        notice:
          "Akun dibuat. Cek email kamu untuk tautan konfirmasi, lalu masuk.",
      };
    }

    // Development only. The service role is the one thing in this app that can
    // confirm an address without an inbound click, and a development stack
    // should not make a tester go and fish in Mailpit to finish signing up.
    if (!data.user) return failed("Pendaftaran gagal. Coba lagi sebentar.");
    const { error: confirmError } =
      await createAdminClient().auth.admin.updateUserById(data.user.id, {
        email_confirm: true,
      });
    if (confirmError) {
      return failed("Pendaftaran gagal. Coba lagi sebentar.");
    }

    const retry = await supabase.auth.signInWithPassword({ email, password });
    if (retry.error) return failed("Pendaftaran gagal. Coba lagi sebentar.");
  }

  redirect("/onboarding");
}

/* ------------------------------------------------------------------ */
/* Keluar                                                             */
/* ------------------------------------------------------------------ */

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/* ------------------------------------------------------------------ */
/* Masuk demo                                                         */
/*                                                                  */
/* One click, for the seeded UMKM and the seeded creator. Deliberately */
/* takes no input: the credential is a constant in this file, so a     */
/* caller who could pass an address would turn this into a password     */
/* login with the password in the source. The role argument only       */
/* chooses which of the two seeded accounts to use.                    */
/*                                                                  */
/* Refused outside development. The guard runs first, so a production      */
/* request reaches /login and never authenticates anyone.                     */
/*                                                                        */
/* What the build does NOT do is delete this function: app/actions.ts is a  */
/* "use server" module, so every export is a callable endpoint and none of   */
/* them can be tree-shaken. `kolab12345` and both addresses therefore       */
/* survive in the server chunk of a production build - verified, not         */
/* assumed. That costs nothing, because they are not secrets in the first   */
/* place: supabase/seed.sql commits the same values, the accounts exist only */
/* after a local `supabase db reset`, and no deployed database is seeded by  */
/* this repo. The controls that hide them from users are on /login, which    */
/* is gated on the same NODE_ENV check.                                      */
/* ------------------------------------------------------------------ */

export async function demoSignIn(role: "umkm" | "influencer"): Promise<void> {
  if (process.env.NODE_ENV === "production") redirect("/login");

  const email = role === "umkm" ? "budi@kolab.id" : "rara@kolab.id";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });

  // The seeded accounts only exist after `supabase db reset`. A stack that has
  // not been seeded lands on the sign-in form instead of a dashboard that
  // would render as somebody else.
  if (error) redirect("/login");

  redirect(DASHBOARD_BY_ROLE[role]);
}

/* ------------------------------------------------------------------ */
/* Onboarding                                                         */
/*                                                                  */
/* Turns an account with no profile into an account that owns exactly */
/* one record. Everything here writes through the service role, because */
/* rls-access-control creates no write policy at all - the publishable */
/* key can read the catalog and nothing more. That makes this action   */
/* the whole authorization boundary: the identity it acts on is the    */
/* caller's own session and the values it writes come from its own     */
/* form, never from a parameter naming someone else's record.         */
/* ------------------------------------------------------------------ */

export async function onboard(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  // Deliberately not requireUser(): that guard sends an account without a
  // profile to /onboarding, which is the one place that cannot accept a
  // redirect, so calling it here made this action unreachable for exactly the
  // accounts it exists to serve. getUser() asks the narrower question - is there
  // a session - and the profile is then looked up separately to refuse an
  // account that already owns a record.
  const user = await getUser();
  if (!user) redirect("/login");

  const existing = await getUserContext();
  if (existing) redirect(DASHBOARD_BY_ROLE[existing.role]);

  const role = String(formData.get("role") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim().slice(0, 80);
  const city = String(formData.get("city") ?? "").trim().slice(0, 40);
  const categoryId = Number(formData.get("categoryId"));

  if (role !== "umkm" && role !== "influencer") {
    return failed("Pilih peran terlebih dahulu.");
  }
  if (fullName.length < 2) return failed("Isi namamu lengkap.");
  if (city.length < 2) return failed("Isi kota kamu.");
  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return failed("Pilih kategori.");
  }

  // The role is the visitor's to pick only because they have no profile yet to
  // contradict it. An operator already has one, so `existing` above sent them to
  // /admin and nothing about this form can make them one.
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category) return failed("Kategori tidak dikenal.");

  const admin = createAdminClient();
  let ownId: number;

  if (role === "umkm") {
    const businessName = String(formData.get("businessName") ?? "")
      .trim()
      .slice(0, 80);
    if (businessName.length < 2) return failed("Isi nama usaha.");

    const { data: inserted, error } = await admin
      .from("umkms")
      .insert({
        name: businessName,
        owner: fullName,
        category_id: categoryId,
        city,
      })
      .select("id")
      .single();
    if (error || !inserted) return failed("Gagal menyimpan usaha. Coba lagi.");
    ownId = inserted.id;
  } else {
    const rawHandle = String(formData.get("handle") ?? "").trim();
    // The seeded handles carry their "@" and the UI prints the column verbatim,
    // so the stored form has one. The visitor types whatever they like.
    const bare = rawHandle.replace(/^@+/, "").toLowerCase();
    if (!/^[a-z0-9._]{3,30}$/.test(bare)) {
      return failed("Handle minimal 3 karakter: huruf, angka, titik, atau garis.");
    }
    const handle = `@${bare}`;

    const bio = String(formData.get("bio") ?? "").trim().slice(0, 300);
    const basePrice = Number(formData.get("startingPrice"));
    if (!Number.isInteger(basePrice) || basePrice < 0) {
      return failed("Isi harga mulai dengan angka.");
    }

    const { data: inserted, error } = await admin
      .from("influencers")
      .insert({
        name: fullName,
        handle,
        category_id: categoryId,
        city,
        starting_price: basePrice,
        bio: bio || null,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      // 23505 is the unique violation on influencers.handle, the only unique
      // constraint an insert here can reach.
      if (error?.code === "23505") {
        return failed("Handle itu sudah dipakai kreator lain.");
      }
      return failed("Gagal menyimpan profil kreator. Coba lagi.");
    }
    ownId = inserted.id;
  }

  const { error: profileError } = await admin.from("profiles").insert({
    user_id: user.id,
    full_name: fullName,
    umkm_id: role === "umkm" ? ownId : null,
    influencer_id: role === "influencer" ? ownId : null,
    role,
  });

  if (profileError) {
    // Unwind the record rather than leaving one that no account owns.
    // profiles.umkm_id is UNIQUE, so a duplicate here means someone raced this
    // account through two onboarding submissions.
    if (role === "umkm") {
      await admin.from("umkms").delete().eq("id", ownId);
    } else {
      await admin.from("influencers").delete().eq("id", ownId);
    }
    if (profileError.code === "23505") {
      return failed("Akun ini sudah punya profil. Buka dashboard kamu.");
    }
    return failed("Gagal menautkan profil. Coba lagi.");
  }

  redirect(DASHBOARD_BY_ROLE[role]);
}

/* ------------------------------------------------------------------ */
/* Profil UMKM                                                        */
/* ------------------------------------------------------------------ */

export async function updateProfile(formData: FormData): Promise<void> {
  const account = await requireUmkm();

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const owner = String(formData.get("owner") ?? "").trim().slice(0, 80);
  const category = String(formData.get("category") ?? "").trim().slice(0, 40);
  const city = String(formData.get("city") ?? "").trim().slice(0, 40);

  if (!name || !owner || !category || !city) {
    redirect("/dashboard/profile?gagal=1");
  }

  // The form still names the category the way the UI renders it. Resolve that
  // label back to the id the database stores rather than writing free text.
  const supabase = createClient();
  const { data: categoryRow } = await supabase
    .from("categories")
    .select("id")
    .eq("name", category)
    .maybeSingle();
  if (!categoryRow) redirect("/dashboard/profile?gagal=1");

  const admin = createAdminClient();
  const { error } = await admin
    .from("umkms")
    .update({ name, owner, category_id: categoryRow.id, city })
    .eq("id", account.umkmId);
  if (error) redirect("/dashboard/profile?gagal=1");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  redirect("/dashboard/profile?updated=1");
}

/* ------------------------------------------------------------------ */
/* Paket kreator                                                      */
/*                                                                  */
/* The creator's own catalog. Both actions are scoped by `.eq(         */
/* "influencer_id", account.influencerId)`, which is the authorization  */
/* check: a replayed package id belonging to another creator matches    */
/* zero rows, and the action reports that rather than changing it.      */
/*                                                                  */
/* `starting_price` is never written here. The `maintain_starting_price` */
/* trigger owns it, so a price change, an activation, or a deactivation */
/* all land in the same recompute the catalog reads. Nothing in this    */
/* file can forget to update it.                                        */
/* ------------------------------------------------------------------ */

const PAKET_HREF = "/dashboard/influencer/paket";

export async function saveInfluencerPackage(
  previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const account = await requireInfluencer();

  const packageId = Number(formData.get("packageId"));
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const price = Number(formData.get("price"));
  const summary = String(formData.get("summary") ?? "").trim().slice(0, 200);
  const quota = Number(formData.get("quota"));
  const days = Number(formData.get("days"));

  if (name.length < 2) return failed("Isi nama paket.");
  if (!Number.isInteger(price) || price <= 0) {
    return failed("Harga paket harus angka lebih dari nol.");
  }
  if (summary.length < 2) return failed("Isi ringkasan paket.");
  // The column CHECK says the same thing; refusing here reports which field it
  // was, where a 23514 from the insert would only say the write failed.
  if (!Number.isInteger(quota) || quota < 1 || quota > 5) {
    return failed("Kuota revisi harus antara 1 dan 5.");
  }
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    return failed("Estimasi pengerjaan harus antara 1 dan 90 hari.");
  }

  // The UI collects the included items as a comma-separated string; the column
  // is jsonb. Split, trim, drop blanks, and cap so one form cannot turn into an
  // unbounded list of rows on the public page.
  const includes = String(formData.get("includes") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "")
    .slice(0, 12);

  const admin = createAdminClient();

  if (Number.isInteger(packageId) && packageId > 0) {
    // `.eq("influencer_id", ...)` is the authorization: an id replayed from
    // another creator's package matches no rows, and `select` then shows the
    // update went nowhere.
    const { data: updated, error } = await admin
      .from("packages")
      .update({
        name,
        price,
        summary,
        includes,
        revision_quota: quota,
        estimated_days: days,
        updated_at: new Date().toISOString(),
      })
      .eq("id", packageId)
      .eq("influencer_id", account.influencerId)
      .select("id");

    if (error) return failed("Gagal menyimpan paket. Coba lagi.");
    if (!updated || updated.length === 0) {
      return failed("Paket itu bukan milikmu.");
    }
  } else {
    const { error } = await admin.from("packages").insert({
      influencer_id: account.influencerId,
      name,
      price,
      summary,
      includes,
      revision_quota: quota,
      estimated_days: days,
      is_active: true,
    });
    if (error) return failed("Gagal menyimpan paket. Coba lagi.");
  }

  // The public page and the creator's own starting price are maintained by the
  // `maintain_starting_price` trigger, but the cached pages still have to be
  // told to read again.
  revalidatePath("/dashboard/influencer/paket");
  revalidatePath(`/influencers/${account.influencerId}`);
  revalidatePath("/influencers");
  revalidatePath("/insights");

  // No redirect: the form's `useActionState` reads this notice and closes itself,
  // which is also what lets a validation error render inline instead of replacing
  // the page with a query-string message.
  return { error: null, notice: "Paket disimpan." };
}

/**
 * Activate or deactivate one of the caller's packages.
 *
 * Deactivating the last active package is refused by the
 * `packages_guard_deactivation` trigger, whose message names the fix. That case
 * is told apart from a generic write failure so the page can show it, rather
 * than reporting "failed" for a refusal that is actually the rule working.
 */
export async function setPackageActive(formData: FormData): Promise<void> {
  const account = await requireInfluencer();

  const packageId = Number(formData.get("packageId"));
  const active = String(formData.get("active")) === "1";

  if (!Number.isInteger(packageId) || packageId < 1) redirect(PAKET_HREF);

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("packages")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", packageId)
    .eq("influencer_id", account.influencerId)
    .select("id");

  if (error) {
    // `check_violation` is the errcode the guard raises; see the migration.
    if (error.code === "23514") redirect(`${PAKET_HREF}?gagal=terakhir`);
    redirect(`${PAKET_HREF}?gagal=simpan`);
  }
  if (!updated || updated.length === 0) redirect(`${PAKET_HREF}?gagal=akses`);

  revalidatePath(PAKET_HREF);
  revalidatePath(`/influencers/${account.influencerId}`);
  revalidatePath("/influencers");
  revalidatePath("/insights");
  redirect(`${PAKET_HREF}?updated=1`);
}

/* ------------------------------------------------------------------ */
/* Booking                                                            */
/* ------------------------------------------------------------------ */

/** Accepted brief length. Mirrors the textarea's maxLength and the spec's bounds. */
const MIN_BRIEF = BRIEF_MIN;
const MAX_BRIEF = BRIEF_MAX;

export async function submitBooking(formData: FormData): Promise<void> {
  const account = await requireUmkm();

  const influencerId = Number(formData.get("influencerId"));
  if (!Number.isInteger(influencerId) || influencerId < 1) {
    redirect("/influencers");
  }

  const packageId = Number(formData.get("packageId"));
  const rawBrief = String(formData.get("message") ?? "").trim();

  // The brief is the one free-text field, so both bounds are enforced here
  // rather than trusting `maxLength` on the textarea, which a crafted request
  // ignores. A too-long brief is refused rather than silently truncated: the
  // business should know the text it wrote was not the text that was sent.
  if (!rawBrief) redirect(`/booking/${influencerId}?gagal=brief`);
  if (rawBrief.length < MIN_BRIEF) {
    redirect(`/booking/${influencerId}?gagal=singkat`);
  }
  if (rawBrief.length > MAX_BRIEF) {
    redirect(`/booking/${influencerId}?gagal=panjang`);
  }
  if (!Number.isInteger(packageId) || packageId < 1) {
    redirect(`/booking/${influencerId}?gagal=1`);
  }
  const brief = rawBrief;

  const admin = createAdminClient();

  // The package is the price authority: its fields are snapshotted into the
  // booking, and it must belong to the creator named in the form and still be
  // offered. A deactivated package is not bookable even if its id is replayed.
  const { data: pkg } = await admin
    .from("packages")
    .select(
      "id, influencer_id, name, price, includes, revision_quota, estimated_days, is_active",
    )
    .eq("id", packageId)
    .maybeSingle();
  if (!pkg || pkg.influencer_id !== influencerId || !pkg.is_active) {
    redirect(`/booking/${influencerId}?gagal=1`);
  }

  // Codes are display-only, so a readable sequence beats a random string. The
  // count is a hint at the next number and can collide under a concurrent
  // submit, which surfaces as a 23505 on `bookings_code_key`; the retry moves
  // the sequence forward by one so the second attempt lands on the next number.
  const year = new Date().getFullYear();
  let booking: { id: number } | null = null;

  for (let attempt = 0; attempt < 5 && !booking; attempt += 1) {
    const { data: last } = await admin
      .from("bookings")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sequence = (last?.id ?? 0) + 1 + attempt;
    const code = `CLB-${year}-${String(sequence).padStart(4, "0")}`;

    const { data, error } = await admin
      .from("bookings")
      .insert({
        code,
        umkm_id: account.umkmId,
        influencer_id: influencerId,
        package_id: pkg.id,
        package_name: pkg.name,
        package_includes: pkg.includes,
        amount: pkg.price,
        revision_quota: pkg.revision_quota,
        estimated_days: pkg.estimated_days,
        brief,
      })
      .select("id")
      .single();

    // 23505 is `bookings_code_key`. Anything else is a real failure.
    if (!error && data) {
      booking = data;
      break;
    }
    if (error && error.code !== "23505") {
      redirect(`/booking/${influencerId}?gagal=1`);
    }
  }

  if (!booking) redirect(`/booking/${influencerId}?gagal=1`);

  // Chat: the conversation row belongs to the booking's creation. Writing the
  // brief as the first message keeps the thread substantive from the start
  // instead of the conversation existing with nothing in it.
  const { data: conversation } = await admin
    .from("conversations")
    .insert({ booking_id: booking.id })
    .select("id")
    .single();

  if (conversation) {
    await admin.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: account.userId,
      body: brief,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/influencer");
  redirect("/dashboard?status=baru");
}

/* ------------------------------------------------------------------ */
/* Siklus hidup booking                                               */
/*                                                                   */
/* Setiap aksi di bawah membaca booking lewat sesi pemanggil dulu —    */
/* getBookingById membaca lewat klien user-scoped, dan kebijakan party  */
/* read di `bookings` yang memutuskan. Pemanggil yang bukan pihak akan  */
/* mendapat null dan aksi menolak sebelum service role tersentuh.       */
/*                                                                   */
/* Tulisannya satu RPC, jadi state machine di database-lah satu-satunya */
/* yang bisa mengubah status. Alasan singkat ditaruh di query `gagal`;  */
/* halaman detail yang merangkai kalimatnya (lihat GAGAL_TEXT).         */
/* ------------------------------------------------------------------ */

const UMKM_RIWAYAT = "/dashboard/riwayat";
const CREATOR_RIWAYAT = "/dashboard/influencer/riwayat";

/** Kode SQLSTATE -> alasan singkat untuk URL. Halaman memetakan ke kalimat. */
function reasonFor(error: { code?: string } | null): string {
  switch (error?.code) {
    case "23514":
      return "aturan";
    case "23505":
      return "duplikat";
    case "P0002":
      return "tidak";
    default:
      return "gagal";
  }
}

/** Kembali ke `next` same-origin bila ada, kalau tidak ke halaman detail. */
function backTo(formData: FormData, fallback: string): string {
  return safeNext(formData.get("next")) ?? fallback;
}

async function fetchOwned(formData: FormData): Promise<Booking | null> {
  const bookingId = Number(formData.get("bookingId"));
  if (!Number.isInteger(bookingId) || bookingId < 1) return null;
  return getBookingById(bookingId);
}

/** Segarkan semua halaman yang menampilkan booking ini. */
function revalidateBooking(id: number, influencerId: number) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/riwayat");
  revalidatePath(`/dashboard/riwayat/${id}`);
  revalidatePath("/dashboard/influencer");
  revalidatePath("/dashboard/influencer/riwayat");
  revalidatePath(`/dashboard/influencer/riwayat/${id}`);
  revalidatePath(`/influencers/${influencerId}`);
}

/* ---------- kreator: terima / tolak / kirim konten ---------- */

export async function acceptBooking(formData: FormData): Promise<void> {
  const account = await requireInfluencer();
  const booking = await fetchOwned(formData);
  if (!booking || booking.influencerId !== account.influencerId) {
    redirect(`${CREATOR_RIWAYAT}?gagal=akses`);
  }
  const back = backTo(formData, `${CREATOR_RIWAYAT}/${booking.id}`);

  const { error } = await createAdminClient().rpc("apply_booking_transition", {
    p_booking_id: booking.id,
    p_to: "ACCEPTED",
    p_actor_role: "influencer",
  });
  revalidateBooking(booking.id, booking.influencerId);
  redirect(
    error ? `${back}?gagal=${reasonFor(error)}` : `${back}?ok=diterima`,
  );
}

export async function declineBooking(formData: FormData): Promise<void> {
  const account = await requireInfluencer();
  const booking = await fetchOwned(formData);
  if (!booking || booking.influencerId !== account.influencerId) {
    redirect(`${CREATOR_RIWAYAT}?gagal=akses`);
  }
  const back = backTo(formData, `${CREATOR_RIWAYAT}/${booking.id}`);

  const { error } = await createAdminClient().rpc("apply_booking_transition", {
    p_booking_id: booking.id,
    p_to: "REJECTED",
    p_actor_role: "influencer",
  });
  revalidateBooking(booking.id, booking.influencerId);
  redirect(error ? `${back}?gagal=${reasonFor(error)}` : `${back}?ok=ditolak`);
}

export async function submitDelivery(formData: FormData): Promise<void> {
  const account = await requireInfluencer();
  const booking = await fetchOwned(formData);
  if (!booking || booking.influencerId !== account.influencerId) {
    redirect(`${CREATOR_RIWAYAT}?gagal=akses`);
  }
  const back = backTo(formData, `${CREATOR_RIWAYAT}/${booking.id}`);

  const contentUrl = String(formData.get("contentUrl") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!contentUrl) redirect(`${back}?gagal=link`);

  const { error } = await createAdminClient().rpc("submit_delivery", {
    p_booking_id: booking.id,
    p_actor_role: "influencer",
    p_content_url: contentUrl,
    p_note: note || undefined,
  });
  revalidateBooking(booking.id, booking.influencerId);
  redirect(error ? `${back}?gagal=${reasonFor(error)}` : `${back}?ok=terkirim`);
}

/* ---------- UMKM: bayar / minta revisi / setujui / perpanjang ---------- */

export async function payBooking(formData: FormData): Promise<void> {
  const account = await requireUmkm();
  const booking = await fetchOwned(formData);
  if (!booking || booking.umkmId !== account.umkmId) {
    redirect(`${UMKM_RIWAYAT}?gagal=akses`);
  }
  const back = backTo(formData, `${UMKM_RIWAYAT}/${booking.id}`);

  const { error } = await createAdminClient().rpc("apply_booking_transition", {
    p_booking_id: booking.id,
    p_to: "FUNDED",
    p_actor_role: "umkm",
  });
  revalidateBooking(booking.id, booking.influencerId);
  redirect(error ? `${back}?gagal=${reasonFor(error)}` : `${back}?ok=dibayar`);
}

export async function approveBooking(formData: FormData): Promise<void> {
  const account = await requireUmkm();
  const booking = await fetchOwned(formData);
  if (!booking || booking.umkmId !== account.umkmId) {
    redirect(`${UMKM_RIWAYAT}?gagal=akses`);
  }
  const back = backTo(formData, `${UMKM_RIWAYAT}/${booking.id}`);

  const { error } = await createAdminClient().rpc("apply_booking_transition", {
    p_booking_id: booking.id,
    p_to: "COMPLETED",
    p_actor_role: "umkm",
  });
  revalidateBooking(booking.id, booking.influencerId);
  redirect(error ? `${back}?gagal=${reasonFor(error)}` : `${back}?ok=selesai`);
}

export async function requestRevision(formData: FormData): Promise<void> {
  const account = await requireUmkm();
  const booking = await fetchOwned(formData);
  if (!booking || booking.umkmId !== account.umkmId) {
    redirect(`${UMKM_RIWAYAT}?gagal=akses`);
  }
  const back = backTo(formData, `${UMKM_RIWAYAT}/${booking.id}`);

  const deliveryId = Number(formData.get("deliveryId"));
  const section = String(formData.get("section") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const withinBrief = formData.get("withinBrief") === "1";

  if (!Number.isInteger(deliveryId) || deliveryId < 1) {
    redirect(`${back}?gagal=ronde`);
  }
  if (!section) redirect(`${back}?gagal=bagian`);
  if (!note) redirect(`${back}?gagal=catatan`);

  const { error } = await createAdminClient().rpc("request_revision", {
    p_booking_id: booking.id,
    p_actor_role: "umkm",
    p_delivery_id: deliveryId,
    p_section: section,
    p_note: note,
    p_within_brief: withinBrief,
  });
  revalidateBooking(booking.id, booking.influencerId);
  if (error) {
    // 23514 from the quota trigger is the one refusal worth its own sentence.
    const reason =
      error.code === "23514" ? "kuota" : reasonFor(error);
    redirect(`${back}?gagal=${reason}`);
  }
  redirect(`${back}?ok=revisi`);
}

export async function extendReviewWindow(formData: FormData): Promise<void> {
  const account = await requireUmkm();
  const booking = await fetchOwned(formData);
  if (!booking || booking.umkmId !== account.umkmId) {
    redirect(`${UMKM_RIWAYAT}?gagal=akses`);
  }
  const back = backTo(formData, `${UMKM_RIWAYAT}/${booking.id}`);

  const { error } = await createAdminClient().rpc("extend_review_window", {
    p_booking_id: booking.id,
  });
  revalidateBooking(booking.id, booking.influencerId);
  redirect(error ? `${back}?gagal=perpanjang` : `${back}?ok=diperpanjang`);
}

/* ---------- kedua pihak: batalkan / buka sengketa ---------- */

/** The signed-in party's own role, or null when the caller is neither. */
function partyRole(role: string): PartyRole | null {
  return role === "umkm" || role === "influencer" ? role : null;
}

export async function cancelBooking(formData: FormData): Promise<void> {
  const account = await requireParty();
  const role = partyRole(account.role);
  if (!role) redirect("/dashboard");

  const booking = await fetchOwned(formData);
  const isParty =
    booking &&
    (role === "umkm"
      ? booking.umkmId === account.umkmId
      : booking.influencerId === account.influencerId);
  if (!isParty) redirect(`${DASHBOARD_BY_ROLE[account.role]}?gagal=akses`);

  const base = role === "umkm" ? UMKM_RIWAYAT : CREATOR_RIWAYAT;
  const back = backTo(formData, `${base}/${booking.id}`);

  const { error } = await createAdminClient().rpc("apply_booking_transition", {
    p_booking_id: booking.id,
    p_to: "CANCELLED",
    p_actor_role: role,
  });
  revalidateBooking(booking.id, booking.influencerId);
  redirect(error ? `${back}?gagal=${reasonFor(error)}` : `${back}?ok=batal`);
}

export async function openDispute(formData: FormData): Promise<void> {
  const account = await requireParty();
  const role = partyRole(account.role);
  if (!role) redirect("/dashboard");

  const booking = await fetchOwned(formData);
  const isParty =
    booking &&
    (role === "umkm"
      ? booking.umkmId === account.umkmId
      : booking.influencerId === account.influencerId);
  if (!isParty) redirect(`${DASHBOARD_BY_ROLE[account.role]}?gagal=akses`);

  const base = role === "umkm" ? UMKM_RIWAYAT : CREATOR_RIWAYAT;
  const back = backTo(formData, `${base}/${booking.id}`);

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) redirect(`${back}?gagal=alasan`);

  const { error } = await createAdminClient().rpc("open_dispute", {
    p_booking_id: booking.id,
    p_actor_role: role,
    p_reason: reason,
  });
  revalidateBooking(booking.id, booking.influencerId);
  redirect(error ? `${back}?gagal=${reasonFor(error)}` : `${back}?ok=sengketa`);
}

/* ---------- kedua pihak: tawaran penyelesaian (langkah 3-5) ---------- */

const OFFER_TYPES: readonly OfferType[] = [
  "EXTRA_REVISION",
  "DISCOUNT",
  "CANCELLATION",
];

export async function createOffer(formData: FormData): Promise<void> {
  const account = await requireParty();
  const role = partyRole(account.role);
  if (!role) redirect("/dashboard");

  const booking = await fetchOwned(formData);
  const isParty =
    booking &&
    (role === "umkm"
      ? booking.umkmId === account.umkmId
      : booking.influencerId === account.influencerId);
  if (!isParty) redirect(`${DASHBOARD_BY_ROLE[account.role]}?gagal=akses`);

  const base = role === "umkm" ? UMKM_RIWAYAT : CREATOR_RIWAYAT;
  const back = backTo(formData, `${base}/${booking.id}`);

  const type = String(formData.get("type") ?? "") as OfferType;
  if (!OFFER_TYPES.includes(type)) redirect(`${back}?gagal=tawaran`);

  // The per-type bounds (count >= 1, amounts in (0, amount]) live in the database
  // function; this only rejects a non-positive integer before the round trip.
  const value = Number(formData.get("value"));
  if (!Number.isInteger(value) || value < 1) redirect(`${back}?gagal=nilai`);

  const note = String(formData.get("note") ?? "").trim().slice(0, 300);

  const { error } = await createAdminClient().rpc("create_offer", {
    p_booking_id: booking.id,
    p_actor_role: role,
    p_type: type,
    p_value: value,
    p_note: note || undefined,
  });
  revalidateBooking(booking.id, booking.influencerId);
  redirect(error ? `${back}?gagal=${reasonFor(error)}` : `${back}?ok=tawaran`);
}

export async function respondToOffer(formData: FormData): Promise<void> {
  const account = await requireParty();
  const role = partyRole(account.role);
  if (!role) redirect("/dashboard");

  const booking = await fetchOwned(formData);
  const isParty =
    booking &&
    (role === "umkm"
      ? booking.umkmId === account.umkmId
      : booking.influencerId === account.influencerId);
  if (!isParty) redirect(`${DASHBOARD_BY_ROLE[account.role]}?gagal=akses`);

  const base = role === "umkm" ? UMKM_RIWAYAT : CREATOR_RIWAYAT;
  const back = backTo(formData, `${base}/${booking.id}`);

  const offerId = Number(formData.get("offerId"));
  if (!Number.isInteger(offerId) || offerId < 1) {
    redirect(`${back}?gagal=tawaran`);
  }
  const accept = formData.get("accept") === "1";

  const { data, error } = await createAdminClient().rpc("respond_to_offer", {
    p_offer_id: offerId,
    p_actor_role: role,
    p_accept: accept,
  });
  revalidateBooking(booking.id, booking.influencerId);
  if (error) redirect(`${back}?gagal=${reasonFor(error)}`);

  // An overdue offer is returned as EXPIRED rather than raising, so its returned
  // status is the refusal the page reports.
  if ((data as { status?: string } | null)?.status === "EXPIRED") {
    redirect(`${back}?gagal=kedaluwarsa`);
  }
  redirect(
    `${back}?ok=${accept ? "tawaran-diterima" : "tawaran-ditolak"}`,
  );
}

/* ------------------------------------------------------------------ */
/* Chat (ARCHITECTURE §2.7)                                            */
/*                                                                     */
/* Messaging is a write, so it follows the same rule as the lifecycle   */
/* actions: read the booking through the caller's own session first,    */
/* then write through the service role. `send_message` resolves the     */
/* sender from the role and the booking, so no user id crosses the      */
/* boundary. Reads are RLS-scoped in lib/data/chat.ts.                  */
/* ------------------------------------------------------------------ */

const UMKM_CHAT = "/dashboard/chat";
const CREATOR_CHAT = "/dashboard/influencer/chat";

/** Party check shared by both chat actions; null means "not your booking". */
async function ownedChat(formData: FormData): Promise<{
  role: PartyRole;
  bookingId: number;
  path: string;
} | null> {
  const account = await requireParty();
  const role = partyRole(account.role);
  if (!role) return null;

  const booking = await fetchOwned(formData);
  const isParty =
    booking &&
    (role === "umkm"
      ? booking.umkmId === account.umkmId
      : booking.influencerId === account.influencerId);
  if (!isParty) return null;

  return {
    role,
    bookingId: booking.id,
    path: role === "umkm" ? UMKM_CHAT : CREATOR_CHAT,
  };
}

export async function sendMessage(formData: FormData): Promise<void> {
  const owned = await ownedChat(formData);
  if (!owned) redirect("/dashboard");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const { error } = await createAdminClient().rpc("send_message", {
    p_booking_id: owned.bookingId,
    p_actor_role: owned.role,
    p_body: body.slice(0, 2000),
  });
  // A closed thread or a missing party is a refusal, not a crash: the page
  // re-renders unchanged and the message is simply not stored.
  if (error) console.error(`[chat] sendMessage failed: ${error.message}`);

  revalidatePath(owned.path);
}

export async function markChatRead(formData: FormData): Promise<void> {
  const owned = await ownedChat(formData);
  if (!owned) return;

  await createAdminClient().rpc("mark_conversation_read", {
    p_booking_id: owned.bookingId,
    p_actor_role: owned.role,
  });
  revalidatePath(owned.path);
}

/* ------------------------------------------------------------------ */
/* Review & rating 2 arah (setelah kolaborasi selesai)                 */
/* ------------------------------------------------------------------ */

export async function submitReview(formData: FormData): Promise<void> {
  const account = await requireParty();

  const bookingId = Number(formData.get("bookingId"));
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 300);

  const isUmkm = account.role === "umkm";
  const dashboardHref = DASHBOARD_BY_ROLE[account.role];

  const booking = await getBookingById(bookingId);
  if (!booking) redirect(dashboardHref);

  // A completed collaboration is reviewable. So is one the operator ended with a
  // refund: the decision closes it even though its status is CANCELLED, and the
  // spec opens the review for every dispute outcome.
  const reviewable =
    booking.status === "COMPLETED" ||
    (booking.status === "CANCELLED" &&
      (await getDisputeForBooking(booking.id))?.status === "RESOLVED");
  if (!reviewable) redirect(dashboardHref);

  // Hanya pihak yang terlibat dalam booking yang boleh menilai
  const isParty = isUmkm
    ? booking.umkmId === account.umkmId
    : booking.influencerId === account.influencerId;
  if (!isParty) redirect(dashboardHref);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`/review/${booking.id}?gagal=1`);
  }

  // Satu kolaborasi hanya dinilai sekali per sisi
  if (await hasReviewed(booking.id, account.role)) {
    redirect(dashboardHref);
  }

  // The reviewer is one of the booking's two parties; the schema records that
  // by naming the *other* side as the reviewee, which `reviews_reviewee_chk`
  // then constrains to exactly one column.
  const admin = createAdminClient();
  const { error } = await admin.from("reviews").insert({
    booking_id: booking.id,
    reviewer_role: account.role,
    reviewee_umkm_id: isUmkm ? null : booking.umkmId,
    reviewee_influencer_id: isUmkm ? booking.influencerId : null,
    rating,
    // No comment is stored as null, not as an empty string: the public list
    // branches on "has a comment", and an empty string would render an empty
    // quote block.
    comment: comment || null,
  });
  if (error) redirect(`/review/${booking.id}?gagal=1`);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/influencer");
  revalidatePath(`/influencers/${booking.influencerId}`);
  revalidatePath("/insights");
  redirect(isUmkm ? "/dashboard?review=1" : "/dashboard/influencer?review=1");
}

/* ------------------------------------------------------------------ */
/* Admin: keputusan sengketa (ARCHITECTURE §5.7)                       */
/*                                                                     */
/* The same rule as the party actions, with a different guard: the      */
/* operator reads the dispute through the admin session first (the      */
/* `*_admin_dispute_read` policies admit it), then the decision is one   */
/* RPC through the service role. `apply_booking_transition` stays the    */
/* only writer of `bookings.status`; the function calls it internally.   */
/* ------------------------------------------------------------------ */

const ADMIN_DASHBOARD = "/admin";
const ADMIN_KASUS = "/admin/kasus";

const DISPUTE_DECISIONS: readonly DisputeDecision[] = [
  "RELEASE_FULL",
  "REFUND_FULL",
  "SPLIT",
];

export async function decideDispute(formData: FormData): Promise<void> {
  const account = await requireRole("admin");

  const disputeId = Number(formData.get("disputeId"));
  if (!Number.isInteger(disputeId) || disputeId < 1) {
    redirect(ADMIN_KASUS);
  }
  const back = backTo(formData, `${ADMIN_KASUS}/${disputeId}`);

  const dispute = await getAdminCase(disputeId);
  if (!dispute) redirect(ADMIN_KASUS);

  const decision = String(formData.get("decision") ?? "") as DisputeDecision;
  if (!DISPUTE_DECISIONS.includes(decision)) {
    redirect(`${back}?gagal=keputusan`);
  }

  const note = String(formData.get("note") ?? "").trim();
  if (!note) redirect(`${back}?gagal=alasan`);

  // Only meaningful for SPLIT; the database ignores it otherwise and validates
  // the range for the split itself.
  const rawPercent = Number(formData.get("percent") ?? 50);
  const creatorShare = Number.isFinite(rawPercent)
    ? Math.round(rawPercent)
    : 50;

  const { error } = await createAdminClient().rpc("decide_dispute", {
    p_dispute_id: disputeId,
    p_decision: decision,
    p_creator_share_percent: creatorShare,
    p_note: note,
    p_decided_by: account.userId,
  });

  revalidatePath(ADMIN_DASHBOARD);
  revalidatePath(ADMIN_KASUS);
  revalidatePath(`${ADMIN_KASUS}/${disputeId}`);
  revalidateBooking(dispute.bookingId, dispute.influencerId);

  redirect(
    error ? `${back}?gagal=${reasonFor(error)}` : `${back}?ok=diputuskan`,
  );
}

export async function requestDisputeInfo(formData: FormData): Promise<void> {
  const account = await requireRole("admin");

  const disputeId = Number(formData.get("disputeId"));
  if (!Number.isInteger(disputeId) || disputeId < 1) {
    redirect(ADMIN_KASUS);
  }
  const back = backTo(formData, `${ADMIN_KASUS}/${disputeId}`);

  const dispute = await getAdminCase(disputeId);
  if (!dispute) redirect(ADMIN_KASUS);

  const question = String(formData.get("question") ?? "").trim();
  if (!question) redirect(`${back}?gagal=pertanyaan`);

  // "both" asks each party the same question, so it is two info rows. The
  // dispute only leaves NEED_INFO once the last of them is answered.
  const target = String(formData.get("target") ?? "");
  const targets: PartyRole[] =
    target === "both"
      ? ["umkm", "influencer"]
      : target === "umkm" || target === "influencer"
        ? [target]
        : [];
  if (targets.length === 0) redirect(`${back}?gagal=target`);

  const admin = createAdminClient();
  for (const role of targets) {
    const { error } = await admin.rpc("request_dispute_info", {
      p_dispute_id: disputeId,
      p_question: question,
      p_target_role: role,
      p_asked_by: account.userId,
    });
    if (error) {
      revalidatePath(`${ADMIN_KASUS}/${disputeId}`);
      redirect(`${back}?gagal=${reasonFor(error)}`);
    }
  }

  revalidatePath(ADMIN_DASHBOARD);
  revalidatePath(ADMIN_KASUS);
  revalidatePath(`${ADMIN_KASUS}/${disputeId}`);
  redirect(`${back}?ok=diminta`);
}

/** A party answers the operator's question from the booking detail page. */
export async function answerDisputeInfo(formData: FormData): Promise<void> {
  const account = await requireParty();
  const role = partyRole(account.role);
  if (!role) redirect("/dashboard");

  const booking = await fetchOwned(formData);
  const isParty =
    booking &&
    (role === "umkm"
      ? booking.umkmId === account.umkmId
      : booking.influencerId === account.influencerId);
  if (!isParty) redirect(`${DASHBOARD_BY_ROLE[account.role]}?gagal=akses`);

  const base = role === "umkm" ? UMKM_RIWAYAT : CREATOR_RIWAYAT;
  const back = backTo(formData, `${base}/${booking.id}`);

  const infoId = Number(formData.get("infoId"));
  if (!Number.isInteger(infoId) || infoId < 1) {
    redirect(`${back}?gagal=pertanyaan`);
  }
  const answer = String(formData.get("answer") ?? "").trim();
  if (!answer) redirect(`${back}?gagal=jawaban`);

  const { error } = await createAdminClient().rpc("answer_dispute_info", {
    p_info_id: infoId,
    p_actor_role: role,
    p_answer: answer,
    p_answered_by: account.userId,
  });

  revalidateBooking(booking.id, booking.influencerId);
  revalidatePath(ADMIN_DASHBOARD);
  revalidatePath(ADMIN_KASUS);

  redirect(error ? `${back}?gagal=${reasonFor(error)}` : `${back}?ok=dijawab`);
}