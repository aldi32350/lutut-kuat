import sharp from "sharp";
import { theme } from "./theme";

/** Tambah watermark kecil di pojok kanan bawah (untuk akun free). */
export async function addWatermark(png: Buffer): Promise<Buffer> {
  const meta = await sharp(png).metadata();
  const w = meta.width ?? 1024;
  const h = meta.height ?? 1024;

  const fontSize = Math.max(14, Math.round(w * 0.026));
  const text = escapeXml(theme.brand.watermarkText);
  const boxW = Math.round(fontSize * (text.length * 0.62 + 2.4));
  const boxH = Math.round(fontSize * 1.9);
  const pad = Math.round(fontSize * 0.8);

  const svg = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${w - boxW - pad}, ${h - boxH - pad})" opacity="0.85">
        <rect width="${boxW}" height="${boxH}" rx="${boxH / 2}" fill="#000" fill-opacity="0.45"/>
        <text x="${boxW / 2}" y="${boxH * 0.66}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
          font-size="${fontSize}" font-weight="700" fill="#fff">✦ ${text}</text>
      </g>
    </svg>`,
  );

  return sharp(png).composite([{ input: svg, top: 0, left: 0 }]).png().toBuffer();
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}
