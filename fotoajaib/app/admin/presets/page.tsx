import { getCatalog } from "@/lib/catalog";
import { findPreset, KATEGORI } from "@/lib/presets";
import { PresetManager } from "@/components/admin/PresetManager";

export const metadata = { title: "Kelola preset" };

export default async function AdminPresetsPage() {
  const catalog = await getCatalog({ includeInactive: true });
  return (
    <PresetManager
      kategori={KATEGORI.map((k) => ({ id: k.id, nama: k.nama }))}
      presets={catalog.map((p) => ({
        id: p.id,
        kategori: p.kategori,
        nama: p.nama,
        deskripsi: p.deskripsi,
        promptTemplate: p.promptTemplate,
        aktif: p.aktif,
        premium: !!p.premium,
        diubah: p.diubah,
        bawaan: findPreset(p.id)!.promptTemplate,
      }))}
    />
  );
}
