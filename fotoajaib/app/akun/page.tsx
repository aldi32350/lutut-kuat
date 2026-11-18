import Link from "next/link";
import { Coins, Crown, ImageIcon } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { PricingCards } from "@/components/pricing/PricingCards";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getPaket, rupiah } from "@/lib/plans";
import { config } from "@/lib/config";

export const metadata = { title: "Akun" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  paid: { label: "Lunas", variant: "default" },
  pending: { label: "Menunggu", variant: "secondary" },
  failed: { label: "Gagal/Kedaluwarsa", variant: "destructive" },
};

export default async function AkunPage() {
  const user = await requireUser("/akun");
  const db = await getDb();
  const [payments, gens] = await Promise.all([db.listPayments(user.id), db.listGenerations(user.id, { limit: 1000 })]);
  const tglPro = user.planExpiresAt ? new Date(user.planExpiresAt).toLocaleDateString("id-ID", { dateStyle: "long" }) : null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Halo, {user.name || user.email.split("@")[0]}!</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <LogoutButton />
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat icon={<Coins className="h-5 w-5" />} label="Sisa kredit" value={String(user.credits)} testId="akun-credits" />
          <Stat
            icon={<Crown className="h-5 w-5" />}
            label="Paket"
            value={user.isPro ? "Pro" : "Gratis"}
            sub={user.isPro ? `aktif s.d. ${tglPro}` : "fitur Pro terkunci, ada watermark"}
            testId="akun-plan"
          />
          <Stat icon={<ImageIcon className="h-5 w-5" />} label="Foto dibuat" value={String(gens.length)} sub={<Link href="/galeri" className="underline">lihat galeri</Link>} />
        </section>

        <section id="paket" className="scroll-mt-20">
          <h2 className="text-lg font-bold">Beli kredit / upgrade</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Bayar via QRIS, e-wallet (GoPay, OVO, DANA, ShopeePay), atau Virtual Account.
            {config.paymentProvider === "demo" && " (Mode demo: pembayaran hanya simulasi.)"}
          </p>
          <PricingCards loggedIn showFree={false} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Riwayat pembayaran</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pembayaran.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Paket</th>
                    <th className="p-3">Nominal</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="whitespace-nowrap p-3">{new Date(p.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td className="p-3">{getPaket(p.packageId)?.nama ?? p.packageId}</td>
                      <td className="p-3">{rupiah(p.amount)}</td>
                      <td className="p-3">
                        <Badge variant={STATUS[p.status].variant}>{STATUS[p.status].label}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function Stat({ icon, label, value, sub, testId }: { icon: React.ReactNode; label: string; value: string; sub?: React.ReactNode; testId?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-primary">{icon}</span> {label}
      </div>
      <p className="mt-1 text-2xl font-bold" data-testid={testId}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
