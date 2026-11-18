import { getCurrentUser, isProActive } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

/** Admin: tambah/kurangi kredit, beri Pro N hari, atau ubah role. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser();
  if (!admin?.isAdmin) return Response.json({ error: "Khusus admin" }, { status: 403 });

  const db = await getDb();
  const target = await db.getProfile(params.id);
  if (!target) return Response.json({ error: "User tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  const kredit = Math.trunc(Number(body.addCredits ?? 0));
  if (kredit) {
    if (target.credits + kredit < 0) return Response.json({ error: "Kredit tidak boleh minus" }, { status: 400 });
    await db.addCredits(target.id, kredit, "admin", `oleh ${admin.email}`);
  }

  const hari = Math.trunc(Number(body.proHari ?? 0));
  if (hari > 0) {
    const base = isProActive(target) ? new Date(target.planExpiresAt!).getTime() : Date.now();
    await db.updateProfile(target.id, { plan: "pro", planExpiresAt: new Date(base + hari * 86_400_000).toISOString() });
  }
  if (body.cabutPro) await db.updateProfile(target.id, { plan: "free", planExpiresAt: null });

  if (body.role === "admin" || body.role === "user") {
    if (target.id === admin.id && body.role === "user") return Response.json({ error: "Tidak bisa mencabut admin diri sendiri" }, { status: 400 });
    await db.updateProfile(target.id, { role: body.role });
  }

  return Response.json({ ok: true, profile: await db.getProfile(target.id) });
}
