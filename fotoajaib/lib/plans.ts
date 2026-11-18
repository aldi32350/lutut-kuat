/**
 * Paket & harga. Ubah angka di sini, halaman harga, akun, dan pembayaran ikut berubah.
 * Semua paket dibayar sekali (bukan langganan otomatis).
 */

export interface Paket {
  id: string;
  nama: string;
  harga: number; // Rupiah
  kredit: number;
  /** aktifkan Pro selama N hari (akses semua fitur + tanpa watermark) */
  proHari?: number;
  deskripsi: string;
  fitur: string[];
  unggulan?: boolean;
}

export const PAKET: Paket[] = [
  {
    id: "kredit-20",
    nama: "Isi 20 Kredit",
    harga: 19_000,
    kredit: 20,
    deskripsi: "Tambah kredit untuk fitur gratis.",
    fitur: ["20 kali generate", "Fitur non-Pro", "Kredit tidak hangus"],
  },
  {
    id: "pro-30",
    nama: "Pro 30 Hari",
    harga: 49_000,
    kredit: 60,
    proHari: 30,
    deskripsi: "Semua fitur, tanpa watermark.",
    fitur: ["60 kredit", "Akses semua fitur Pro", "Tanpa watermark", "Prioritas antrean"],
    unggulan: true,
  },
  {
    id: "kredit-100",
    nama: "Isi 100 Kredit",
    harga: 79_000,
    kredit: 100,
    deskripsi: "Paling hemat untuk jualan online.",
    fitur: ["100 kali generate", "Hemat 17% per kredit", "Kredit tidak hangus"],
  },
];

export const FREE_INFO = {
  nama: "Gratis",
  fitur: ["3 kredit untuk akun baru", "Fitur non-Pro", "Watermark kecil di hasil"],
};

export function getPaket(id: string) {
  return PAKET.find((p) => p.id === id) ?? null;
}

export const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
