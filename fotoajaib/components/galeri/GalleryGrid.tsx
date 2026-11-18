"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, FolderHeart, Heart, ImageOff, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BeforeAfterSlider } from "@/components/studio/BeforeAfterSlider";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  presetId: string;
  inputUrl: string;
  outputUrl: string;
  saved: boolean;
  createdAt: string;
}

export function GalleryGrid({ initial, namaPreset }: { initial: Item[]; namaPreset: Record<string, string> }) {
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<"semua" | "disimpan">("semua");
  const [open, setOpen] = useState<Item | null>(null);

  const list = tab === "semua" ? items : items.filter((i) => i.saved);

  async function toggleSave(item: Item) {
    const saved = !item.saved;
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, saved } : x)));
    setOpen((o) => (o?.id === item.id ? { ...o, saved } : o));
    const res = await fetch(`/api/generations/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saved }),
    });
    if (!res.ok) {
      toast.error("Gagal menyimpan. Coba lagi.");
      setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, saved: !saved } : x)));
    }
  }

  async function hapus(item: Item) {
    if (!confirm("Hapus foto ini dari galeri? Tindakan ini tidak bisa dibatalkan.")) return;
    const res = await fetch(`/api/generations/${item.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Gagal menghapus. Coba lagi.");
    setItems((xs) => xs.filter((x) => x.id !== item.id));
    setOpen(null);
    toast.success("Foto dihapus.");
  }

  return (
    <>
      <div className="mt-4 inline-flex rounded-xl bg-muted p-1 text-sm font-medium">
        {(["semua", "disimpan"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-lg px-4 py-1.5 transition", tab === t ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            {t === "semua" ? `Semua (${items.length})` : `Disimpan (${items.filter((i) => i.saved).length})`}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <ImageOff className="h-8 w-8" />
          {tab === "semua" ? "Belum ada foto. Yuk buat foto pertamamu!" : "Belum ada foto yang disimpan."}
          <Button asChild size="sm">
            <Link href="/studio">Buka Studio</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((it) => (
            <div key={it.id} className="group relative overflow-hidden rounded-2xl border bg-card">
              <button className="block w-full" onClick={() => setOpen(it)} aria-label="Lihat foto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.outputUrl} alt={namaPreset[it.presetId] ?? "Hasil"} loading="lazy" className="aspect-square w-full bg-checker object-cover" />
              </button>
              <button
                onClick={() => toggleSave(it)}
                aria-label={it.saved ? "Batal simpan" : "Simpan"}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur"
              >
                <Heart className={cn("h-4 w-4", it.saved && "fill-red-500 text-red-500")} />
              </button>
              <div className="p-2.5">
                <p className="line-clamp-1 text-sm font-medium">{namaPreset[it.presetId] ?? it.presetId}</p>
                <p className="text-xs text-muted-foreground">{new Date(it.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={() => setOpen(null)}>
          <div className="max-h-[95vh] w-full max-w-2xl overflow-auto rounded-t-3xl bg-background p-4 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">{namaPreset[open.presetId] ?? open.presetId}</p>
              <button onClick={() => setOpen(null)} aria-label="Tutup" className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <BeforeAfterSlider before={open.inputUrl} after={open.outputUrl} />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button asChild>
                <a href={`${open.outputUrl}?download=fotoajaib-${open.presetId}-${open.id.slice(0, 8)}.png`}>
                  <Download className="mr-1.5 h-4 w-4" /> Unduh
                </a>
              </Button>
              <Button variant="outline" onClick={() => toggleSave(open)}>
                <FolderHeart className="mr-1.5 h-4 w-4" /> {open.saved ? "Tersimpan" : "Simpan"}
              </Button>
              <Button variant="outline" onClick={() => hapus(open)} className="text-destructive">
                <Trash2 className="mr-1.5 h-4 w-4" /> Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
