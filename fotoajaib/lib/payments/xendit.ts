import crypto from "crypto";

/**
 * Xendit Invoice (QRIS, e-wallet, Virtual Account dalam satu halaman bayar).
 * Docs: https://developers.xendit.co/api-reference/#create-invoice
 */

export async function createXenditInvoice(input: {
  orderId: string;
  amount: number;
  description: string;
  email: string;
  successUrl: string;
  failureUrl: string;
}) {
  const res = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${process.env.XENDIT_SECRET_KEY ?? ""}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      external_id: input.orderId,
      amount: input.amount,
      description: input.description,
      payer_email: input.email,
      currency: "IDR",
      invoice_duration: 86400,
      success_redirect_url: input.successUrl,
      failure_redirect_url: input.failureUrl,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.invoice_url) throw new Error(`Xendit error: ${JSON.stringify(data).slice(0, 300)}`);
  return { redirectUrl: data.invoice_url as string, invoiceId: data.id as string };
}

/** Webhook Xendit membawa header x-callback-token yang harus sama dengan token di dashboard. */
export function verifyXenditToken(token: string | null) {
  const expected = process.env.XENDIT_WEBHOOK_TOKEN ?? "";
  if (!expected || !token || token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
