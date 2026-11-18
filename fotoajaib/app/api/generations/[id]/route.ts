import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { errorJson } from "@/lib/errors";
import { deleteFiles } from "@/lib/storage";

export const runtime = "nodejs";

async function own(id: string) {
  const user = await getCurrentUser();
  if (!user) return { err: errorJson("AUTH", 401) };
  const db = await getDb();
  const gen = await db.getGeneration(id);
  if (!gen || gen.userId !== user.id) return { err: errorJson("NOT_FOUND", 404) };
  return { db, gen };
}

/** Simpan / batal simpan ke galeri */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const r = await own(params.id);
  if (r.err) return r.err;
  const body = await req.json().catch(() => ({}));
  await r.db.updateGeneration(params.id, { saved: Boolean(body.saved) });
  return Response.json({ ok: true, saved: Boolean(body.saved) });
}

/** Hapus dari riwayat (beserta file) */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const r = await own(params.id);
  if (r.err) return r.err;
  await r.db.deleteGeneration(params.id);
  await deleteFiles([r.gen.inputUrl, r.gen.outputUrl]).catch(() => {});
  return Response.json({ ok: true });
}
