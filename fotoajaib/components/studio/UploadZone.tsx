"use client";

import { useCallback, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { ImagePlus, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIPE_OK = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export interface UploadedPhoto {
  file: File;
  previewUrl: string;
}

interface Props {
  label?: string;
  value: UploadedPhoto | null;
  onChange: (v: UploadedPhoto | null) => void;
  compact?: boolean;
}

export function UploadZone({ label = "Upload foto", value, onChange, compact }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (!TIPE_OK.includes(file.type)) {
        toast.error("Format foto belum didukung", { description: "Pakai JPG, PNG, atau WEBP ya." });
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("Foto terlalu besar", { description: "Maksimal 10MB. Coba pilih foto lain." });
        return;
      }
      setBusy(true);
      try {
        // Kompres di HP sebelum upload: hemat kuota & lebih cepat
        const compressed = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          initialQuality: 0.9,
        });
        const out = new File([compressed], file.name, { type: compressed.type || file.type });
        if (value) URL.revokeObjectURL(value.previewUrl);
        onChange({ file: out, previewUrl: URL.createObjectURL(out) });
      } catch {
        toast.error("Foto gagal dibaca", { description: "Coba pilih foto lain." });
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onChange, value],
  );

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        data-testid="upload-input"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-2xl border bg-checker">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.previewUrl} alt="Foto yang diupload" className={cn("mx-auto w-full object-contain", compact ? "max-h-48" : "max-h-80")} />
          <div className="absolute right-2 top-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/75"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Ganti
            </button>
            <button
              type="button"
              aria-label="Hapus foto"
              onClick={() => {
                URL.revokeObjectURL(value.previewUrl);
                onChange(null);
              }}
              className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/75"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 text-center transition",
            compact ? "py-6" : "py-12",
            drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/50",
          )}
        >
          {busy ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <ImagePlus className="h-6 w-6" />
            </span>
          )}
          <span className="font-semibold">{busy ? "Menyiapkan foto…" : label}</span>
          <span className="text-xs text-muted-foreground">
            <span className="hidden sm:inline">Seret foto ke sini atau klik. </span>
            JPG, PNG, WEBP · maks 10MB
          </span>
        </button>
      )}
    </div>
  );
}
