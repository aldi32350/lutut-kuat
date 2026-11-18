"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  kategori: string;
  nama: string;
  deskripsi: string;
  promptTemplate: string;
  aktif: boolean;
  premium: boolean;
  diubah: boolean;
  bawaan: string;
}

export function PresetManager({ presets, kategori }: { presets: Row[]; kategori: { id: string; nama: string }[] }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Matikan preset, ubah nama/deskripsi, atau sesuaikan prompt. Perubahan disimpan di database; tombol “Reset” mengembalikan ke bawaan
        di <code>lib/presets.ts</code>. Klausa penjaga wajah & keamanan selalu ditambahkan otomatis.
      </p>
      {kategori.map((k) => (
        <section key={k.id}>
          <h2 className="mb-2 font-semibold">{k.nama}</h2>
          <div className="space-y-2">
            {presets
              .filter((p) => p.kategori === k.id)
              .map((p) => (
                <PresetRow key={p.id} p={p} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PresetRow({ p }: { p: Row }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState(p.nama);
  const [deskripsi, setDeskripsi] = useState(p.deskripsi);
  const [prompt, setPrompt] = useState(p.promptTemplate);
  const [busy, setBusy] = useState(false);

  async function kirim(method: "PATCH" | "DELETE", body?: object, pesan = "Tersimpan") {
    setBusy(true);
    const res = await fetch(`/api/admin/presets/${p.id}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (!res.ok) return toast.error("Gagal menyimpan");
    toast.success(pesan);
    router.refresh();
  }

  return (
    <div className={cn("rounded-xl border bg-card", !p.aktif && "opacity-60")}>
      <div className="flex items-center gap-3 p-3">
        <label className="relative inline-flex cursor-pointer items-center" title={p.aktif ? "Aktif" : "Nonaktif"}>
          <input
            type="checkbox"
            className="peer sr-only"
            checked={p.aktif}
            onChange={(e) => kirim("PATCH", { aktif: e.target.checked }, e.target.checked ? `${p.nama} diaktifkan` : `${p.nama} dinonaktifkan`)}
            aria-label={`Aktifkan ${p.nama}`}
            data-preset-toggle={p.id}
          />
          <span className="h-6 w-11 rounded-full bg-muted transition peer-checked:bg-primary" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </label>
        <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setOpen(!open)}>
          <span className="truncate font-medium">{p.nama}</span>
          {p.premium && <Badge variant="secondary">PRO</Badge>}
          {p.diubah && <Badge variant="outline">diubah</Badge>}
          <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 transition", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Nama</Label>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Input value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Prompt template (bahasa Inggris, placeholder {"{{nama}}"})</Label>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={7} className="font-mono text-xs" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => kirim("PATCH", { nama, deskripsi, promptTemplate: prompt })}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />} Simpan
            </Button>
            {p.diubah && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setPrompt(p.bawaan);
                  kirim("DELETE", undefined, "Dikembalikan ke bawaan");
                }}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" /> Reset ke bawaan
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
