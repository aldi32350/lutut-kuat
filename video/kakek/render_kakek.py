"""Render video kakek animasi (9:16, 30 fps).
  python render_kakek.py preview   -> contact sheet (preview.jpg)
  python render_kakek.py           -> frames.mp4 (tanpa suara), lalu mix.py untuk 2 versi audio
Butuh server lokal yang melayani folder "Project Aldi" di http://127.0.0.1:5173/
"""
import io, sys, subprocess, pathlib, time
import imageio_ffmpeg
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = "http://127.0.0.1:5173/video/kakek/kakek.html"
FPS = 30


def open_page(p):
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1080, "height": 1920})
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_function("window.__ready === true", timeout=30000)
    pg.wait_for_timeout(500)
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
    sheet = Image.new("RGB", (cols * 270, ((len(shots) + cols - 1) // cols) * 480), "white")
    for i, s in enumerate(shots):
        sheet.paste(s, ((i % cols) * 270, (i // cols) * 480))
    sheet.save(HERE / "preview.jpg", quality=85)
    print("preview:", HERE / "preview.jpg")


def full():
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    out = HERE / "frames.mp4"
    with sync_playwright() as p:
        b, pg = open_page(p)
        dur = pg.evaluate("DURATION")
        n = int(dur * FPS)
        cmd = [ff, "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-",
               "-vf", "scale=in_range=pc:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
               "-r", str(FPS), str(out)]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        t0 = time.time()
        for i in range(n):
            pg.evaluate(f"render({i / FPS})")
            proc.stdin.write(pg.screenshot(type="jpeg", quality=92))
            if i % 150 == 0:
                print(f"frame {i}/{n} ({time.time() - t0:.0f}s)", flush=True)
        proc.stdin.close(); proc.wait(); b.close()
    print("selesai:", out, "durasi", dur)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        preview([0.2, 2.0, 3.6, 6.0, 9.0, 12.8, 16.5, 18.6, 20.0, 23.0, 25.5, 27.5, 30.1, 31.2, 34.0, 38.6, 39.6, 41.0])
    else:
        full()
