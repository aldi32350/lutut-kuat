/**
 * Konfigurasi berbasis .env. Semua bagian punya "mode demo" supaya app bisa
 * dicoba tanpa akun Supabase / Gemini / Midtrans.
 */

const supabaseEnabled = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function pickPaymentProvider(): "midtrans" | "xendit" | "demo" {
  const explicit = process.env.PAYMENT_PROVIDER?.toLowerCase();
  if (explicit === "midtrans" || explicit === "xendit" || explicit === "demo") return explicit;
  if (process.env.MIDTRANS_SERVER_KEY) return "midtrans";
  if (process.env.XENDIT_SECRET_KEY) return "xendit";
  return "demo";
}

export const config = {
  /** true → login, database & storage memakai Supabase. false → mode demo lokal (.data/) */
  supabaseEnabled,
  authMode: (supabaseEnabled ? "supabase" : "local") as "supabase" | "local",
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  adminEmails: (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  paymentProvider: pickPaymentProvider(),
  /** kredit gratis untuk akun baru */
  freeCredits: Number(process.env.FREE_CREDITS ?? 3),
  rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 5),
  /** rahasia untuk menandatangani cookie sesi mode lokal */
  authSecret: process.env.AUTH_SECRET || "dev-secret-ganti-di-produksi",
  storageBucket: process.env.SUPABASE_BUCKET || "photos",
};
