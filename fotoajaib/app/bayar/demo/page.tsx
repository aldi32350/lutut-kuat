import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { DemoPay } from "@/components/pricing/DemoPay";
import { requireUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { getDb } from "@/lib/db";
import { getPaket } from "@/lib/plans";

export const metadata = { title: "Pembayaran (demo)" };
export const dynamic = "force-dynamic";

export default async function DemoBayarPage({ searchParams }: { searchParams: { order?: string } }) {
  if (config.paymentProvider !== "demo") notFound();
  const user = await requireUser("/akun");
  const payment = await (await getDb()).getPayment(searchParams.order ?? "");
  if (!payment || payment.userId !== user.id) notFound();
  const paket = getPaket(payment.packageId);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-8">
        <DemoPay orderId={payment.id} paketNama={paket?.nama ?? payment.packageId} amount={payment.amount} status={payment.status} />
      </main>
    </>
  );
}
