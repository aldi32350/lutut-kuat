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

## Menjalankan di komputer
1. Salin `lutut-kuat/js/secret.example.js` menjadi `lutut-kuat/js/secret.js`, lalu isi dengan kunci acak milik Anda.
2. Jalankan perintah ini:
   ```
   python -m http.server 5173 --directory lutut-kuat
   ```
3. Buka http://localhost:5173

## Yang tidak disimpan di repo ini
- `lutut-kuat/js/secret.js`: kunci rahasia untuk membuat kode aktivasi.
- `pembuat-kode-aktivasi.html`: alat penjual untuk membuat kode aktivasi.

Kedua file ini hanya ada di komputer pemilik. Simpan cadangannya di tempat yang aman.
