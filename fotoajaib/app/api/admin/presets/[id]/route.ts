import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { findPreset } from "@/lib/presets";

export const runtime = "nodejs";

async function guard(id: string) {
  const admin = await getCurrentUser();
  if (!admin?.isAdmin) return Response.json({ error: "Khusus admin" }, { status: 403 });
  if (!findPreset(id)) return Response.json({ error: "Preset tidak ada" }, { status: 404 });
  return null;
}

/** Ubah preset (disimpan sebagai override; preset bawaan di lib/presets.ts tidak berubah). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const err = await guard(params.id);
  if (err) return err;
  const b = await req.json().catch(() => ({}));
  const db = await getDb();
  await db.upsertPresetOverride({
    id: params.id,
    ...(typeof b.aktif === "boolean" ? { aktif: b.aktif } : {}),
    ...(typeof b.nama === "string" ? { nama: b.nama.trim().slice(0, 80) } : {}),
    ...(typeof b.deskripsi === "string" ? { deskripsi: b.deskripsi.trim().slice(0, 200) } : {}),
    ...(typeof b.promptTemplate === "string" ? { promptTemplate: b.promptTemplate.trim().slice(0, 4000) } : {}),
  });
  return Response.json({ ok: true });
}

/** Kembalikan ke bawaan */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const err = await guard(params.id);
  if (err) return err;
  await (await getDb()).deletePresetOverride(params.id);
  return Response.json({ ok: true });
}
