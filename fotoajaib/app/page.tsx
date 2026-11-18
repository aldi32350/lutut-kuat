import Link from "next/link";
import { ArrowRight, Download, ImagePlus, ShieldCheck, Sparkles, Wand2, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { BeforeAfterSlider } from "@/components/studio/BeforeAfterSlider";
import { PricingCards } from "@/components/pricing/PricingCards";
import { Icon } from "@/components/Icon";
import { theme } from "@/lib/theme";
import { KATEGORI } from "@/lib/presets";
import { getCatalog } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

const FAQ = [
  {
    q: "Apakah wajah saya akan berubah?",
    a: "Tidak. Setiap gaya diperintahkan untuk menjaga bentuk wajah, warna kulit, dan ciri khasmu, jadi hasilnya tetap kamu. Fitur seperti karikatur atau filter umur memang mengubah gaya, tapi tetap mudah dikenali.",
  },
  {
    q: "Berapa lama proses membuat satu foto?",
    a: "Biasanya 10–25 detik, tergantung gaya yang dipilih dan kepadatan server.",
  },
  {
    q: "Apa itu kredit?",
    a: `1 kredit = 1 kali generate. Akun baru dapat ${config.freeCredits} kredit gratis. Kalau generate gagal, kreditmu dikembalikan otomatis.`,
  },
  {
    q: "Apakah foto saya aman?",
    a: "Foto disimpan privat dan hanya bisa diakses lewat akunmu. Kamu bisa menghapus foto kapan saja dari Galeri.",
  },
  {
    q: "Foto apa saja yang tidak boleh?",
    a: "Konten dewasa, kekerasan, dan wajah tokoh publik/artis akan ditolak. Untuk fitur yang memakai wajah orang lain (misalnya gabung foto), kamu wajib punya izin dari orang tersebut.",
  },
  {
    q: "Bayarnya bagaimana?",
    a: "Sekali bayar, tanpa langganan otomatis. Bisa via QRIS, GoPay, OVO, DANA, ShopeePay, atau Virtual Account bank.",
  },
];

export default async function Home() {
  const [catalog, user] = await Promise.all([getCatalog(), getCurrentUser()]);
  const unggulan = ["pas-foto", "photoshoot-produk", "headshot-linkedin", "prewedding", "karikatur", "restorasi-foto", "foto-katalog", "thumbnail-youtube"]
    .map((id) => catalog.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <>
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_0%,hsl(var(--primary)/0.18),transparent),radial-gradient(40%_40%_at_0%_100%,hsl(var(--accent)/0.15),transparent)]" />
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Photo Studio di HP kamu
              </span>
              <h1 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Foto biasa jadi <span className="text-primary">foto studio</span> dalam hitungan detik
              </h1>
              <p className="mt-4 text-balance text-lg text-muted-foreground">
                Pas foto, headshot LinkedIn, foto produk jualan, prewedding, sampai restorasi foto lama. Cukup upload, pilih gaya, jadi.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
                  <Link href="/studio">
                    Coba Gratis <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
                  <a href="#harga">Lihat Harga</a>
                </Button>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> {config.freeCredits} foto gratis · tanpa kartu kredit · wajah tetap kamu
              </p>
            </div>
            <div className="mx-auto w-full max-w-md">
              <BeforeAfterSlider before="/examples/headshot-linkedin-before.svg" after="/examples/headshot-linkedin-after.svg" />
              <p className="mt-2 text-center text-xs text-muted-foreground">Geser untuk membandingkan sebelum &amp; sesudah</p>
            </div>
          </div>
        </section>

        {/* CONTOH */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-center text-3xl font-bold">{catalog.length}+ gaya siap pakai</h2>
          <p className="mt-2 text-center text-muted-foreground">Untuk jualan online, kebutuhan kerja, sampai momen keluarga.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {KATEGORI.map((k) => (
              <span key={k.id} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
                <Icon name={k.ikon} className="h-4 w-4 text-primary" /> {k.nama}
              </span>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {unggulan.map((p) => (
              <Link key={p.id} href={`/studio?fitur=${p.id}`} className="group overflow-hidden rounded-2xl border bg-card transition hover:shadow-lg">
                <div className="grid grid-cols-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.contohGambar.before} alt="" className="aspect-square w-full object-cover" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.contohGambar.after} alt="" className="aspect-square w-full object-cover" />
                </div>
                <div className="flex items-center gap-1.5 p-3 text-sm font-semibold">
                  <Icon name={p.ikon} className="h-4 w-4 shrink-0 text-primary" />
                  <span className="line-clamp-1">{p.nama}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/studio">Lihat semua gaya</Link>
            </Button>
          </div>
        </section>

        {/* CARA KERJA */}
        <section className="bg-muted/50 py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold">Cuma 3 langkah</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { icon: ImagePlus, t: "1. Upload foto", d: "Pilih dari galeri HP atau seret ke sini. JPG, PNG, WEBP hingga 10MB." },
                { icon: Wand2, t: "2. Pilih gaya", d: "Pas foto, headshot, foto produk, prewedding, dan puluhan gaya lain." },
                { icon: Download, t: "3. Unduh hasil", d: "Bandingkan sebelum–sesudah, lalu unduh PNG HD atau simpan ke galeri." },
              ].map((s) => (
                <div key={s.t} className="rounded-3xl border bg-card p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <s.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-accent" /> Rata-rata selesai dalam 15 detik
            </p>
          </div>
        </section>

        {/* HARGA */}
        <section id="harga" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-14">
          <h2 className="text-center text-3xl font-bold">Harga sederhana, sekali bayar</h2>
          <p className="mb-8 mt-2 text-center text-muted-foreground">Tanpa langganan otomatis. Bayar pakai QRIS, e-wallet, atau Virtual Account.</p>
          <PricingCards loggedIn={!!user} />
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-16">
          <h2 className="text-center text-3xl font-bold">Pertanyaan yang sering ditanyakan</h2>
          <div className="mt-6 space-y-2">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border bg-card p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span className="text-xl text-muted-foreground transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {theme.brand.name} · {theme.brand.tagline}
      </footer>
    </>
  );
}
