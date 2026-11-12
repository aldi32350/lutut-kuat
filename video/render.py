"""Render video cerita Lutut Kuat (9:16, 30 fps) menjadi MP4.

Pakai:
  python render.py preview        -> contact sheet beberapa detik penting (assets/preview.jpg)
  python render.py                -> render penuh ke lutut-kuat-cerita.mp4
Butuh server lokal yang melayani folder "Project Aldi" di http://127.0.0.1:5173/
"""
import io, subprocess, sys, pathlib, time
import imageio_ffmpeg
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = "http://127.0.0.1:5173/video/story.html"
FPS = 30


def open_page(p):
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
    pg.goto(URL, wait_until="networkidle")
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(800)
    return b, pg


def preview(times):
    from PIL import Image
    with sync_playwright() as p:
        b, pg = open_page(p)
        shots = []
        for t in times:
            pg.evaluate(f"render({t})")
            shots.append(Image.open(io.BytesIO(pg.screenshot(type="jpeg", quality=80))).resize((270, 480)))
        b.close()
    cols = 6
    rows = (len(shots) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 270, rows * 480), "white")
    for i, s in enumerate(shots):
        sheet.paste(s, ((i % cols) * 270, (i // cols) * 480))
    out = HERE / "assets" / "preview.jpg"
    sheet.save(out, quality=85)
    print("preview:", out)


def full():
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    out = HERE / "lutut-kuat-cerita.mp4"
    music = HERE / "assets" / "musik.wav"
    with sync_playwright() as p:
        b, pg = open_page(p)
        dur = pg.evaluate("DURATION")
        n = int(dur * FPS)
        cmd = [ff, "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-"]
        if music.exists():
            cmd += ["-i", str(music), "-c:a", "aac", "-b:a", "160k", "-shortest"]
        cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-r", str(FPS),
                "-movflags", "+faststart", str(out)]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        t0 = time.time()
        for i in range(n):
            pg.evaluate(f"render({i / FPS})")
            proc.stdin.write(pg.screenshot(type="jpeg", quality=92))
            if i % 150 == 0:
                print(f"frame {i}/{n}  ({time.time() - t0:.0f}s)", flush=True)
        proc.stdin.close()
        proc.wait()
        b.close()
    print("selesai:", out, f"{out.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        preview([0.3, 2.5, 4.6, 6.0, 9.5, 11.6, 13.4, 15.5, 18.8, 23.8, 28.5, 31.5, 34.5, 37.9, 39.6, 41.5, 44.0, 48.5])
    else:
        full()
