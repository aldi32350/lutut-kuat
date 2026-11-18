import crypto from "crypto";
import sharp from "sharp";
import { getActivePreset } from "@/lib/catalog";
import { buildPrompt, missingRequired, resolveAspect, type PresetInputs } from "@/lib/prompt";
import { AIError, getProvider } from "@/lib/ai/provider";
import { moderateText } from "@/lib/moderation";
import { rateLimit } from "@/lib/rate-limit";
import { saveFile } from "@/lib/storage";
import { addWatermark } from "@/lib/watermark";
import { errorJson } from "@/lib/errors";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 120; // detik (Vercel)

const MAX_BYTES = 10 * 1024 * 1024;
const TIPE_OK = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return errorJson("AUTH", 401);

  // Rate limit per user: memori (cepat) + database (berlaku di semua instance server)
  const limit = config.rateLimitPerMinute;
  const rl = rateLimit(`gen:${user.id}`, limit, 60_000);
  if (!rl.ok) return errorJson("RATE_LIMIT", 429, { retryAfterSec: rl.retryAfterSec });
  const db = await getDb();
  const recent = await db.countGenerationsSince(user.id, new Date(Date.now() - 60_000).toISOString());
  if (recent >= limit) return errorJson("RATE_LIMIT", 429, { retryAfterSec: 60 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return errorJson("BAD_REQUEST", 400);
  }

  const preset = await getActivePreset(String(form.get("presetId") ?? ""));
  if (!preset) return errorJson("PRESET", 400);
  if (preset.premium && !user.isPro) return errorJson("PRO_ONLY", 403);

  const inputs: PresetInputs = {};
  try {
    const raw = JSON.parse(String(form.get("inputs") ?? "{}"));
    for (const [k, v] of Object.entries(raw ?? {})) inputs[k] = String(v).slice(0, 300);
  } catch {
    return errorJson("BAD_REQUEST", 400);
  }

  if (preset.butuhPersetujuan && form.get("consent") !== "true") return errorJson("CONSENT", 400);

  const kurang = missingRequired(preset, inputs);
  if (kurang) return errorJson("BAD_REQUEST", 400, { message: `Isi dulu “${kurang}” ya.` });

  const files = [form.get("image"), form.get("image2")].filter((f): f is File => f instanceof File);
  if (files.length < preset.jumlahFotoInput) return errorJson("BAD_REQUEST", 400, { message: "Upload fotonya dulu ya." });
  for (const f of files) {
    if (!TIPE_OK.includes(f.type)) return errorJson("FILE_TYPE", 400);
    if (f.size > MAX_BYTES) return errorJson("FILE_SIZE", 400);
  }

  if (!moderateText(Object.values(inputs)).ok) return errorJson("MODERATION", 400);

  // Normalisasi: putar sesuai EXIF, batasi 2048px, JPEG. Foto rusak ditolak sebelum kredit dipotong.
  let images: { data: Buffer; mimeType: string }[];
  try {
    images = await Promise.all(
      files.slice(0, preset.jumlahFotoInput).map(async (f) => {
        const buf = Buffer.from(await f.arrayBuffer());
        const data = await sharp(buf).rotate().resize(2048, 2048, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 92 }).toBuffer();
        return { data, mimeType: "image/jpeg" };
      }),
    );
  } catch {
    return errorJson("FILE_TYPE", 400, { message: "Foto tidak bisa dibaca (mungkin rusak). Coba pilih foto lain." });
  }

  // Potong kredit (atomik); dikembalikan kalau gagal
  const genId = crypto.randomUUID();
  if (!(await db.consumeCredit(user.id, genId))) return errorJson("NO_CREDIT", 402);

  let recorded = false;
  try {
    const input = await saveFile("inputs", images[0].data, "jpg");
    await db.createGeneration({
      id: genId,
      userId: user.id,
      presetId: preset.id,
      inputUrl: input.url,
      outputUrl: null,
      status: "pending",
      saved: false,
      error: null,
    });
    recorded = true;

    const prompt = buildPrompt(preset, inputs);
    const provider = await getProvider();
    const aspectRatio = resolveAspect(preset, inputs);

    const started = Date.now();
    const result = await provider.generate({ prompt, images, aspectRatio });
    const durationMs = Date.now() - started;

    let png: Buffer = await sharp(result.image).png().toBuffer();
    if (preset.potongTepat && aspectRatio) png = await cropToRatio(png, aspectRatio);

    const watermark = !user.isPro;
    if (watermark) png = await addWatermark(png);

    const output = await saveFile("outputs", png, "png", genId);
    await db.updateGeneration(genId, { outputUrl: output.url, status: "success" });
    const profile = await db.getProfile(user.id);

    return Response.json({
      id: genId,
      presetId: preset.id,
      inputUrl: input.url,
      outputUrl: output.url,
      provider: provider.name,
      watermark,
      durationMs,
      creditsLeft: profile?.credits ?? 0,
    });
  } catch (e) {
    // Gagal → kembalikan kredit
    await db.addCredits(user.id, 1, "refund", genId).catch((err) => console.error("[generate] refund gagal", err));
    if (recorded) await db.updateGeneration(genId, { status: "failed", error: e instanceof Error ? e.message.slice(0, 300) : "error" }).catch(() => {});

    if (e instanceof AIError) {
      console.error(`[generate] ${e.code}: ${e.message}`, e.detail ?? "");
      const status = e.code === "SAFETY" ? 422 : e.code === "QUOTA" ? 503 : 502;
      return errorJson(e.code, status, { refunded: true });
    }
    console.error("[generate] internal", e);
    return errorJson("INTERNAL", 500, { refunded: true });
  }
}

/** Potong ke rasio persis (mis. pas foto 3:4), fokus ke bagian atas (kepala). */
async function cropToRatio(png: Buffer, ratio: string) {
  const [rw, rh] = ratio.split(":").map(Number);
  const { width = 0, height = 0 } = await sharp(png).metadata();
  if (!rw || !rh || !width || !height) return png;
  let w = width;
  let h = Math.round((width * rh) / rw);
  if (h > height) {
    h = height;
    w = Math.round((height * rw) / rh);
  }
  return sharp(png).resize(w, h, { fit: "cover", position: "north" }).png().toBuffer();
}
