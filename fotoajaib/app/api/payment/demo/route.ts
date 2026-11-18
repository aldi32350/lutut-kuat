import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { getDb } from "@/lib/db";
import { applyPaidPayment } from "@/lib/payments/apply";

export const runtime = "nodejs";

/** Simulasi pembayaran — HANYA aktif saat belum ada Midtrans/Xendit (mode demo). */
export async function POST(req: Request) {
  if (config.paymentProvider !== "demo") return Response.json({ error: "Mode demo tidak aktif" }, { status: 404 });

  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Masuk dulu ya." }, { status: 401 });

  const { orderId, action } = await req.json().catch(() => ({}));
  const db = await getDb();
  const payment = await db.getPayment(String(orderId ?? ""));
  if (!payment || payment.userId !== user.id) return Response.json({ error: "Order tidak ditemukan." }, { status: 404 });

  if (action === "cancel") {
    await db.markPaymentFailed(payment.id);
    return Response.json({ ok: true, status: "failed" });
  }
  await applyPaidPayment(payment.id, `DEMO-${Date.now()}`);
  return Response.json({ ok: true, status: "paid" });
}
