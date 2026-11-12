# Lutut Kuat: Panduan Pemilik Aplikasi

Aplikasi web (PWA) untuk latihan lutut di rumah. Aplikasi ini dibuka lewat link di HP, bisa dipasang ke layar utama seperti aplikasi biasa, dan tetap jalan tanpa internet setelah dibuka sekali.

## Isi aplikasi
- **15 gerakan** dengan animasi figur, langkah-langkah, tips, dan peringatan.
- **5 program**: Pemanasan Pagi, Lutut Kuat (Duduk), Lutut Kuat (Berdiri), Latihan di Tempat Tidur, dan Peregangan Santai.
- **Pemutar latihan otomatis**: hitung mundur, hitungan repetisi, timer tahan, istirahat, dan kaki kanan/kiri (animasinya ikut dicerminkan).
- **Panduan suara Bahasa Indonesia** dan bunyi bip. Jika perangkat tidak punya suara Indonesia, aplikasi memakai bip saja dan menampilkan cara menambahkan suaranya.
- **Riwayat**: hari beruntun, kalender bulanan, dan catatan rasa lutut setelah latihan.
- **Ramah lansia**: tulisan bisa diperbesar, tombol besar, kecepatan bisa diatur ke "Lambat", dan layar tetap menyala selama latihan.
- Peringatan medis ditampilkan saat aplikasi pertama kali dibuka.

## Mengganti brand
Edit `js/config.js` untuk mengubah nama aplikasi, tagline, nomor WhatsApp, dan nama penjual.
Nama di `manifest.webmanifest` dan `<title>` di `index.html` juga perlu diganti.
Ikonnya ada di folder `icons/`.

Setiap kali mengubah file, naikkan versi `CACHE` di `sw.js` (misalnya `lutut-kuat-v2`) supaya pengguna lama mendapat versi terbaru.

## Lisensi, pembayaran & admin
- Pengguna **wajib mengisi nama panggilan** dan mencentang persetujuan sebelum memakai aplikasi.
- Masa coba **3 hari** sejak pertama kali menekan "Mulai". Beranda menampilkan **hitung mundur**; setelah habis, aplikasi **terkunci total** dan hanya halaman pembayaran yang bisa dibuka.

### Alur pembeli
1. Isi **nama lengkap** dan **nomor HP/WhatsApp**.
2. Pilih **metode pembayaran**: QRIS, atau transfer BSI/BRI/BCA/Mandiri (a.n. Muhamad Aldi Wiyono).
3. Upload **foto/screenshot bukti bayar**.
4. Status berubah menjadi "sedang dicek". Setelah Anda menyetujuinya, aplikasi pembeli **aktif otomatis** (dicek tiap 10 detik selama halaman terbuka, dan setiap kali aplikasi dibuka).

### Menu admin (khusus Anda)
- Alamat: **https://lututkuat.web.id/admin**. Password ada di file `admin-password.txt` (di folder `Project Aldi`). Simpan password di tempat aman lalu hapus file itu.
- Tab **Perlu dicek**: berisi nama, nomor HP (bisa diklik ke WA), metode, dan **foto bukti** (ketuk untuk memperbesar).
- **✅ Setujui**: tekan setelah Anda memastikan uangnya sudah masuk ke rekening atau QRIS. Aplikasi pembeli langsung aktif, dan muncul tawaran untuk mengirim kabar plus kode lewat WhatsApp.
- **❌ Tolak**: tulis alasannya. Pembeli akan melihat alasan itu dan bisa mengirim ulang bukti.
- **Buat kode manual**: untuk pembeli yang membayar di luar aplikasi. Masukkan kode perangkat dari HP pembeli (ada di menu Pengaturan).
- Kode aktivasi adalah **tanda tangan digital** dari server untuk satu HP, jadi tidak bisa dipalsukan atau dipakai di HP lain.

### Data di server (VPS)
- Folder `/opt/lutut-kuat-api` (container `lk-api`): `data/orders.json` berisi data pembeli, `data/proofs/` berisi foto bukti, dan `data/keys/` berisi kunci tanda tangan. **Jangan hapus folder `data/keys`**, karena tanpa kunci itu semua kode aktivasi tidak bisa dibuat lagi.
- Data pembeli (nama, nomor HP, foto bukti) adalah data pribadi. Simpan seperlunya, dan hapus data lama lewat tombol **🗑 Hapus** di admin bila sudah tidak diperlukan.
- Kalau ingin mengganti password admin, minta dibuatkan ulang isi `ADMIN_HASH` di `/opt/lutut-kuat-api/.env`, lalu jalankan `docker compose up -d` di folder itu.

### Keterbatasan
Masa coba tetap disimpan di HP, jadi pengguna yang paham teknis masih bisa mengulangnya dengan menghapus data browser. Kode aktivasi sendiri tidak bisa dipalsukan.

## Foto
Semua foto di folder `img/` berasal dari Pexels (https://www.pexels.com/license/), yang gratis dan boleh dipakai untuk tujuan komersial tanpa atribusi.
Nomor foto di Pexels: 5637731 (pembuka), 5637581 (beranda), 6787540, 11674389, 6815685, 6798725, 7500435 (program), dan 5637858 (selesai).

Aturan Pexels yang perlu diperhatikan:
- Jangan menjual foto ini secara terpisah tanpa diubah.
- Jangan menampilkan orang di dalam foto seolah-olah mereka mendukung atau merekomendasikan produk Anda.
  Contohnya, jangan beri keterangan "testimoni" atau "pengguna kami".

Untuk mengganti foto, cukup timpa file dengan nama yang sama di folder `img/`.

## Mencoba di komputer
```
python -m http.server 5173 --directory lutut-kuat
```
Setelah itu buka http://localhost:5173

## Online-kan (gratis)
1. **Netlify Drop**: buka https://app.netlify.com/drop lalu seret folder `lutut-kuat`. Anda langsung mendapat link, dan nama domainnya bisa diganti.
2. Alternatif lain: Vercel, Cloudflare Pages, atau GitHub Pages.

Aplikasi wajib dibuka lewat **https** supaya bisa dipasang di layar utama dan berjalan offline. Semua layanan di atas sudah otomatis memakai https.

## Ide cara menjual
- **Jual akses link**: pembeli membayar di Lynk.id, Shopee, atau marketplace lain, lalu menerima link aplikasi.
  Catatan: link bisa dibagikan pembeli ke orang lain. Aplikasi ini belum punya sistem login atau kode aktivasi.
- **Jadikan APK Android**: buka https://www.pwabuilder.com, masukkan link aplikasi, lalu unduh paket Android. Hasilnya bisa dibagikan sebagai file APK atau diunggah ke Play Store.
- **Target pembeli**: anak atau keluarga yang merawat orang tua, komunitas lansia, posyandu lansia, dan klinik fisioterapi (dengan nama klinik sebagai brand).
- **Bahan konten**: rekam layar animasi gerakan untuk Reels atau TikTok, misalnya "3 gerakan lutut untuk ibu di rumah".

## Penting
- Isi gerakan adalah latihan umum yang lazim dipakai. **Sebaiknya minta fisioterapis meninjau isinya** sebelum dijual luas. Langkah ini juga bisa dijadikan nilai jual ("disusun bersama fisioterapis").
- Jangan mengklaim aplikasi bisa **menyembuhkan** penyakit. Gunakan kata-kata seperti "membantu menjaga kekuatan dan kelenturan lutut".
