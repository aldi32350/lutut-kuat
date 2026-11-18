import { getDb } from "@/lib/db";
import { PRESETS, type Preset, type PublicPreset } from "@/lib/presets";

/**
 * Katalog efektif = preset bawaan (lib/presets.ts) + perubahan admin (tabel preset_overrides).
 * Hanya untuk server.
 */
export async function getCatalog(opts: { includeInactive?: boolean } = {}): Promise<(Preset & { diubah: boolean })[]> {
  const db = await getDb();
  const overrides = new Map((await db.getPresetOverrides()).map((o) => [o.id, o]));

  return PRESETS.map((p) => {
    const o = overrides.get(p.id);
    if (!o) return { ...p, diubah: false };
    return {
      ...p,
      aktif: o.aktif ?? p.aktif,
      nama: o.nama || p.nama,
      deskripsi: o.deskripsi || p.deskripsi,
      promptTemplate: o.promptTemplate || p.promptTemplate,
      diubah: true,
    };
  }).filter((p) => opts.includeInactive || p.aktif);
}

export async function getActivePreset(id: string) {
  return (await getCatalog()).find((p) => p.id === id) ?? null;
}

export function toPublic(p: Preset): PublicPreset {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { promptTemplate, ...rest } = p;
  return rest;
}
