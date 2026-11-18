/**
 * Moderasi teks input sebelum dikirim ke AI.
 * Foto sendiri dimoderasi oleh filter keamanan provider + SAFETY_CLAUSE di lib/prompt.ts.
 */

const KATA_TERLARANG = [
  // dewasa
  "telanjang", "bugil", "nude", "naked", "nsfw", "porn", "porno", "sexy", "lingerie", "bikini", "topless", "hentai",
  // kekerasan
  "darah", "blood", "gore", "mutilasi", "bunuh", "kill", "senjata", "pistol", "gun", "bom", "bomb", "teroris",
  // tokoh publik
  "presiden", "president", "artis", "celebrity", "selebriti", "aktor terkenal", "actress", "politisi",
];

export interface ModerationResult {
  ok: boolean;
  alasan?: string;
}

export function moderateText(texts: string[]): ModerationResult {
  const gabung = ` ${texts.join(" ").toLowerCase()} `;
  for (const kata of KATA_TERLARANG) {
    const re = new RegExp(`[^a-z]${kata.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^a-z]`, "i");
    if (re.test(gabung)) {
      return { ok: false, alasan: kata };
    }
  }
  return { ok: true };
}
