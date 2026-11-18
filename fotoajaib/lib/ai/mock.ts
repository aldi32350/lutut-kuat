import sharp from "sharp";
import type { GenerateRequest, GenerateResult, ImageProvider } from "./provider";

/**
 * Provider tiruan untuk development tanpa API key.
 * Tidak memanggil AI: hanya menaruh foto di atas latar putih dengan bingkai,
 * supaya seluruh alur (upload → generate → hasil → unduh) bisa dites gratis.
 */
export class MockProvider implements ImageProvider {
  name = "mock";

  async generate(req: GenerateRequest): Promise<GenerateResult> {
    await new Promise((r) => setTimeout(r, Number(process.env.MOCK_DELAY_MS ?? 2500)));

    const src = req.images[0].data;
    const inner = await sharp(src).resize(880, 880, { fit: "inside" }).modulate({ saturation: 1.15, brightness: 1.04 }).toBuffer();
    const meta = await sharp(inner).metadata();
    const w = (meta.width ?? 880) + 120;
    const h = (meta.height ?? 880) + 120;

    const label = Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect x="16" y="16" rx="10" width="230" height="36" fill="#7c3aed"/>
        <text x="30" y="40" font-family="Arial" font-size="18" font-weight="700" fill="#fff">MODE DEMO (mock)</text>
      </svg>`,
    );

    const image = await sharp({ create: { width: w, height: h, channels: 3, background: "#ffffff" } })
      .composite([
        { input: inner, top: 60, left: 60 },
        { input: label, top: 0, left: 0 },
      ])
      .png()
      .toBuffer();

    return { image, mimeType: "image/png", note: "mock provider" };
  }
}
