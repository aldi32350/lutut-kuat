// =====================================================
//  DATA GERAKAN & PROGRAM
//  Pose: hip [x,y], torso (derajat dari tegak), n/f = kaki dekat/jauh
//  [paha, betis, telapak relatif], arm [lengan atas, lengan bawah]
//  atau hold [x,y] (tangan berpegangan pada titik).
// =====================================================
(function () {
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const P = (base, over) => Object.assign(clone(base), over || {});

  const SEAT = { hip: [95, 121], torso: 0, n: [90, 0, 90], f: [90, 0, 90], arm: [25, 60] };
  const STAND = { hip: [95, 86], torso: 0, n: [0, 0, 90], f: [0, 0, 90], hold: [127, 84] };
  const LIE = { hip: [110, 150], torso: -90, n: [90, 90, 90], f: [90, 90, 90], arm: [85, 90] };

  const CATEGORIES = [
    { id: "pemanasan", name: "Pemanasan", icon: "🔥", desc: "Melancarkan aliran darah dan menyiapkan sendi." },
    { id: "duduk", name: "Latihan Duduk", icon: "🪑", desc: "Aman dan nyaman, dilakukan sambil duduk di kursi." },
    { id: "berbaring", name: "Latihan Berbaring", icon: "🛏️", desc: "Bisa dilakukan di kasur atau matras." },
    { id: "berdiri", name: "Latihan Berdiri", icon: "🧍", desc: "Sambil berpegangan pada sandaran kursi yang kokoh." },
    { id: "peregangan", name: "Peregangan", icon: "🌿", desc: "Melemaskan otot di sekitar lutut." },
  ];

  const EXERCISES = [
    // ---------------- PEMANASAN ----------------
    {
      id: "pompa-kaki",
      name: "Pompa Pergelangan Kaki",
      cat: "pemanasan",
      pos: "Duduk di kursi",
      props: ["chair"],
      frames: [P(SEAT, { n: [90, 0, 125], f: [90, 0, 125] }), P(SEAT, { n: [90, 0, 60], f: [90, 0, 60] })],
      mode: "reps", reps: 15, sides: false, up: 1, hold: 0.3, down: 1,
      highlight: "ankle",
      target: "Pergelangan kaki & betis",
      benefit: "Melancarkan peredaran darah di kaki dan mengurangi rasa kaku.",
      steps: [
        "Duduk tegak di kursi, kedua telapak kaki menapak di lantai.",
        "Angkat ujung jari kaki ke atas, tumit tetap di lantai.",
        "Lalu tekan ujung jari ke bawah dan angkat tumit.",
        "Lakukan bergantian secara perlahan dan berirama.",
      ],
      tips: ["Bernapas dengan santai.", "Bisa juga dilakukan sambil berbaring."],
    },
    {
      id: "jalan-duduk",
      name: "Jalan di Tempat Sambil Duduk",
      cat: "pemanasan",
      pos: "Duduk di kursi",
      props: ["chair"],
      frames: [P(SEAT, { n: [115, 15, 75] }), P(SEAT, { f: [115, 15, 75] })],
      mode: "reps", reps: 10, sides: false, up: 0.9, hold: 0.1, down: 0.9,
      repLabel: "x tiap kaki",
      highlight: "thigh",
      target: "Paha & pinggul",
      benefit: "Menghangatkan otot paha dan melatih gerak sendi lutut serta pinggul.",
      steps: [
        "Duduk tegak, punggung tidak bersandar terlalu jauh.",
        "Angkat lutut kanan sedikit ke atas, lalu turunkan.",
        "Ganti angkat lutut kiri, lalu turunkan.",
        "Lakukan bergantian seperti berjalan di tempat.",
      ],
      tips: ["Ayunkan tangan bila nyaman.", "Tidak perlu mengangkat terlalu tinggi."],
    },
    {
      id: "geser-kaki",
      name: "Geser Kaki di Lantai",
      cat: "pemanasan",
      pos: "Duduk di kursi",
      props: ["chair"],
      frames: [P(SEAT), P(SEAT, { n: [80, 34, 90] })],
      mode: "reps", reps: 10, sides: true, up: 1.2, hold: 0.3, down: 1.2,
      highlight: "knee",
      target: "Sendi lutut",
      benefit: "Melumasi sendi lutut dengan gerakan menekuk dan meluruskan yang ringan.",
      steps: [
        "Duduk tegak dengan kedua kaki menapak di lantai.",
        "Geser satu kaki ke depan perlahan, telapak tetap menyentuh lantai.",
        "Tarik kembali kaki ke posisi awal.",
        "Selesaikan satu sisi, lalu ganti kaki yang lain.",
      ],
      tips: ["Gunakan kaus kaki atau alas licin agar mudah digeser."],
    },

    // ---------------- LATIHAN DUDUK ----------------
    {
      id: "luruskan-lutut",
      name: "Luruskan Lutut",
      cat: "duduk",
      pos: "Duduk di kursi",
      props: ["chair"],
      frames: [P(SEAT), P(SEAT, { n: [93, 88, 90] })],
      mode: "reps", reps: 10, sides: true, up: 1.5, hold: 3, down: 1.5,
      highlight: "thigh",
      target: "Otot paha depan (quadriceps)",
      benefit: "Menguatkan otot paha depan yang menopang dan melindungi lutut.",
      steps: [
        "Duduk tegak, pegang sisi kursi bila perlu.",
        "Luruskan satu kaki perlahan sampai sejajar lantai.",
        "Tahan 3 detik sambil mengencangkan otot paha.",
        "Turunkan perlahan ke posisi awal.",
      ],
      tips: ["Tarik ujung jari kaki ke arah tubuh saat lutut lurus.", "Jangan menghentak."],
      caution: "Jika lutut terasa nyeri tajam, kurangi tinggi angkatan.",
    },
    {
      id: "jinjit-duduk",
      name: "Jinjit Sambil Duduk",
      cat: "duduk",
      pos: "Duduk di kursi",
      props: ["chair"],
      frames: [P(SEAT), P(SEAT, { n: [97, -3, 63], f: [97, -3, 63] })],
      mode: "reps", reps: 12, sides: false, up: 1, hold: 1, down: 1,
      highlight: "calf",
      target: "Otot betis",
      benefit: "Menguatkan betis yang membantu menstabilkan lutut saat berjalan.",
      steps: [
        "Duduk tegak, kedua telapak kaki menapak di lantai.",
        "Angkat kedua tumit setinggi mungkin, ujung jari tetap di lantai.",
        "Tahan sebentar.",
        "Turunkan tumit perlahan.",
      ],
      tips: ["Letakkan tangan di atas paha untuk sedikit beban tambahan."],
    },
    {
      id: "duduk-berdiri",
      name: "Duduk–Berdiri dari Kursi",
      cat: "duduk",
      pos: "Kursi kokoh tanpa roda",
      props: ["chair"],
      frames: [
        P(SEAT, { torso: 5, arm: [80, 85] }),
        { hip: [110, 115], torso: 40, n: [75, -20, 110], f: [75, -20, 110], arm: [75, 80] },
        { hip: [130, 86], torso: 0, n: [0, 0, 90], f: [0, 0, 90], arm: [15, 10] },
      ],
      mode: "reps", reps: 8, sides: false, up: 2, hold: 1, down: 2.5,
      highlight: "thigh",
      target: "Paha, bokong & keseimbangan",
      benefit: "Melatih gerakan sehari-hari: bangun dari duduk dengan lebih mudah dan mandiri.",
      steps: [
        "Duduk di ujung kursi, kaki selebar bahu dan menapak di lantai.",
        "Condongkan badan ke depan, tangan lurus ke depan.",
        "Dorong kaki untuk berdiri tegak.",
        "Duduk kembali perlahan, jangan menjatuhkan badan.",
      ],
      tips: ["Boleh memakai tangan untuk menumpu pada pegangan kursi.", "Pastikan kursi tidak mudah bergeser."],
      caution: "Lakukan dengan pendamping bila keseimbangan kurang baik.",
    },

    // ---------------- BERBARING ----------------
    {
      id: "kencangkan-paha",
      name: "Kencangkan Paha",
      cat: "berbaring",
      pos: "Berbaring telentang",
      props: ["mat"],
      frames: [P(LIE), P(LIE, { n: [90, 90, 70] })],
      mode: "reps", reps: 10, sides: true, up: 1, hold: 5, down: 1,
      highlight: "thigh",
      target: "Otot paha depan",
      benefit: "Latihan paling dasar untuk mengaktifkan otot paha tanpa membebani sendi.",
      steps: [
        "Berbaring telentang, kedua kaki lurus.",
        "Tekan bagian belakang lutut ke kasur dengan mengencangkan otot paha.",
        "Tarik ujung jari kaki ke arah tubuh.",
        "Tahan 5 detik, lalu lemaskan.",
      ],
      tips: ["Letakkan handuk gulung di bawah lutut untuk membantu merasakan tekanan."],
    },
    {
      id: "geser-tumit",
      name: "Geser Tumit",
      cat: "berbaring",
      pos: "Berbaring telentang",
      props: ["mat"],
      frames: [P(LIE), P(LIE, { n: [135, 45, 90] })],
      mode: "reps", reps: 10, sides: true, up: 2, hold: 1, down: 2,
      highlight: "knee",
      target: "Kelenturan sendi lutut",
      benefit: "Membantu menambah ruang gerak lutut agar lebih mudah ditekuk.",
      steps: [
        "Berbaring telentang dengan kedua kaki lurus.",
        "Geser tumit mendekati bokong sehingga lutut menekuk.",
        "Tahan sebentar pada posisi yang masih nyaman.",
        "Geser kembali sampai kaki lurus.",
      ],
      tips: ["Tumit tetap menyentuh kasur selama gerakan."],
    },
    {
      id: "angkat-kaki-lurus",
      name: "Angkat Kaki Lurus",
      cat: "berbaring",
      pos: "Berbaring telentang",
      props: ["mat"],
      frames: [P(LIE, { f: [135, 45, 90] }), P(LIE, { f: [135, 45, 90], n: [122, 122, 75] })],
      mode: "reps", reps: 10, sides: true, up: 1.5, hold: 2, down: 2,
      highlight: "thigh",
      target: "Paha depan & pinggul",
      benefit: "Menguatkan paha tanpa menekuk lutut, cocok untuk lutut yang mudah nyeri.",
      steps: [
        "Berbaring, tekuk satu lutut dengan telapak menapak.",
        "Kaki yang lain lurus, kencangkan otot pahanya.",
        "Angkat kaki lurus setinggi lutut kaki yang ditekuk.",
        "Tahan 2 detik, turunkan perlahan.",
      ],
      tips: ["Jaga lutut tetap lurus saat diangkat.", "Punggung bawah tetap menempel di kasur."],
    },

    // ---------------- BERDIRI ----------------
    {
      id: "tekuk-belakang",
      name: "Tekuk Lutut ke Belakang",
      cat: "berdiri",
      pos: "Berdiri berpegangan kursi",
      props: ["support"],
      frames: [P(STAND), P(STAND, { n: [-5, -95, 90] })],
      mode: "reps", reps: 10, sides: true, up: 1.5, hold: 2, down: 1.5,
      highlight: "hamstring",
      target: "Otot paha belakang (hamstring)",
      benefit: "Menyeimbangkan kekuatan otot depan dan belakang lutut.",
      steps: [
        "Berdiri tegak sambil berpegangan pada sandaran kursi.",
        "Tekuk satu lutut, angkat tumit ke arah bokong.",
        "Tahan 2 detik.",
        "Turunkan perlahan ke lantai.",
      ],
      tips: ["Paha tetap sejajar dengan paha kaki yang lain."],
    },
    {
      id: "jongkok-ringan",
      name: "Jongkok Ringan",
      cat: "berdiri",
      pos: "Berdiri berpegangan kursi",
      props: ["support"],
      frames: [P(STAND), P(STAND, { hip: [89.7, 95.6], torso: 20, n: [35, -25, 115], f: [35, -25, 115] })],
      mode: "reps", reps: 10, sides: false, up: 2, hold: 1, down: 2,
      highlight: "thigh",
      target: "Paha, bokong & lutut",
      benefit: "Menguatkan otot-otot utama penopang lutut secara bertahap.",
      steps: [
        "Berdiri dengan kaki selebar bahu, berpegangan pada kursi.",
        "Tekuk lutut sedikit seperti hendak duduk.",
        "Turun hanya sedikit, sejauh masih nyaman.",
        "Kembali berdiri tegak perlahan.",
      ],
      tips: ["Lutut tidak melewati ujung jari kaki.", "Berat badan bertumpu di tumit."],
      caution: "Hentikan bila lutut terasa nyeri. Cukup turun sedikit saja.",
    },
    {
      id: "jinjit-berdiri",
      name: "Jinjit Berpegangan",
      cat: "berdiri",
      pos: "Berdiri berpegangan kursi",
      props: ["support"],
      frames: [P(STAND), P(STAND, { hip: [95, 79], n: [0, 0, 55], f: [0, 0, 55] })],
      mode: "reps", reps: 12, sides: false, up: 1.5, hold: 1.5, down: 1.5,
      highlight: "calf",
      target: "Betis & keseimbangan",
      benefit: "Menguatkan betis dan melatih keseimbangan untuk mencegah jatuh.",
      steps: [
        "Berdiri tegak sambil berpegangan pada sandaran kursi.",
        "Angkat kedua tumit, bertumpu pada ujung kaki.",
        "Tahan sebentar.",
        "Turunkan tumit perlahan.",
      ],
      tips: ["Jangan mengunci lutut terlalu kaku."],
    },

    // ---------------- PEREGANGAN ----------------
    {
      id: "regang-paha-belakang",
      name: "Peregangan Paha Belakang",
      cat: "peregangan",
      pos: "Duduk di ujung kursi",
      props: ["chair"],
      frames: [
        P(SEAT, { hip: [100, 121], n: [70, 50, 130] }),
        P(SEAT, { hip: [100, 121], torso: 32, n: [70, 50, 130], arm: [80, 70] }),
      ],
      mode: "time", time: 20, sides: true, up: 2, down: 2,
      highlight: "hamstring",
      target: "Otot paha belakang",
      benefit: "Melemaskan otot belakang paha yang sering kaku dan menarik lutut.",
      steps: [
        "Duduk di ujung kursi.",
        "Luruskan satu kaki ke depan, tumit di lantai, jari kaki menghadap atas.",
        "Condongkan badan ke depan dengan punggung tetap lurus.",
        "Tahan saat terasa tarikan ringan di belakang paha.",
      ],
      tips: ["Tarik napas panjang dan hembuskan perlahan.", "Tidak perlu menyentuh ujung kaki."],
    },
    {
      id: "regang-betis",
      name: "Peregangan Betis",
      cat: "peregangan",
      pos: "Berdiri berpegangan kursi",
      props: ["support"],
      frames: [P(STAND), P(STAND, { hip: [100, 88], torso: 8, n: [-15, -15, 105], f: [15, -5, 95] })],
      mode: "time", time: 20, sides: true, up: 2, down: 2,
      highlight: "calf",
      target: "Otot betis",
      benefit: "Melenturkan betis sehingga lutut dan pergelangan kaki lebih leluasa bergerak.",
      steps: [
        "Berdiri menghadap sandaran kursi dan berpegangan.",
        "Mundurkan satu kaki, lutut lurus, tumit tetap menapak.",
        "Tekuk lutut kaki depan dan condongkan badan sedikit ke depan.",
        "Tahan saat terasa tarikan di betis kaki belakang.",
      ],
      tips: ["Ujung kaki belakang menghadap lurus ke depan."],
    },
    {
      id: "peluk-lutut",
      name: "Peluk Lutut ke Dada",
      cat: "peregangan",
      pos: "Berbaring telentang",
      props: ["mat"],
      frames: [P(LIE, { arm: undefined, hold: [116, 152] }), P(LIE, { arm: undefined, hold: [97, 119], n: [200, 60, 90] })],
      mode: "time", time: 20, sides: true, up: 2.5, down: 2.5,
      highlight: "knee",
      target: "Lutut, pinggul & punggung bawah",
      benefit: "Menekuk lutut dengan lembut dan merilekskan punggung bawah.",
      steps: [
        "Berbaring telentang dengan kaki lurus.",
        "Tekuk satu lutut dan tarik perlahan ke arah dada dengan kedua tangan.",
        "Tahan sambil bernapas santai.",
        "Turunkan kembali perlahan.",
      ],
      tips: ["Pegang di belakang paha bila memegang lutut terasa tidak nyaman."],
    },
  ];

  // Bersihkan field undefined (dari arm: undefined)
  EXERCISES.forEach((ex) => ex.frames.forEach((f) => Object.keys(f).forEach((k) => f[k] === undefined && delete f[k])));

  const PROGRAMS = [
    {
      id: "pemanasan-pagi",
      name: "Pemanasan Pagi",
      emoji: "🌅",
      level: "Ringan",
      pos: "Duduk",
      desc: "Gerakan ringan untuk mengawali hari agar lutut tidak kaku.",
      items: ["pompa-kaki", "jalan-duduk", "geser-kaki"],
    },
    {
      id: "kuat-duduk",
      name: "Lutut Kuat – Duduk",
      emoji: "🪑",
      level: "Ringan",
      pos: "Duduk",
      desc: "Program utama yang aman untuk lansia, semuanya dilakukan sambil duduk.",
      items: ["pompa-kaki", "jalan-duduk", "luruskan-lutut", "jinjit-duduk", "regang-paha-belakang"],
    },
    {
      id: "kuat-berdiri",
      name: "Lutut Kuat – Berdiri",
      emoji: "💪",
      level: "Sedang",
      pos: "Berdiri + kursi",
      desc: "Tingkat lanjutan untuk melatih kekuatan dan keseimbangan.",
      items: ["jalan-duduk", "duduk-berdiri", "tekuk-belakang", "jongkok-ringan", "jinjit-berdiri", "regang-betis"],
    },
    {
      id: "di-kasur",
      name: "Latihan di Tempat Tidur",
      emoji: "🛏️",
      level: "Ringan",
      pos: "Berbaring",
      desc: "Cocok dilakukan sesaat setelah bangun tidur, sebelum turun dari kasur.",
      items: ["kencangkan-paha", "geser-tumit", "angkat-kaki-lurus", "peluk-lutut"],
    },
    {
      id: "peregangan-santai",
      name: "Peregangan Santai",
      emoji: "🌿",
      level: "Ringan",
      pos: "Campuran",
      desc: "Melemaskan otot di sekitar lutut. Baik untuk sore atau sebelum tidur.",
      items: ["regang-paha-belakang", "regang-betis", "peluk-lutut"],
    },
  ];

  // Rekomendasi per hari (0 = Minggu)
  const DAILY = ["peregangan-santai", "kuat-duduk", "di-kasur", "kuat-duduk", "kuat-berdiri", "kuat-duduk", "pemanasan-pagi"];

  window.LK_DATA = { CATEGORIES, EXERCISES, PROGRAMS, DAILY };
})();
