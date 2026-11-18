import { getDb } from "@/lib/db";
import { applyPaidPayment } from "@/lib/payments/apply";
import { midtransStatus, verifyMidtransSignature } from "@/lib/payments/midtrans";

export const runtime = "nodejs";

/**
 * Notifikasi pembayaran Midtrans.
 * Set di Midtrans Dashboard → Settings → Payment → Notification URL:
 *   https://domainmu.com/api/payment/webhook/midtrans
 */
export async function POST(req: Request) {
  const n = await req.json().catch(() => null);
  if (!n?.order_id || !verifyMidtransSignature(n)) {
    return Response.json({ error: "signature tidak valid" }, { status: 403 });
  }

  const db = await getDb();
  const payment = await db.getPayment(n.order_id);
  if (!payment) return Response.json({ error: "order tidak ditemukan" }, { status: 404 });
  if (Math.round(Number(n.gross_amount)) !== payment.amount) {
    console.error("[midtrans] nominal tidak cocok", n.order_id, n.gross_amount, payment.amount);
    return Response.json({ error: "nominal tidak cocok" }, { status: 400 });
  }

  const status = midtransStatus(n);
  if (status === "paid") await applyPaidPayment(n.order_id, n.transaction_id ?? null);
  if (status === "failed") await db.markPaymentFailed(n.order_id);
  return Response.json({ ok: true });
}
