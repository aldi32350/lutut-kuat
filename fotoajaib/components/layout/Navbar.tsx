import Link from "next/link";
import { Sparkles } from "lucide-react";
import { theme } from "@/lib/theme";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          {theme.brand.name}
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/studio" className="rounded-md px-3 py-2 font-medium hover:bg-muted">
            Studio
          </Link>
          <span className="rounded-md px-3 py-2 text-muted-foreground" title="Tersedia di tahap berikutnya">
            Galeri
          </span>
        </nav>
      </div>
    </header>
  );
}
