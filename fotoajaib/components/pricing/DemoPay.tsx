"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, QrCode, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/plans";
import { cn } from "@/lib/utils";

const METODE = [
  { id: "qris", label: "QRIS", icon: QrCode },
  { id: "ewallet", label: "E-wallet (GoPay, OVO, DANA)", icon: Wallet },
  { id: "va", label: "Virtual Account (BCA, BNI, BRI)", icon: Building2 },
];

/** Halaman bayar tiruan untuk mode demo — tidak ada uang yang berpindah. */
export function DemoPay({ orderId, paketNama, amount, status }: { orderId: string; paketNama: string; amount: number; status: string }) {
  const router = useRouter();
  const [metode, setMetode] = useState("qris");
  const [busy, setBusy] = useState(false);

  async function kirim(action: "pay" | "cancel") {
    setBusy(true);
    await fetch("/api/payment/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action }),
    });
    router.replace(action === "pay" ? `/bayar/selesai?order=${orderId}` : "/akun#paket");
    router.refresh();
  }

  return (
    <div className="rounded-3xl border bg-card p-6">
      <p className="rounded-lg bg-accent/15 p-2 text-center text-xs font-medium">SIMULASI PEMBAYARAN · mode demo, tidak ada uang yang ditarik</p>
      <p className="mt-5 text-sm text-muted-foreground">Order {orderId}</p>
      <p className="font-semibold">{paketNama}</p>
      <p className="mt-1 text-3xl font-extrabold">{rupiah(amount)}</p>

      {status !== "pending" ? (
        <p className="mt-6 rounded-lg bg-muted p-3 text-sm">Order ini sudah {status === "paid" ? "lunas" : "dibatalkan"}.</p>
      ) : (
        <>
          <div className="mt-6 space-y-2">
            {METODE.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetode(m.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition",
                  metode === m.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted",
                )}
              >
                <m.icon className="h-5 w-5 text-primary" /> {m.label}
              </button>
            ))}
          </div>
          <Button className="mt-6 h-11 w-full" disabled={busy} onClick={() => kirim("pay")}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Bayar Sekarang (simulasi)
          </Button>
          <Button variant="ghost" className="mt-2 w-full" disabled={busy} onClick={() => kirim("cancel")}>
            Batalkan
          </Button>
        </>
      )}
    </div>
  );
}
