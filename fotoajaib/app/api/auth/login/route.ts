import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { findLocalUser } from "@/lib/db/local";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifyPassword } from "@/lib/auth/local";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Masuk (mode demo lokal). */
export async function POST(req: Request) {
  if (config.authMode !== "local") return Response.json({ error: "Gunakan login Supabase" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!rateLimit(`login:${email}`, 10, 15 * 60_000).ok) {
    return Response.json({ error: "Terlalu banyak percobaan. Tunggu 15 menit." }, { status: 429 });
  }

  const user = await findLocalUser(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return Response.json({ error: "Email atau password salah." }, { status: 401 });
  }

  cookies().set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions);
  return Response.json({ ok: true });
}
