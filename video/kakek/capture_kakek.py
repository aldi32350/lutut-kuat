"""Ambil screenshot aplikasi Lutut Kuat (dari server lokal) untuk dipakai di video.
Pakai: python capture_app.py   (server lokal harus jalan di http://localhost:5173)
"""
import json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(__file__).parent / "assets"
OUT.mkdir(exist_ok=True)
BASE = "http://127.0.0.1:5173/lutut-kuat/"
DAY = 86400000
now = int(time.time() * 1000)

# Data contoh: sudah latihan 5 hari terakhir, masa coba masih berjalan
sessions = []
for d in range(1, 6):
    t = time.localtime(time.time() - d * 86400)
    sessions.append({
        "date": time.strftime("%Y-%m-%dT07:30:00.000Z", t),
        "day": time.strftime("%Y-%m-%d", t),
        "programId": "kuat-duduk", "title": "Lutut Kuat – Duduk",
        "seconds": 520, "completed": True, "pain": 0,
    })
state = {
    "name": "Pak Darmo", "accepted": True, "sessions": sessions,
    "settings": {"textSize": "besar", "voice": False, "count": False, "beep": False, "pace": "normal", "rest": 15},
    "deviceId": "DEMO-VIDE", "trialStart": now - 6 * 3600 * 1000, "lastSeen": now,
}

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    pg = ctx.new_page()
    pg.goto(BASE)
    pg.evaluate("s => localStorage.setItem('lututkuat_v1', s)", json.dumps(state))
    pg.goto(BASE + "#/")
    pg.reload()
    pg.wait_for_timeout(1500)
    pg.screenshot(path=str(OUT / "app-home.png"))

    pg.goto(BASE + "#/gerakan")
    pg.wait_for_timeout(1200)
    pg.screenshot(path=str(OUT / "app-gerakan.png"))

    # Pemutar: lompat ke "Luruskan Lutut" lalu tunggu masuk fase latihan & posisi kaki terangkat
    pg.goto(BASE + "#/latihan/kuat-duduk")
    pg.wait_for_timeout(600)
    pg.click("#pl-next"); pg.wait_for_timeout(200)
    pg.click("#pl-next"); pg.wait_for_timeout(200)
    pg.wait_for_timeout(7000 + 600 + 1500 + 6600 + 1700)  # persiapan + 1 repetisi + tengah repetisi ke-2 (tahan)
    pg.screenshot(path=str(OUT / "app-player.png"))
    b.close()
print("ok:", sorted(x.name for x in OUT.glob("app-*.png")))
