import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Penyimpanan file.
 * Tahap A: folder lokal `.data/` (tidak ikut git), diakses via /api/files/...
 * Tahap C: diganti Supabase Storage tanpa mengubah pemanggilnya.
 */

export type FileKind = "inputs" | "outputs";

const ROOT = path.join(process.cwd(), ".data");

export async function saveFile(kind: FileKind, data: Buffer, ext: "png" | "jpg" | "webp") {
  const id = crypto.randomUUID();
  const name = `${id}.${ext}`;
  const dir = path.join(ROOT, kind);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), data);
  return { id, name, url: `/api/files/${kind}/${name}` };
}

const SAFE_NAME = /^[0-9a-f-]{36}\.(png|jpg|webp)$/;

export async function readFile(kind: string, name: string) {
  if ((kind !== "inputs" && kind !== "outputs") || !SAFE_NAME.test(name)) return null;
  try {
    return await fs.readFile(path.join(ROOT, kind, name));
  } catch {
    return null;
  }
}
