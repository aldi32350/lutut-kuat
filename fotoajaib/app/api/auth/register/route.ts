import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { getDb } from "@/lib/db";
import { createLocalUser } from "@/lib/db/local";
import { createSessionToken, hashPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/local";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Daftar akun (mode demo lokal). Mode Supabase mendaftar langsung dari browser. */
export async function POST(req: Request) {
  if (config.authMode !== "local") return Response.json({ error: "Gunakan login Supabase" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (!rateLimit(`reg:${ip}`, 5, 60 * 60_000).ok) return Response.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 60);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!name) return Response.json({ error: "Nama wajib diisi." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Format email belum benar." }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password minimal 8 karakter." }, { status: 400 });

  const user = await createLocalUser(email, name, hashPassword(password));
  if (!user) return Response.json({ error: "Email ini sudah terdaftar. Silakan masuk." }, { status: 409 });

  const db = await getDb();
  await db.ensureProfile({ id: user.id, email, name }, config.freeCredits);

  cookies().set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions);
  return Response.json({ ok: true });
}
