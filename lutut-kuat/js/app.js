(function () {
  "use strict";
  const { CATEGORIES, EXERCISES, PROGRAMS, DAILY } = window.LK_DATA;
  const { Figure, repProgress } = window.LK_FIG;
  const CFG = window.APP_CONFIG;

  // ---------------- Utilitas ----------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const exById = (id) => EXERCISES.find((e) => e.id === id);
  const progById = (id) => PROGRAMS.find((p) => p.id === id);
  const catById = (id) => CATEGORIES.find((c) => c.id === id);
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const HARI_PANJANG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  // ---------------- Penyimpanan ----------------
  const KEY = "lututkuat_v1";
  const DEFAULTS = {
    name: "",
    accepted: false,
    sessions: [],
    settings: { textSize: "besar", voice: true, count: true, beep: true, pace: "normal", rest: 15 },
  };
  let state = load();
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === "object")
        return { ...DEFAULTS, ...s, settings: { ...DEFAULTS.settings, ...(s.settings || {}) }, sessions: s.sessions || [] };
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
  }
  // ---------------- Lisensi ----------------
  const LIC = window.LK_LICENSE;
  const DAY = 86400000;
  const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");
  function ensureLicenseState() {
    let ch = false;
    const now = Date.now();
    if (!state.deviceId) (state.deviceId = LIC.newDeviceId()), (ch = true);
    if (state.accepted && !state.trialStart) (state.trialStart = now), (ch = true);
    if (!state.lastSeen || now > state.lastSeen) (state.lastSeen = now), (ch = true);
    if (ch) save();
  }
  let LICENSED = false;
  async function checkLicense() {
    try { LICENSED = !!(state.license && (await LIC.verifyLicense(state.deviceId, state.license, CFG.licensePublicKey))); } catch (e) { LICENSED = false; }
  }
  function lic() {
    if (LICENSED) return { active: true };
    const now = Date.now();
    const start = state.trialStart || now;
    // jam HP dimundurkan lebih dari 1 jam → anggap masa coba habis
    const tampered = state.lastSeen && now < state.lastSeen - 3600000;
    const left = tampered ? 0 : start + CFG.trialDays * DAY - now;
    return { active: false, trial: left > 0, left: Math.max(0, left) };
  }
  function leftText(ms) {
    const d = Math.floor(ms / DAY), h = Math.floor((ms % DAY) / 3600000);
    return d > 0 ? `${d} hari ${h} jam` : h > 0 ? `${h} jam` : `${Math.max(1, Math.ceil(ms / 60000))} menit`;
  }

  function applyTextSize() {
    document.documentElement.dataset.size = state.settings.textSize;
  }

  // ---------------- Suara ----------------
  // Hanya memakai suara Bahasa Indonesia. Jika perangkat tidak punya,
  // suara dimatikan (diganti bunyi bip) agar tidak terdengar logat Inggris.
  const isIndo = (v) => /^(id|in)([-_]|$)/i.test(v.lang) || /indonesia/i.test(v.name);
  const Voice = {
    v: null,
    count: 0,
    init() {
      if (!("speechSynthesis" in window)) return;
      const pick = () => {
        const vs = speechSynthesis.getVoices();
        this.count = vs.length;
        const indo = vs.filter(isIndo);
        // utamakan suara Google / online yang lebih natural
        this.v = indo.find((v) => /google|natural|online/i.test(v.name)) || indo[0] || null;
        const s = $("#voice-status");
        if (s) s.innerHTML = voiceStatusHTML();
      };
      this.pick = pick;
      pick();
      speechSynthesis.onvoiceschanged = pick;
    },
    // "id" = ada suara Indonesia, "none" = tidak ada, "unknown" = daftar suara belum terbaca
    status() {
      if (!("speechSynthesis" in window)) return "none";
      if (this.v) return "id";
      return this.count > 0 ? "none" : "unknown";
    },
    ok() {
      return this.status() !== "none";
    },
    say(text, force) {
      if (!this.count && this.pick) this.pick();
      if ((!state.settings.voice && !force) || !this.ok()) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "id-ID";
        if (this.v) u.voice = this.v;
        u.rate = 0.95;
        speechSynthesis.speak(u);
      } catch (e) {}
    },
    stop() {
      try {
        speechSynthesis.cancel();
      } catch (e) {}
    },
  };

  let audioCtx = null;
  function beep(freq = 880, dur = 0.12, vol = 0.15) {
    if (!state.settings.beep) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = freq;
      o.type = "sine";
      g.gain.setValueAtTime(vol, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur + 0.02);
    } catch (e) {}
  }

  // ---------------- Wake lock ----------------
  let wakeLock = null, wantWake = false;
  async function keepAwake(on) {
    wantWake = on;
    try {
      if (on && "wakeLock" in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => (wakeLock = null));
      } else if (!on && wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    } catch (e) {}
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && wantWake) keepAwake(true);
  });

  // ---------------- Perhitungan ----------------
  function doseText(ex) {
    if (ex.mode === "time") return `${ex.time} detik${ex.sides ? " tiap kaki" : ""}`;
    if (ex.repLabel) return `${ex.reps}${ex.repLabel}`;
    return `${ex.reps}x${ex.sides ? " tiap kaki" : ""}`;
  }
  function doseSpoken(ex) {
    if (ex.mode === "time") return `tahan ${ex.time} detik${ex.sides ? ", tiap kaki" : ""}`;
    return `${ex.reps} kali${ex.sides || ex.repLabel ? ", tiap kaki" : ""}`;
  }

  function buildTimeline(program) {
    const segs = [];
    const pace = state.settings.pace === "lambat" ? 1.35 : 1;
    program.items.forEach((id, i) => {
      const ex = exById(id);
      const sides = ex.sides ? ["kanan", "kiri"] : [null];
      sides.forEach((side, si) => {
        segs.push({ type: "prep", ex, side, idx: i, first: si === 0, dur: si === 0 ? 7 : 5 });
        if (ex.mode === "reps") {
          const up = ex.up * pace, hold = ex.hold * pace, down = ex.down * pace, gap = 0.6;
          const rep = up + hold + down + gap;
          segs.push({ type: "work", ex, side, idx: i, dur: rep * ex.reps, rep, up, hold, down, reps: ex.reps });
        } else {
          segs.push({ type: "work", ex, side, idx: i, dur: ex.up + ex.time + ex.down, up: ex.up, hold: ex.time, down: ex.down, reps: 1 });
        }
      });
      if (i < program.items.length - 1)
        segs.push({ type: "rest", ex: exById(program.items[i + 1]), idx: i + 1, dur: state.settings.rest });
    });
    return segs;
  }
  const programMinutes = (p) => Math.max(1, Math.round(buildTimeline(p).reduce((a, s) => a + s.dur, 0) / 60));

  function doneDays() {
    return new Set(state.sessions.filter((s) => s.completed).map((s) => s.day));
  }
  function streak() {
    const days = doneDays();
    const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(dayKey(d))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }
  function weekDates() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }
  function greeting() {
    const h = new Date().getHours();
    return h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
  }

  const PROP_LABEL = {
    chair: "Kursi kokoh tanpa roda",
    support: "Kursi bersandaran untuk berpegangan",
    mat: "Kasur atau matras",
  };
  const PAIN = [
    { v: 0, e: "😊", t: "Nyaman" },
    { v: 1, e: "🙂", t: "Sedikit pegal" },
    { v: 2, e: "😐", t: "Agak nyeri" },
    { v: 3, e: "😣", t: "Nyeri" },
  ];

  // ---------------- Router ----------------
  const view = $("#view");
  const nav = $("#nav");
  let figures = [];
  let cleanup = null;

  function clearView() {
    figures.forEach((f) => f.destroy());
    figures = [];
    if (cleanup) cleanup();
    cleanup = null;
    Voice.stop();
  }
  function addFigure(container, ex, opts = {}) {
    const f = new Figure(container, opts);
    f.setExercise(ex, opts.mirror);
    figures.push(f);
    return f;
  }

  function route() {
    clearView();
    lockedView = false;
    const hash = location.hash.replace(/^#\/?/, "");
    const [page, arg] = hash.split("/");
    window.scrollTo(0, 0);
    // Wajib setuju peringatan & mengisi nama sebelum memakai aplikasi
    if (!state.accepted || !hasName()) return renderOnboarding();
    ensureLicenseState();
    const L = lic();
    // Masa coba habis & belum aktif → aplikasi terkunci total, hanya halaman pembayaran
    if (!L.active && !L.trial) {
      document.body.classList.remove("in-player");
      return renderPayment(true);
    }
    if (page === "bayar") {
      $$("a", nav).forEach((a) => a.classList.remove("active"));
      document.body.classList.remove("in-player");
      return renderPayment(false);
    }
    const tab = page === "gerakan" ? "gerakan" : page === "riwayat" ? "riwayat" : page === "pengaturan" ? "pengaturan" : "beranda";
    $$("a", nav).forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
    document.body.classList.toggle("in-player", page === "latihan");
    if (page === "program" && progById(arg)) return renderProgram(progById(arg));
    if (page === "latihan" && progById(arg)) return renderPlayer(progById(arg));
    if (page === "gerakan" && arg && exById(arg)) return renderExercise(exById(arg));
    if (page === "gerakan") return renderLibrary();
    if (page === "riwayat") return renderHistory();
    if (page === "pengaturan") return renderSettings();
    renderHome();
  }
  window.addEventListener("hashchange", route);

  const hasName = () => String(state.name || "").trim().length >= 2;
  let lockedView = false;

  // Detak tiap detik: perbarui hitung mundur & kunci aplikasi tepat saat masa coba habis
  function splitTime(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
  }
  setInterval(() => {
    if (!state.accepted || !hasName()) return;
    const L = lic();
    if (!L.active && !L.trial) {
      if (!lockedView) route();
      return;
    }
    const box = $("#countdown");
    if (box && !L.active) {
      const t = splitTime(L.left);
      box.querySelector("[data-d]").textContent = t.d;
      box.querySelector("[data-h]").textContent = pad(t.h);
      box.querySelector("[data-m]").textContent = pad(t.m);
      box.querySelector("[data-s]").textContent = pad(t.s);
      box.classList.toggle("urgent", L.left < DAY);
    }
  }, 1000);

  const back = (fallback) =>
    `<button class="back" data-back="${fallback}" aria-label="Kembali">‹ Kembali</button>`;
  view.addEventListener("click", (e) => {
    const b = e.target.closest("[data-back]");
    if (b) location.hash = b.dataset.back;
  });

  // ---------------- Onboarding ----------------
  function renderOnboarding() {
    nav.hidden = true;
    view.innerHTML = `
      <section class="onboard">
        <div class="onboard-photo">
          <img src="img/pembuka.jpg" alt="Kakek dan nenek tersenyum bahagia">
          <div class="logo-badge">🦵</div>
        </div>
        <h1>${esc(CFG.appName)}</h1>
        <p class="lead">${esc(CFG.tagline)}. Ikuti gerakan dengan panduan gambar, suara, dan hitungan.</p>
        <label class="field">
          <span>Siapa nama panggilan Anda?</span>
          <input id="ob-name" type="text" maxlength="30" placeholder="Contoh: Bu Sari" autocomplete="given-name" value="${esc(state.name || "")}" required>
          <small class="hint" id="ob-hint">Wajib diisi agar aplikasi bisa dipakai.</small>
        </label>
        <div class="card warn">
          <h3>⚠️ Penting dibaca</h3>
          <ul>
            <li>Aplikasi ini berisi latihan ringan, <b>bukan pengganti</b> pemeriksaan dokter atau fisioterapis.</li>
            <li>Konsultasikan dulu ke dokter bila Anda baru operasi, cedera, atau lutut bengkak dan panas.</li>
            <li>Hentikan latihan bila muncul nyeri tajam, pusing, atau sesak napas.</li>
            <li>Untuk lansia, sebaiknya latihan didampingi keluarga pada awalnya.</li>
          </ul>
        </div>
        <label class="check">
          <input id="ob-agree" type="checkbox" ${state.accepted ? "checked" : ""}>
          <span>Saya sudah membaca dan memahami</span>
        </label>
        <button id="ob-start" class="btn primary block" disabled>Mulai</button>
        <p class="muted small center" id="ob-why"></p>
      </section>`;
    const agree = $("#ob-agree"), start = $("#ob-start"), nameIn = $("#ob-name");
    const check = () => {
      const okName = nameIn.value.trim().length >= 2;
      start.disabled = !(agree.checked && okName);
      $("#ob-hint").classList.toggle("bad", nameIn.value.length > 0 && !okName);
      $("#ob-why").textContent = !okName ? "Isi nama panggilan dulu (minimal 2 huruf)." : !agree.checked ? "Centang kotak persetujuan untuk melanjutkan." : "";
    };
    agree.addEventListener("change", check);
    nameIn.addEventListener("input", check);
    check();
    start.addEventListener("click", () => {
      if (nameIn.value.trim().length < 2 || !agree.checked) return check();
      state.name = nameIn.value.trim();
      state.accepted = true;
      state.trialStart = state.trialStart || Date.now();
      save();
      nav.hidden = false;
      location.hash = "#/";
      route();
    });
  }

  // ---------------- Beranda ----------------
  let installEvt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installEvt = e;
    const c = $("#install-card");
    if (c) c.hidden = false;
  });

  function programCard(p, big) {
    return `
      <a class="prog ${big ? "prog-big" : ""}" href="#/program/${p.id}">
        <div class="prog-img"><img src="img/${p.id}.jpg" alt="" loading="lazy"></div>
        <div class="prog-body">
          <div class="prog-name">${esc(p.name)}</div>
          <div class="prog-meta">⏱ ${programMinutes(p)} menit · ${esc(p.level)} · ${esc(p.pos)}</div>
          ${big ? `<div class="prog-desc">${esc(p.desc)}</div>` : ""}
        </div>
        <div class="chev">›</div>
      </a>`;
  }

  function renderHome() {
    nav.hidden = false;
    const today = new Date();
    const rec = progById(DAILY[today.getDay()]);
    const days = doneDays();
    const s = streak();
    const weekCount = weekDates().filter((d) => days.has(dayKey(d))).length;
    const doneToday = days.has(dayKey(today));
    const name = state.name ? `, ${esc(state.name)}` : "";
    view.innerHTML = `
      <header class="hello-photo">
        <img src="img/beranda.jpg" alt="Kakek dan nenek bergandengan tangan">
        <div class="hello-text">
          <p>${HARI_PANJANG[today.getDay()]}, ${today.getDate()} ${BULAN[today.getMonth()]}</p>
          <h1>${greeting()}${name} 👋</h1>
          <p>Yuk jaga lutut tetap kuat hari ini.</p>
        </div>
      </header>

      <div class="card streak">
        <div class="streak-top">
          <div><div class="big-num">🔥 ${s}</div><div class="muted">hari berturut-turut</div></div>
          <div><div class="big-num">✅ ${weekCount}/7</div><div class="muted">hari minggu ini</div></div>
        </div>
        <div class="week">
          ${weekDates()
            .map((d) => {
              const k = dayKey(d), done = days.has(k), isToday = k === dayKey(today);
              return `<div class="day ${done ? "done" : ""} ${isToday ? "today" : ""}"><span>${HARI[d.getDay()]}</span><b>${done ? "✓" : d.getDate()}</b></div>`;
            })
            .join("")}
        </div>
      </div>

      ${(() => {
        const L = lic();
        if (L.active) return "";
        const t = splitTime(L.left);
        return `<a class="card trial ${L.left < DAY ? "urgent" : ""}" id="countdown" href="#/bayar">
          <div class="trial-head">🎁 <b>Masa coba gratis berakhir dalam</b></div>
          <div class="cd">
            <div><b data-d>${t.d}</b><span>Hari</span></div>
            <div><b data-h>${pad(t.h)}</b><span>Jam</span></div>
            <div><b data-m>${pad(t.m)}</b><span>Menit</span></div>
            <div><b data-s>${pad(t.s)}</b><span>Detik</span></div>
          </div>
          <div class="trial-cta">Aktifkan selamanya hanya <b>${rupiah(CFG.price)}</b> ›</div>
        </a>`;
      })()}

      <h2 class="sec">${doneToday ? "Hari ini sudah latihan 🎉 Mau tambah?" : "Rekomendasi hari ini"}</h2>
      ${programCard(rec, true)}
      <a class="btn primary block start-today" href="#/latihan/${rec.id}">▶ Mulai Sekarang</a>

      <div id="install-card" class="card install" ${installEvt ? "" : "hidden"}>
        <div><b>Pasang di layar utama</b><p class="muted">Buka lebih cepat, seperti aplikasi biasa.</p></div>
        <button class="btn" id="btn-install">Pasang</button>
      </div>

      <h2 class="sec">Semua program</h2>
      <div class="list">${PROGRAMS.map((p) => programCard(p)).join("")}</div>

      <div class="card tip">
        <b>💡 Ingat:</b> sedikit pegal itu wajar. Bila nyeri tajam, berhenti dan istirahat.
      </div>`;
    const bi = $("#btn-install");
    if (bi)
      bi.addEventListener("click", async () => {
        if (!installEvt) return;
        installEvt.prompt();
        await installEvt.userChoice;
        installEvt = null;
        $("#install-card").hidden = true;
      });
  }

  // ---------------- Detail Program ----------------
  function renderProgram(p) {
    nav.hidden = false;
    const exs = p.items.map(exById);
    const props = [...new Set(exs.flatMap((e) => e.props))];
    view.innerHTML = `
      ${back("#/")}
      <section class="hero">
        <div class="hero-photo"><img src="img/${p.id}.jpg" alt=""></div>
        <h1>${esc(p.name)}</h1>
        <div class="chips">
          <span class="chip">⏱ ${programMinutes(p)} menit</span>
          <span class="chip">📶 ${esc(p.level)}</span>
          <span class="chip">🧘 ${exs.length} gerakan</span>
        </div>
        <p>${esc(p.desc)}</p>
      </section>
      <div class="card">
        <h3>Yang perlu disiapkan</h3>
        <ul class="plain">${props.map((x) => `<li>✔️ ${PROP_LABEL[x]}</li>`).join("")}<li>✔️ Pakaian longgar & air minum</li></ul>
      </div>
      <h2 class="sec">Urutan gerakan</h2>
      <div class="list">
        ${exs
          .map(
            (e, i) => `
          <a class="ex-row" href="#/gerakan/${e.id}">
            <div class="ex-thumb" data-ex="${e.id}"></div>
            <div class="ex-info"><div class="ex-name">${i + 1}. ${esc(e.name)}</div><div class="muted">${doseText(e)}</div></div>
            <div class="chev">›</div>
          </a>`
          )
          .join("")}
      </div>
      <div class="sticky-cta"><a class="btn primary block" href="#/latihan/${p.id}">▶ Mulai Latihan</a></div>`;
    $$(".ex-thumb", view).forEach((c) => addFigure(c, exById(c.dataset.ex), { small: true }).setProgress(1));
  }

  // ---------------- Pustaka Gerakan ----------------
  function renderLibrary() {
    nav.hidden = false;
    view.innerHTML = `
      <h1 class="page-title">Daftar Gerakan</h1>
      <p class="muted">Ketuk gerakan untuk melihat contoh dan cara melakukannya.</p>
      ${CATEGORIES.map((c) => {
        const exs = EXERCISES.filter((e) => e.cat === c.id);
        return `
        <h2 class="sec">${c.icon} ${esc(c.name)}</h2>
        <p class="muted small">${esc(c.desc)}</p>
        <div class="grid">
          ${exs
            .map(
              (e) => `
            <a class="ex-card" href="#/gerakan/${e.id}">
              <div class="ex-thumb" data-ex="${e.id}"></div>
              <div class="ex-name">${esc(e.name)}</div>
              <div class="muted small">${doseText(e)}</div>
            </a>`
            )
            .join("")}
        </div>`;
      }).join("")}`;
    $$(".ex-thumb", view).forEach((c) => addFigure(c, exById(c.dataset.ex), { small: true }).setProgress(1));
  }

  // ---------------- Detail Gerakan ----------------
  function renderExercise(ex) {
    nav.hidden = false;
    const cat = catById(ex.cat);
    view.innerHTML = `
      ${back("#/gerakan")}
      <div class="fig-stage" id="ex-fig"></div>
      <h1 class="page-title">${esc(ex.name)}</h1>
      <div class="chips">
        <span class="chip">${cat.icon} ${esc(cat.name)}</span>
        <span class="chip">🔁 ${doseText(ex)}</span>
        <span class="chip">📍 ${esc(ex.pos)}</span>
      </div>
      <div class="card">
        <h3>🎯 Melatih: ${esc(ex.target)}</h3>
        <p>${esc(ex.benefit)}</p>
      </div>
      <div class="card">
        <h3>Cara melakukan</h3>
        <ol class="steps">${ex.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
        <button class="btn block" id="btn-listen">🔊 Dengarkan panduan</button>
      </div>
      ${ex.tips && ex.tips.length ? `<div class="card tip"><h3>💡 Tips</h3><ul>${ex.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
      ${ex.caution ? `<div class="card warn"><b>⚠️ Perhatian:</b> ${esc(ex.caution)}</div>` : ""}`;
    addFigure($("#ex-fig"), ex).loop();
    $("#btn-listen").addEventListener("click", () =>
      Voice.say(`${ex.name}. ${ex.steps.map((s, i) => `Langkah ${i + 1}. ${s}`).join(" ")}`, true)
    );
  }

  // ---------------- Riwayat ----------------
  function renderHistory() {
    nav.hidden = false;
    const done = state.sessions.filter((s) => s.completed);
    const totalMin = Math.round(state.sessions.reduce((a, s) => a + (s.seconds || 0), 0) / 60);
    const days = doneDays();
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    let cal = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => `<div class="cal-h">${d}</div>`).join("");
    for (let i = 0; i < offset; i++) cal += `<div></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const k = dayKey(new Date(now.getFullYear(), now.getMonth(), d));
      cal += `<div class="cal-d ${days.has(k) ? "done" : ""} ${d === now.getDate() ? "today" : ""}">${d}</div>`;
    }
    const recent = [...state.sessions].reverse().slice(0, 15);
    view.innerHTML = `
      <h1 class="page-title">Riwayat Latihan</h1>
      <div class="stats">
        <div class="stat"><b>${streak()}</b><span>hari beruntun</span></div>
        <div class="stat"><b>${done.length}</b><span>sesi selesai</span></div>
        <div class="stat"><b>${totalMin}</b><span>menit total</span></div>
      </div>
      <div class="card">
        <h3>${BULAN[now.getMonth()]} ${now.getFullYear()}</h3>
        <div class="cal">${cal}</div>
      </div>
      <h2 class="sec">Catatan terakhir</h2>
      ${
        recent.length
          ? `<div class="list">${recent
              .map((s) => {
                const d = new Date(s.date);
                const pain = PAIN.find((p) => p.v === s.pain);
                return `<div class="hist">
                  <div class="hist-emoji">${pain ? pain.e : s.completed ? "✅" : "⏸"}</div>
                  <div><b>${esc(s.title)}</b>
                  <div class="muted small">${HARI_PANJANG[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} · ${pad(d.getHours())}.${pad(d.getMinutes())} · ${Math.max(1, Math.round(s.seconds / 60))} mnt${s.completed ? "" : " · tidak selesai"}${pain ? " · " + pain.t : ""}</div></div>
                </div>`;
              })
              .join("")}</div>`
          : `<div class="card empty">Belum ada latihan. Yuk mulai dari <a href="#/">Beranda</a>! 💪</div>`
      }`;
  }

  // ---------------- Pengaturan ----------------
  function seg(name, options, current) {
    return `<div class="seg" data-name="${name}">${options
      .map(([v, l]) => `<button data-v="${v}" class="${String(current) === String(v) ? "on" : ""}">${l}</button>`)
      .join("")}</div>`;
  }
  function toggle(name, label) {
    return `<label class="toggle"><span>${label}</span><input type="checkbox" data-t="${name}" ${state.settings[name] ? "checked" : ""}><i></i></label>`;
  }
  function voiceStatusHTML() {
    const st = Voice.status();
    if (st === "id") return `<p class="ok small">✅ Suara Bahasa Indonesia aktif (${esc(Voice.v.name)})</p>`;
    if (st === "unknown") return `<p class="muted small">Suara akan memakai Bahasa Indonesia bila tersedia di perangkat.</p>`;
    return `<div class="voice-warn small">
      <b>⚠️ Perangkat ini belum punya suara Bahasa Indonesia.</b> Sementara panduan memakai bunyi bip.
      Cara menambahkan:
      <ul>
        <li><b>Android:</b> Setelan › Aksesibilitas/Bahasa › Output teks-ke-ucapan › pilih <i>Google</i> › instal data suara <i>Bahasa Indonesia</i>.</li>
        <li><b>iPhone:</b> Pengaturan › Aksesibilitas › Konten Lisan › Suara › tambahkan <i>Bahasa Indonesia</i>.</li>
        <li><b>Windows:</b> Settings › Time &amp; language › Speech › Add voices › <i>Bahasa Indonesia</i>. Atau buka aplikasi di Google Chrome.</li>
      </ul>
      Setelah itu buka ulang aplikasi.</div>`;
  }

  function renderSettings() {
    nav.hidden = false;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    view.innerHTML = `
      <h1 class="page-title">Pengaturan</h1>
      ${(() => {
        const L = lic();
        return `<div class="card">
          <h3>Status aplikasi</h3>
          ${
            L.active
              ? `<p class="ok">✅ Aktif selamanya. Terima kasih sudah membeli!</p>`
              : L.trial
              ? `<p>🎁 Masa coba gratis, sisa <b>${leftText(L.left)}</b>.</p>`
              : `<p class="danger-text">⛔ Masa coba sudah habis.</p>`
          }
          <p class="muted small">Kode perangkat: <b class="mono">${esc(state.deviceId)}</b></p>
          ${L.active ? "" : `<a class="btn primary block" href="#/bayar">Aktifkan (${rupiah(CFG.price)})</a>`}
        </div>`;
      })()}
      <div class="card">
        <label class="field"><span>Nama panggilan</span><input id="set-name" type="text" maxlength="30" value="${esc(state.name)}"></label>
      </div>
      <div class="card">
        <h3>Ukuran tulisan</h3>
        ${seg("textSize", [["normal", "Normal"], ["besar", "Besar"], ["sangat", "Sangat besar"]], state.settings.textSize)}
      </div>
      <div class="card">
        <h3>Suara</h3>
        ${toggle("voice", "Panduan suara")}
        ${toggle("count", "Hitungan dengan suara")}
        ${toggle("beep", "Bunyi tanda (bip)")}
        <div id="voice-status">${voiceStatusHTML()}</div>
        <button class="btn block" id="test-voice">🔊 Coba suara</button>
      </div>
      <div class="card">
        <h3>Kecepatan gerakan</h3>
        ${seg("pace", [["lambat", "🐢 Lambat"], ["normal", "Normal"]], state.settings.pace)}
        <h3 style="margin-top:1rem">Istirahat antar gerakan</h3>
        ${seg("rest", [[10, "10 dtk"], [15, "15 dtk"], [30, "30 dtk"], [45, "45 dtk"]], state.settings.rest)}
      </div>
      ${isIOS ? `<div class="card tip"><b>📲 Pasang di iPhone:</b> buka di Safari, ketuk tombol Bagikan, lalu pilih <i>Tambahkan ke Layar Utama</i>.</div>` : ""}
      <div class="card">
        <h3>Tentang</h3>
        <p><b>${esc(CFG.appName)}</b> v${esc(CFG.version)} · ${esc(CFG.author)}</p>
        <p class="muted small">Aplikasi ini berisi latihan umum untuk menjaga kekuatan dan kelenturan lutut. Informasi di dalamnya bukan diagnosis atau pengganti saran tenaga kesehatan. Hentikan latihan bila timbul nyeri tajam, bengkak, pusing, atau sesak napas, dan segera konsultasikan ke dokter.</p>
        ${CFG.whatsapp ? `<a class="btn block" target="_blank" rel="noopener" href="https://wa.me/${encodeURIComponent(CFG.whatsapp)}">💬 Hubungi kami</a>` : ""}
      </div>
      <button class="btn danger block" id="reset">Hapus semua data</button>`;

    $("#set-name").addEventListener("change", (e) => {
      const v = e.target.value.trim();
      if (v.length < 2) {
        alert("Nama panggilan wajib diisi (minimal 2 huruf).");
        e.target.value = state.name;
        return;
      }
      state.name = v;
      save();
    });
    $$(".seg", view).forEach((s) =>
      s.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const name = s.dataset.name;
        state.settings[name] = name === "rest" ? Number(b.dataset.v) : b.dataset.v;
        save();
        $$("button", s).forEach((x) => x.classList.toggle("on", x === b));
        if (name === "textSize") applyTextSize();
      })
    );
    $$("[data-t]", view).forEach((t) =>
      t.addEventListener("change", () => {
        state.settings[t.dataset.t] = t.checked;
        save();
      })
    );
    $("#test-voice").addEventListener("click", () => {
      beep();
      if (!Voice.ok()) return alert("Suara Bahasa Indonesia belum tersedia di perangkat ini. Lihat cara menambahkannya di atas.");
      Voice.say(`Halo${state.name ? " " + state.name : ""}. Ini contoh panduan suara. Satu, dua, tiga.`, true);
    });
    $("#reset").addEventListener("click", () => {
      if (!confirm("Hapus semua riwayat dan pengaturan? Tindakan ini tidak bisa dibatalkan.")) return;
      // status lisensi & masa coba tetap disimpan
      const keep = { deviceId: state.deviceId, trialStart: state.trialStart, lastSeen: state.lastSeen, license: state.license, accepted: state.accepted, buyer: state.buyer, order: state.order };
      state = Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), keep);
      save();
      applyTextSize();
      location.hash = "#/";
      route();
    });
  }

  // ---------------- Pembayaran & Aktivasi ----------------
  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand("copy");
      } catch (e2) {}
      t.remove();
    }
    if (btn) {
      const old = btn.textContent;
      btn.textContent = "✓ Tersalin";
      setTimeout(() => (btn.textContent = old), 1500);
    }
  }

  // ---------- API server pembayaran ----------
  const API = (CFG.apiBase || "") + "/api";
  async function apiCall(path, opts = {}) {
    let r;
    try {
      r = await fetch(API + path, { ...opts, headers: { "Content-Type": "application/json" }, cache: "no-store" });
    } catch (e) {
      throw new Error("Tidak bisa terhubung. Periksa koneksi internet Anda, lalu coba lagi.");
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Server sedang sibuk. Coba lagi sebentar.");
    return j;
  }
  async function activateWith(license) {
    const ok = await LIC.verifyLicense(state.deviceId, license, CFG.licensePublicKey);
    if (!ok) return false;
    state.license = license.trim();
    LICENSED = true;
    save();
    return true;
  }
  // cek status pesanan yang menunggu (dipanggil saat buka aplikasi & di halaman bayar)
  async function refreshOrder() {
    if (!state.order || !state.order.id) return null;
    const o = await apiCall(`/orders/${state.order.id}?device=${encodeURIComponent(state.deviceId)}`);
    state.order = { id: o.id, status: o.status, note: o.note || "" };
    save();
    if (o.status === "aktif" && o.license) await activateWith(o.license);
    return o;
  }
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1400, sc = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        let q = 0.82, d = c.toDataURL("image/jpeg", q);
        while (d.length > 2.6e6 && q > 0.4) { q -= 0.12; d = c.toDataURL("image/jpeg", q); }
        resolve(d);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Foto tidak bisa dibaca. Coba pilih foto lain (format JPG/PNG).")); };
      img.src = url;
    });
  }
  let payPoll = null;

  function renderPayment(locked) {
    lockedView = locked;
    nav.hidden = locked;
    clearInterval(payPoll);
    const pay = CFG.payment;
    const L = lic();
    if (L.active) {
      view.innerHTML = `
        ${locked ? "" : back("#/")}
        <section class="pay-done">
          <div class="big-check">✅</div>
          <h1>Aplikasi sudah aktif</h1>
          <p>Terima kasih${state.buyer && state.buyer.name ? ", " + esc(state.buyer.name) : ""}! ${esc(CFG.appName)} bisa dipakai selamanya di perangkat ini.</p>
          <a class="btn primary block" href="#/">Ke Beranda</a>
        </section>`;
      return;
    }
    const buyer = state.buyer || { name: state.name || "", phone: "" };
    const order = state.order || null;
    const stage = !order ? "data" : order.status; // data | baru | menunggu | ditolak
    const methods = [{ id: "QRIS", label: "QRIS", sub: "GoPay, OVO, DANA, ShopeePay, m-banking" }, ...pay.banks.map((b) => ({ id: b.bank, label: "Transfer " + b.bank, sub: b.number }))];
    const method = methods.find((m) => m.id === state.payMethod) || null;
    const waAdmin = (txt) => CFG.whatsapp ? `https://wa.me/${encodeURIComponent(CFG.whatsapp)}?text=${encodeURIComponent(txt)}` : "";

    const hero = `
      ${locked ? "" : back("#/")}
      <section class="pay-hero">
        <img src="img/beranda.jpg" alt="">
        <div class="pay-hero-text">
          ${locked ? `<p class="pill-lock">⛔ Masa coba ${CFG.trialDays} hari sudah habis</p>` : `<p class="pill-lock trial">🎁 Masa coba: sisa ${leftText(L.left)}</p>`}
          <h1>Aktifkan ${esc(CFG.appName)}</h1>
          <p>Lanjutkan latihan lutut setiap hari, tanpa batas.</p>
        </div>
      </section>
      <div class="card price-card">
        <div class="price">${rupiah(CFG.price)}</div>
        <div class="muted">sekali bayar · berlaku selamanya</div>
      </div>
      <ol class="pay-steps">
        <li class="${stage === "data" ? "now" : "done"}">Data diri</li>
        <li class="${stage === "baru" || stage === "ditolak" ? "now" : stage === "menunggu" ? "done" : ""}">Bayar & kirim bukti</li>
        <li class="${stage === "menunggu" ? "now" : ""}">Diaktifkan admin</li>
      </ol>`;

    let body = "";
    if (stage === "data") {
      body = `
        <h2 class="sec"><span class="step-no">1</span> Isi data diri</h2>
        <div class="card">
          <label class="field"><span>Nama lengkap</span>
            <input id="b-name" type="text" maxlength="60" autocomplete="name" value="${esc(buyer.name)}" placeholder="Contoh: Sri Wahyuni"></label>
          <label class="field"><span>Nomor HP / WhatsApp</span>
            <input id="b-phone" type="tel" inputmode="tel" maxlength="16" autocomplete="tel" value="${esc(buyer.phone)}" placeholder="Contoh: 0812 3456 7890"></label>
          <p class="muted small">Nomor ini dipakai admin untuk mengabari Anda setelah pembayaran dicek.</p>
          <button class="btn primary block" id="b-next">Lanjut ke pembayaran ›</button>
          <div id="b-msg" role="status"></div>
        </div>`;
    } else if (stage === "menunggu") {
      body = `
        <div class="card wait-card">
          <div class="wait-icon">⏳</div>
          <h2>Bukti pembayaran sedang dicek</h2>
          <p>Terima kasih, <b>${esc(buyer.name)}</b>! Admin akan memeriksa pembayaran Anda. Aplikasi akan <b>aktif otomatis</b> setelah disetujui. Anda boleh menutup halaman ini.</p>
          <p class="muted small">No. pesanan: <b class="mono">${esc(order.id)}</b> · HP: ${esc(buyer.phone)}</p>
          <button class="btn primary block" id="o-refresh">🔄 Cek status sekarang</button>
          ${CFG.whatsapp ? `<a class="btn wa block" target="_blank" rel="noopener" href="${waAdmin(`Halo admin, saya ${buyer.name} sudah mengirim bukti pembayaran ${CFG.appName}. No. pesanan: ${order.id}`)}">💬 Tanya admin via WhatsApp</a>` : ""}
          <div id="o-msg" role="status"></div>
        </div>`;
    } else {
      body = `
        ${stage === "ditolak" ? `<div class="card warn"><b>❌ Pembayaran belum bisa disetujui.</b><p>${esc(order.note || "Bukti pembayaran belum sesuai.")}</p><p class="small">Silakan periksa lalu kirim ulang bukti pembayaran di bawah.</p></div>` : ""}
        <div class="card buyer-card">
          <div><span class="muted small">Atas nama</span><br><b>${esc(buyer.name)}</b> · ${esc(buyer.phone)}</div>
          <button class="link-btn" id="b-edit">Ubah</button>
        </div>
        <h2 class="sec"><span class="step-no">2</span> Pilih metode pembayaran</h2>
        <div class="methods">
          ${methods.map((m) => `<button class="method ${method && method.id === m.id ? "on" : ""}" data-m="${esc(m.id)}"><b>${esc(m.label)}</b><span>${esc(m.sub)}</span></button>`).join("")}
        </div>
        ${method ? (method.id === "QRIS" ? `
          <div class="card">
            <h3>Scan QRIS</h3>
            <button class="qris-box" id="qris-zoom" aria-label="Perbesar QRIS"><img src="${esc(pay.qris)}" alt="Kode QRIS pembayaran"></button>
            <p class="center small">a.n. <b>${esc(pay.accountName)}</b> · Nominal <b>${rupiah(CFG.price)}</b></p>
            <a class="btn block" href="${esc(pay.qris)}" download="QRIS-${esc(CFG.appName.replace(/\s+/g, "-"))}.png">⬇️ Simpan gambar QRIS</a>
            <p class="muted small center">Membuka dari HP yang sama? Simpan gambarnya, lalu pilih “Upload QR / dari galeri” di aplikasi pembayaran.</p>
          </div>` : `
          <div class="card">
            <h3>Transfer ${esc(method.id)}</h3>
            <div class="bank">
              <div><div class="bank-name">No. rekening</div><div class="bank-no mono">${esc(method.sub)}</div></div>
              <button class="btn small-btn" data-copy="${esc(method.sub)}">Salin</button>
            </div>
            <p class="small">Atas nama: <b>${esc(pay.accountName)}</b></p>
            <p class="small">Nominal: <b>${rupiah(CFG.price)}</b> <button class="link-btn" data-copy="${CFG.price}">salin</button></p>
          </div>`) + `
        <h2 class="sec"><span class="step-no">3</span> Kirim bukti pembayaran</h2>
        <div class="card">
          <p class="small">Foto atau screenshot bukti transfer yang menampilkan <b>nominal</b> dan <b>tanggal</b>.</p>
          <label class="upload" for="p-file">
            <input id="p-file" type="file" accept="image/*">
            <img id="p-prev" alt="" hidden>
            <span id="p-hint">📷 Pilih foto bukti pembayaran</span>
          </label>
          <button class="btn primary block" id="p-send" disabled>Kirim bukti pembayaran</button>
          <div id="p-msg" role="status"></div>
        </div>` : `<p class="muted small center">Pilih salah satu metode di atas.</p>`}`;
    }

    view.innerHTML = hero + body + `
      <details class="card manual">
        <summary>Sudah punya kode aktivasi dari admin?</summary>
        <textarea id="act-code" class="mono" rows="3" placeholder="Tempel kode aktivasi di sini"></textarea>
        <button class="btn block" id="act-btn">Aktifkan dengan kode</button>
        <div id="act-msg" role="status"></div>
        <p class="muted small">Kode perangkat Anda: <b class="mono">${esc(state.deviceId)}</b></p>
      </details>
      <div id="qris-modal" class="modal" hidden>
        <div class="modal-inner"><img src="${esc(pay.qris)}" alt="Kode QRIS pembayaran"><p class="center">Ketuk di mana saja untuk menutup</p></div>
      </div>`;

    const rerender = () => renderPayment(lockedView);
    const busy = (btn, on, label) => { btn.disabled = on; if (label) btn.textContent = label; };
    const showErr = (id, e) => ($(id).innerHTML = `<p class="danger-text">${esc(e.message || e)}</p>`);
    const celebrate = () => { beep(1046, 0.15); setTimeout(() => beep(1318, 0.25), 180); location.hash = "#/bayar"; route(); };

    $$("[data-copy]", view).forEach((b) => b.addEventListener("click", () => copyText(b.dataset.copy, b)));
    const modal = $("#qris-modal");
    if ($("#qris-zoom")) $("#qris-zoom").addEventListener("click", () => (modal.hidden = false));
    modal.addEventListener("click", () => (modal.hidden = true));

    if (stage === "data") {
      $("#b-next").addEventListener("click", async (e) => {
        const name = $("#b-name").value.trim(), phone = $("#b-phone").value.trim();
        if (name.length < 2) return showErr("#b-msg", "Nama lengkap wajib diisi.");
        if (phone.replace(/\D/g, "").length < 9) return showErr("#b-msg", "Nomor HP wajib diisi dengan benar.");
        busy(e.target, true, "Menyimpan…");
        try {
          const o = await apiCall("/orders", { method: "POST", body: JSON.stringify({ name, phone, deviceId: state.deviceId }) });
          state.buyer = { name, phone };
          state.order = { id: o.id, status: o.status, note: o.note || "" };
          save();
          if (o.status === "aktif" && o.license && (await activateWith(o.license))) return celebrate();
          rerender();
          window.scrollTo(0, 0);
        } catch (err) { busy(e.target, false, "Lanjut ke pembayaran ›"); showErr("#b-msg", err); }
      });
    }
    if ($("#b-edit")) $("#b-edit").addEventListener("click", () => { state.order = null; save(); rerender(); });
    $$("[data-m]", view).forEach((b) => b.addEventListener("click", () => { state.payMethod = b.dataset.m; save(); rerender(); }));

    if ($("#p-file")) {
      let dataUrl = null;
      $("#p-file").addEventListener("change", async (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        $("#p-msg").innerHTML = "";
        try {
          dataUrl = await compressImage(f);
          const pv = $("#p-prev"); pv.src = dataUrl; pv.hidden = false;
          $("#p-hint").textContent = "Ganti foto";
          $("#p-send").disabled = false;
        } catch (err) { showErr("#p-msg", err); }
      });
      $("#p-send").addEventListener("click", async (e) => {
        if (!dataUrl) return;
        busy(e.target, true, "Mengirim…");
        try {
          const o = await apiCall(`/orders/${state.order.id}/proof`, { method: "POST", body: JSON.stringify({ deviceId: state.deviceId, method: state.payMethod, image: dataUrl }) });
          state.order = { id: o.id, status: o.status, note: "" };
          save();
          rerender();
          window.scrollTo(0, 0);
        } catch (err) { busy(e.target, false, "Kirim bukti pembayaran"); showErr("#p-msg", err); }
      });
    }

    if (stage === "menunggu" || stage === "ditolak" || stage === "baru") {
      const check = async (manual) => {
        try {
          const before = state.order.status;
          await refreshOrder();
          if (LICENSED) return celebrate();
          if (state.order.status !== before) return rerender();
          if (manual) $("#o-msg").innerHTML = `<p class="muted small center">Belum disetujui. Kami akan cek lagi otomatis.</p>`;
        } catch (err) { if (manual) showErr("#o-msg", err); }
      };
      if ($("#o-refresh")) $("#o-refresh").addEventListener("click", () => check(true));
      if (stage === "menunggu") payPoll = setInterval(() => !document.hidden && check(false), 10000);
    }

    $("#act-btn").addEventListener("click", async () => {
      const code = $("#act-code").value.trim();
      if (code && (await activateWith(code))) return celebrate();
      $("#act-msg").innerHTML = `<p class="danger-text">Kode tidak cocok untuk perangkat ini. Pastikan kode disalin utuh, atau hubungi admin.</p>`;
    });
  }

  // ---------------- Pemutar Latihan ----------------
  function renderPlayer(program) {
    nav.hidden = true;
    const segs = buildTimeline(program);
    const total = program.items.length;
    let i = 0, t = 0, paused = false, last = performance.now(), raf = null, spentSec = 0, finished = false;
    let lastRep = -1, lastSec = -1, lastCue = "";

    view.innerHTML = `
      <section class="player">
        <div class="pl-top">
          <button class="icon-btn" id="pl-close" aria-label="Tutup">✕</button>
          <div class="pl-progress"><div class="muted small" id="pl-count"></div><div class="bar"><i id="pl-bar"></i></div></div>
        </div>
        <div class="pl-phase"><span id="pl-phase" class="pill"></span><span id="pl-side" class="pill side"></span></div>
        <h1 id="pl-name" class="pl-name"></h1>
        <div class="fig-stage player-fig" id="pl-fig"></div>
        <div class="pl-counter"><div id="pl-num" class="pl-num"></div><div id="pl-cue" class="pl-cue"></div></div>
        <div class="bar thin"><i id="pl-segbar"></i></div>
        <div class="pl-controls">
          <button class="icon-btn lg" id="pl-prev" aria-label="Sebelumnya">⏮</button>
          <button class="icon-btn xl primary" id="pl-play" aria-label="Jeda">⏸</button>
          <button class="icon-btn lg" id="pl-next" aria-label="Berikutnya">⏭</button>
        </div>
        <div id="pl-extra" class="pl-extra"></div>
        ${state.settings.voice && !Voice.ok() ? `<p class="muted small center">🔇 Suara Bahasa Indonesia tidak tersedia di perangkat ini, panduan memakai bunyi bip. <a href="#/pengaturan">Cara menambahkan</a></p>` : ""}
      </section>`;

    const fig = addFigure($("#pl-fig"), segs[0].ex);
    let figKey = "";
    const el = {
      count: $("#pl-count"), bar: $("#pl-bar"), phase: $("#pl-phase"), side: $("#pl-side"), name: $("#pl-name"),
      num: $("#pl-num"), cue: $("#pl-cue"), segbar: $("#pl-segbar"), extra: $("#pl-extra"), play: $("#pl-play"),
    };
    const totalDur = segs.reduce((a, s) => a + s.dur, 0);
    const before = segs.map((_, k) => segs.slice(0, k).reduce((a, s) => a + s.dur, 0));

    function enter() {
      const s = segs[i];
      lastRep = -1;
      lastSec = -1;
      lastCue = "";
      const key = s.ex.id + "|" + (s.side || "");
      if (key !== figKey) {
        fig.setExercise(s.ex, s.side === "kiri");
        figKey = key;
      }
      el.count.textContent = `Gerakan ${Math.min(s.idx + 1, total)} dari ${total}`;
      el.name.textContent = s.ex.name;
      el.side.textContent = s.side ? `Kaki ${s.side}` : "";
      el.side.hidden = !s.side;
      el.phase.className = "pill " + s.type;
      el.phase.textContent = s.type === "prep" ? "BERSIAP" : s.type === "work" ? "LATIHAN" : "ISTIRAHAT";
      document.querySelector(".player").dataset.phase = s.type;

      if (s.type === "prep") {
        el.extra.innerHTML = s.first
          ? `<ol class="steps compact">${s.ex.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`
          : `<p class="center">Sekarang ganti ke <b>kaki ${s.side}</b>.</p>`;
        if (s.first) Voice.say(`${s.ex.name}. ${doseSpoken(s.ex)}. ${s.side ? "Mulai dengan kaki " + s.side + ". " : ""}${s.ex.steps[0]}`);
        else Voice.say(`Ganti kaki ${s.side}. Bersiap.`);
      } else if (s.type === "work") {
        el.extra.innerHTML = s.ex.tips && s.ex.tips[0] ? `<p class="center muted">💡 ${esc(s.ex.tips[0])}</p>` : "";
        beep(1046, 0.18);
        if (s.ex.mode === "time") Voice.say("Mulai. Masuk ke posisi perlahan.");
      } else {
        el.name.textContent = "Istirahat sejenak";
        el.extra.innerHTML = `
          <p class="center">Berikutnya: <b>${esc(s.ex.name)}</b> · ${doseText(s.ex)}</p>
          <div class="row-btns"><button class="btn" id="pl-more">+15 detik</button><button class="btn primary" id="pl-skip">Lewati ›</button></div>`;
        $("#pl-more").onclick = () => (s.dur += 15);
        $("#pl-skip").onclick = () => jump(i + 1);
        beep(660, 0.2);
        Voice.say(`Bagus! Istirahat. Berikutnya, ${s.ex.name}.`);
      }
    }

    function update() {
      const s = segs[i];
      const remain = Math.max(0, Math.ceil(s.dur - t));
      el.segbar.style.width = `${Math.min(100, (t / s.dur) * 100)}%`;
      el.bar.style.width = `${Math.min(100, ((before[i] + t) / totalDur) * 100)}%`;

      if (s.type === "prep" || s.type === "rest") {
        // pratinjau gerakan berulang
        const ex = s.ex, up = ex.up, hold = ex.mode === "time" ? 1.2 : Math.max(ex.hold, 0.4), down = ex.down;
        const cyc = up + hold + down + 0.6;
        fig.setProgress(repProgress(t % cyc, up, hold, down));
        el.num.textContent = remain;
        el.cue.textContent = s.type === "prep" ? "detik lagi dimulai" : "detik istirahat";
        if (remain !== lastSec) {
          if (remain <= 3 && remain > 0) beep(740, 0.1);
          lastSec = remain;
        }
        return;
      }

      // work
      if (s.ex.mode === "reps") {
        const r = Math.min(s.reps - 1, Math.floor(t / s.rep));
        const tt = t - r * s.rep;
        fig.setProgress(repProgress(tt, s.up, s.hold, s.down));
        el.num.textContent = `${r + 1} / ${s.reps}`;
        if (r !== lastRep) {
          lastRep = r;
          if (state.settings.count && state.settings.voice && Voice.ok()) Voice.say(String(r + 1));
          else beep(880, 0.08);
        }
        let cue;
        if (tt < s.up) cue = "Gerakkan perlahan";
        else if (tt < s.up + s.hold) cue = s.hold >= 1.5 ? `Tahan… ${Math.ceil(s.up + s.hold - tt)}` : "Tahan";
        else if (tt < s.up + s.hold + s.down) cue = "Kembali perlahan";
        else cue = "Rileks";
        if (cue.startsWith("Tahan") && !lastCue.startsWith("Tahan") && s.hold >= 2) Voice.say("Tahan");
        el.cue.textContent = cue;
        lastCue = cue;
      } else {
        fig.setProgress(repProgress(t, s.up, s.hold, s.down));
        let cue, num;
        if (t < s.up) {
          cue = "Masuk ke posisi";
          num = s.hold;
        } else if (t < s.up + s.hold) {
          num = Math.ceil(s.up + s.hold - t);
          cue = "Tahan, bernapas santai";
          if (num !== lastSec) {
            if (num === 10 && s.hold >= 20) Voice.say("Sepuluh detik lagi");
            else if (num <= 3) beep(740, 0.1);
            lastSec = num;
          }
        } else {
          num = 0;
          cue = "Kembali perlahan";
          if (lastCue !== cue) Voice.say("Selesai. Kembali perlahan.");
        }
        el.num.textContent = num;
        el.cue.textContent = cue;
        lastCue = cue;
      }
    }

    function jump(k) {
      if (k >= segs.length) return finish();
      i = Math.max(0, k);
      t = 0;
      enter();
      update();
    }
    function firstPrepOf(idx) {
      return segs.findIndex((s) => s.type === "prep" && s.first && s.idx === idx);
    }

    function tick(now) {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      if (!paused) {
        t += dt;
        spentSec += dt;
        while (t >= segs[i].dur) {
          t -= segs[i].dur;
          if (i + 1 >= segs.length) return finish();
          i++;
          enter();
        }
        update();
      }
      raf = requestAnimationFrame(tick);
    }

    function setPaused(p) {
      paused = p;
      el.play.textContent = p ? "▶" : "⏸";
      el.play.setAttribute("aria-label", p ? "Lanjutkan" : "Jeda");
      document.querySelector(".player").classList.toggle("paused", p);
      if (p) {
        Voice.stop();
        el.cue.textContent = "Dijeda";
      }
    }

    function record(completed) {
      if (spentSec < 30 && !completed) return null;
      const now = new Date();
      const rec = { date: now.toISOString(), day: dayKey(now), programId: program.id, title: program.name, seconds: Math.round(spentSec), completed, pain: null };
      state.sessions.push(rec);
      if (state.sessions.length > 500) state.sessions.shift();
      save();
      return rec;
    }

    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      keepAwake(false);
      // Dihitung "selesai" bila minimal 40% durasi benar-benar dijalani (bukan hanya dilewati)
      const rec = record(spentSec >= totalDur * 0.4) || { pain: null };
      beep(1046, 0.15);
      setTimeout(() => beep(1318, 0.25), 180);
      Voice.say(`Hebat${state.name ? " " + state.name : ""}! Latihan selesai. Bagaimana rasa lutut Anda sekarang?`);
      figures.forEach((f) => f.destroy());
      figures = [];
      view.innerHTML = `
        <section class="finish">
          <div class="finish-photo"><img src="img/selesai.jpg" alt="Kakek dan nenek bahagia"><div class="confetti">🎉</div></div>
          <h1>Hebat${state.name ? ", " + esc(state.name) : ""}!</h1>
          <p class="lead">Latihan <b>${esc(program.name)}</b> selesai.</p>
          <div class="stats">
            <div class="stat"><b>${Math.max(1, Math.round(spentSec / 60))}</b><span>menit</span></div>
            <div class="stat"><b>${total}</b><span>gerakan</span></div>
            <div class="stat"><b>🔥 ${streak()}</b><span>hari beruntun</span></div>
          </div>
          <div class="card">
            <h3>Bagaimana rasa lutut Anda sekarang?</h3>
            <div class="pain">${PAIN.map((p) => `<button data-p="${p.v}"><span>${p.e}</span>${p.t}</button>`).join("")}</div>
            <div id="pain-msg"></div>
          </div>
          <a class="btn primary block" href="#/">Kembali ke Beranda</a>
        </section>`;
      $$(".pain button", view).forEach((b) =>
        b.addEventListener("click", () => {
          const v = Number(b.dataset.p);
          rec.pain = v;
          save();
          $$(".pain button", view).forEach((x) => x.classList.toggle("on", x === b));
          $("#pain-msg").innerHTML =
            v <= 1
              ? `<p class="ok">👍 Bagus sekali! Pertahankan latihan rutin setiap hari.</p>`
              : v === 2
              ? `<p class="note">Coba pilih kecepatan <b>Lambat</b> di Pengaturan dan kurangi jangkauan gerakan. Kompres hangat bisa membantu.</p>`
              : `<p class="danger-text">Istirahatkan lutut dulu. Bila nyeri tidak mereda, lutut bengkak, atau terasa panas, <b>periksakan ke dokter</b> sebelum latihan lagi.</p>`;
        })
      );
    }

    el.play.onclick = () => setPaused(!paused);
    $("#pl-next").onclick = () => {
      const nxt = firstPrepOf(segs[i].idx + (segs[i].type === "rest" ? 0 : 1));
      if (nxt < 0 || nxt <= i) finish();
      else jump(nxt);
    };
    $("#pl-prev").onclick = () => {
      const s = segs[i];
      const cur = firstPrepOf(s.idx);
      if (s.type !== "rest" && (i > cur || t >= 2)) jump(cur);
      else jump(Math.max(0, firstPrepOf(Math.max(0, s.idx - 1))));
    };
    $("#pl-close").onclick = () => {
      setPaused(true);
      if (confirm("Hentikan latihan sekarang?")) {
        record(false);
        location.hash = "#/program/" + program.id;
      } else setPaused(false);
    };

    keepAwake(true);
    enter();
    update();
    raf = requestAnimationFrame((n) => {
      last = n;
      tick(n);
    });
    cleanup = () => {
      cancelAnimationFrame(raf);
      keepAwake(false);
      document.body.classList.remove("in-player");
    };
  }

  // ---------------- Start ----------------
  document.title = CFG.appName;
  applyTextSize();
  Voice.init();
  (async () => {
    ensureLicenseState();
    await checkLicense();
    route();
    // pesanan yang menunggu: cek apakah sudah disetujui admin
    if (!LICENSED && state.order && state.order.status === "menunggu") {
      try { await refreshOrder(); if (LICENSED || state.order.status !== "menunggu") route(); } catch (e) {}
    }
  })();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
