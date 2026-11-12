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
  version: "1.2.0",

  // ---------- LISENSI & PEMBAYARAN ----------
  price: 49000, // harga aktivasi (Rupiah), sekali bayar
  trialDays: 3, // masa coba gratis sejak pertama kali dibuka
  // Kunci PUBLIK untuk memeriksa kode aktivasi dari server (aman dibagikan).
  licensePublicKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEvNFHSwSgzoIFQdOk9tUn+EqnM6perEKeVZZUf81nKDkY7gYtUa6K2NOAeshBANSP0XQxJZ/mN8TagG99Id4Y/Q==",
  // Alamat server pembayaran. Kosong = domain yang sama dengan aplikasi.
  apiBase: "",
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
