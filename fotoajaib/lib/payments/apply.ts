import { getDb } from "@/lib/db";
import { getPaket } from "@/lib/plans";
import { isProActive } from "@/lib/auth";

/**
 * Jalankan efek pembayaran lunas: tambah kredit + aktifkan/perpanjang Pro.
 * Aman dipanggil berkali-kali (webhook sering dikirim ulang): hanya berefek sekali.
 */
export async function applyPaidPayment(orderId: string, providerRef: string | null) {
  const db = await getDb();
  const payment = await db.getPayment(orderId);
  if (!payment) return { ok: false as const, reason: "order tidak ditemukan" };

  const changed = await db.markPaymentPaid(orderId, providerRef);
  if (!changed) return { ok: true as const, already: true };

  const paket = getPaket(payment.packageId);
  if (!paket) return { ok: false as const, reason: "paket tidak dikenal" };

  await db.addCredits(payment.userId, paket.kredit, "purchase", orderId);

  if (paket.proHari) {
    const profile = await db.getProfile(payment.userId);
    // Perpanjang dari tanggal berakhir kalau Pro masih aktif
    const base = profile && isProActive(profile) ? new Date(profile.planExpiresAt!).getTime() : Date.now();
    const until = new Date(base + paket.proHari * 86_400_000).toISOString();
    await db.updateProfile(payment.userId, { plan: "pro", planExpiresAt: until });
  }
  return { ok: true as const, already: false };
}
