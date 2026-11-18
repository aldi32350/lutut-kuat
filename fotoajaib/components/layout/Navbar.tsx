import Link from "next/link";
import { Coins, Crown, Shield, Sparkles } from "lucide-react";
import { theme } from "@/lib/theme";
import { getCurrentUser } from "@/lib/auth";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="hidden min-[380px]:inline">{theme.brand.name}</span>
        </Link>

        <nav className="flex items-center gap-0.5 text-sm">
          <Link href="/studio" className="rounded-md px-2.5 py-2 font-medium hover:bg-muted">
            Studio
          </Link>
          {user && (
            <Link href="/galeri" className="rounded-md px-2.5 py-2 font-medium hover:bg-muted">
              Galeri
            </Link>
          )}
          {user?.isAdmin && (
            <Link href="/admin" className="rounded-md p-2 hover:bg-muted" aria-label="Admin">
              <Shield className="h-4 w-4" />
            </Link>
          )}
          {user ? (
            <Link
              href="/akun"
              className="ml-1 flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium hover:bg-muted"
              title="Kredit & akun"
            >
              {user.isPro ? <Crown className="h-4 w-4 text-accent" /> : <Coins className="h-4 w-4 text-primary" />}
              <span data-testid="nav-credits">{user.credits}</span>
              <span className="hidden sm:inline">kredit</span>
            </Link>
          ) : (
            <Link href="/login" className="ml-1 rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground hover:opacity-90">
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
