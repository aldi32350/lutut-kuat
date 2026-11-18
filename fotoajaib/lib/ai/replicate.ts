import { AIError, type GenerateRequest, type GenerateResult, type ImageProvider } from "./provider";

/**
 * Placeholder untuk Seedream via Replicate / fal.ai. Belum diimplementasikan.
 * Rencana: upload gambar sebagai data URL ke model bytedance/seedream,
 * tunggu prediction selesai, unduh URL hasilnya.
 */
export class ReplicateProvider implements ImageProvider {
  name = "replicate";
  async generate(_req: GenerateRequest): Promise<GenerateResult> {
    throw new AIError("CONFIG", "Provider Replicate belum diaktifkan. Pakai AI_PROVIDER=gemini.");
  }
}
