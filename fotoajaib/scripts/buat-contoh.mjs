// Membuat gambar contoh before/after (ilustrasi SVG) untuk setiap preset.
// Jalankan: node scripts/buat-contoh.mjs
// Ganti nanti dengan hasil generate asli (simpan dengan nama file yang sama di public/examples/).
import { writeFileSync, mkdirSync } from "fs";

const OUT = new URL("../public/examples/", import.meta.url);
mkdirSync(OUT, { recursive: true });

// subjek: orang | produk | makanan | logo | pasangan | keluarga | bayi | sketsa | dua
const DAFTAR = {
  "photoshoot-produk": { s: "produk", bg: ["#fde68a", "#f9a8d4"], podium: true },
  "food-photography": { s: "makanan", bg: ["#78350f", "#451a03"] },
  "fashion-model": { s: "produk", after: "orang", bg: ["#e0e7ff", "#c7d2fe"] },
  mockup: { s: "logo", after: "kaos", bg: ["#f1f5f9", "#e2e8f0"] },
  "foto-katalog": { s: "produk", bg: ["#ffffff", "#ffffff"] },
  "pas-foto": { s: "orang", bg: ["#d0021b", "#d0021b"], formal: true },
  "headshot-linkedin": { s: "orang", bg: ["#64748b", "#334155"], formal: true },
  "foto-wisuda": { s: "orang", bg: ["#57534e", "#292524"], toga: true },
  "foto-hijab": { s: "orang", bg: ["#fce7f3", "#fbcfe8"], hijab: true },
  prewedding: { s: "pasangan", bg: ["#fdba74", "#f472b6"] },
  "foto-keluarga": { s: "keluarga", bg: ["#e7e5e4", "#d6d3d1"] },
  "foto-bayi": { s: "bayi", bg: ["#e0f2fe", "#fce7f3"] },
  "foto-umrah-haji": { s: "orang", bg: ["#fef3c7", "#d6d3d1"], putih: true, kabah: true },
  "foto-tempo-dulu": { s: "orang", bg: ["#d6b98c", "#a1835a"], sepia: true },
  karikatur: { s: "orang", bg: ["#a7f3d0", "#6ee7b7"], kepalaBesar: true },
  "gaya-3d": { s: "orang", bg: ["#ddd6fe", "#c4b5fd"], kepalaBesar: true, glossy: true },
  "diorama-mini": { s: "orang", bg: ["#cbd5e1", "#94a3b8"], mini: true },
  "sketsa-realistis": { s: "sketsa", bg: ["#bae6fd", "#86efac"] },
  "thumbnail-youtube": { s: "orang", bg: ["#facc15", "#ef4444"], judul: true },
  "hapus-background": null, // sudah ada (dibuat manual)
  "ubah-pose": { s: "orang", bg: ["#c9b79c", "#c9b79c"], senyum: true, kamar: true },
  "perluas-gambar": { s: "orang", bg: ["#bae6fd", "#7dd3fc"], lebar: true },
  "gabung-2-foto": { s: "dua", bg: ["#bbf7d0", "#60a5fa"] },
  "restorasi-foto": { s: "orang", bg: ["#a8a29e", "#78716c"], rusak: true },
  "filter-umur": { s: "orang", bg: ["#e5e7eb", "#d1d5db"], tua: true },
};

const KULIT = "#e0ac85";

function orang(x, y, sc, o = {}) {
  const baju = o.baju ?? "#2a9d8f";
  const head = o.kepalaBesar ? 1.5 : 1;
  const rambut = o.tua ? "#d1d5db" : "#2b2118";
  let g = `<g transform="translate(${x} ${y}) scale(${sc})">`;
  g += `<path d="M-66 110c4-62 30-110 66-110s62 48 66 110z" fill="${baju}"/>`;
  if (o.formal) g += `<path d="M-14 0l14 40 14-40z" fill="#fff"/><path d="M-4 6h8l-2 34h-4z" fill="#1e3a8a"/>`;
  g += `<g transform="translate(0 -38) scale(${head}) translate(0 38)">`;
  if (o.hijab) {
    g += `<path d="M-48 -30c0-36 22-56 48-56s48 20 48 56v40c0 14-20 24-48 24s-48-10-48-24z" fill="#db2777"/>`;
    g += `<ellipse cx="0" cy="-30" rx="28" ry="33" fill="${KULIT}"/>`;
  } else {
    g += `<circle cx="0" cy="-38" r="38" fill="${KULIT}"/>`;
    g += `<path d="M-38 -44c0-30 17-46 38-46s38 16 38 46c-6-14-20-22-38-22s-32 8-38 22z" fill="${rambut}"/>`;
  }
  const mataY = o.hijab ? -32 : -40;
  g += `<circle cx="-12" cy="${mataY}" r="3.5" fill="#1f2937"/><circle cx="12" cy="${mataY}" r="3.5" fill="#1f2937"/>`;
  g += o.senyum
    ? `<path d="M-14 ${mataY + 16}q14 14 28 0" stroke="#7f1d1d" stroke-width="4" fill="#fff"/>`
    : `<path d="M-10 ${mataY + 18}q10 6 20 0" stroke="#7f1d1d" stroke-width="3" fill="none"/>`;
  if (o.tua) g += `<path d="M-22 ${mataY - 12}h12M10 ${mataY - 12}h12M-26 ${mataY + 8}q4 6 8 4M18 ${mataY + 12}q4-2 8-4" stroke="#b07a55" stroke-width="2" fill="none"/>`;
  if (o.toga) g += `<path d="M-50 -82l50-18 50 18-50 18z" fill="#111"/><path d="M40 -80v26" stroke="#facc15" stroke-width="3"/>`;
  g += `</g></g>`;
  return g;
}

const SUBJEK = {
  produk: (c) => `<rect x="120" y="120" width="60" height="130" rx="14" fill="${c ? "#7c3aed" : "#8b7fa8"}"/><rect x="132" y="96" width="36" height="30" rx="6" fill="${c ? "#facc15" : "#a3a08a"}"/><rect x="128" y="160" width="44" height="40" rx="4" fill="#fff" opacity=".85"/>`,
  makanan: (c) => `<ellipse cx="150" cy="200" rx="105" ry="45" fill="#f5f5f4"/><ellipse cx="150" cy="190" rx="70" ry="28" fill="${c ? "#f59e0b" : "#b9a37a"}"/><circle cx="125" cy="180" r="12" fill="${c ? "#16a34a" : "#8a9a7a"}"/><circle cx="170" cy="182" r="14" fill="${c ? "#dc2626" : "#a07a72"}"/>`,
  logo: () => `<circle cx="150" cy="150" r="60" fill="#7c3aed"/><path d="M120 150l20 20 40-45" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round"/>`,
  kaos: () => `<path d="M80 80l40-20h60l40 20 30 50-35 15-15-25v150H100V120l-15 25-35-15z" fill="#fff" stroke="#d4d4d8" stroke-width="2"/><circle cx="150" cy="150" r="32" fill="#7c3aed"/><path d="M134 150l11 11 22-24" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>`,
  orang: (c, o) => orang(150, c && o.mini ? 215 : 190, c && o.mini ? 0.55 : 1, { ...o, baju: c ? o.baju ?? (o.formal ? "#1f2937" : o.toga ? "#111" : o.putih ? "#fafafa" : "#7c3aed") : "#6b7280", formal: c && o.formal, toga: c && o.toga, hijab: o.hijab && c ? true : false, senyum: c && o.senyum, tua: c && o.tua, kepalaBesar: c && o.kepalaBesar }),
  pasangan: (c) => orang(110, 195, 0.85, { baju: c ? "#f9fafb" : "#6b7280", hijab: true }) + orang(195, 190, 0.9, { baju: c ? "#1f2937" : "#64748b", formal: c }),
  dua: (c) => (c ? orang(105, 195, 0.85, { baju: "#2563eb" }) + orang(200, 195, 0.85, { baju: "#16a34a", hijab: true }) : orang(150, 195, 0.9, { baju: "#6b7280" })),
  keluarga: (c) => orang(80, 205, 0.7, { baju: c ? "#b45309" : "#6b7280" }) + orang(220, 205, 0.7, { baju: c ? "#b45309" : "#6b7280", hijab: true }) + orang(130, 240, 0.5, { baju: c ? "#d97706" : "#6b7280" }) + orang(175, 240, 0.5, { baju: c ? "#d97706" : "#6b7280", hijab: true }),
  bayi: (c) => `<ellipse cx="150" cy="200" rx="80" ry="42" fill="${c ? "#fbcfe8" : "#b8b0a8"}"/><circle cx="150" cy="150" r="38" fill="${KULIT}"/><path d="M135 150q5 5 10 0M155 150q5 5 10 0" stroke="#1f2937" stroke-width="3" fill="none"/>${c ? `<path d="M112 140q38-50 76 0" fill="#f9a8d4"/>` : ""}`,
  sketsa: (c) =>
    c
      ? `<rect x="80" y="140" width="140" height="100" fill="#fef3c7"/><path d="M70 145l80-65 80 65z" fill="#b91c1c"/><rect x="135" y="185" width="30" height="55" fill="#78350f"/><rect x="95" y="160" width="28" height="24" fill="#93c5fd"/><rect x="177" y="160" width="28" height="24" fill="#93c5fd"/><rect y="240" width="300" height="60" fill="#4ade80"/>`
      : `<g stroke="#374151" stroke-width="2.5" fill="none" stroke-linecap="round"><rect x="80" y="140" width="140" height="100"/><path d="M70 145l80-65 80 65"/><rect x="135" y="185" width="30" height="55"/><rect x="95" y="160" width="28" height="24"/><rect x="177" y="160" width="28" height="24"/><path d="M20 240h260"/></g>`,
};

function bgBefore() {
  return `<rect width="300" height="300" fill="#c9b79c"/><rect y="200" width="300" height="100" fill="#8d6e4f"/><rect x="18" y="40" width="70" height="95" rx="4" fill="#6b8fa3"/><rect x="25" y="47" width="56" height="81" fill="#a9c7d6"/><rect x="225" y="30" width="60" height="150" fill="#7a5a3c"/>`;
}

function svg(inner, defs = "", filter = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs>${defs}</defs><g ${filter}>${inner}</g></svg>\n`;
}

let n = 0;
for (const [id, c] of Object.entries(DAFTAR)) {
  if (!c) continue;
  const subjBefore = SUBJEK[c.s](false, c);
  const subjAfter = SUBJEK[c.after ?? c.s](true, c);

  // BEFORE: foto biasa di ruangan berantakan
  let before = bgBefore() + subjBefore;
  if (c.s === "sketsa") before = `<rect width="300" height="300" fill="#fafaf9"/>` + subjBefore;
  if (c.s === "logo") before = `<rect width="300" height="300" fill="#fff"/>` + subjBefore;
  if (c.rusak) before += `<rect width="300" height="300" fill="#78716c" opacity=".35"/><path d="M0 60l120 40 40-30 140 60M200 0l-30 300" stroke="#fafaf9" stroke-width="5" opacity=".8"/>`;
  const beforeDefs = c.rusak || c.sepia ? `<filter id="g"><feColorMatrix type="saturate" values="0.1"/></filter>` : "";
  writeFileSync(new URL(`${id}-before.svg`, OUT), svg(before, beforeDefs, beforeDefs ? 'filter="url(#g)"' : ""));

  // AFTER: latar bertema + subjek rapi
  const defs = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.bg[0]}"/><stop offset="1" stop-color="${c.bg[1]}"/></linearGradient>${c.sepia ? `<filter id="s"><feColorMatrix type="matrix" values=".39 .77 .19 0 0 .35 .69 .17 0 0 .27 .53 .13 0 0 0 0 0 1 0"/></filter>` : ""}`;
  let after = `<rect width="300" height="300" fill="url(#bg)"/>`;
  if (c.kamar) after = bgBefore();
  if (c.kabah) after += `<rect x="190" y="120" width="80" height="90" fill="#111"/><rect x="190" y="138" width="80" height="10" fill="#d4a017"/><rect y="210" width="300" height="90" fill="#f5f5f4"/>`;
  if (c.podium) after += `<ellipse cx="150" cy="255" rx="95" ry="22" fill="#fff" opacity=".85"/>`;
  if (c.mini) after += `<rect y="230" width="300" height="70" fill="#78350f"/><ellipse cx="150" cy="232" rx="50" ry="10" fill="#e0f2fe" opacity=".8"/><rect x="215" y="120" width="60" height="110" rx="4" fill="#7c3aed"/><rect x="223" y="130" width="44" height="60" fill="#ede9fe"/>`;
  if (c.lebar) after += `<rect y="230" width="300" height="70" fill="#4ade80"/><circle cx="250" cy="60" r="24" fill="#fde047"/><rect x="75" y="40" width="150" height="220" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="8 6"/>`;
  if (c.s === "dua") after += `<rect y="235" width="300" height="65" fill="#a3e635"/>`;
  after += subjAfter;
  if (c.judul) after = `<rect width="300" height="300" fill="url(#bg)"/><g transform="translate(70 0)">${subjAfter}</g><text x="14" y="110" font-family="Arial Black,Arial" font-weight="900" font-size="38" fill="#fff" stroke="#111" stroke-width="3" paint-order="stroke">WOW!</text><text x="14" y="150" font-family="Arial Black,Arial" font-weight="900" font-size="26" fill="#facc15" stroke="#111" stroke-width="3" paint-order="stroke">HASILNYA</text>`;
  after += `<path d="M262 22l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#fff" opacity=".9"/>`;
  writeFileSync(new URL(`${id}-after.svg`, OUT), svg(after, defs, c.sepia ? 'filter="url(#s)"' : ""));
  n++;
}
console.log(`${n} pasang contoh dibuat di public/examples/`);
