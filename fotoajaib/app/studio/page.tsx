import { Navbar } from "@/components/layout/Navbar";
import { Studio } from "@/components/studio/Studio";
import { KATEGORI } from "@/lib/presets";
import { getCatalog, toPublic } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Studio" };
export const dynamic = "force-dynamic";

export default async function StudioPage({ searchParams }: { searchParams: { fitur?: string } }) {
  const [catalog, user] = await Promise.all([getCatalog(), getCurrentUser()]);
  // Hanya data yang aman dikirim ke browser (promptTemplate tetap di server).
  const presets = catalog.map(toPublic);

  return (
    <>
      <Navbar />
      <Studio
        presets={presets}
        kategori={KATEGORI}
        user={user ? { credits: user.credits, isPro: user.isPro } : null}
        initialPresetId={searchParams.fitur}
      />
    </>
  );
}
