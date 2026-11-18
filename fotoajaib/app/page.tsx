import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { theme } from "@/lib/theme";

// Landing page lengkap (hero, before-after, harga, FAQ) dibangun di Tahap E.
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">{theme.brand.tagline}</h1>
        <p className="mt-4 text-balance text-muted-foreground">
          Upload foto, pilih gaya, dan biarkan AI mengubahnya jadi foto studio, pas foto, atau konten promosi.
        </p>
        <Button asChild size="lg" className="mt-8 rounded-full">
          <Link href="/studio">
            Coba Sekarang <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </main>
    </>
  );
}
