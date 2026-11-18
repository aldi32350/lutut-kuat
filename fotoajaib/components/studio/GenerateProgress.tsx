"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TAHAP = [
  "Menganalisis foto…",
  "Memisahkan subjek dari latar…",
  "Mengatur pencahayaan studio…",
  "Merapikan detail & tepi…",
  "Menyempurnakan hasil akhir…",
];

/** Progress perkiraan: naik cepat lalu melambat, tidak pernah 100% sebelum benar-benar selesai. */
export function GenerateProgress({ estimasiDetik }: { estimasiDetik: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed((Date.now() - start) / 1000), 250);
    return () => clearInterval(t);
  }, []);

  const pct = Math.min(95, 95 * (1 - Math.exp(-elapsed / (estimasiDetik * 0.55))));
  const sisa = Math.ceil(estimasiDetik - elapsed);
  const tahap = TAHAP[Math.min(TAHAP.length - 1, Math.floor((pct / 95) * TAHAP.length))];

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6 text-center" role="status" aria-live="polite">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
      <div>
        <p className="font-semibold">{tahap}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {sisa > 0 ? `Perkiraan ${sisa} detik lagi` : "Sebentar lagi selesai, AI sedang finishing…"}
        </p>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground">Jangan tutup halaman ini ya.</p>
    </div>
  );
}
