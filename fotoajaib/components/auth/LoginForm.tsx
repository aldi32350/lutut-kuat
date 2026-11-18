"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  mode: "supabase" | "local";
  next: string;
  freeCredits: number;
  callbackError?: boolean;
}

export function LoginForm({ mode, next, freeCredits, callbackError }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"masuk" | "daftar">("masuk");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(callbackError ? "Login gagal. Coba lagi ya." : null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "local") {
        const res = await fetch(`/api/auth/${tab === "masuk" ? "login" : "register"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Gagal, coba lagi.");
        router.replace(next);
        router.refresh();
        return;
      }

      const { supabaseBrowser } = await import("@/lib/supabase/client");
      const supabase = supabaseBrowser();
      if (tab === "masuk") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(terjemahkan(error.message));
        router.replace(next);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw new Error(terjemahkan(error.message));
        if (data.session) {
          router.replace(next);
          router.refresh();
        } else {
          setInfo("Cek email kamu dan klik link konfirmasi untuk mengaktifkan akun.");
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const { supabaseBrowser } = await import("@/lib/supabase/client");
    await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <h1 className="text-2xl font-bold">{tab === "masuk" ? "Masuk" : "Buat akun"}</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Gift className="h-4 w-4 text-primary" /> Akun baru dapat {freeCredits} kredit gratis.
      </p>

      <div className="mt-5 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-medium">
        {(["masuk", "daftar"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn("rounded-lg py-2 transition", tab === t ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            {t === "masuk" ? "Masuk" : "Daftar"}
          </button>
        ))}
      </div>

      {mode === "supabase" ? (
        <>
          <Button type="button" variant="outline" className="mt-5 h-11 w-full" onClick={google}>
            <GoogleIcon /> Lanjut dengan Google
          </Button>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> atau pakai email <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : (
        <p className="mt-4 rounded-lg bg-accent/15 p-3 text-xs text-accent-foreground dark:text-accent">
          <b>Mode demo:</b> akun disimpan di komputer ini. Login Google aktif setelah Supabase disetel.
        </p>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        {tab === "daftar" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={tab === "masuk" ? "current-password" : "new-password"}
          />
        </div>

        {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {info && <p className="rounded-lg bg-primary/10 p-3 text-sm">{info}</p>}

        <Button type="submit" className="h-11 w-full" disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          {tab === "masuk" ? "Masuk" : "Daftar & dapat kredit gratis"}
        </Button>
      </form>
    </div>
  );
}

function terjemahkan(msg: string) {
  if (/invalid login/i.test(msg)) return "Email atau password salah.";
  if (/already registered/i.test(msg)) return "Email ini sudah terdaftar. Silakan masuk.";
  if (/email not confirmed/i.test(msg)) return "Email belum dikonfirmasi. Cek kotak masuk kamu.";
  if (/password/i.test(msg)) return "Password minimal 8 karakter.";
  return msg;
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
