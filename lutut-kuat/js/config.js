// =====================================================
//  PENGATURAN BRAND — ubah bagian ini sesuai brand Anda
// =====================================================
window.APP_CONFIG = {
  appName: "Lutut Kuat",
  tagline: "Latihan lutut ringan di rumah",
  // Nomor WhatsApp untuk tombol "Hubungi Kami" (format internasional, tanpa +). Kosongkan "" jika tidak dipakai.
  whatsapp: "6285122142971",
  // Nama penjual / brand yang tampil di halaman Tentang
  author: "Tim Lutut Kuat",
  version: "1.1.0",

  // ---------- LISENSI & PEMBAYARAN ----------
  price: 49000, // harga aktivasi (Rupiah), sekali bayar
  trialDays: 3, // masa coba gratis sejak pertama kali dibuka
  // Kunci rahasia pembuat kode aktivasi diambil dari js/secret.js (tidak di-upload ke GitHub).
  licenseSecret: window.APP_SECRET || "",
  payment: {
    accountName: "Muhamad Aldi Wiyono",
    qris: "img/qris.png",
    banks: [
      { bank: "BSI", number: "7306102006" },
      { bank: "BRI", number: "226201016975504" },
      { bank: "BCA", number: "7380913725" },
      { bank: "Mandiri", number: "1140029914267" },
    ],
  },
};
