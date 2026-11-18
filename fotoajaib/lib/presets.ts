/**
 * Katalog fitur. Setiap fitur = 1 preset prompt.
 *
 * - Placeholder di promptTemplate: {{namaInput}}, diisi dari inputTambahan.
 *   Untuk select, yang dimasukkan adalah `prompt` milik opsi yang dipilih.
 * - Klausa penjaga identitas wajah & aturan keamanan ditambahkan otomatis (lib/prompt.ts).
 * - Admin bisa menonaktifkan / mengubah nama, deskripsi, dan prompt dari /admin/presets
 *   (disimpan di database sebagai override, file ini tetap jadi nilai bawaan).
 */

export type KategoriId = "produk" | "personal" | "keluarga" | "kreatif" | "edit";
export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9";

export interface OpsiInput {
  value: string;
  label: string;
  prompt?: string;
  /** opsi ini mengubah rasio hasil (mis. ukuran pas foto) */
  aspectRatio?: AspectRatio;
}

export interface InputTambahan {
  nama: string;
  label: string;
  tipe: "text" | "select" | "image";
  opsi?: OpsiInput[];
  placeholder?: string;
  wajib?: boolean;
  default?: string;
}

export interface Preset {
  id: string;
  kategori: KategoriId;
  nama: string;
  deskripsi: string;
  ikon: string; // nama ikon lucide-react (lihat components/Icon.tsx)
  contohGambar: { before: string; after: string };
  promptTemplate: string;
  inputTambahan?: InputTambahan[];
  jumlahFotoInput: 1 | 2;
  /** label untuk kotak upload (berguna kalau 2 foto) */
  labelFoto?: [string] | [string, string];
  /** wajib centang persetujuan (fitur yang memakai wajah orang lain) */
  butuhPersetujuan?: boolean;
  /** hanya untuk paket Pro */
  premium?: boolean;
  aspectRatio?: AspectRatio;
  /** potong hasil persis ke rasio (pas foto untuk dicetak) */
  potongTepat?: boolean;
  estimasiDetik: number;
  aktif: boolean;
}

/** Versi preset yang dikirim ke browser (tanpa prompt). */
export type PublicPreset = Omit<Preset, "promptTemplate">;

export const KATEGORI: { id: KategoriId; nama: string; ikon: string }[] = [
  { id: "produk", nama: "Produk & Bisnis", ikon: "ShoppingBag" },
  { id: "personal", nama: "Personal & Profesional", ikon: "UserRound" },
  { id: "keluarga", nama: "Keluarga & Momen", ikon: "Heart" },
  { id: "kreatif", nama: "Desain & Kreatif", ikon: "Palette" },
  { id: "edit", nama: "Edit & Manipulasi", ikon: "Wand2" },
];

const contoh = (id: string) => ({ before: `/examples/${id}-before.svg`, after: `/examples/${id}-after.svg` });
const p = (...lines: string[]) => lines.join(" ");

export const PRESETS: Preset[] = [
  // ───────────────────────── PRODUK & BISNIS ─────────────────────────
  {
    id: "photoshoot-produk",
    kategori: "produk",
    nama: "Photoshoot Produk",
    deskripsi: "Foto produk seadanya jadi foto iklan profesional dengan set dan cahaya studio.",
    ikon: "Package",
    contohGambar: contoh("photoshoot-produk"),
    jumlahFotoInput: 1,
    aspectRatio: "1:1",
    estimasiDetik: 18,
    aktif: true,
    inputTambahan: [
      {
        nama: "gaya",
        label: "Gaya foto",
        tipe: "select",
        default: "minimalis",
        opsi: [
          { value: "minimalis", label: "Minimalis studio", prompt: "a minimalist studio set with a smooth pastel seamless backdrop and a simple geometric podium" },
          { value: "mewah", label: "Mewah / luxury", prompt: "a luxurious set with dark marble, brushed gold accents and dramatic low-key lighting" },
          { value: "alam", label: "Alam / natural", prompt: "a natural outdoor-inspired set with stones, fresh green leaves, soft sunlight and gentle shadows" },
          { value: "lifestyle", label: "Lifestyle (meja kayu)", prompt: "a cozy lifestyle scene on a warm wooden table with tasteful, softly blurred props" },
          { value: "pop", label: "Warna-warni pop", prompt: "a bold, playful pop-art set with saturated complementary colors and hard graphic shadows" },
          { value: "air", label: "Percikan air segar", prompt: "a fresh splash scene with water droplets and crisp splashes frozen in motion around the product" },
        ],
      },
    ],
    promptTemplate: p(
      "Create a professional commercial product photograph of the product in this photo, placed in {{gaya}}.",
      "Keep the product itself identical: exact shape, proportions, colors, materials, label text, logo and packaging details must not change.",
      "Lighting: large softbox key light at 45 degrees, subtle rim light to separate the product from the background, controlled reflections, realistic contact shadow.",
      "Camera: 100mm macro lens, f/8, product centered with balanced negative space, eye-level or slight high angle.",
      "Ultra sharp, high-end advertising quality, color-accurate, no added text or watermarks.",
    ),
  },
  {
    id: "food-photography",
    kategori: "produk",
    nama: "Food Photography",
    deskripsi: "Makanan dan minuman tampil menggugah selera, siap untuk menu dan media sosial.",
    ikon: "UtensilsCrossed",
    contohGambar: contoh("food-photography"),
    jumlahFotoInput: 1,
    aspectRatio: "1:1",
    estimasiDetik: 18,
    aktif: true,
    inputTambahan: [
      {
        nama: "gaya",
        label: "Gaya penyajian",
        tipe: "select",
        default: "rustic",
        opsi: [
          { value: "rustic", label: "Rustic kayu hangat", prompt: "a rustic dark wooden table with linen napkin, warm side window light and a few fresh ingredients scattered around" },
          { value: "flatlay", label: "Flat lay (dari atas)", prompt: "a clean top-down flat lay on a light stone surface with neatly arranged complementary props, shot from directly above" },
          { value: "finedining", label: "Restoran fine dining", prompt: "an elegant fine-dining setting with a dark moody background, a single spotlight and refined plating" },
          { value: "streetfood", label: "Street food malam", prompt: "a lively night street-food stall atmosphere with warm bokeh lights and a hint of steam" },
          { value: "cerah", label: "Cerah & segar", prompt: "a bright, airy daylight scene with white marble and fresh herbs, light and fresh mood" },
        ],
      },
    ],
    promptTemplate: p(
      "Turn this food or drink photo into a mouth-watering professional food photograph styled as {{gaya}}.",
      "Keep the dish recognizable: same food, same ingredients, same portion and the same plate or glass, but make it look fresh, glossy and appetizing.",
      "Add natural details such as gentle steam for hot food or condensation for cold drinks where appropriate.",
      "Lighting: soft directional backlight with fill, highlighting textures. Camera: 85mm lens, f/2.8, shallow depth of field.",
      "Magazine-quality, realistic, rich but natural colors, no text.",
    ),
  },
  {
    id: "fashion-model",
    kategori: "produk",
    nama: "Fashion / Model Pakai Produk",
    deskripsi: "Foto baju, hijab, tas, atau aksesori jadi dipakai model dalam foto katalog fashion.",
    ikon: "Shirt",
    contohGambar: contoh("fashion-model"),
    jumlahFotoInput: 1,
    premium: true,
    aspectRatio: "3:4",
    estimasiDetik: 20,
    aktif: true,
    inputTambahan: [
      {
        nama: "model",
        label: "Model",
        tipe: "select",
        default: "wanitahijab",
        opsi: [
          { value: "wanitahijab", label: "Wanita berhijab", prompt: "a modest Indonesian woman in her 20s wearing a neat hijab" },
          { value: "wanita", label: "Wanita", prompt: "an Indonesian woman in her 20s" },
          { value: "pria", label: "Pria", prompt: "an Indonesian man in his 20s" },
          { value: "anak", label: "Anak-anak", prompt: "a cheerful Indonesian child around 7 years old" },
        ],
      },
      {
        nama: "latar",
        label: "Lokasi",
        tipe: "select",
        default: "studio",
        opsi: [
          { value: "studio", label: "Studio polos", prompt: "a clean light-grey studio backdrop" },
          { value: "kota", label: "Jalanan kota", prompt: "a stylish urban street with soft daylight" },
          { value: "kafe", label: "Kafe estetik", prompt: "an aesthetic cafe interior with warm light" },
          { value: "taman", label: "Taman", prompt: "a green park in golden-hour light" },
        ],
      },
    ],
    promptTemplate: p(
      "Create a professional fashion catalog photo of {{model}} wearing or using the exact product shown in this photo, in {{latar}}.",
      "The product must stay identical: same design, cut, colors, pattern, fabric texture, logo and details. Do not redesign it.",
      "The model is a fictional, non-famous person with a natural, friendly expression and a flattering full-body or three-quarter pose that showcases the product.",
      "Lighting: soft beauty-dish key light with gentle fill. Camera: 85mm, f/4, sharp focus on the product.",
      "Modest, tasteful styling suitable for an Indonesian e-commerce store. Photorealistic, no text.",
    ),
  },
  {
    id: "mockup",
    kategori: "produk",
    nama: "Mockup",
    deskripsi: "Taruh logo atau desainmu di kaos, mug, totebag, kemasan, dan lainnya.",
    ikon: "Layers",
    contohGambar: contoh("mockup"),
    jumlahFotoInput: 1,
    labelFoto: ["Upload logo / desain"],
    premium: true,
    aspectRatio: "1:1",
    estimasiDetik: 16,
    aktif: true,
    inputTambahan: [
      {
        nama: "media",
        label: "Jenis mockup",
        tipe: "select",
        default: "kaos",
        opsi: [
          { value: "kaos", label: "Kaos", prompt: "the chest of a plain cotton t-shirt laid flat on a clean surface" },
          { value: "mug", label: "Mug", prompt: "a white ceramic mug on a wooden table" },
          { value: "totebag", label: "Totebag", prompt: "a natural canvas tote bag hanging against a light wall" },
          { value: "box", label: "Kemasan box", prompt: "a premium cardboard product box standing on a studio surface" },
          { value: "botol", label: "Botol / pouch", prompt: "a standing pouch and a bottle label in a product packshot" },
          { value: "banner", label: "Banner / spanduk", prompt: "a roll-up banner standing at an exhibition booth" },
          { value: "kartu", label: "Kartu nama", prompt: "a stack of premium business cards on a desk" },
        ],
      },
    ],
    promptTemplate: p(
      "Create a realistic product mockup photo showing the logo or design from this image printed on {{media}}.",
      "Reproduce the design faithfully: same shapes, colors, text and proportions. Do not change or misspell any lettering.",
      "Make the print follow the surface naturally (fabric folds, curvature, lighting and texture).",
      "Soft studio lighting, clean composition, photorealistic, high resolution, no extra text.",
    ),
  },
  {
    id: "foto-katalog",
    kategori: "produk",
    nama: "Foto Katalog (Background Putih)",
    deskripsi: "Standar marketplace: produk di latar putih bersih, terang, dan tajam.",
    ikon: "Store",
    contohGambar: contoh("foto-katalog"),
    jumlahFotoInput: 1,
    aspectRatio: "1:1",
    estimasiDetik: 14,
    aktif: true,
    inputTambahan: [
      {
        nama: "bayangan",
        label: "Bayangan",
        tipe: "select",
        default: "lembut",
        opsi: [
          { value: "lembut", label: "Bayangan lembut", prompt: "a soft, natural contact shadow beneath the product" },
          { value: "pantulan", label: "Pantulan (reflection)", prompt: "a subtle mirror reflection beneath the product on a glossy white surface" },
          { value: "tanpa", label: "Tanpa bayangan", prompt: "no shadow at all" },
        ],
      },
    ],
    promptTemplate: p(
      "Create a clean e-commerce catalog photo of the product in this image on a pure white (#FFFFFF) seamless background with {{bayangan}}.",
      "Keep the product exactly the same: shape, colors, labels, text and details unchanged. Remove any clutter, hands or props.",
      "Center the product, fill about 80% of the frame, straighten it, and correct perspective.",
      "Even high-key studio lighting, accurate colors, crisp edges, very sharp. Suitable for Shopee/Tokopedia listings. No text or watermark.",
    ),
  },

  // ─────────────────────── PERSONAL & PROFESIONAL ───────────────────────
  {
    id: "pas-foto",
    kategori: "personal",
    nama: "Pas Foto",
    deskripsi: "Pas foto resmi untuk lamaran kerja, ijazah, KTP, atau visa. Pilih warna latar dan ukuran.",
    ikon: "IdCard",
    contohGambar: contoh("pas-foto"),
    jumlahFotoInput: 1,
    aspectRatio: "3:4",
    potongTepat: true,
    estimasiDetik: 15,
    aktif: true,
    inputTambahan: [
      {
        nama: "background",
        label: "Warna latar",
        tipe: "select",
        default: "merah",
        opsi: [
          { value: "merah", label: "Merah", prompt: "a flat, evenly lit solid red (#D0021B) background" },
          { value: "biru", label: "Biru", prompt: "a flat, evenly lit solid blue (#1E5AA8) background" },
          { value: "putih", label: "Putih", prompt: "a flat, evenly lit pure white background" },
        ],
      },
      {
        nama: "ukuran",
        label: "Ukuran",
        tipe: "select",
        default: "3x4",
        opsi: [
          { value: "2x3", label: "2 × 3", prompt: "2x3 cm", aspectRatio: "2:3" },
          { value: "3x4", label: "3 × 4", prompt: "3x4 cm", aspectRatio: "3:4" },
          { value: "4x6", label: "4 × 6", prompt: "4x6 cm", aspectRatio: "2:3" },
        ],
      },
      {
        nama: "pakaian",
        label: "Pakaian",
        tipe: "select",
        default: "tetap",
        opsi: [
          { value: "tetap", label: "Seperti di foto", prompt: "keep the person's original clothing, neatened" },
          { value: "kemeja", label: "Kemeja putih", prompt: "dress the person in a neat white collared shirt" },
          { value: "jas", label: "Jas formal", prompt: "dress the person in a dark formal suit with a white shirt (and a tie for men)" },
          { value: "batik", label: "Batik", prompt: "dress the person in a neat, formal long-sleeved batik shirt" },
        ],
      },
    ],
    promptTemplate: p(
      "Convert this photo into an official Indonesian ID/passport photo ({{ukuran}} pas foto) with {{background}}.",
      "Front-facing head-and-shoulders portrait, head straight and centered, eyes looking directly at the camera, neutral expression with mouth closed, both ears visible if not covered by hijab.",
      "Head occupies about 70% of the frame height with a small margin above the head. {{pakaian}}.",
      "If the person wears a hijab, keep it neat and keep the face fully visible.",
      "Even, shadow-free studio lighting, natural skin tone, sharp focus, no accessories added, no filters, no text.",
    ),
  },
  {
    id: "headshot-linkedin",
    kategori: "personal",
    nama: "Headshot Studio / LinkedIn",
    deskripsi: "Foto profil profesional untuk LinkedIn, CV, dan website perusahaan.",
    ikon: "Briefcase",
    contohGambar: contoh("headshot-linkedin"),
    jumlahFotoInput: 1,
    aspectRatio: "1:1",
    estimasiDetik: 16,
    aktif: true,
    inputTambahan: [
      {
        nama: "latar",
        label: "Latar",
        tipe: "select",
        default: "abu",
        opsi: [
          { value: "abu", label: "Abu-abu studio", prompt: "a neutral mid-grey studio backdrop with soft vignette" },
          { value: "kantor", label: "Kantor (blur)", prompt: "a modern bright office softly blurred in the background" },
          { value: "biru", label: "Gradasi biru", prompt: "a smooth navy-to-steel-blue gradient backdrop" },
          { value: "putih", label: "Putih bersih", prompt: "a clean bright white backdrop" },
        ],
      },
      {
        nama: "pakaian",
        label: "Pakaian",
        tipe: "select",
        default: "tetap",
        opsi: [
          { value: "tetap", label: "Seperti di foto", prompt: "keep the person's original outfit but make it look neat and well pressed" },
          { value: "jas", label: "Jas / blazer", prompt: "dress the person in a well-fitted dark blazer with a clean shirt" },
          { value: "smartcasual", label: "Smart casual", prompt: "dress the person in a smart-casual knit or collared shirt" },
        ],
      },
    ],
    promptTemplate: p(
      "Create a professional corporate headshot of the person in this photo against {{latar}}. {{pakaian}}.",
      "Head-and-shoulders framing, body angled slightly, face toward the camera, confident and approachable natural smile.",
      "Lighting: classic Rembrandt/loop lighting with a large softbox key, soft fill and a subtle hair light.",
      "Camera: 85mm portrait lens, f/2.8, eyes tack sharp, natural skin texture (no plastic smoothing). Photorealistic, no text.",
    ),
  },
  {
    id: "foto-wisuda",
    kategori: "personal",
    nama: "Foto Wisuda",
    deskripsi: "Foto wisuda dengan toga dan latar studio atau kampus, tanpa perlu ke studio.",
    ikon: "GraduationCap",
    contohGambar: contoh("foto-wisuda"),
    jumlahFotoInput: 1,
    aspectRatio: "3:4",
    estimasiDetik: 18,
    aktif: true,
    inputTambahan: [
      {
        nama: "toga",
        label: "Warna toga",
        tipe: "select",
        default: "hitam",
        opsi: [
          { value: "hitam", label: "Hitam", prompt: "a black graduation gown and black mortarboard cap" },
          { value: "dongker", label: "Biru dongker", prompt: "a navy-blue graduation gown and matching mortarboard cap" },
          { value: "marun", label: "Merah marun", prompt: "a maroon graduation gown and matching mortarboard cap" },
          { value: "hijau", label: "Hijau", prompt: "a dark green graduation gown and matching mortarboard cap" },
        ],
      },
      {
        nama: "latar",
        label: "Latar",
        tipe: "select",
        default: "studio",
        opsi: [
          { value: "studio", label: "Studio wisuda", prompt: "a classic graduation studio backdrop with a bookshelf and soft drapery" },
          { value: "kampus", label: "Kampus outdoor", prompt: "a sunny university campus with a grand building softly blurred behind" },
          { value: "polos", label: "Polos gradasi", prompt: "a simple warm grey gradient backdrop" },
        ],
      },
      { nama: "selempang", label: "Tulisan di selempang (opsional)", tipe: "text", placeholder: "contoh: S.Kom 2026" },
    ],
    promptTemplate: p(
      "Create a formal graduation portrait of the person in this photo wearing {{toga}}, holding a rolled diploma tied with a ribbon, in front of {{latar}}.",
      "If the person wears a hijab, keep the hijab and place the cap neatly on top. Optional sash text: \"{{selempang}}\" (render it exactly, or omit the sash if empty).",
      "Proud, warm smile, three-quarter body pose. Soft studio lighting with gentle fill, 85mm lens, f/4. Photorealistic and celebratory.",
    ),
  },
  {
    id: "foto-hijab",
    kategori: "personal",
    nama: "Foto Hijab",
    deskripsi: "Foto potret muslimah dengan hijab rapi bergaya studio atau editorial.",
    ikon: "Sparkles",
    contohGambar: contoh("foto-hijab"),
    jumlahFotoInput: 1,
    aspectRatio: "3:4",
    estimasiDetik: 18,
    aktif: true,
    inputTambahan: [
      {
        nama: "gaya",
        label: "Gaya hijab",
        tipe: "select",
        default: "pashmina",
        opsi: [
          { value: "pashmina", label: "Pashmina", prompt: "a soft, elegantly draped pashmina hijab" },
          { value: "segiempat", label: "Segi empat", prompt: "a neat square hijab pinned under the chin" },
          { value: "syari", label: "Syar'i", prompt: "a long, loose syar'i khimar covering the chest" },
          { value: "tetap", label: "Seperti di foto", prompt: "the person's current hijab, neatened" },
        ],
      },
      { nama: "warna", label: "Warna hijab", tipe: "text", placeholder: "contoh: dusty pink", default: "" },
      {
        nama: "latar",
        label: "Suasana",
        tipe: "select",
        default: "studio",
        opsi: [
          { value: "studio", label: "Studio lembut", prompt: "a soft pastel studio backdrop" },
          { value: "taman", label: "Taman bunga", prompt: "a blooming flower garden with soft bokeh" },
          { value: "editorial", label: "Editorial majalah", prompt: "a chic editorial magazine set with clean architectural lines" },
        ],
      },
    ],
    promptTemplate: p(
      "Create an elegant modest portrait of the woman in this photo wearing {{gaya}} in {{warna}} color, set in {{latar}}.",
      "The hijab must fully cover the hair and neck, look neatly styled and realistic in fabric and folds; clothing stays modest and loose.",
      "Graceful pose, gentle smile. Soft beauty lighting, 85mm lens, f/2.8, refined pastel color grading. Photorealistic, no text.",
    ),
  },

  // ─────────────────────── KELUARGA & MOMEN ───────────────────────
  {
    id: "prewedding",
    kategori: "keluarga",
    nama: "Prewedding",
    deskripsi: "Foto prewedding romantis dari foto berdua biasa: pantai, taman, adat, atau kota Eropa.",
    ikon: "HeartHandshake",
    contohGambar: contoh("prewedding"),
    jumlahFotoInput: 1,
    labelFoto: ["Upload foto berdua"],
    butuhPersetujuan: true,
    premium: true,
    aspectRatio: "3:4",
    estimasiDetik: 22,
    aktif: true,
    inputTambahan: [
      {
        nama: "tema",
        label: "Tema",
        tipe: "select",
        default: "taman",
        opsi: [
          { value: "taman", label: "Taman bunga", prompt: "a dreamy blooming flower garden at golden hour" },
          { value: "pantai", label: "Pantai sunset", prompt: "a tropical beach at sunset with gentle waves and warm glow" },
          { value: "adatjawa", label: "Adat Jawa", prompt: "a traditional Javanese setting (joglo pavilion) wearing elegant kebaya and beskap" },
          { value: "eropa", label: "Kota Eropa", prompt: "a charming European old-town street with cobblestones" },
          { value: "studio", label: "Studio klasik", prompt: "a classic fine-art studio with dark backdrop and chiaroscuro light" },
          { value: "gunung", label: "Pegunungan", prompt: "a misty mountain viewpoint at sunrise" },
        ],
      },
    ],
    promptTemplate: p(
      "Create a romantic, tasteful pre-wedding photograph of the couple in this photo in {{tema}}.",
      "Both people must keep their exact faces and identities. Keep any hijab worn. Modest, elegant outfits suited to the theme.",
      "Natural, affectionate but modest pose (holding hands, looking at each other or walking together).",
      "Cinematic lighting, 50mm lens, f/2, soft film-like color grading, photorealistic, no text.",
    ),
  },
  {
    id: "foto-keluarga",
    kategori: "keluarga",
    nama: "Foto Keluarga",
    deskripsi: "Foto keluarga studio yang rapi dan hangat, cocok untuk Lebaran atau dicetak.",
    ikon: "Users",
    contohGambar: contoh("foto-keluarga"),
    jumlahFotoInput: 1,
    labelFoto: ["Upload foto keluarga"],
    butuhPersetujuan: true,
    aspectRatio: "4:3",
    estimasiDetik: 22,
    aktif: true,
    inputTambahan: [
      {
        nama: "tema",
        label: "Tema",
        tipe: "select",
        default: "studio",
        opsi: [
          { value: "studio", label: "Studio klasik", prompt: "a classic family-portrait studio with a warm neutral backdrop" },
          { value: "lebaran", label: "Lebaran", prompt: "a festive Eid al-Fitr living room with ketupat decorations and warm light" },
          { value: "taman", label: "Outdoor taman", prompt: "a green park in soft afternoon light" },
          { value: "rumah", label: "Ruang tamu hangat", prompt: "a cozy, tidy living room with warm lamps" },
        ],
      },
      {
        nama: "seragam",
        label: "Pakaian",
        tipe: "select",
        default: "tetap",
        opsi: [
          { value: "tetap", label: "Seperti di foto", prompt: "keep everyone's outfits, neatened" },
          { value: "putih", label: "Seragam putih", prompt: "dress everyone in coordinated white outfits (modest)" },
          { value: "batik", label: "Batik seragam", prompt: "dress everyone in coordinated matching batik outfits" },
          { value: "muslim", label: "Busana muslim", prompt: "dress everyone in coordinated modest Muslim attire (koko, gamis, hijab for women who already wear one)" },
        ],
      },
    ],
    promptTemplate: p(
      "Create a warm, professional family portrait of all the people in this photo in {{tema}}; {{seragam}}.",
      "Every person must be included and keep their exact face and identity; do not add or remove anyone.",
      "Arrange them naturally (some seated, some standing), everyone looking at the camera with natural smiles.",
      "Soft, even studio lighting so all faces are well lit, 50mm lens, f/5.6, everyone in focus. Photorealistic, no text.",
    ),
  },
  {
    id: "foto-bayi",
    kategori: "keluarga",
    nama: "Foto Bayi",
    deskripsi: "Foto bayi dan balita bertema lucu ala studio newborn.",
    ikon: "Baby",
    contohGambar: contoh("foto-bayi"),
    jumlahFotoInput: 1,
    aspectRatio: "1:1",
    estimasiDetik: 18,
    aktif: true,
    inputTambahan: [
      {
        nama: "tema",
        label: "Tema",
        tipe: "select",
        default: "newborn",
        opsi: [
          { value: "newborn", label: "Newborn bedong", prompt: "a classic newborn setup, swaddled in a soft knitted wrap in a cozy basket" },
          { value: "bulan", label: "Bulan & bintang", prompt: "a dreamy night theme sleeping on a soft crescent moon with tiny stars" },
          { value: "bunga", label: "Taman bunga", prompt: "a gentle flower garden with soft pastel blossoms" },
          { value: "kostum", label: "Kostum lucu", prompt: "a cute knitted animal-ear hat and matching outfit" },
          { value: "ulangtahun", label: "Ulang tahun", prompt: "a first-birthday cake-smash set with balloons" },
        ],
      },
    ],
    promptTemplate: p(
      "Create an adorable professional baby photograph of the baby in this photo with {{tema}}.",
      "Keep the baby's exact face and features. The baby must look safe, comfortable and fully, modestly clothed or wrapped.",
      "Soft, diffused window light, warm pastel tones, 85mm lens, f/2.8, very gentle and heartwarming mood. Photorealistic, no text.",
    ),
  },
  {
    id: "foto-umrah-haji",
    kategori: "keluarga",
    nama: "Foto Umrah / Haji",
    deskripsi: "Kenang-kenangan bernuansa Tanah Suci dengan busana ihram atau gamis.",
    ikon: "Landmark",
    contohGambar: contoh("foto-umrah-haji"),
    jumlahFotoInput: 1,
    aspectRatio: "3:4",
    estimasiDetik: 20,
    aktif: true,
    inputTambahan: [
      {
        nama: "lokasi",
        label: "Latar",
        tipe: "select",
        default: "haram",
        opsi: [
          { value: "haram", label: "Masjidil Haram", prompt: "the courtyard of Masjid al-Haram in Mecca with the Kaaba softly in the background" },
          { value: "nabawi", label: "Masjid Nabawi", prompt: "the courtyard of Masjid an-Nabawi in Medina with its iconic umbrellas and green dome" },
          { value: "jabalrahmah", label: "Jabal Rahmah", prompt: "Jabal Rahmah hill near Arafat under a clear sky" },
        ],
      },
      {
        nama: "busana",
        label: "Busana",
        tipe: "select",
        default: "tetap",
        opsi: [
          { value: "tetap", label: "Seperti di foto", prompt: "keep the person's current modest clothing" },
          { value: "ihram", label: "Ihram (pria)", prompt: "dress the man in a clean white two-piece ihram garment" },
          { value: "gamis", label: "Gamis & khimar putih (wanita)", prompt: "dress the woman in a clean white gamis and long white khimar" },
        ],
      },
    ],
    promptTemplate: p(
      "Create a respectful, serene pilgrimage memorial photo of the person in this photo at {{lokasi}}; {{busana}}.",
      "Calm, grateful expression, modest pose (e.g., hands raised in prayer or standing peacefully).",
      "Soft natural daylight, 35mm lens, f/4, realistic architecture and atmosphere, photorealistic, no text.",
    ),
  },
  {
    id: "foto-tempo-dulu",
    kategori: "keluarga",
    nama: "Foto Tempo Dulu (Vintage)",
    deskripsi: "Jadikan fotomu seperti foto jadul era 1920-an sampai 1990-an.",
    ikon: "Camera",
    contohGambar: contoh("foto-tempo-dulu"),
    jumlahFotoInput: 1,
    premium: true,
    estimasiDetik: 16,
    aktif: true,
    inputTambahan: [
      {
        nama: "era",
        label: "Era",
        tipe: "select",
        default: "1950",
        opsi: [
          { value: "1920", label: "1920-an sepia", prompt: "a 1920s Dutch East Indies studio portrait: sepia tone, painted backdrop, period clothing, plate camera look" },
          { value: "1950", label: "1950-an hitam putih", prompt: "a 1950s black-and-white studio photograph with silver gelatin grain and period hairstyle and clothing" },
          { value: "1970", label: "1970-an retro warna", prompt: "a 1970s faded Kodachrome color photo with warm cast, period fashion and decor" },
          { value: "1990", label: "1990-an film", prompt: "a 1990s 35mm point-and-shoot film photo with direct flash and a date stamp feel (no actual text)" },
        ],
      },
    ],
    promptTemplate: p(
      "Re-imagine this photo as {{era}}.",
      "Adapt clothing, hairstyle (keep hijab if worn), background and photographic artefacts to the era: grain, slight blur, vignetting, dust and scratches appropriate to the period.",
      "The people must keep their exact faces and identities. Authentic, nostalgic, no text.",
    ),
  },

  // ─────────────────────── DESAIN & KREATIF ───────────────────────
  {
    id: "karikatur",
    kategori: "kreatif",
    nama: "Karikatur",
    deskripsi: "Karikatur lucu kepala besar atau gaya kartun, cocok untuk kado dan avatar.",
    ikon: "Smile",
    contohGambar: contoh("karikatur"),
    jumlahFotoInput: 1,
    premium: true,
    aspectRatio: "3:4",
    estimasiDetik: 18,
    aktif: true,
    inputTambahan: [
      {
        nama: "gaya",
        label: "Gaya",
        tipe: "select",
        default: "kepalabesar",
        opsi: [
          { value: "kepalabesar", label: "Kepala besar", prompt: "a classic hand-painted caricature with a big head and small body, exaggerated but flattering features" },
          { value: "kartun", label: "Kartun 2D", prompt: "a clean, colorful 2D cartoon illustration with bold outlines" },
          { value: "anime", label: "Anime", prompt: "a polished Japanese anime illustration with cel shading" },
          { value: "3dfilm", label: "Film animasi 3D", prompt: "a charming 3D animated-movie character render with soft subsurface lighting" },
        ],
      },
      { nama: "profesi", label: "Tema / profesi (opsional)", tipe: "text", placeholder: "contoh: dokter, pemain bola, chef" },
    ],
    promptTemplate: p(
      "Transform the person in this photo into {{gaya}}. Theme or profession: {{profesi}} (ignore if empty).",
      "The caricature must remain clearly recognizable as the same person: keep their distinctive facial features, skin tone, hairstyle or hijab, and glasses if any.",
      "Fun, friendly and respectful, never mocking. Simple matching background. High quality illustration, no text.",
    ),
  },
  {
    id: "gaya-3d",
    kategori: "kreatif",
    nama: "Gaya 3D / Isometric",
    deskripsi: "Ubah foto jadi figur 3D, gaya clay, atau ilustrasi isometric.",
    ikon: "Box",
    contohGambar: contoh("gaya-3d"),
    jumlahFotoInput: 1,
    premium: true,
    aspectRatio: "1:1",
    estimasiDetik: 18,
    aktif: true,
    inputTambahan: [
      {
        nama: "gaya",
        label: "Gaya",
        tipe: "select",
        default: "figurin",
        opsi: [
          { value: "figurin", label: "Figur 3D", prompt: "a cute stylized 3D vinyl figurine with smooth glossy materials" },
          { value: "clay", label: "Clay / plastisin", prompt: "a handmade claymation figure with visible clay texture and fingerprints" },
          { value: "isometric", label: "Isometric", prompt: "a detailed isometric 3D illustration on a small floating tile" },
          { value: "lowpoly", label: "Low poly", prompt: "a stylish low-poly 3D render with flat-shaded facets" },
        ],
      },
    ],
    promptTemplate: p(
      "Turn the subject of this photo into {{gaya}}.",
      "If it is a person, keep them recognizable (face shape, skin tone, hairstyle or hijab, outfit colors). If it is an object or place, keep its key shapes and colors.",
      "Soft global illumination, clean pastel background, high-quality 3D render, no text.",
    ),
  },
  {
    id: "diorama-mini",
    kategori: "kreatif",
    nama: "Diorama Mini",
    deskripsi: "Jadikan dirimu figur koleksi mini lengkap dengan kotak kemasan di meja kerja.",
    ikon: "Gamepad2",
    contohGambar: contoh("diorama-mini"),
    jumlahFotoInput: 1,
    premium: true,
    aspectRatio: "1:1",
    estimasiDetik: 20,
    aktif: true,
    inputTambahan: [
      {
        nama: "set",
        label: "Set",
        tipe: "select",
        default: "meja",
        opsi: [
          { value: "meja", label: "Figur di meja kerja", prompt: "a 1/7 scale collectible figure standing on a round clear acrylic base on a computer desk, with its illustrated retail box beside it and a monitor showing the 3D modeling of the figure" },
          { value: "toko", label: "Diorama toko kecil", prompt: "a miniature diorama of a tiny Indonesian shop (warung) with the person as a small figure inside, tilt-shift look" },
          { value: "kamar", label: "Diorama kamar", prompt: "a miniature diorama of a cozy bedroom with the person as a small figure, tilt-shift look" },
        ],
      },
    ],
    promptTemplate: p(
      "Create a realistic photo of {{set}}, based on the person in this photo.",
      "The figure must look like the same person (face, hairstyle or hijab, outfit) in figurine form with realistic PVC/resin material.",
      "Indoor environment, natural light, shallow depth of field, photorealistic product-photo quality. Packaging artwork may show the figure but no readable brand names.",
    ),
  },
  {
    id: "sketsa-realistis",
    kategori: "kreatif",
    nama: "Sketsa → Gambar Realistis",
    deskripsi: "Coretan tangan atau sketsa jadi gambar realistis berwarna.",
    ikon: "PenTool",
    contohGambar: contoh("sketsa-realistis"),
    jumlahFotoInput: 1,
    labelFoto: ["Upload sketsa"],
    estimasiDetik: 16,
    aktif: true,
    inputTambahan: [
      {
        nama: "hasil",
        label: "Jadikan",
        tipe: "select",
        default: "foto",
        opsi: [
          { value: "foto", label: "Foto realistis", prompt: "a photorealistic photograph" },
          { value: "arsitektur", label: "Render arsitektur", prompt: "a photorealistic architectural visualization with realistic materials and daylight" },
          { value: "produk", label: "Render produk", prompt: "a polished photorealistic product design render on a studio background" },
          { value: "lukisan", label: "Lukisan digital", prompt: "a rich, detailed digital painting" },
        ],
      },
      { nama: "keterangan", label: "Keterangan (opsional)", tipe: "text", placeholder: "contoh: rumah minimalis 2 lantai warna putih" },
    ],
    promptTemplate: p(
      "Turn this sketch or drawing into {{hasil}}. Extra description: {{keterangan}} (ignore if empty).",
      "Follow the sketch's composition, proportions, perspective and layout closely; interpret lines as real shapes and add realistic materials, color, lighting and detail.",
      "High resolution, coherent and clean, no text.",
    ),
  },
  {
    id: "thumbnail-youtube",
    kategori: "kreatif",
    nama: "Thumbnail YouTube",
    deskripsi: "Thumbnail 16:9 mencolok dengan ekspresi, warna kontras, dan judul besar.",
    ikon: "MonitorPlay",
    contohGambar: contoh("thumbnail-youtube"),
    jumlahFotoInput: 1,
    premium: true,
    aspectRatio: "16:9",
    estimasiDetik: 20,
    aktif: true,
    inputTambahan: [
      { nama: "judul", label: "Teks judul (maks 5 kata)", tipe: "text", placeholder: "contoh: MODAL 100 RIBU!", wajib: true },
      {
        nama: "ekspresi",
        label: "Ekspresi",
        tipe: "select",
        default: "kaget",
        opsi: [
          { value: "kaget", label: "Kaget", prompt: "an excited, surprised expression" },
          { value: "senang", label: "Senang", prompt: "a big happy smile" },
          { value: "serius", label: "Serius", prompt: "a focused, serious expression" },
          { value: "tetap", label: "Seperti di foto", prompt: "their original expression" },
        ],
      },
      {
        nama: "warna",
        label: "Tema warna",
        tipe: "select",
        default: "kuningmerah",
        opsi: [
          { value: "kuningmerah", label: "Kuning–merah", prompt: "bold yellow and red" },
          { value: "biruoranye", label: "Biru–oranye", prompt: "electric blue and orange" },
          { value: "hijauhitam", label: "Hijau–hitam", prompt: "neon green and black" },
        ],
      },
    ],
    promptTemplate: p(
      "Design an eye-catching YouTube thumbnail (16:9) featuring the person from this photo as a large cut-out on the right side with {{ekspresi}} and a bright outline glow.",
      "Add the headline text \"{{judul}}\" in huge, bold, high-contrast sans-serif letters on the left, spelled exactly as given.",
      "Color scheme: {{warna}}; punchy, high saturation, dramatic lighting, clean uncluttered background, readable at small size.",
    ),
  },

  // ─────────────────────── EDIT & MANIPULASI ───────────────────────
  {
    id: "hapus-background",
    kategori: "edit",
    nama: "Hapus / Ganti Background",
    deskripsi: "Ganti latar foto jadi polos, studio, atau suasana pilihanmu. Subjek tetap utuh.",
    ikon: "Eraser",
    contohGambar: contoh("hapus-background"),
    jumlahFotoInput: 1,
    estimasiDetik: 15,
    aktif: true,
    inputTambahan: [
      {
        nama: "background",
        label: "Background baru",
        tipe: "select",
        default: "putih",
        opsi: [
          { value: "putih", label: "Putih polos", prompt: "a seamless pure white (#FFFFFF) studio background with no texture, no gradient and no props" },
          { value: "abu", label: "Abu-abu studio", prompt: "a seamless light grey studio backdrop with a soft, subtle vignette, like a professional photo studio" },
          { value: "gradasi", label: "Gradasi lembut", prompt: "a smooth, soft pastel gradient background (lavender to peach), clean and modern" },
          { value: "hijau", label: "Hijau (green screen)", prompt: "a flat, evenly lit chroma-key green (#00B140) background with no shadows, suitable for keying" },
          { value: "custom", label: "Tulis sendiri…" },
        ],
      },
      { nama: "custom", label: "Deskripsikan background", tipe: "text", placeholder: "contoh: kafe estetik dengan lampu hangat, blur" },
    ],
    promptTemplate: p(
      "Edit this photo: remove the original background completely and replace it with {{background}}.",
      "Keep the main subject (person, product or object) exactly as it is: same pose, same clothing, same colors, same proportions and same position in the frame.",
      "Produce a clean, precise cut-out with natural edges, including fine details such as hair strands, fur and semi-transparent areas; no halos, no leftover fragments of the old background.",
      "Relight the subject subtly so it matches the new background, and add a soft, realistic contact shadow where the subject meets the ground if appropriate.",
      "Photorealistic, high resolution, sharp focus, professional studio quality. Do not add text, logos or extra objects.",
    ),
  },
  {
    id: "ubah-pose",
    kategori: "edit",
    nama: "Ubah Pose / Angle / Ekspresi",
    deskripsi: "Ganti ekspresi, arah wajah, atau pose tanpa foto ulang.",
    ikon: "Move3d",
    contohGambar: contoh("ubah-pose"),
    jumlahFotoInput: 1,
    premium: true,
    estimasiDetik: 18,
    aktif: true,
    inputTambahan: [
      {
        nama: "ubah",
        label: "Ubah menjadi",
        tipe: "select",
        default: "senyum",
        opsi: [
          { value: "senyum", label: "Tersenyum lebar", prompt: "a natural, warm open smile" },
          { value: "senyumtipis", label: "Senyum tipis", prompt: "a subtle, closed-mouth confident smile" },
          { value: "samping", label: "Menoleh ke samping", prompt: "the head turned to a three-quarter profile view looking to the side" },
          { value: "lipattangan", label: "Tangan dilipat", prompt: "a confident pose with arms crossed" },
          { value: "duduk", label: "Duduk santai", prompt: "a relaxed seated pose on a simple chair" },
          { value: "custom", label: "Tulis sendiri…" },
        ],
      },
      { nama: "custom", label: "Pose / ekspresi yang diinginkan", tipe: "text", placeholder: "contoh: melambaikan tangan" },
    ],
    promptTemplate: p(
      "Edit this photo so the person has {{ubah}}.",
      "Change only what is needed for the new pose or expression; keep the same person, outfit, hairstyle or hijab, lighting and background.",
      "Anatomically correct hands and body, natural result, photorealistic, no text.",
    ),
  },
  {
    id: "perluas-gambar",
    kategori: "edit",
    nama: "Perluas Gambar (Outpainting)",
    deskripsi: "Lebarkan foto ke rasio lain, misalnya jadi 16:9 atau 9:16 untuk Story dan Reels.",
    ikon: "Expand",
    contohGambar: contoh("perluas-gambar"),
    jumlahFotoInput: 1,
    estimasiDetik: 18,
    aktif: true,
    inputTambahan: [
      {
        nama: "rasio",
        label: "Rasio baru",
        tipe: "select",
        default: "169",
        opsi: [
          { value: "169", label: "16:9 (YouTube)", prompt: "a wide 16:9 landscape frame", aspectRatio: "16:9" },
          { value: "916", label: "9:16 (Story/Reels)", prompt: "a tall 9:16 vertical frame", aspectRatio: "9:16" },
          { value: "11", label: "1:1 (Feed)", prompt: "a square 1:1 frame", aspectRatio: "1:1" },
          { value: "43", label: "4:3", prompt: "a 4:3 frame", aspectRatio: "4:3" },
        ],
      },
    ],
    promptTemplate: p(
      "Extend (outpaint) this image to fill {{rasio}}.",
      "Keep the entire original image content unchanged and seamlessly continue the scene beyond its borders: matching perspective, lighting, colors, textures and grain.",
      "Do not crop or distort the original content; no visible seams, no duplicated objects, no text.",
    ),
  },
  {
    id: "gabung-2-foto",
    kategori: "edit",
    nama: "Gabung 2 Foto",
    deskripsi: "Satukan dua orang dari foto berbeda dalam satu foto yang natural.",
    ikon: "Combine",
    contohGambar: contoh("gabung-2-foto"),
    jumlahFotoInput: 2,
    labelFoto: ["Foto orang pertama", "Foto orang kedua"],
    butuhPersetujuan: true,
    premium: true,
    aspectRatio: "4:3",
    estimasiDetik: 22,
    aktif: true,
    inputTambahan: [
      { nama: "suasana", label: "Suasana / lokasi", tipe: "text", placeholder: "contoh: berdua di depan Monas, siang hari", wajib: true },
    ],
    promptTemplate: p(
      "Combine the person from the first image and the person from the second image into one natural photograph: {{suasana}}.",
      "Both people must keep their exact faces, identities, hairstyles or hijab and outfits from their own photos.",
      "Consistent lighting, perspective, scale and color for both, realistic shadows, natural friendly pose standing side by side. Photorealistic, no text.",
    ),
  },
  {
    id: "restorasi-foto",
    kategori: "edit",
    nama: "Restorasi Foto Lama",
    deskripsi: "Perbaiki foto lama yang pudar, sobek, atau buram, dan bisa sekalian diwarnai.",
    ikon: "History",
    contohGambar: contoh("restorasi-foto"),
    jumlahFotoInput: 1,
    estimasiDetik: 18,
    aktif: true,
    inputTambahan: [
      {
        nama: "mode",
        label: "Mode",
        tipe: "select",
        default: "warnai",
        opsi: [
          { value: "warnai", label: "Restorasi + warnai", prompt: "then colorize it with natural, historically plausible colors" },
          { value: "asli", label: "Restorasi saja", prompt: "keeping its original black-and-white or sepia tones" },
        ],
      },
    ],
    promptTemplate: p(
      "Restore this old photograph: remove scratches, tears, dust, stains, creases and noise, repair missing areas, recover sharpness and contrast, {{mode}}.",
      "Keep the composition, clothing and every person's exact face and identity; do not modernize or beautify them.",
      "Natural, faithful, high resolution result, no text.",
    ),
  },
  {
    id: "filter-umur",
    kategori: "edit",
    nama: "Filter Umur",
    deskripsi: "Lihat dirimu versi anak-anak, remaja, atau saat tua nanti.",
    ikon: "Hourglass",
    contohGambar: contoh("filter-umur"),
    jumlahFotoInput: 1,
    premium: true,
    estimasiDetik: 16,
    aktif: true,
    inputTambahan: [
      {
        nama: "usia",
        label: "Jadikan usia",
        tipe: "select",
        default: "70",
        opsi: [
          { value: "8", label: "Anak 8 tahun", prompt: "about 8 years old (a child)" },
          { value: "17", label: "Remaja 17", prompt: "about 17 years old" },
          { value: "40", label: "40 tahun", prompt: "about 40 years old" },
          { value: "70", label: "70 tahun", prompt: "about 70 years old, with natural wrinkles and grey hair" },
        ],
      },
    ],
    promptTemplate: p(
      "Edit this portrait so the person looks {{usia}}.",
      "Apply realistic age changes (skin texture, facial fat, hair) while keeping the same identity, bone structure, eye color, skin tone, outfit style and background.",
      "Photorealistic, respectful, no text.",
    ),
  },
];

export function findPreset(id: string) {
  return PRESETS.find((x) => x.id === id);
}

/** Preset aktif (bawaan). Versi dengan override admin ada di lib/catalog.ts. */
export function getPreset(id: string) {
  return PRESETS.find((x) => x.id === id && x.aktif);
}
