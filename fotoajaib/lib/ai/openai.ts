import { AIError, type GenerateRequest, type GenerateResult, type ImageProvider } from "./provider";

/**
 * Placeholder untuk OpenAI gpt-image. Belum diimplementasikan.
 * Rencana: POST https://api.openai.com/v1/images/edits (model gpt-image-1),
 * kirim gambar sebagai multipart + prompt, ambil b64_json dari respons.
 */
export class OpenAIProvider implements ImageProvider {
  name = "openai";
  async generate(_req: GenerateRequest): Promise<GenerateResult> {
    throw new AIError("CONFIG", "Provider OpenAI belum diaktifkan. Pakai AI_PROVIDER=gemini.");
  }
}
