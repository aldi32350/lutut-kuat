"use client";

import { Search } from "lucide-react";
import type { KategoriId, PublicPreset } from "@/lib/presets";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

interface Props {
  presets: PublicPreset[];
  kategori: { id: KategoriId; nama: string; ikon: string }[];
  activeKategori: KategoriId | "semua";
  onKategori: (k: KategoriId | "semua") => void;
  query: string;
  onQuery: (q: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function filterPresets(presets: PublicPreset[], k: KategoriId | "semua", q: string) {
  const needle = q.trim().toLowerCase();
  return presets.filter(
    (p) =>
      (k === "semua" || p.kategori === k) &&
      (!needle || p.nama.toLowerCase().includes(needle) || p.deskripsi.toLowerCase().includes(needle)),
  );
}

/** Search + daftar kategori. Desktop: sidebar vertikal. HP: chip horizontal. */
export function KategoriNav({
  presets, kategori, activeKategori, onKategori, query, onQuery,
}: Pick<Props, "presets" | "kategori" | "activeKategori" | "onKategori" | "query" | "onQuery">) {
  const count = (k: KategoriId) => presets.filter((p) => p.kategori === k).length;
  const items = [{ id: "semua" as const, nama: "Semua", ikon: "Sparkles" }, ...kategori];

  return (
    <div className="space-y-3">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Cari fitur, mis. pas foto"
          className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        {items.map((k) => {
          const n = k.id === "semua" ? presets.length : count(k.id);
          const active = activeKategori === k.id;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => onKategori(k.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition lg:rounded-lg lg:border-transparent lg:py-2",
                active ? "border-primary bg-primary text-primary-foreground lg:bg-primary/10 lg:text-primary" : "hover:bg-muted",
              )}
            >
              <Icon name={k.ikon} className="h-4 w-4" />
              <span className="whitespace-nowrap">{k.nama}</span>
              <span className={cn("ml-auto hidden text-xs lg:inline", active ? "" : "text-muted-foreground")}>{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PresetGrid({ list, selectedId, onSelect }: { list: PublicPreset[]; selectedId: string | null; onSelect: (id: string) => void }) {
  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Belum ada fitur di sini. Fitur lainnya segera hadir!
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {list.map((p) => {
        const active = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            aria-pressed={active}
            className={cn(
              "group overflow-hidden rounded-2xl border bg-card text-left transition",
              active ? "border-primary ring-2 ring-primary" : "hover:border-primary/50 hover:shadow-md",
            )}
          >
            <div className="relative grid grid-cols-2">
              {p.premium && (
                <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground shadow">
                  PRO
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.contohGambar.before} alt="Sebelum" className="aspect-square w-full object-cover" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.contohGambar.after} alt="Sesudah" className="aspect-square w-full object-cover" />
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Icon name={p.ikon} className="h-4 w-4 shrink-0 text-primary" />
                <span className="line-clamp-1">{p.nama}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.deskripsi}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
