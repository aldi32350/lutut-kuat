import type { AIErrorCode } from "./ai/provider";

export type ApiErrorCode =
  | AIErrorCode
  | "BAD_REQUEST"
  | "FILE_TYPE"
  | "FILE_SIZE"
  | "PRESET"
  | "CONSENT"
  | "MODERATION"
  | "RATE_LIMIT"
  | "AUTH"
  | "NO_CREDIT"
  | "PRO_ONLY"
  | "NOT_FOUND"
  | "INTERNAL";

/** Pesan ramah (Bahasa Indonesia) yang ditampilkan ke user. */
export const PESAN_ERROR: Record<ApiErrorCode, string> = {
  BAD_REQUEST: "Permintaan tidak lengkap. Coba muat ulang halaman lalu ulangi.",
  FILE_TYPE: "Format foto belum didukung. Pakai JPG, PNG, atau WEBP ya.",
  FILE_SIZE: "Ukuran foto terlalu besar. Maksimal 10MB.",
  PRESET: "Gaya yang dipilih tidak ditemukan. Pilih gaya lain.",
  CONSENT: "Centang dulu persetujuan pemakaian wajah orang lain.",
  MODERATION: "Maaf, permintaan ini tidak bisa diproses karena melanggar ketentuan konten (dewasa, kekerasan, atau tokoh publik).",
  RATE_LIMIT: "Kamu terlalu cepat! Tunggu sebentar lalu coba lagi.",
  SAFETY: "Foto ini tidak bisa diproses karena terdeteksi melanggar ketentuan konten (dewasa, kekerasan, atau wajah tokoh publik). Coba pakai foto lain.",
  NO_IMAGE: "AI belum berhasil membuat gambar kali ini. Coba Generate Ulang, atau pakai foto yang lebih jelas.",
  QUOTA: "Server AI sedang sibuk. Coba lagi dalam 1–2 menit.",
  CONFIG: "Layanan AI belum dikonfigurasi dengan benar. Hubungi admin.",
  TIMEOUT: "AI terlalu lama merespons. Coba lagi sebentar lagi.",
  PROVIDER: "Terjadi gangguan di layanan AI. Coba lagi sebentar lagi.",
  AUTH: "Masuk dulu ya untuk mulai membuat foto.",
  NO_CREDIT: "Kredit kamu habis. Isi ulang kredit untuk lanjut membuat foto.",
  PRO_ONLY: "Fitur ini khusus paket Pro. Upgrade untuk membukanya.",
  NOT_FOUND: "Data tidak ditemukan.",
  INTERNAL: "Ups, ada yang salah di server kami. Coba lagi ya.",
};

export function errorJson(code: ApiErrorCode, status: number, extra?: Record<string, unknown>) {
  return Response.json({ error: { code, message: PESAN_ERROR[code], ...extra } }, { status });
}
