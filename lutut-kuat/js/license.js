// =====================================================
//  LISENSI
//  Kode perangkat dibuat acak di HP. Kode aktivasi = tanda tangan digital (ECDSA P-256)
//  dari server untuk kode perangkat itu. Aplikasi hanya menyimpan KUNCI PUBLIK,
//  jadi kode aktivasi tidak bisa dipalsukan walau isi aplikasi dibaca orang.
// =====================================================
(function () {
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa huruf/angka yang mirip (I, O, 0, 1)
  const clean = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const fmt = (s) => s.slice(0, 4) + "-" + s.slice(4, 8);

  function newDeviceId() {
    const a = new Uint32Array(8);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return fmt(Array.from(a, (x) => ALPHA[x % 32]).join(""));
  }

  const b64ToBytes = (b64) => {
    const s = atob(b64.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "") + "===".slice((b64.length + 3) % 4));
    return Uint8Array.from(s, (c) => c.charCodeAt(0));
  };

  let keyPromise = null;
  async function verifyLicense(deviceId, license, publicKeyB64) {
    if (!license || !publicKeyB64 || !window.crypto || !crypto.subtle) return false;
    try {
      keyPromise = keyPromise || crypto.subtle.importKey("spki", b64ToBytes(publicKeyB64), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
      const key = await keyPromise;
      const sig = b64ToBytes(String(license).trim());
      if (sig.length !== 64) return false;
      return await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, sig, new TextEncoder().encode("LK1|" + clean(deviceId)));
    } catch (e) {
      return false;
    }
  }

  window.LK_LICENSE = { newDeviceId, verifyLicense, clean, fmt };
})();
