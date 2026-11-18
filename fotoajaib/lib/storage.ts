import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { config } from "@/lib/config";

/**
 * Penyimpanan foto.
 * - Supabase aktif → bucket Storage privat (default "photos")
 * - Mode demo     → folder lokal .data/
 * File selalu disajikan lewat /api/files/<kind>/<nama> (nama berupa UUID acak, sulit ditebak).
 */

export type FileKind = "inputs" | "outputs";

const ROOT = path.join(process.cwd(), ".data");
const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };
const SAFE_NAME = /^[0-9a-f-]{36}\.(png|jpg|webp)$/;

export async function saveFile(kind: FileKind, data: Buffer, ext: "png" | "jpg" | "webp", id: string = crypto.randomUUID()) {
  const name = `${id}.${ext}`;

  if (config.supabaseEnabled) {
    const { supabaseAdmin } = await import("@/lib/supabase/admin");
    const { error } = await supabaseAdmin().storage.from(config.storageBucket).upload(`${kind}/${name}`, data, {
      contentType: MIME[ext],
      upsert: false,
    });
    if (error) throw new Error(`Upload storage gagal: ${error.message}`);
  } else {
    const dir = path.join(ROOT, kind);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), data);
  }

  return { id, name, url: `/api/files/${kind}/${name}` };
}

export async function readFile(kind: string, name: string): Promise<Buffer | null> {
  if ((kind !== "inputs" && kind !== "outputs") || !SAFE_NAME.test(name)) return null;
  try {
    if (config.supabaseEnabled) {
      const { supabaseAdmin } = await import("@/lib/supabase/admin");
      const { data, error } = await supabaseAdmin().storage.from(config.storageBucket).download(`${kind}/${name}`);
      if (error || !data) return null;
      return Buffer.from(await data.arrayBuffer());
    }
    return await fs.readFile(path.join(ROOT, kind, name));
  } catch {
    return null;
  }
}

export async function deleteFiles(urls: (string | null)[]) {
  const items = urls
    .filter((u): u is string => !!u)
    .map((u) => u.match(/^\/api\/files\/(inputs|outputs)\/([0-9a-f-]{36}\.(?:png|jpg|webp))$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => `${m[1]}/${m[2]}`);
  if (!items.length) return;

  if (config.supabaseEnabled) {
    const { supabaseAdmin } = await import("@/lib/supabase/admin");
    await supabaseAdmin().storage.from(config.storageBucket).remove(items);
  } else {
    await Promise.all(items.map((p) => fs.rm(path.join(ROOT, p), { force: true })));
  }
}
