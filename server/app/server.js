// =====================================================
//  Lutut Kuat – server pembayaran & admin (Node.js, tanpa dependensi)
//  Data disimpan di DATA_DIR: orders.json + folder proofs/
// =====================================================
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = +process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || "/data";
const KEY_FILE = process.env.LICENSE_KEY || path.join(DATA_DIR, "keys", "license-private.pem");
const ADMIN_HASH = process.env.ADMIN_HASH || ""; // format: scrypt$<salt hex>$<hash hex>
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString("hex");
const PRICE = +process.env.PRICE || 49000;
const STATIC_DIR = process.env.STATIC_DIR || ""; // hanya untuk uji lokal

const PROOF_DIR = path.join(DATA_DIR, "proofs");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
fs.mkdirSync(PROOF_DIR, { recursive: true });
const PRIVATE_KEY = crypto.createPrivateKey(fs.readFileSync(KEY_FILE));

// ---------- penyimpanan ----------
let orders = [];
try { orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8")); } catch (e) { orders = []; }
function saveOrders() {
  const tmp = ORDERS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(orders, null, 1));
  fs.renameSync(tmp, ORDERS_FILE);
}
const byId = (id) => orders.find((o) => o.id === id);

// ---------- utilitas ----------
const cleanDevice = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const fmtDevice = (s) => { const c = cleanDevice(s); return c.slice(0, 4) + "-" + c.slice(4, 8); };
function normPhone(p) {
  let d = String(p || "").replace(/[^0-9+]/g, "").replace(/^\+/, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (d.startsWith("8")) d = "62" + d;
  return d;
}
const newId = () => crypto.randomBytes(6).toString("base64url").replace(/[-_]/g, "x").toUpperCase().slice(0, 8);
const b64u = (buf) => Buffer.from(buf).toString("base64url");

function signLicense(deviceId) {
  const sig = crypto.sign("sha256", Buffer.from("LK1|" + cleanDevice(deviceId)), { key: PRIVATE_KEY, dsaEncoding: "ieee-p1363" });
  return b64u(sig);
}

function makeToken() {
  const body = b64u(JSON.stringify({ exp: Date.now() + 7 * 864e5 }));
  return body + "." + b64u(crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest());
}
function checkToken(tok) {
  if (!tok || !tok.includes(".")) return false;
  const [body, sig] = tok.split(".");
  const good = b64u(crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest());
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return false;
  try { return JSON.parse(Buffer.from(body, "base64url")).exp > Date.now(); } catch (e) { return false; }
}
function checkPassword(pw) {
  const [algo, salt, hash] = ADMIN_HASH.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const got = crypto.scryptSync(String(pw || ""), Buffer.from(salt, "hex"), 32);
  const want = Buffer.from(hash, "hex");
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

// batas permintaan per IP
const hits = new Map();
function limited(ip, key, max, windowMs) {
  const k = ip + "|" + key, now = Date.now();
  const arr = (hits.get(k) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(k, arr);
  return arr.length > max;
}

function send(res, code, obj, headers = {}) {
  const body = typeof obj === "string" || Buffer.isBuffer(obj) ? obj : JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers });
  res.end(body);
}
function readBody(req, max) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > max) { reject(new Error("too_large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); } catch (e) { reject(new Error("bad_json")); } });
    req.on("error", reject);
  });
}
const publicOrder = (o, withLicense) => ({
  id: o.id, status: o.status, note: o.note || "", amount: o.amount, name: o.name,
  ...(withLicense && o.status === "aktif" ? { license: o.license } : {}),
});

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".json": "application/json" };

// ---------- router ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  const auth = () => checkToken(String(req.headers.authorization || "").replace(/^Bearer /, ""));
  let m;
  try {
    if (p === "/api/health") return send(res, 200, { ok: true });

    // --- pembeli: buat pesanan (nama + HP) ---
    if (p === "/api/orders" && req.method === "POST") {
      if (limited(ip, "order", 20, 3600e3)) return send(res, 429, { error: "Terlalu banyak percobaan. Coba lagi nanti." });
      const b = await readBody(req, 4096);
      const name = String(b.name || "").trim().replace(/\s+/g, " ").slice(0, 60);
      const phone = normPhone(b.phone);
      const dev = cleanDevice(b.deviceId);
      if (name.length < 2) return send(res, 400, { error: "Nama wajib diisi." });
      if (!/^62\d{8,13}$/.test(phone)) return send(res, 400, { error: "Nomor HP tidak valid. Contoh: 0812xxxxxxx" });
      if (dev.length !== 8) return send(res, 400, { error: "Kode perangkat tidak valid." });
      let o = [...orders].reverse().find((x) => x.deviceId === fmtDevice(dev));
      if (o && (o.status === "menunggu" || o.status === "aktif")) return send(res, 200, publicOrder(o, true));
      if (o) { Object.assign(o, { name, phone, updatedAt: Date.now() }); }
      else { o = { id: newId(), name, phone, deviceId: fmtDevice(dev), amount: PRICE, status: "baru", createdAt: Date.now() }; orders.push(o); }
      saveOrders();
      return send(res, 200, publicOrder(o));
    }

    // --- pembeli: kirim bukti bayar ---
    if ((m = p.match(/^\/api\/orders\/([A-Z0-9]{8})\/proof$/)) && req.method === "POST") {
      if (limited(ip, "proof", 20, 3600e3)) return send(res, 429, { error: "Terlalu banyak percobaan. Coba lagi nanti." });
      const o = byId(m[1]);
      const b = await readBody(req, 4 * 1024 * 1024);
      if (!o || o.deviceId !== fmtDevice(b.deviceId)) return send(res, 404, { error: "Pesanan tidak ditemukan." });
      if (o.status === "aktif") return send(res, 200, publicOrder(o, true));
      const mm = String(b.image || "").match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
      if (!mm) return send(res, 400, { error: "Foto bukti tidak terbaca. Coba pilih foto lain." });
      const buf = Buffer.from(mm[2], "base64");
      if (buf.length < 2000 || buf.length > 3 * 1024 * 1024) return send(res, 400, { error: "Ukuran foto tidak sesuai." });
      const file = `${o.id}-${Date.now()}.${mm[1] === "jpeg" ? "jpg" : mm[1]}`;
      fs.writeFileSync(path.join(PROOF_DIR, file), buf);
      Object.assign(o, { status: "menunggu", method: String(b.method || "").slice(0, 30), proof: file, proofAt: Date.now(), note: "" });
      saveOrders();
      return send(res, 200, publicOrder(o));
    }

    // --- pembeli: cek status (dan ambil lisensi bila sudah disetujui) ---
    if ((m = p.match(/^\/api\/orders\/([A-Z0-9]{8})$/)) && req.method === "GET") {
      const o = byId(m[1]);
      if (!o || o.deviceId !== fmtDevice(url.searchParams.get("device"))) return send(res, 404, { error: "Pesanan tidak ditemukan." });
      return send(res, 200, publicOrder(o, true));
    }

    // --- admin ---
    if (p === "/api/admin/login" && req.method === "POST") {
      if (limited(ip, "login", 10, 900e3)) return send(res, 429, { error: "Terlalu banyak percobaan login. Tunggu 15 menit." });
      const b = await readBody(req, 1024);
      if (!checkPassword(b.password)) return send(res, 401, { error: "Password salah." });
      return send(res, 200, { token: makeToken() });
    }
    if (p.startsWith("/api/admin/") && !p.startsWith("/api/admin/proof/") && !auth()) return send(res, 401, { error: "Silakan login lagi." });
    if (p === "/api/admin/orders" && req.method === "GET") {
      return send(res, 200, { price: PRICE, orders: [...orders].sort((a, b) => (b.proofAt || b.createdAt) - (a.proofAt || a.createdAt)) });
    }
    if ((m = p.match(/^\/api\/admin\/proof\/([A-Z0-9]{8})$/)) && req.method === "GET") {
      if (!checkToken(url.searchParams.get("t"))) return send(res, 401, { error: "unauthorized" });
      const o = byId(m[1]);
      if (!o || !o.proof) return send(res, 404, { error: "Tidak ada bukti." });
      const f = path.join(PROOF_DIR, path.basename(o.proof));
      return send(res, 200, fs.readFileSync(f), { "Content-Type": MIME[path.extname(f)] || "image/jpeg", "Cache-Control": "private, max-age=3600" });
    }
    if ((m = p.match(/^\/api\/admin\/orders\/([A-Z0-9]{8})\/(approve|reject|delete)$/)) && req.method === "POST") {
      const o = byId(m[1]);
      if (!o) return send(res, 404, { error: "Pesanan tidak ditemukan." });
      const b = await readBody(req, 2048);
      if (m[2] === "approve") Object.assign(o, { status: "aktif", license: signLicense(o.deviceId), approvedAt: Date.now(), note: "" });
      if (m[2] === "reject") Object.assign(o, { status: "ditolak", note: String(b.note || "Bukti pembayaran belum sesuai.").slice(0, 200), rejectedAt: Date.now() });
      if (m[2] === "delete") {
        if (o.proof) try { fs.unlinkSync(path.join(PROOF_DIR, path.basename(o.proof))); } catch (e) {}
        orders = orders.filter((x) => x !== o);
      }
      saveOrders();
      return send(res, 200, m[2] === "delete" ? { ok: true } : o);
    }
    if (p === "/api/admin/license" && req.method === "POST") {
      const b = await readBody(req, 1024);
      const dev = cleanDevice(b.deviceId);
      if (dev.length !== 8) return send(res, 400, { error: "Kode perangkat harus 8 huruf/angka." });
      return send(res, 200, { deviceId: fmtDevice(dev), license: signLicense(dev) });
    }
    if (p.startsWith("/api/")) return send(res, 404, { error: "not_found" });

    // --- halaman admin ---
    if (p === "/admin" || p === "/admin/") {
      return send(res, 200, fs.readFileSync(path.join(__dirname, "admin.html")), {
        "Content-Type": "text/html; charset=utf-8", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex",
      });
    }

    // --- file statis (hanya untuk uji lokal) ---
    if (STATIC_DIR) {
      let f = path.normalize(path.join(STATIC_DIR, decodeURIComponent(p)));
      if (!f.startsWith(path.normalize(STATIC_DIR))) return send(res, 403, { error: "forbidden" });
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
      if (fs.existsSync(f)) return send(res, 200, fs.readFileSync(f), { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-cache" });
    }
    return send(res, 404, { error: "not_found" });
  } catch (e) {
    const msg = e.message === "too_large" ? "Ukuran data terlalu besar." : e.message === "bad_json" ? "Data tidak valid." : "Terjadi kesalahan server.";
    if (!["too_large", "bad_json"].includes(e.message)) console.error(e);
    return send(res, e.message === "too_large" ? 413 : 400, { error: msg });
  }
});
server.listen(PORT, () => console.log(`Lutut Kuat API di port ${PORT}, ${orders.length} pesanan`));
