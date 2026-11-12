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

## Lisensi: coba 3 hari, lalu bayar Rp49.000
- Pengguna **wajib mengisi nama panggilan** (minimal 2 huruf) dan mencentang persetujuan sebelum bisa memakai aplikasi.
- Masa coba **3 hari** dimulai saat pengguna menekan "Mulai" pertama kali. Beranda menampilkan **hitung mundur** (hari, jam, menit, detik) yang berubah menjadi merah ketika sisa waktunya kurang dari 1 hari.
- Begitu masa coba habis, aplikasi langsung **terkunci total**, termasuk saat sedang dibuka atau sedang latihan. Menu bawah hilang, dan yang bisa dibuka hanya **halaman pembayaran**. Halaman ini berisi QRIS, rekening BSI, BRI, BCA, dan Mandiri a.n. Muhamad Aldi Wiyono, serta kode perangkat pembeli.
- Pembeli mengirim **bukti bayar dan kode perangkat** kepada Anda.

### Cara mengaktifkan pembeli
1. Cek dulu bahwa uangnya sudah masuk.
2. Buka file **`pembuat-kode-aktivasi.html`** dengan klik dua kali. File ini ada di folder `Project Aldi`, di luar folder aplikasi.
3. Masukkan kode perangkat pembeli, lalu tekan **Buat kode aktivasi**.
4. Tekan **Salin pesan balasan** dan kirim pesannya ke pembeli.
5. Pembeli memasukkan kode itu di langkah 3 halaman pembayaran. Setelah itu aplikasi aktif selamanya.

Satu kode aktivasi **hanya berlaku di satu HP**, jadi kode tidak bisa dibagikan ke orang lain.

### Penting
- **Jangan upload `pembuat-kode-aktivasi.html`** ke hosting. Upload hanya isi folder `lutut-kuat`.
- Isi `whatsapp` di `js/config.js` (contoh: `"6281234567890"`). Setelah diisi, muncul tombol "Kirim bukti via WhatsApp" yang otomatis berisi pesan beserta kode perangkat pembeli.
- Untuk mengganti harga, masa coba, nomor rekening, atau QRIS, edit `js/config.js` dan file `img/qris.png`.
- **Keterbatasan:** aplikasi ini tidak punya server, jadi kuncinya bekerja di dalam HP. Orang yang paham teknis masih bisa mengakalinya, misalnya dengan menghapus data browser untuk mengulang masa coba. Untuk penjualan ke pengguna umum dan lansia, cara ini sudah memadai. Kalau nanti penjualannya besar, sistemnya bisa ditingkatkan dengan server login.

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
