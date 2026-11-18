import { Navbar } from "@/components/layout/Navbar";
import { GalleryGrid } from "@/components/galeri/GalleryGrid";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PRESETS } from "@/lib/presets";

export const metadata = { title: "Galeri" };
export const dynamic = "force-dynamic";

export default async function GaleriPage() {
  const user = await requireUser("/galeri");
  const db = await getDb();
  const items = await db.listGenerations(user.id);
  const namaPreset = Object.fromEntries(PRESETS.map((p) => [p.id, p.nama]));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold">Galeri</h1>
        <p className="text-sm text-muted-foreground">Semua hasil foto kamu. Tandai yang favorit dengan “Simpan”.</p>
        <GalleryGrid
          initial={items.map((g) => ({ id: g.id, presetId: g.presetId, inputUrl: g.inputUrl, outputUrl: g.outputUrl!, saved: g.saved, createdAt: g.createdAt }))}
          namaPreset={namaPreset}
        />
      </main>
    </>
  );
}
