/**
 * SATU-SATUNYA tempat untuk mengatur brand & warna.
 * Ganti nama brand atau warna di sini, seluruh app ikut berubah.
 *
 * Warna ditulis dalam format HSL tanpa "hsl()": "H S% L%".
 * Tips: cari warna di https://hslpicker.com lalu salin angkanya.
 */
export const theme = {
  brand: {
    name: "FotoAjaib",
    tagline: "Foto biasa jadi foto studio, dalam hitungan detik.",
    watermarkText: "FotoAjaib",
  },
  colors: {
    light: {
      primary: "262 83% 58%", // ungu
      primaryForeground: "0 0% 100%",
      accent: "35 95% 55%", // oranye hangat untuk highlight
      accentForeground: "26 83% 14%",
      background: "0 0% 100%",
      foreground: "240 10% 4%",
      muted: "240 5% 96%",
      mutedForeground: "240 4% 42%",
      card: "0 0% 100%",
      border: "240 6% 90%",
      destructive: "0 72% 51%",
    },
    dark: {
      primary: "263 90% 68%",
      primaryForeground: "240 10% 4%",
      accent: "35 95% 60%",
      accentForeground: "26 83% 14%",
      background: "240 10% 5%",
      foreground: "0 0% 98%",
      muted: "240 4% 14%",
      mutedForeground: "240 5% 65%",
      card: "240 8% 8%",
      border: "240 4% 18%",
      destructive: "0 63% 55%",
    },
  },
  radius: "0.875rem",
} as const;

type Palette = Record<keyof (typeof theme.colors)["light"], string>;

function vars(p: Palette) {
  return `
  --background:${p.background};--foreground:${p.foreground};
  --card:${p.card};--card-foreground:${p.foreground};
  --popover:${p.card};--popover-foreground:${p.foreground};
  --primary:${p.primary};--primary-foreground:${p.primaryForeground};
  --secondary:${p.muted};--secondary-foreground:${p.foreground};
  --muted:${p.muted};--muted-foreground:${p.mutedForeground};
  --accent:${p.accent};--accent-foreground:${p.accentForeground};
  --destructive:${p.destructive};--destructive-foreground:0 0% 100%;
  --border:${p.border};--input:${p.border};--ring:${p.primary};`;
}

/** CSS yang disisipkan di <head> oleh app/layout.tsx */
export function themeCss() {
  return `:root{${vars(theme.colors.light)}--radius:${theme.radius};}
@media (prefers-color-scheme: dark){:root:not(.light){${vars(theme.colors.dark)}}}
.dark{${vars(theme.colors.dark)}}`;
}
