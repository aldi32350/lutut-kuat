import type { Preset } from "./presets";

/** Selalu ditambahkan ke setiap prompt: menjaga identitas wajah asli. */
export const IDENTITY_CLAUSE =
  "If the photo contains a person, preserve the person's exact facial features and identity (face shape, eyes, nose, lips, skin tone, distinctive marks) so they remain clearly recognizable as the same person. Do not beautify, slim, whiten or otherwise alter the face beyond what the instructions above explicitly request (such as a new expression, age or art style).";

/**
 * Instruksi keamanan. Model diminta membalas teks "REFUSED: ..." (tanpa gambar)
 * jika foto melanggar — lib/ai/gemini.ts menangkap balasan ini.
 */
export const SAFETY_CLAUSE =
  "Safety rules (must follow): if the input photo contains nudity, sexual content, graphic violence or gore, or clearly depicts a famous public figure, celebrity or politician, do NOT generate any image and instead reply with the single line 'REFUSED: <short reason>'. Never produce sexualized, violent or hateful content.";

export type PresetInputs = Record<string, string>;

/** Isi {{placeholder}} di template dengan nilai input user. */
export function buildPrompt(preset: Preset, inputs: PresetInputs): string {
  let prompt = preset.promptTemplate;

  for (const field of preset.inputTambahan ?? []) {
    if (field.tipe === "image") continue;
    const raw = (inputs[field.nama] ?? field.default ?? "").trim();
    let value = raw;

    if (field.tipe === "select") {
      const opt = field.opsi?.find((o) => o.value === raw);
      if (opt?.value === "custom") {
        // opsi "Tulis sendiri" → pakai teks dari input "custom"
        value = (inputs.custom ?? "").trim() || "a clean, neutral studio background";
      } else {
        value = opt?.prompt ?? opt?.label ?? raw;
      }
    }

    prompt = prompt.replaceAll(`{{${field.nama}}}`, value);
  }

  // placeholder yang tidak terisi dibuang supaya tidak membingungkan model
  prompt = prompt.replace(/\{\{[^}]+\}\}/g, "").replace(/\s{2,}/g, " ").trim();

  return `${prompt}\n\n${IDENTITY_CLAUSE}\n\n${SAFETY_CLAUSE}`;
}

/** Rasio hasil: opsi select yang punya aspectRatio (mis. ukuran pas foto) menang atas bawaan preset. */
export function resolveAspect(preset: Preset, inputs: PresetInputs): string | undefined {
  for (const field of preset.inputTambahan ?? []) {
    if (field.tipe !== "select") continue;
    const val = inputs[field.nama] ?? field.default;
    const opt = field.opsi?.find((o) => o.value === val);
    if (opt?.aspectRatio) return opt.aspectRatio;
  }
  return preset.aspectRatio;
}

/** Validasi input wajib. Mengembalikan label input yang belum diisi, atau null. */
export function missingRequired(preset: Preset, inputs: PresetInputs): string | null {
  for (const field of preset.inputTambahan ?? []) {
    if (field.wajib && field.tipe !== "image" && !(inputs[field.nama] ?? "").trim()) return field.label;
  }
  return null;
}
