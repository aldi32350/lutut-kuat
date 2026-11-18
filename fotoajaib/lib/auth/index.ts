import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";
import { getDb, type Profile } from "@/lib/db";
import { readSessionToken, SESSION_COOKIE } from "./local";

export interface CurrentUser extends Profile {
  isAdmin: boolean;
  isPro: boolean;
}

export function isProActive(p: Pick<Profile, "plan" | "planExpiresAt">) {
  return p.plan === "pro" && !!p.planExpiresAt && new Date(p.planExpiresAt).getTime() > Date.now();
}

function decorate(p: Profile): CurrentUser {
  const isAdmin = p.role === "admin" || config.adminEmails.includes(p.email.toLowerCase());
  return { ...p, isAdmin, isPro: isProActive(p) };
}

/** User yang sedang login (atau null). Hanya untuk server. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const db = await getDb();

  if (config.authMode === "local") {
    const userId = readSessionToken(cookies().get(SESSION_COOKIE)?.value);
    if (!userId) return null;
    const p = await db.getProfile(userId);
    return p ? decorate(p) : null;
  }

  const { supabaseServer } = await import("@/lib/supabase/server");
  const { data } = await supabaseServer().auth.getUser();
  const u = data.user;
  if (!u) return null;
  // Profil dibuat otomatis saat pertama kali login (termasuk via Google)
  const p =
    (await db.getProfile(u.id)) ??
    (await db.ensureProfile(
      { id: u.id, email: u.email ?? "", name: (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || "" },
      config.freeCredits,
    ));
  return decorate(p);
}

export async function requireUser(next = "/studio") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!user.isAdmin) redirect("/");
  return user;
}
