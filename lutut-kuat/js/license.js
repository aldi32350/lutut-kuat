// =====================================================
//  LISENSI: kode perangkat & kode aktivasi
//  Kode aktivasi = turunan dari (kode perangkat + kunci rahasia),
//  sehingga satu kode hanya berlaku di satu HP.
//  Dipakai juga oleh "pembuat-kode-aktivasi.html".
// =====================================================
(function () {
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa huruf/angka yang mirip (I, O, 0, 1)

  function cyrb53(str, seed) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }

  function toAlpha(n, len) {
    let s = "";
    for (let i = 0; i < len; i++) {
      s += ALPHA[n % 32];
      n = Math.floor(n / 32);
    }
    return s;
  }

  const clean = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const fmt = (s) => s.slice(0, 4) + "-" + s.slice(4, 8);

  function newDeviceId() {
    const a = new Uint32Array(8);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return fmt(Array.from(a, (x) => ALPHA[x % 32]).join(""));
  }

  function activationCode(deviceId, secret) {
    const id = clean(deviceId);
    const a = cyrb53(id + "|" + secret, 7);
    const b = cyrb53(secret + "|" + id, 13);
    return fmt(toAlpha(a, 4) + toAlpha(b, 4));
  }

  function verify(deviceId, code, secret) {
    return clean(code).length === 8 && clean(code) === clean(activationCode(deviceId, secret));
  }

  window.LK_LICENSE = { newDeviceId, activationCode, verify, clean, fmt };
})();
