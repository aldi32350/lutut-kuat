import { getDb } from "@/lib/db";
import { applyPaidPayment } from "@/lib/payments/apply";
import { verifyXenditToken } from "@/lib/payments/xendit";

export const runtime = "nodejs";

/**
 * Callback invoice Xendit.
 * Set di Xendit Dashboard → Settings → Webhooks → Invoices paid:
 *   https://domainmu.com/api/payment/webhook/xendit
 */
export async function POST(req: Request) {
  if (!verifyXenditToken(req.headers.get("x-callback-token"))) {
    return Response.json({ error: "token tidak valid" }, { status: 403 });
  }
  const n = await req.json().catch(() => null);
  if (!n?.external_id) return Response.json({ error: "data tidak lengkap" }, { status: 400 });

  const db = await getDb();
  const payment = await db.getPayment(n.external_id);
  if (!payment) return Response.json({ error: "order tidak ditemukan" }, { status: 404 });

  if (n.status === "PAID" || n.status === "SETTLED") {
    if (Math.round(Number(n.paid_amount ?? n.amount)) < payment.amount) {
      return Response.json({ error: "nominal kurang" }, { status: 400 });
    }
    await applyPaidPayment(n.external_id, n.id ?? null);
  } else if (n.status === "EXPIRED") {
    await db.markPaymentFailed(n.external_id);
  }
  return Response.json({ ok: true });
}
