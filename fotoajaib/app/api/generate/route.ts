import sharp from "sharp";
import { getPreset } from "@/lib/presets";
import { buildPrompt, missingRequired, resolveAspect, type PresetInputs } from "@/lib/prompt";
import { AIError, getProvider } from "@/lib/ai/provider";
import { moderateText } from "@/lib/moderation";
import { rateLimit } from "@/lib/rate-limit";
import { saveFile } from "@/lib/storage";
import { addWatermark } from "@/lib/watermark";
import { errorJson } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 120; // detik (Vercel)

const MAX_BYTES = 10 * 1024 * 1024;
const TIPE_OK = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const rl = rateLimit(`gen:${ip}`, Number(process.env.RATE_LIMIT_PER_MINUTE ?? 5), 60_000);
  if (!rl.ok) return errorJson("RATE_LIMIT", 429, { retryAfterSec: rl.retryAfterSec });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return errorJson("BAD_REQUEST", 400);
  }

  const preset = getPreset(String(form.get("presetId") ?? ""));
  if (!preset) return errorJson("PRESET", 400);

  let inputs: PresetInputs = {};
  try {
    inputs = JSON.parse(String(form.get("inputs") ?? "{}"));
  } catch {
    return errorJson("BAD_REQUEST", 400);
  }

  if (preset.butuhPersetujuan && form.get("consent") !== "true") return errorJson("CONSENT", 400);

  const kurang = missingRequired(preset, inputs);
  if (kurang) return errorJson("BAD_REQUEST", 400, { message: `Isi dulu “${kurang}” ya.` });

  const files = [form.get("image"), form.get("image2")].filter((f): f is File => f instanceof File);
  if (files.length < preset.jumlahFotoInput) return errorJson("BAD_REQUEST", 400);
  for (const f of files) {
    if (!TIPE_OK.includes(f.type)) return errorJson("FILE_TYPE", 400);
    if (f.size > MAX_BYTES) return errorJson("FILE_SIZE", 400);
  }

  const mod = moderateText(Object.values(inputs).map(String));
  if (!mod.ok) return errorJson("MODERATION", 400);

  try {
    // Normalisasi: putar sesuai EXIF, batasi 2048px, simpan sebagai JPEG
    const images = await Promise.all(
      files.slice(0, preset.jumlahFotoInput).map(async (f) => {
        const buf = Buffer.from(await f.arrayBuffer());
        const data = await sharp(buf).rotate().resize(2048, 2048, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 92 }).toBuffer();
        return { data, mimeType: "image/jpeg" };
      }),
    );

    const input = await saveFile("inputs", images[0].data, "jpg");
    const prompt = buildPrompt(preset, inputs);
    const provider = await getProvider();

    const started = Date.now();
    const aspectRatio = resolveAspect(preset, inputs);
    const result = await provider.generate({ prompt, images, aspectRatio });
    const durationMs = Date.now() - started;

    let png: Buffer = await sharp(result.image).png().toBuffer();
    if (preset.potongTepat && aspectRatio) png = await cropToRatio(png, aspectRatio);

    // Tahap A belum ada login → semua dianggap akun free (pakai watermark).
    // Tahap C/D: cek paket user dari database.
    const isFree = true;
    if (isFree) png = await addWatermark(png);

    const output = await saveFile("outputs", png, "png");

    return Response.json({
      id: output.id,
      presetId: preset.id,
      inputUrl: input.url,
      outputUrl: output.url,
      provider: provider.name,
      watermark: isFree,
      durationMs,
    });
  } catch (e) {
    if (e instanceof AIError) {
      console.error(`[generate] ${e.code}: ${e.message}`, e.detail ?? "");
      const status = e.code === "SAFETY" ? 422 : e.code === "QUOTA" ? 503 : 502;
      return errorJson(e.code, status);
    }
    console.error("[generate] internal", e);
    return errorJson("INTERNAL", 500);
  }
}

/** Potong tengah ke rasio persis (mis. pas foto 3:4) tanpa memperbesar. */
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
