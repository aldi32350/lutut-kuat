"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { KategoriId, PublicPreset } from "@/lib/presets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UploadZone, type UploadedPhoto } from "./UploadZone";
import { KategoriNav, PresetGrid, filterPresets } from "./PresetCatalog";
import { PresetInputs } from "./PresetInputs";
import { GenerateProgress } from "./GenerateProgress";
import { ResultPanel, type GenerateResponse } from "./ResultPanel";

interface Props {
  presets: PublicPreset[];
  kategori: { id: KategoriId; nama: string; ikon: string }[];
  user: { credits: number; isPro: boolean } | null;
  initialPresetId?: string;
}

type Status = "idle" | "loading" | "done" | "error";

function defaultInputs(p: PublicPreset) {
  const v: Record<string, string> = {};
  for (const f of p.inputTambahan ?? []) if (f.default) v[f.nama] = f.default;
  return v;
}

export function Studio({ presets, kategori, user, initialPresetId }: Props) {
  const router = useRouter();
  const first = presets.find((p) => p.id === initialPresetId) ?? presets[0];
  const [photo, setPhoto] = useState<UploadedPhoto | null>(null);
  const [photo2, setPhoto2] = useState<UploadedPhoto | null>(null);
  const [kat, setKat] = useState<KategoriId | "semua">("semua");
  const [query, setQuery] = useState("");
  const [presetId, setPresetId] = useState<string | null>(first?.id ?? null);
  const [inputs, setInputs] = useState<Record<string, string>>(first ? defaultInputs(first) : {});
  const [credits, setCredits] = useState(user?.credits ?? 0);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const preset = presets.find((p) => p.id === presetId) ?? null;
  const list = useMemo(() => filterPresets(presets, kat, query), [presets, kat, query]);

  const butuh2 = preset?.jumlahFotoInput === 2;
  const terkunci = !!preset?.premium && !user?.isPro;
  const kurangInput = preset?.inputTambahan?.find((f) => f.wajib && f.tipe !== "image" && !(inputs[f.nama] ?? "").trim());
  const siap =
    !!user && !terkunci && credits > 0 && !!photo && !!preset && (!butuh2 || !!photo2) && (!preset.butuhPersetujuan || consent) && !kurangInput;

  // Teks tombol utama menjelaskan apa yang masih kurang
  const labelTombol = !user
    ? "Masuk untuk generate"
    : terkunci
      ? "Khusus Pro — upgrade"
      : credits < 1
        ? "Kredit habis — isi ulang"
        : !photo || (butuh2 && !photo2)
          ? "Upload foto dulu"
          : preset?.butuhPersetujuan && !consent
            ? "Centang persetujuan dulu"
            : kurangInput
              ? `Isi “${kurangInput.label}”`
              : `Generate · 1 kredit`;

  function tombolUtama() {
    if (!user) return router.push(`/login?next=${encodeURIComponent(`/studio?fitur=${presetId ?? ""}`)}`);
    if (terkunci || credits < 1) return router.push("/akun#paket");
    generate();
  }
  const step = !photo ? 1 : status === "idle" ? 2 : 3;

  useEffect(() => {
    if (status !== "idle") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [status]);

  function pilihPreset(id: string) {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    setInputs(defaultInputs(p));
    setConsent(false);
  }

  async function generate() {
    if (!photo || !preset) return;
    setStatus("loading");
    setError(null);

    const fd = new FormData();
    fd.append("image", photo.file);
    if (butuh2 && photo2) fd.append("image2", photo2.file);
    fd.append("presetId", preset.id);
    fd.append("inputs", JSON.stringify(inputs));
    fd.append("consent", String(consent));

    try {
      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.error) {
        throw new Error(data?.error?.message ?? "Ups, ada yang salah. Coba lagi ya.");
      }
      setResult(data as GenerateResponse);
      setCredits(data.creditsLeft);
      setStatus("done");
      toast.success("Foto berhasil dibuat!", { description: `Sisa kredit: ${data.creditsLeft}` });
      router.refresh(); // perbarui angka kredit di navbar
    } catch (e) {
      const msg =
        e instanceof TypeError ? "Koneksi internet terputus. Periksa sinyal lalu coba lagi." : (e as Error).message;
      setError(msg);
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 lg:pb-12">
      <Stepper step={step} />

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <KategoriNav
            presets={presets}
            kategori={kategori}
            activeKategori={kat}
            onKategori={setKat}
            query={query}
            onQuery={setQuery}
          />
        </aside>

        <div className="min-w-0 space-y-8">
          <section aria-labelledby="s1">
            <SectionTitle id="s1" n={1} title="Upload foto" />
            <div className={cn("grid gap-3", butuh2 && "sm:grid-cols-2")}>
              <UploadZone value={photo} onChange={setPhoto} label={preset?.labelFoto?.[0] ?? (butuh2 ? "Foto pertama" : "Upload foto")} />
              {butuh2 && <UploadZone value={photo2} onChange={setPhoto2} label={preset?.labelFoto?.[1] ?? "Foto kedua"} />}
            </div>
          </section>

          <section aria-labelledby="s2">
            <SectionTitle id="s2" n={2} title="Pilih gaya" />
            <PresetGrid list={list} selectedId={presetId} onSelect={pilihPreset} />

            {preset && (preset.inputTambahan?.length || preset.butuhPersetujuan) ? (
              <div className="mt-4 rounded-2xl border bg-card p-4">
                <p className="mb-3 text-sm font-semibold">Atur “{preset.nama}”</p>
                <PresetInputs preset={preset} values={inputs} onChange={setInputs} consent={consent} onConsent={setConsent} />
              </div>
            ) : null}

            {/* Tombol generate: menempel di bawah layar pada HP */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur lg:static lg:mt-4 lg:border-0 lg:bg-transparent lg:p-0">
              <Button
                size="lg"
                className="h-12 w-full rounded-xl text-base lg:w-auto lg:px-10"
                disabled={status === "loading" || (!siap && !!user && !terkunci && credits > 0)}
                onClick={tombolUtama}
                data-testid="generate-btn"
              >
                {terkunci ? <Lock className="mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
                {status === "loading" ? "Sedang membuat…" : labelTombol}
              </Button>
            </div>
          </section>

          <section aria-labelledby="s3" ref={resultRef} className="scroll-mt-20">
            <SectionTitle id="s3" n={3} title="Hasil" />
            {status === "idle" && (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Hasil foto akan muncul di sini.
              </div>
            )}
            {status === "loading" && <GenerateProgress estimasiDetik={preset?.estimasiDetik ?? 15} />}
            {status === "error" && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm">{error}</p>
                <Button variant="outline" onClick={generate} disabled={!siap}>
                  Coba Lagi
                </Button>
              </div>
            )}
            {status === "done" && result && photo && (
              <ResultPanel key={result.id} result={result} beforeUrl={photo.previewUrl} onRegenerate={generate} busy={false} />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({ id, n, title }: { id: string; n: number; title: string }) {
  return (
    <h2 id={id} className="mb-3 flex items-center gap-2 text-lg font-bold">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm text-primary-foreground">{n}</span>
      {title}
    </h2>
  );
}

function Stepper({ step }: { step: number }) {
  const items = ["Upload", "Pilih gaya", "Hasil"];
  return (
    <ol className="flex items-center gap-2 text-xs sm:text-sm">
      {items.map((label, i) => {
        const n = i + 1;
        const state = n < step ? "done" : n === step ? "now" : "next";
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                state === "next" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
              )}
            >
              {n}
            </span>
            <span className={cn("font-medium", state === "next" && "text-muted-foreground")}>{label}</span>
            {n < items.length && <span className={cn("h-px flex-1", n < step ? "bg-primary" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
