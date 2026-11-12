"""Buat musik latar lembut (piano + pad) untuk video cerita, 100% buatan sendiri (bebas hak cipta).
Bagian 1 (0-21 dtk) hangat & sedikit sendu, bagian 2 (21-33) tegang, bagian 3 (33-50) cerah & penuh harapan.
Output: assets/musik.wav
"""
import wave, pathlib
import numpy as np

SR = 44100
DUR = 50.0
HERE = pathlib.Path(__file__).parent
t_all = np.arange(int(SR * DUR)) / SR
mix = np.zeros_like(t_all)

NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
def hz(name, octave):
    return 440.0 * 2 ** ((NOTE[name] + 12 * (octave + 1) - 69) / 12)

CHORDS = {  # nada akor (oktaf 3-4)
    "Am": [("A", 3), ("C", 4), ("E", 4)], "F": [("F", 3), ("A", 3), ("C", 4)], "C": [("C", 4), ("E", 4), ("G", 4)],
    "G": [("G", 3), ("B", 3), ("D", 4)], "Dm": [("D", 4), ("F", 4), ("A", 4)], "E": [("E", 3), ("G#", 3), ("B", 3)],
    "Em": [("E", 3), ("G", 3), ("B", 3)],
}

def piano(f, start, dur, vol):
    n0 = int(start * SR); n = int((dur + 1.8) * SR)
    t = np.arange(n) / SR
    env = np.minimum(t / 0.008, 1) * np.exp(-t * 2.2)
    w = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3) + 0.12 * np.sin(6 * np.pi * f * t) * np.exp(-t * 5))
    seg = w * env * vol
    end = min(len(mix), n0 + n)
    mix[n0:end] += seg[: end - n0]

def pad(freqs, start, dur, vol):
    n0 = int(start * SR); n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.minimum(t / 1.2, 1) * np.minimum((dur - t) / 1.2, 1)
    w = sum(np.sin(2 * np.pi * f * t) + np.sin(2 * np.pi * f * 1.004 * t) for f in freqs)
    end = min(len(mix), n0 + n)
    mix[n0:end] += (w * env * vol)[: end - n0]

def section(start, end, prog, bar, arp_vol, pad_vol, pattern):
    t = start; i = 0
    while t < end - 0.01:
        ch = CHORDS[prog[i % len(prog)]]
        fr = [hz(n, o) for n, o in ch]
        pad([f / 2 for f in fr], t, bar + 0.6, pad_vol)
        piano(hz(ch[0][0], 2), t, bar, arp_vol * 0.9)  # bas
        step = bar / len(pattern)
        for k, idx in enumerate(pattern):
            if idx is None:
                continue
            f = fr[idx % 3] * (2 if idx >= 3 else 1)
            piano(f, t + k * step, step, arp_vol * (1.0 if k == 0 else 0.7))
        t += bar; i += 1

# Bagian 1: hangat-sendu
section(0.0, 21.0, ["Am", "F", "C", "G"], 2.62, 0.10, 0.018, [0, 1, 2, 3, None, 2, 1, None])
# Bagian 2: tegang, lebih sepi
section(21.0, 33.0, ["Dm", "Am", "F", "E"], 3.0, 0.08, 0.024, [0, None, 2, None, 1, None, None, None])
# Bagian 3: cerah, penuh harapan
section(33.0, 50.0, ["C", "G", "Am", "F"], 2.15, 0.11, 0.02, [0, 2, 3, 2, 1, 2, 3, 4])
piano(hz("C", 5), 47.5, 2.5, 0.12); piano(hz("E", 5), 47.5, 2.5, 0.08); piano(hz("G", 5), 47.5, 2.5, 0.07)

# Gema sederhana
for delay, g in [(0.23, 0.28), (0.41, 0.18), (0.67, 0.1)]:
    d = int(delay * SR)
    mix[d:] += mix[:-d] * g

fade = np.ones_like(mix)
fi, fo = int(1.0 * SR), int(2.5 * SR)
fade[:fi] = np.linspace(0, 1, fi)
fade[-fo:] = np.linspace(1, 0, fo)
mix *= fade
mix = mix / np.max(np.abs(mix)) * 0.8
pcm = (mix * 32767).astype(np.int16)
stereo = np.column_stack([pcm, pcm]).ravel()
out = HERE / "assets" / "musik.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print("musik:", out)
