# FotoAjaib — AI Photo Studio

Ubah foto biasa jadi foto studio, pas foto, konten promosi, dan katalog produk dengan AI
(Google Gemini `gemini-2.5-flash-image` / "Nano Banana").

> Nama brand & warna diatur di satu file: [`lib/theme.ts`](lib/theme.ts).

## Status pengembangan

| Tahap | Isi | Status |
|---|---|---|
| A | Setup project, upload, 1 preset (Hapus/Ganti Background) end-to-end | ✅ selesai |
| B | Semua preset katalog | ⏳ |
| C | Login Supabase (email + Google), galeri | ⏳ |
| D | Kredit, paket, pembayaran Midtrans/Xendit, rate limit per user | ⏳ |
| E | Landing page lengkap, halaman admin | ⏳ |

## Cara install (lokal)

Butuh **Node.js 18.17+** (sudah dites di Node 26).

```bash
cd fotoajaib
npm install
cp .env.example .env.local      # Windows PowerShell: copy .env.example .env.local
npm run dev
```

Buka http://localhost:3000/studio.

### Mode demo vs AI asli

- **Tanpa API key** → app otomatis memakai provider `mock`: tidak memanggil AI, hanya menaruh fotomu
  di bingkai putih bertuliskan "MODE DEMO". Berguna untuk mengetes alur tanpa biaya.
- **Dengan Gemini** → buat API key di https://aistudio.google.com/apikey, lalu isi di `.env.local`:
  ```
  GEMINI_API_KEY=isi_key_kamu
  ```
  Restart `npm run dev`. Keterangan di bawah hasil tidak lagi menulis "Mode demo".

## Isi `.env.local`

| Variabel | Wajib | Keterangan |
|---|---|---|
| `AI_PROVIDER` | – | `gemini` / `mock` / `openai` / `replicate`. Kosong = otomatis |
| `GEMINI_API_KEY` | ya (produksi) | API key Google AI Studio |
| `GEMINI_IMAGE_MODEL` | – | default `gemini-2.5-flash-image` |
| `RATE_LIMIT_PER_MINUTE` | – | batas generate per menit (default 5) |
| `MOCK_DELAY_MS` | – | jeda pura-pura provider mock |
| `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | Tahap C | |
| `MIDTRANS_*`, `XENDIT_*` | Tahap D | |

## Struktur penting

```
app/studio/            halaman studio
app/api/generate/      upload → moderasi → AI → watermark → simpan
app/api/files/         menyajikan file hasil (Tahap A: dari folder .data/)
lib/presets.ts         katalog fitur (1 fitur = 1 preset prompt)
lib/prompt.ts          isi template + klausa "preserve identity" & keamanan
lib/ai/provider.ts     interface provider + pemilih (tambah provider baru di sini)
lib/ai/gemini.ts       implementasi Gemini
lib/theme.ts           nama brand & warna
```

### Menambah preset
Tambahkan objek baru di `PRESETS` dalam `lib/presets.ts`. Placeholder `{{nama}}` di `promptTemplate`
otomatis diisi dari `inputTambahan`. Klausa penjaga identitas wajah & keamanan ditambahkan otomatis.

### Menambah provider AI
Buat file di `lib/ai/` yang mengimplementasikan `ImageProvider`, lalu daftarkan di `getProvider()`.

## Setup Supabase
_Ditulis lengkap di Tahap C._

## Deploy ke Vercel
_Ditulis lengkap setelah Tahap C_ (Tahap A menyimpan file di disk lokal, yang tidak permanen di Vercel).
