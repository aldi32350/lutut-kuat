import { Navbar } from "@/components/layout/Navbar";
import { Studio } from "@/components/studio/Studio";
import { KATEGORI, PRESETS } from "@/lib/presets";

export const metadata = { title: "Studio" };

export default function StudioPage() {
  // Hanya data yang aman dikirim ke browser (promptTemplate tetap di server).
  const presets = PRESETS.filter((p) => p.aktif).map(({ promptTemplate: _omit, ...rest }) => rest);
  return (
    <>
      <Navbar />
      <Studio presets={presets} kategori={KATEGORI} />
    </>
  );
}
