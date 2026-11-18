/**
 * Layer abstraksi provider AI gambar.
 * Tambah provider baru: buat file di lib/ai/, implementasikan ImageProvider,
 * lalu daftarkan di getProvider() di bawah.
 */

export interface InputImage {
  data: Buffer;
  mimeType: string;
}

export interface GenerateRequest {
  prompt: string;
  images: InputImage[];
  aspectRatio?: string;
}

export interface GenerateResult {
  image: Buffer;
  mimeType: string;
  /** teks tambahan dari model, jika ada (untuk log) */
  note?: string;
}

export interface ImageProvider {
  name: string;
  generate(req: GenerateRequest): Promise<GenerateResult>;
}

export type AIErrorCode =
  | "SAFETY" // ditolak filter keamanan
  | "NO_IMAGE" // model tidak mengembalikan gambar
  | "QUOTA" // kuota / rate limit provider habis
  | "CONFIG" // API key belum diisi / salah
  | "TIMEOUT"
  | "PROVIDER"; // error lain dari provider

export class AIError extends Error {
  constructor(
    public code: AIErrorCode,
    message: string,
    public detail?: string,
  ) {
    super(message);
    this.name = "AIError";
  }
}

let cached: ImageProvider | null = null;

export async function getProvider(): Promise<ImageProvider> {
  if (cached) return cached;

  const pilihan = (process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : "mock")).toLowerCase();

  switch (pilihan) {
    case "gemini": {
      const { GeminiProvider } = await import("./gemini");
      cached = new GeminiProvider();
      break;
    }
    case "openai": {
      const { OpenAIProvider } = await import("./openai");
      cached = new OpenAIProvider();
      break;
    }
    case "replicate": {
      const { ReplicateProvider } = await import("./replicate");
      cached = new ReplicateProvider();
      break;
    }
    case "mock": {
      const { MockProvider } = await import("./mock");
      cached = new MockProvider();
      break;
    }
    default:
      throw new AIError("CONFIG", `AI_PROVIDER "${pilihan}" tidak dikenal`);
  }
  return cached;
}
