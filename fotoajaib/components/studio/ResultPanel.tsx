"use client";

import { Download, FolderHeart, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

export interface GenerateResponse {
  id: string;
  presetId: string;
  inputUrl: string;
  outputUrl: string;
  provider: string;
  watermark: boolean;
  durationMs: number;
}

interface Props {
  result: GenerateResponse;
  beforeUrl: string;
  onRegenerate: () => void;
  busy: boolean;
}

export function ResultPanel({ result, beforeUrl, onRegenerate, busy }: Props) {
  const filename = `fotoajaib-${result.presetId}-${result.id.slice(0, 8)}.png`;

  return (
    <div className="space-y-4">
      <BeforeAfterSlider before={beforeUrl} after={result.outputUrl} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button asChild size="lg">
          <a href={`${result.outputUrl}?download=${filename}`} download={filename}>
            <Download className="mr-2 h-4 w-4" /> Unduh PNG HD
          </a>
        </Button>
        <Button size="lg" variant="outline" onClick={onRegenerate} disabled={busy}>
          <RefreshCw className="mr-2 h-4 w-4" /> Generate Ulang
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => toast.info("Galeri segera hadir", { description: "Nanti hasil bisa disimpan setelah kamu login." })}
        >
          <FolderHeart className="mr-2 h-4 w-4" /> Simpan ke Galeri
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Selesai dalam {(result.durationMs / 1000).toFixed(1)} detik
        {result.watermark && " · Akun gratis memakai watermark kecil"}
        {result.provider === "mock" && " · Mode demo (belum memakai AI asli)"}
      </p>
    </div>
  );
}
