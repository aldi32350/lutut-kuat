import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { AIError, type GenerateRequest, type GenerateResult, type ImageProvider } from "./provider";

const TIMEOUT_MS = 90_000;

export class GeminiProvider implements ImageProvider {
  name = "gemini";
  private ai: GoogleGenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new AIError("CONFIG", "GEMINI_API_KEY belum diisi di .env.local");
    this.ai = new GoogleGenAI({ apiKey });
    this.model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  }

  async generate(req: GenerateRequest): Promise<GenerateResult> {
    const parts = [
      ...req.images.map((img) => ({
        inlineData: { mimeType: img.mimeType, data: img.data.toString("base64") },
      })),
      { text: req.prompt },
    ];

    let res;
    try {
      res = await withTimeout(
        this.ai.models.generateContent({
          model: this.model,
          contents: [{ role: "user", parts }],
          config: {
            responseModalities: ["IMAGE", "TEXT"],
            ...(req.aspectRatio ? { imageConfig: { aspectRatio: req.aspectRatio } } : {}),
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
          },
        }),
        TIMEOUT_MS,
      );
    } catch (e) {
      throw mapError(e);
    }

    const blockReason = res.promptFeedback?.blockReason;
    if (blockReason) throw new AIError("SAFETY", "Foto ditolak filter keamanan", String(blockReason));

    const cand = res.candidates?.[0];
    const finish = String(cand?.finishReason ?? "");
    if (/SAFETY|PROHIBITED|IMAGE_SAFETY|BLOCKLIST|SPII/.test(finish)) {
      throw new AIError("SAFETY", "Foto ditolak filter keamanan", finish);
    }

    const outParts = cand?.content?.parts ?? [];
    const text = outParts.map((p) => p.text ?? "").join(" ").trim();
    const imgPart = outParts.find((p) => p.inlineData?.data);

    if (!imgPart?.inlineData?.data) {
      if (/^REFUSED/i.test(text)) throw new AIError("SAFETY", "Foto ditolak", text);
      throw new AIError("NO_IMAGE", "Model tidak mengembalikan gambar", text || finish);
    }

    return {
      image: Buffer.from(imgPart.inlineData.data, "base64"),
      mimeType: imgPart.inlineData.mimeType || "image/png",
      note: text || undefined,
    };
  }
}

function mapError(e: unknown): AIError {
  if (e instanceof AIError) return e;
  const msg = e instanceof Error ? e.message : String(e);
  if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED|401|403/i.test(msg)) {
    return new AIError("CONFIG", "API key Gemini tidak valid", msg);
  }
  // "limit: 0" = project belum mengaktifkan billing (model gambar tidak ada kuota gratis)
  if (/limit: 0\b/.test(msg)) {
    return new AIError("CONFIG", "Billing Gemini belum aktif: model gambar butuh paket berbayar di Google AI Studio", msg);
  }
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(msg)) return new AIError("QUOTA", "Kuota Gemini habis", msg);
  if (/timeout/i.test(msg)) return new AIError("TIMEOUT", "Gemini terlalu lama merespons", msg);
  return new AIError("PROVIDER", "Gemini error", msg);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (err) => (clearTimeout(t), reject(err)),
    );
  });
}
