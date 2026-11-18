"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FREE_INFO, PAKET, rupiah } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingCards({ loggedIn, showFree = true }: { loggedIn: boolean; showFree?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function beli(id: string) {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent("/akun#paket")}`);
      return;
    }
    setBusy(id);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.redirectUrl) throw new Error(data.error ?? "Gagal membuat pembayaran.");
      window.location.href = data.redirectUrl;
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <div className={cn("grid gap-4", showFree ? "md:grid-cols-4" : "md:grid-cols-3")}>
      {showFree && (
        <div className="flex flex-col rounded-3xl border bg-card p-5">
          <p className="font-semibold">{FREE_INFO.nama}</p>
          <p className="mt-2 text-3xl font-extrabold">Rp0</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm">
            {FREE_INFO.fitur.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 text-primary" /> {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="mt-5" onClick={() => router.push(loggedIn ? "/studio" : "/login")}>
            {loggedIn ? "Buka Studio" : "Daftar Gratis"}
          </Button>
        </div>
      )}
      {PAKET.map((p) => (
        <div
          key={p.id}
          className={cn("relative flex flex-col rounded-3xl border bg-card p-5", p.unggulan && "border-primary shadow-lg ring-2 ring-primary")}
        >
          {p.unggulan && (
            <span className="absolute -top-3 left-5 flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
              <Crown className="h-3.5 w-3.5" /> Paling laris
            </span>
          )}
          <p className="font-semibold">{p.nama}</p>
          <p className="mt-2 text-3xl font-extrabold">{rupiah(p.harga)}</p>
          <p className="text-xs text-muted-foreground">sekali bayar · {p.deskripsi}</p>
          <ul className="mt-4 flex-1 space-y-2 text-sm">
            {p.fitur.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 text-primary" /> {f}
              </li>
            ))}
          </ul>
          <Button className="mt-5" variant={p.unggulan ? "default" : "outline"} disabled={!!busy} onClick={() => beli(p.id)} data-paket={p.id}>
            {busy === p.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Beli
          </Button>
        </div>
      ))}
    </div>
  );
}
