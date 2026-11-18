import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { AutoRefresh } from "@/components/pricing/AutoRefresh";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getPaket } from "@/lib/plans";

export const metadata = { title: "Status pembayaran" };
export const dynamic = "force-dynamic";

/** Halaman kembali setelah bayar. Status sebenarnya ditentukan webhook, jadi halaman ini menunggu. */
export default async function SelesaiPage({ searchParams }: { searchParams: { order?: string } }) {
  const user = await requireUser("/akun");
  const payment = await (await getDb()).getPayment(searchParams.order ?? "");
  const mine = payment && payment.userId === user.id ? payment : null;
  const paket = mine ? getPaket(mine.packageId) : null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        {!mine ? (
          <p>Order tidak ditemukan.</p>
        ) : mine.status === "paid" ? (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
            <h1 className="mt-4 text-2xl font-bold">Pembayaran berhasil!</h1>
            <p className="mt-2 text-muted-foreground">
              {paket?.nama} sudah aktif. +{paket?.kredit} kredit masuk ke akunmu.
            </p>
            <Button asChild className="mt-6">
              <Link href="/studio">Mulai buat foto</Link>
            </Button>
          </>
        ) : mine.status === "pending" ? (
          <>
            <Clock className="mx-auto h-14 w-14 text-accent" />
            <h1 className="mt-4 text-2xl font-bold">Menunggu pembayaran…</h1>
            <p className="mt-2 text-muted-foreground">Halaman ini diperbarui otomatis setelah pembayaranmu terkonfirmasi.</p>
            <AutoRefresh seconds={5} />
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-14 w-14 text-destructive" />
            <h1 className="mt-4 text-2xl font-bold">Pembayaran gagal atau kedaluwarsa</h1>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/akun#paket">Coba lagi</Link>
            </Button>
          </>
        )}
      </main>
    </>
  );
}
