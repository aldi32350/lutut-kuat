# FotoAjaib — AI Photo Studio

Ubah foto biasa jadi foto studio, pas foto, konten promosi, dan katalog produk dengan AI
(Google Gemini `gemini-2.5-flash-image` / "Nano Banana").

> Nama brand & warna diatur di satu file: [`lib/theme.ts`](lib/theme.ts).
> Harga paket di [`lib/plans.ts`](lib/plans.ts). Katalog fitur di [`lib/presets.ts`](lib/presets.ts).

## Fitur

- **25 gaya** dalam 5 kategori (Produk & Bisnis, Personal, Keluarga & Momen, Desain & Kreatif, Edit & Manipulasi)
- Alur 3 langkah: upload (kompres di HP) → pilih gaya → hasil dengan slider before/after, unduh PNG HD, simpan ke galeri
- Login email + Google (Supabase), galeri riwayat, akun & riwayat pembayaran
- **Kredit**: 3 gratis untuk akun baru, dikembalikan otomatis kalau generate gagal
- **Paket sekali bayar** (Midtrans Snap / Xendit Invoice: QRIS, e-wallet, VA) dengan webhook
- Paket **Pro**: buka fitur berlabel PRO + tanpa watermark
- Rate limit per user, moderasi teks, aturan keamanan di prompt (tolak konten dewasa/kekerasan/tokoh publik),
  checkbox persetujuan untuk fitur yang memakai wajah orang lain
- Halaman **admin**: statistik, daftar user + pemakaian, tambah kredit/beri Pro, kelola preset (aktif/nonaktif, edit prompt)

## Mode demo (tanpa akun apa pun)

Semua layanan luar punya pengganti lokal, jadi app bisa dicoba tanpa mendaftar apa-apa:

| Bagian | Kalau .env kosong | Kalau diisi |
|---|---|---|
| AI | `mock`: foto ditaruh di bingkai bertulisan "MODE DEMO" | Gemini |
| Login, database, foto | file lokal di folder `.data/` (email + password saja) | Supabase (email + Google) |
| Pembayaran | halaman simulasi, tidak ada uang berpindah | Midtrans atau Xendit |

Halaman `/admin` menampilkan mode yang sedang aktif.

## Cara install (lokal)

Butuh **Node.js 18.17+** (sudah dites di Node 26).

```bash
cd fotoajaib
npm install
cp .env.example .env.local      # Windows PowerShell: copy .env.example .env.local
npm run dev
```

Buka http://localhost:3000.

1. Isi `ADMIN_EMAILS=email-kamu@contoh.com` di `.env.local`, lalu restart.
2. Daftar di `/login` dengan email itu → kamu otomatis admin (ikon perisai di navbar).

## Isi `.env.local`

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL publik, mis. `https://fotoajaib.vercel.app` (untuk redirect pembayaran) |
| `ADMIN_EMAILS` | email admin, pisahkan dengan koma |
| `AUTH_SECRET` | string acak panjang (dipakai di mode demo untuk cookie sesi) |
| `FREE_CREDITS` | kredit gratis akun baru (default 3) |
| `RATE_LIMIT_PER_MINUTE` | batas generate per user per menit (default 5) |
| `AI_PROVIDER` | `gemini` / `mock` / `openai` / `replicate`. Kosong = otomatis |
| `GEMINI_API_KEY` | dari https://aistudio.google.com/apikey — **model gambar butuh billing aktif** |
| `GEMINI_IMAGE_MODEL` | default `gemini-2.5-flash-image` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | dari Supabase → Project Settings → API |
| `SUPABASE_BUCKET` | nama bucket Storage (default `photos`) |
| `PAYMENT_PROVIDER` | `midtrans` / `xendit` / `demo`. Kosong = otomatis |
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION` | dari Midtrans Dashboard → Settings → Access Keys |
| `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_TOKEN` | dari Xendit Dashboard → Settings → API Keys / Webhooks |

> Jangan pernah commit `.env.local` (sudah di-.gitignore).

## Setup Supabase

1. Buat project di https://supabase.com (region Singapore paling dekat).
2. **SQL Editor** → tempel isi [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → Run.
   Ini membuat tabel `profiles`, `credits` (ledger), `generations`, `payments`, `preset_overrides`,
   fungsi atomik kredit, Row Level Security, dan bucket Storage privat `photos`.
3. **Project Settings → API**: salin URL, `anon` key, dan `service_role` key ke `.env.local`.
4. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (lokal) atau domain produksi
   - Redirect URLs: tambahkan `http://localhost:3000/auth/callback` dan `https://domainmu.com/auth/callback`
5. **Login Google** (opsional): Authentication → Providers → Google → aktifkan, isi Client ID & Secret dari
   Google Cloud Console (OAuth client "Web application", redirect URI = `https://<project>.supabase.co/auth/v1/callback`).
6. Restart `npm run dev`. Profil & 3 kredit gratis dibuat otomatis saat user pertama kali login.

Catatan: data di mode demo (`.data/`) **tidak** otomatis pindah ke Supabase.

## Setup pembayaran

### Midtrans
1. Daftar di https://dashboard.midtrans.com (mulai dari Sandbox).
2. Isi `MIDTRANS_SERVER_KEY` dan `MIDTRANS_IS_PRODUCTION=false`.
3. Settings → Payment → **Notification URL**: `https://domainmu.com/api/payment/webhook/midtrans`
4. Settings → Snap Preferences → Finish Redirect URL: `https://domainmu.com/bayar/selesai`

### Xendit
1. Daftar di https://dashboard.xendit.co, isi `XENDIT_SECRET_KEY`.
2. Settings → Webhooks → **Invoices paid**: `https://domainmu.com/api/payment/webhook/xendit`, salin "verification token" ke `XENDIT_WEBHOOK_TOKEN`.
3. Set `PAYMENT_PROVIDER=xendit` (kalau key Midtrans juga terisi).

Webhook diverifikasi (signature Midtrans / token Xendit), nominal dicek, dan aman dikirim berulang
(kredit tidak masuk dua kali). Untuk mencoba webhook di laptop, pakai tunnel seperti `ngrok http 3000`.

## Deploy ke Vercel

> Mode demo menyimpan data di disk, yang **tidak permanen** di Vercel. Untuk produksi, isi Supabase dulu.

1. Push repo ke GitHub (folder `fotoajaib/`).
2. Di https://vercel.com → **Add New Project** → pilih repo → **Root Directory: `fotoajaib`**.
3. Isi semua variabel `.env` di **Settings → Environment Variables** (ganti `NEXT_PUBLIC_APP_URL` ke domain Vercel).
4. Deploy. Generate butuh waktu sampai ~30 detik: route `/api/generate` sudah memakai `maxDuration = 120`
   (paket Hobby Vercel dibatasi 60 detik; kalau sering timeout, pakai paket Pro).
5. Update Supabase Redirect URLs & Notification URL Midtrans/Xendit ke domain produksi.

## Struktur penting

```
app/
  page.tsx                 landing (hero, contoh, cara kerja, harga, FAQ)
  studio/                  halaman utama app
  galeri/  akun/  login/   halaman user
  admin/                   statistik, user, kelola preset (khusus admin)
  bayar/demo|selesai       simulasi bayar & halaman kembali setelah bayar
  api/generate/            cek login, rate limit, kredit → moderasi → AI → watermark → simpan
  api/payment/             buat order + webhook Midtrans/Xendit
lib/
  presets.ts               katalog 25 fitur (1 fitur = 1 preset prompt)
  prompt.ts                isi template + klausa penjaga wajah & keamanan
  ai/provider.ts           interface provider AI (tambah provider baru di sini)
  db/                      interface database + implementasi Supabase & lokal
  auth/                    sesi user (Supabase / lokal)
  plans.ts                 paket & harga
  theme.ts                 nama brand & warna
supabase/migrations/       skema database
scripts/buat-contoh.mjs    membuat ilustrasi contoh before/after
```

### Menambah preset
Tambah objek di `PRESETS` dalam `lib/presets.ts`, lalu jalankan `node scripts/buat-contoh.mjs`
(atau taruh foto contoh asli `public/examples/<id>-before.*` & `-after.*`). Placeholder `{{nama}}`
diisi otomatis dari `inputTambahan`. Tandai `premium: true` untuk fitur khusus Pro.

### Mengganti gambar contoh
Gambar di `public/examples/` masih ilustrasi. Setelah Gemini aktif, generate contoh asli dan simpan
dengan nama file yang sama (format `.svg` boleh diganti `.jpg`, sesuaikan path `contoh()` di `lib/presets.ts`).

### Menambah provider AI
Buat file di `lib/ai/` yang mengimplementasikan `ImageProvider`, lalu daftarkan di `getProvider()`.
