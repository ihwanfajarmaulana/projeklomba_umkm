# PostgREST-level proof that the row-level security policies in
# supabase/migrations/*_rls_baseline.sql actually refuse what they claim to.
#
# The page-level matrix proves the UI refuses cross-party requests. That is not
# the same claim: a page could refuse on its own logic while the database would
# have handed the row over. This asks the database directly, once as an anonymous
# reader and once per seeded account holding a real JWT, so the refusal has a
# single possible author.
#
# Reading a row that RLS hides returns an empty 200, never a 403: PostgREST
# filters the result set rather than rejecting the request. A 4xx here therefore
# means the request itself was refused - an unusable key, a bad filter - not that
# a row was hidden. That is why the checks below are row counts, not status
# codes, and why the insert check is the only one that asserts a status code.
#
# Usage:
#   .\scripts\verify-rls.ps1
#
# Assumes a running local stack (`npx supabase start`) seeded by
# `npx supabase db reset`, and a dev server on :3000 it can drive.
param()

$rest = "http://127.0.0.1:54321/rest/v1"
$auth = "http://127.0.0.1:54321/auth/v1"
$anon = $env:SUPABASE_PUBLISHABLE_KEY
if (-not $anon) { $anon = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" }
$tmp = Join-Path $env:TEMP "kolab-session"

$script:failures = 0

function Check([string]$label, [bool]$ok, [string]$detail) {
  Write-Output ("  [{0}] {1,-52} {2}" -f $(if ($ok) { 'ok' } else { 'FAIL' }), $label, $detail)
  if (-not $ok) { $script:failures++ }
}

function Get-Token([string]$email) {
  $file = Join-Path $tmp "rls-login.json"
  [IO.File]::WriteAllText($file, (@{ email = $email; password = "kolab12345" } | ConvertTo-Json -Compress), (New-Object System.Text.UTF8Encoding($false)))
  curl.exe -s -o $file -X POST "$auth/token?grant_type=password" -H "apikey: $anon" -H "Content-Type: application/json" --data-binary "@$file" | Out-Null
  return ([IO.File]::ReadAllText($file) | ConvertFrom-Json).access_token
}

# Row count as the given identity. No token means anonymous.
function Count-Rows([string]$table, [string]$token, [string]$query = "") {
  $url = "$rest/$table`?select=*"
  if ($query) { $url += "&$query" }
  $args = @('-s', '-w', '|%{http_code}', '-H', "apikey: $anon", '-H', 'Accept: application/json')
  if ($token) { $args += @('-H', "Authorization: Bearer $token") }
  $args += $url
  $raw = & curl.exe @args
  $code = ($raw -split '\|')[-1]
  if ($code -ne '200') { return -1 }
  $rows = (($raw -replace '\|200$', '') | ConvertFrom-Json)
  if ($null -eq $rows) { return 0 }
  return @($rows).Count
}

# ------------------------------------------------------------------ checks ---

Write-Output "=== anonymous reads: the public catalog is open ==="
foreach ($t in @('categories', 'umkms', 'influencers', 'packages', 'reviews')) {
  $n = Count-Rows $t $null
  Check "anon may read $t" ($n -gt 0) "$n rows"
}

Write-Output ""
Write-Output "=== anonymous reads: everything scoped is closed ==="
foreach ($t in @('bookings', 'payments', 'deliveries', 'booking_events', 'revision_requests', 'resolution_offers', 'profiles', 'conversations', 'messages', 'disputes', 'dispute_infos')) {
  $n = Count-Rows $t $null
  Check "anon gets nothing from $t" ($n -eq 0) "$n rows"
}

Write-Output ""
Write-Output "=== anon reads: the still-deferred tables deny by default ==="
foreach ($t in @('notifications')) {
  $n = Count-Rows $t $null
  Check "anon gets nothing from $t" ($n -eq 0) "$n rows"
}

# A party sees its own rows; a non-party sees none. The seed gives booking 1 to
# UMKM 1 (budi) and booking 2 to UMKM 3 (dewi), so siti is the outsider and rara
# is the only account that is a party to both.
$budi = Get-Token 'budi@kolab.id'
$dewi = Get-Token 'dewi@kolab.id'
$siti = Get-Token 'siti@kolab.id'
$rara = Get-Token 'rara@kolab.id'
$admin = Get-Token 'admin@kolab.id'

Write-Output ""
Write-Output "=== a party reads its own rows ==="
Check 'budi sees his one booking' ((Count-Rows 'bookings' $budi) -eq 1) '1 row'
Check 'dewi sees her one booking' ((Count-Rows 'bookings' $dewi) -eq 1) '1 row'
Check 'rara is a party to both, so sees two' ((Count-Rows 'bookings' $rara) -eq 2) '2 rows'
Check "budi sees his booking's four messages" ((Count-Rows 'messages' $budi) -eq 4) '4 rows'
Check "dewi sees her booking's three messages" ((Count-Rows 'messages' $dewi) -eq 3) '3 rows'
Check 'rara is a party to both threads, so sees all seven' ((Count-Rows 'messages' $rara) -eq 7) '7 rows'
Check 'budi sees his one conversation' ((Count-Rows 'conversations' $budi) -eq 1) '1 row'
Check 'rara is a party to both conversations' ((Count-Rows 'conversations' $rara) -eq 2) '2 rows'

Write-Output ""
Write-Output "=== a non-party reads nothing, and the refusal is the policy's ==="
Check 'siti is a party to no booking' ((Count-Rows 'bookings' $siti) -eq 0) '0 rows'
Check 'siti sees no payment' ((Count-Rows 'payments' $siti) -eq 0) '0 rows'
Check 'siti sees no delivery' ((Count-Rows 'deliveries' $siti) -eq 0) '0 rows'
Check 'siti sees no booking event' ((Count-Rows 'booking_events' $siti) -eq 0) '0 rows'
Check 'siti sees no revision request' ((Count-Rows 'revision_requests' $siti) -eq 0) '0 rows'
Check 'siti sees no message' ((Count-Rows 'messages' $siti) -eq 0) '0 rows'
Check 'siti sees no conversation' ((Count-Rows 'conversations' $siti) -eq 0) '0 rows'
Check 'siti sees no dispute' ((Count-Rows 'disputes' $siti) -eq 0) '0 rows'
Check 'siti sees no dispute info' ((Count-Rows 'dispute_infos' $siti) -eq 0) '0 rows'

Write-Output ""
Write-Output "=== profiles: your own row, never anyone else's ==="
foreach ($who in @(@('budi', $budi), @('siti', $siti), @('rara', $rara), @('admin', $admin))) {
  $n = Count-Rows 'profiles' $who[1]
  Check "$($who[0]) sees exactly their own profile" ($n -eq 1) "$n rows"
}
$mine = Count-Rows 'profiles' $siti 'user_id=eq.00000000-0000-4000-8000-000000000000'
Check "siti cannot read another account's profile by guessing its id" ($mine -eq 0) "$mine rows"

Write-Output ""
Write-Output "=== admin dispute visibility ==="
Check 'admin sees all disputes' ((Count-Rows 'disputes' $admin) -eq 3) '3 rows'
Check 'admin sees all dispute infos' ((Count-Rows 'dispute_infos' $admin) -eq 3) '3 rows'
Check 'admin sees disputed bookings only' ((Count-Rows 'bookings' $admin) -eq 3) '3 rows'
Check 'admin sees payments for disputed bookings' ((Count-Rows 'payments' $admin) -eq 3) '3 rows'
Check 'admin sees messages for disputed bookings' ((Count-Rows 'messages' $admin) -eq 6) '6 rows'

Write-Output ""
Write-Output "=== writes are refused outright, with 42501 ==="
# No INSERT policy exists anywhere in the baseline, so every write fails on the
# policy rather than on a constraint or a validation rule. 42501 is that code.
function Try-Insert([string]$label, [string]$table, [string]$body, [string]$token) {
  $file = Join-Path $tmp "rls-insert.json"
  [IO.File]::WriteAllText($file, $body, (New-Object System.Text.UTF8Encoding($false)))
  $args = @('-s', '-o', (Join-Path $tmp 'rls-resp.json'), '-w', '%{http_code}',
    '-X', 'POST', "$rest/$table",
    '-H', "apikey: $anon", '-H', 'Content-Type: application/json',
    '-H', 'Prefer: return=representation')
  if ($token) { $args += @('-H', "Authorization: Bearer $token") }
  $args += @('--data-binary', "@$file")
  $code = & curl.exe @args
  $resp = [IO.File]::ReadAllText((Join-Path $tmp 'rls-resp.json'))
  $msg = ''
  if ($resp -match '"code"\s*:\s*"([^"]+)"') { $msg = $Matches[1] }
  # 401 for a caller with no JWT, 403 for one that has a session but no policy.
  # Both are the same refusal; only the SQLSTATE is worth asserting.
  Check $label (($code -eq '401' -or $code -eq '403') -and $msg -eq '42501') "http=$code code=$msg"
}

# Every NOT NULL column with no default has to be present, or PostgREST rejects
# the request as malformed before RLS ever sees it (PGRST204 / 22P02) and the
# probe would prove nothing.
$booking = '{"code":"CLB-RLS-PROBE","umkm_id":1,"influencer_id":1,"package_id":1,' +
  '"package_name":"probe","amount":100000,"revision_quota":2,"estimated_days":7,' +
  '"brief":"probe","status":"PENDING"}'
$dispute = '{"code":"DSP-RLS-PROBE","booking_id":1,"reason":"probe","due_at":"2026-02-01","opened_by":"umkm","status":"OPEN"}'
Try-Insert 'a party cannot insert a booking, even for itself' 'bookings' $booking $budi
Try-Insert 'a signed-out caller cannot insert a booking' 'bookings' $booking $null
Try-Insert "a user cannot insert its own profile row" 'profiles' '{"user_id":"00000000-0000-4000-8000-000000000000","role":"admin"}' $siti
Try-Insert 'nobody can insert a dispute' 'disputes' $dispute $budi
Try-Insert 'a user cannot insert a message' 'messages' '{"conversation_id":1,"sender_id":"22222222-2222-4222-8222-222222222222","body":"probe"}' $rara

Write-Output ""
Write-Output "=== an update or delete changes nothing ==="
# The baseline defines SELECT policies only, so a write matches zero rows for
# everyone - including the owner. `profiles_own_read` is a SELECT policy and
# lets the RETURNING clause see the row, but with no UPDATE policy the USING
# clause matches nothing, so the write is discarded silently rather than
# refused. All writes go through the service-role client inside a Server Action.
function Try-Update([string]$label, [string]$table, [string]$query, [string]$body, [string]$token) {
  $file = Join-Path $tmp "rls-update.json"
  [IO.File]::WriteAllText($file, $body, (New-Object System.Text.UTF8Encoding($false)))
  $raw = & curl.exe -s -w '|%{http_code}' -X PATCH "$rest/$table`?$query" `
    -H "apikey: $anon" -H 'Content-Type: application/json' -H 'Prefer: return=representation' `
    -H "Authorization: Bearer $token" --data-binary "@$file"
  $code = ($raw -split '\|')[-1]
  $rows = @((($raw -replace '\|200$', '') | ConvertFrom-Json) | Where-Object { $_ }).Count
  Check $label ($code -eq '200' -and $rows -eq 0) "http=$code rows touched=$rows"
}
Try-Update "siti cannot rename dewi's business" 'umkms' 'id=eq.3' '{"name":"Diretas"}' $siti
Try-Update 'siti cannot promote her own profile to admin' 'profiles' 'role=eq.umkm' '{"role":"admin"}' $siti

Write-Output ""
Write-Output "=== the seed is unchanged by all of the above ==="
$after = @(
  "umkms="     + (docker.exe exec -i supabase_db_projeklomba_umkm psql -U postgres -d postgres -t -A -c "select count(*) from public.umkms" 2>$null).Trim(),
  "influencers=" + (docker.exe exec -i supabase_db_projeklomba_umkm psql -U postgres -d postgres -t -A -c "select count(*) from public.influencers" 2>$null).Trim(),
  "bookings="  + (docker.exe exec -i supabase_db_projeklomba_umkm psql -U postgres -d postgres -t -A -c "select count(*) from public.bookings" 2>$null).Trim(),
  "profiles="  + (docker.exe exec -i supabase_db_projeklomba_umkm psql -U postgres -d postgres -t -A -c "select count(*) from public.profiles" 2>$null).Trim(),
  "conversations=" + (docker.exe exec -i supabase_db_projeklomba_umkm psql -U postgres -d postgres -t -A -c "select count(*) from public.conversations" 2>$null).Trim(),
  "messages="  + (docker.exe exec -i supabase_db_projeklomba_umkm psql -U postgres -d postgres -t -A -c "select count(*) from public.messages" 2>$null).Trim(),
  "disputes="  + (docker.exe exec -i supabase_db_projeklomba_umkm psql -U postgres -d postgres -t -A -c "select count(*) from public.disputes" 2>$null).Trim(),
  "dispute_infos=" + (docker.exe exec -i supabase_db_projeklomba_umkm psql -U postgres -d postgres -t -A -c "select count(*) from public.dispute_infos" 2>$null).Trim()
) -join ' '
Check 'row counts are untouched' ($after -match 'umkms=4' -and $after -match 'influencers=4' -and $after -match 'bookings=5' -and $after -match 'profiles=9' -and $after -match 'conversations=5' -and $after -match 'messages=13' -and $after -match 'disputes=3' -and $after -match 'dispute_infos=3') $after

Write-Output ""
if ($script:failures -eq 0) { Write-Output "ALL CHECKS PASSED" } else { Write-Output "$($script:failures) CHECK(S) FAILED" }