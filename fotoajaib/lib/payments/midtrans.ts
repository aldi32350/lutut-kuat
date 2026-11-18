import crypto from "crypto";

/**
 * Midtrans Snap (QRIS, GoPay, ShopeePay, Virtual Account).
 * Docs: https://docs.midtrans.com/reference/snap-api
 */

const isProd = () => process.env.MIDTRANS_IS_PRODUCTION === "true";
const base = () => (isProd() ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com");
const serverKey = () => process.env.MIDTRANS_SERVER_KEY ?? "";

export async function createMidtransTransaction(input: {
  orderId: string;
  amount: number;
  itemName: string;
  email: string;
  name: string;
  finishUrl: string;
}) {
  const res = await fetch(`${base()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey()}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: input.amount },
      item_details: [{ id: input.orderId, price: input.amount, quantity: 1, name: input.itemName.slice(0, 50) }],
      customer_details: { first_name: input.name || "Pelanggan", email: input.email },
      enabled_payments: ["other_qris", "gopay", "shopeepay", "bca_va", "bni_va", "bri_va", "permata_va", "echannel", "cimb_va"],
      callbacks: { finish: input.finishUrl },
      expiry: { unit: "hours", duration: 24 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.redirect_url) throw new Error(`Midtrans error: ${JSON.stringify(data).slice(0, 300)}`);
  return { redirectUrl: data.redirect_url as string, token: data.token as string };
}

/** signature_key = SHA512(order_id + status_code + gross_amount + server_key) */
export function verifyMidtransSignature(n: { order_id: string; status_code: string; gross_amount: string; signature_key: string }) {
  // Tanpa server key, tanda tangan bisa dipalsukan siapa saja → tolak semua
  if (!serverKey() || typeof n.signature_key !== "string") return false;
  const expected = crypto.createHash("sha512").update(`${n.order_id}${n.status_code}${n.gross_amount}${serverKey()}`).digest("hex");
  return expected.length === n.signature_key?.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(n.signature_key));
}

export function midtransStatus(n: { transaction_status: string; fraud_status?: string }): "paid" | "failed" | "pending" {
  if (n.transaction_status === "settlement") return "paid";
  if (n.transaction_status === "capture") return n.fraud_status === "accept" ? "paid" : "pending";
  if (["deny", "cancel", "expire", "failure"].includes(n.transaction_status)) return "failed";
  return "pending";
}
