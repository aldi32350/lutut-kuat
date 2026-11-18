import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getPaket } from "@/lib/plans";
import { config } from "@/lib/config";
import { rateLimit } from "@/lib/rate-limit";
import { createMidtransTransaction } from "@/lib/payments/midtrans";
import { createXenditInvoice } from "@/lib/payments/xendit";

export const runtime = "nodejs";

/** Buat order lalu kembalikan URL halaman bayar (Midtrans / Xendit / simulasi demo). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Masuk dulu ya." }, { status: 401 });
  if (!rateLimit(`pay:${user.id}`, 10, 10 * 60_000).ok) {
    return Response.json({ error: "Terlalu banyak percobaan. Tunggu sebentar." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const paket = getPaket(String(body.packageId ?? ""));
  if (!paket) return Response.json({ error: "Paket tidak ditemukan." }, { status: 400 });

  const orderId = `FA-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const provider = config.paymentProvider;
  const db = await getDb();
  await db.createPayment({ id: orderId, userId: user.id, packageId: paket.id, amount: paket.harga, provider });

  const selesai = `${config.appUrl}/bayar/selesai?order=${orderId}`;
  try {
    if (provider === "midtrans") {
      const r = await createMidtransTransaction({
        orderId,
        amount: paket.harga,
        itemName: paket.nama,
        email: user.email,
        name: user.name,
        finishUrl: selesai,
      });
      return Response.json({ orderId, redirectUrl: r.redirectUrl });
    }
    if (provider === "xendit") {
      const r = await createXenditInvoice({
        orderId,
        amount: paket.harga,
        description: `FotoAjaib - ${paket.nama}`,
        email: user.email,
        successUrl: selesai,
        failureUrl: `${config.appUrl}/akun?bayar=gagal`,
      });
      return Response.json({ orderId, redirectUrl: r.redirectUrl });
    }
    // Mode demo: halaman simulasi pembayaran
    return Response.json({ orderId, redirectUrl: `/bayar/demo?order=${orderId}` });
  } catch (e) {
    console.error("[payment/create]", e);
    await db.markPaymentFailed(orderId);
    return Response.json({ error: "Gagal membuat pembayaran. Coba lagi sebentar lagi." }, { status: 502 });
  }
}
