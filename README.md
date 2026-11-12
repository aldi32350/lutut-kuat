# Lutut Kuat

Aplikasi web (PWA) latihan lutut di rumah untuk lansia. Fitur utamanya:

- 15 gerakan dengan animasi
- 5 program latihan
- pemutar latihan dengan panduan suara Bahasa Indonesia
- riwayat latihan dan mode offline
- masa coba 3 hari, halaman pembayaran, dan aktivasi dengan kode

## Struktur
- `lutut-kuat/`: aplikasinya. Folder ini yang di-upload ke hosting.
- `lutut-kuat/PANDUAN.md`: panduan pemilik, berisi cara mengganti brand, lisensi, dan cara menjual.
- `deploy.sh`: skrip untuk meng-upload aplikasi ke VPS.

## Server pembayaran & admin
- `server/app/server.js` adalah API pembayaran (pesanan, bukti bayar, dan persetujuan admin). Ditulis dengan Node.js tanpa dependensi.
- `server/app/admin.html` adalah halaman admin di `/admin`.
- `server/docker-compose.yml` dijalankan di VPS (`/opt/lutut-kuat-api`).
- Kunci tanda tangan lisensi (`server/keys/`), file `.env`, dan data pembeli **tidak** disimpan di repo.

## Menjalankan di komputer
1. Buat kunci tanda tangan dan password admin untuk uji coba. Lihat `server/app/server.js` untuk variabel yang dibutuhkan: `ADMIN_HASH`, `LICENSE_KEY`, dan `DATA_DIR`.
2. Jalankan perintah ini, lalu buka http://localhost:3000:
   ```
   STATIC_DIR=lutut-kuat DATA_DIR=server/data-test LICENSE_KEY=server/keys/license-private.pem node server/app/server.js
   ```
