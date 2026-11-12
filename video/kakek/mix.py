"""Buat musik hangat-optimis + SFX halus, mix dengan suara kakek, lalu gabung ke video.
Hasil: "Lutut Kuat - Kakek Ikut Main v1.mp4" dan "... (tanpa musik).mp4", loudness -14 LUFS.
"""
import json, wave, pathlib, subprocess
import numpy as np
import imageio_ffmpeg

HERE = pathlib.Path(__file__).parent
FF = imageio_ffmpeg.get_ffmpeg_exe()
SR, FPS = 48000, 30
INFO = json.loads((HERE / "words.json").read_text(encoding="utf-8"))
ENV = np.array(json.loads((HERE / "env.json").read_text()))
S = {s["id"]: s for s in INFO["sentences"]}
OUT_AT = S["cta"]["e"] + 0.25
DUR = np.ceil((OUT_AT + 3.6) * 10) / 10


def read_wav(p):
    with wave.open(str(p)) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2:
            a = a.reshape(-1, 2).mean(1)
    return a


N = int(DUR * SR)
t = np.arange(N) / SR
voice = np.zeros(N, np.float32)
v = read_wav(HERE / "voice.wav")[:N]
voice[: len(v)] = v

# ---------- musik: piano + pad, G mayor, hangat & optimis ----------
music = np.zeros(N, np.float32)
NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "F#": 6, "G": 7, "A": 9, "B": 11}
hz = lambda n, o: 440.0 * 2 ** ((NOTE[n] + 12 * (o + 1) - 69) / 12)
CH = {"G": [("G", 3), ("B", 3), ("D", 4)], "D": [("D", 3), ("F#", 3), ("A", 3)], "Em": [("E", 3), ("G", 3), ("B", 3)],
      "C": [("C", 4), ("E", 4), ("G", 4)], "Am": [("A", 3), ("C", 4), ("E", 4)]}


def add(sig, start):
    n0 = int(start * SR)
    if n0 >= N:
        return
    end = min(N, n0 + len(sig))
    music[n0:end] += sig[: end - n0]


def piano(f, start, vol, dur=2.4):
    tt = np.arange(int(dur * SR)) / SR
    env = np.minimum(tt / 0.006, 1) * np.exp(-tt * 2.6)
    w = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 4) + 0.1 * np.sin(6 * np.pi * f * tt) * np.exp(-tt * 6)
    add((w * env * vol).astype(np.float32), start)


def pad(fs, start, dur, vol):
    tt = np.arange(int(dur * SR)) / SR
    env = np.minimum(tt / 0.9, 1) * np.minimum((dur - tt) / 0.9, 1)
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5 * tt)
    w = sum(np.sin(2 * np.pi * f * vib * tt) + 0.5 * np.sin(2 * np.pi * f * 1.005 * tt) + 0.25 * np.sin(4 * np.pi * f * tt) for f in fs)
    add((w * env * vol).astype(np.float32), start)


bar, prog = 2.4, ["G", "D", "Em", "C", "G", "D", "C", "G"]
pat = [0, 1, 2, 4, 2, 1, 3, 2]
tt0, i = 0.0, 0
while tt0 < DUR - 1:
    ch = CH[prog[i % len(prog)]]
    fr = [hz(n, o) for n, o in ch]
    bright = 1.0 if tt0 > S["main"]["s"] - 1 else 0.75
    pad([f / 2 for f in fr], tt0, bar + 0.5, 0.012 * bright)
    piano(hz(ch[0][0], 2), tt0, 0.09)
    for k, idx in enumerate(pat):
        f = fr[idx % 3] * (2 if idx >= 3 else 1)
        piano(f, tt0 + k * bar / 8, 0.055 * bright * (1.0 if k % 4 == 0 else 0.75))
    tt0 += bar; i += 1
# akor penutup
for n, o in [("G", 4), ("B", 4), ("D", 5)]:
    piano(hz(n, o), OUT_AT + 0.3, 0.07, 3.5)
for d, g in [(0.21, 0.25), (0.37, 0.15)]:  # gema
    k = int(d * SR); music[k:] += music[:-k] * g

# duck musik saat kakek bicara
envs = np.interp(t, np.arange(len(ENV)) / FPS, ENV)
k = int(0.25 * SR); sm = np.convolve(envs, np.ones(k) / k, mode="same")
duck = 1 - 0.55 * np.clip(sm * 2.2, 0, 1)
fade = np.minimum(t / 1.2, 1) * np.clip((DUR - t) / 1.5, 0, 1)
music *= duck * fade

# ---------- SFX halus ----------
sfx = np.zeros(N, np.float32)


def put(sig, start, gain):
    n0 = int(start * SR); end = min(N, n0 + len(sig))
    if 0 <= n0 < N:
        sfx[n0:end] += sig[: end - n0] * gain


def tick():
    tt = np.arange(int(0.08 * SR)) / SR
    return (np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 70)).astype(np.float32)


def whoosh(d=0.45):
    tt = np.arange(int(d * SR)) / SR
    n = np.random.default_rng(3).standard_normal(len(tt)).astype(np.float32)
    n = np.convolve(n, np.ones(40) / 40, mode="same")
    return n * np.sin(np.pi * tt / d) ** 2


def chime():
    tt = np.arange(int(2.0 * SR)) / SR
    return sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.5) for f in (1568, 1976, 2349)).astype(np.float32) / 3


for sid in ["dulu", "pasang", "pagi", "fitur", "main", "cta"]:
    put(whoosh(), S[sid]["s"] - 0.45, 0.10)
for w in INFO["words"]:
    if w["w"].lower().startswith(("sepuluh", "ikut")) and w["s"] > S["pagi"]["s"] - 1:
        put(tick(), w["s"], 0.12)
put(whoosh(0.35), OUT_AT, 0.14)
put(chime(), OUT_AT + 0.9, 0.10)


def write(path, a):
    a = np.clip(a, -1, 1)
    st = np.column_stack([a, a]).ravel()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())


base = voice + sfx
mus_level = 0.42
write(HERE / "mix_music.wav", (base + music / max(1e-6, np.abs(music).max()) * mus_level) * 0.8)
write(HERE / "mix_nomusic.wav", base * 0.8)

frames = HERE / "frames.mp4"
for wavname, outname in [("mix_music.wav", "Lutut Kuat - Kakek Ikut Main v1.mp4"),
                         ("mix_nomusic.wav", "Lutut Kuat - Kakek Ikut Main v1 (tanpa musik).mp4")]:
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(frames), "-i", str(HERE / wavname),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                    "-shortest", "-movflags", "+faststart", str(HERE / outname)], check=True)
    print("ok:", outname)
