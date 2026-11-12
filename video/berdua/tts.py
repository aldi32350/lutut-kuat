"""Suara dialog kakek (k) & nenek (n) via edge-tts + timing kata + amplop mulut per tokoh.
Output: voice.wav, words.json, env_k.json, env_n.json, env.json (gabungan, untuk duck musik)
"""
import asyncio, json, pathlib, subprocess, wave
import numpy as np
import edge_tts, imageio_ffmpeg

HERE = pathlib.Path(__file__).parent
FF = imageio_ffmpeg.get_ffmpeg_exe()
CFG = json.loads((HERE / "naskah.json").read_text(encoding="utf-8"))
SR, FPS, LEAD = 48000, 30, 0.6


async def synth(text, v, path):
    com = edge_tts.Communicate(text, v["voice"], rate=v["rate"], pitch=v["pitch"], boundary="WordBoundary")
    words, audio = [], bytearray()
    async for ch in com.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append({"w": ch["text"], "s": ch["offset"] / 1e7, "e": (ch["offset"] + ch["duration"]) / 1e7})
    path.write_bytes(bytes(audio))
    return words


def decode(mp3):
    raw = subprocess.run([FF, "-loglevel", "error", "-i", str(mp3), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768


async def main():
    tmp = HERE / "tmp"; tmp.mkdir(exist_ok=True)
    segs, words, sents, t = [], [], [], LEAD
    for i, s in enumerate(CFG["sentences"]):
        mp3 = tmp / f"{i}.mp3"
        ws = await synth(s["text"], CFG["voices"][s["who"]], mp3)
        a = decode(mp3)
        nz = np.where(np.abs(a) > 0.01)[0]
        a0, a1 = (nz[0], nz[-1] + 1) if len(nz) else (0, len(a))
        a0 = max(0, a0 - int(0.03 * SR)); a1 = min(len(a), a1 + int(0.08 * SR))
        shift = a0 / SR; a = a[a0:a1]
        for w in ws:
            words.append({"w": w["w"], "s": round(t + w["s"] - shift, 3), "e": round(t + w["e"] - shift, 3), "i": i, "who": s["who"]})
        sents.append({"id": s["id"], "who": s["who"], "text": s["text"], "s": round(t, 3), "e": round(t + len(a) / SR, 3)})
        segs.append((s["who"], t, a))
        t += len(a) / SR
        t += 0.15 if s["text"].endswith(",") else CFG["gap"]
    dur = t + 1.0
    N = int(dur * SR)
    tracks = {"k": np.zeros(N, np.float32), "n": np.zeros(N, np.float32)}
    for who, st, a in segs:
        n0 = int(st * SR); tracks[who][n0:n0 + len(a)] += a[: N - n0]
    full = tracks["k"] + tracks["n"]
    peak = max(1e-6, np.max(np.abs(full)))
    full = full / peak * 0.89
    with wave.open(str(HERE / "voice.wav"), "wb") as wv:
        wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR)
        wv.writeframes((full * 32767).astype(np.int16).tobytes())
    hop = SR // FPS

    def env_of(x):
        e = [float(np.sqrt(np.mean(x[k:k + hop] ** 2))) for k in range(0, len(x), hop)]
        m = max(e) or 1
        return [round(min(1, (v / m) ** 0.7 * 1.25), 3) for v in e]

    ek, en = env_of(tracks["k"]), env_of(tracks["n"])
    (HERE / "env_k.json").write_text(json.dumps(ek)); (HERE / "env_n.json").write_text(json.dumps(en))
    (HERE / "env.json").write_text(json.dumps([max(a, b) for a, b in zip(ek, en)]))
    (HERE / "words.json").write_text(json.dumps({"duration": round(dur, 3), "sentences": sents, "words": words}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"durasi {dur:.2f}s")
    for s in sents:
        print(f"  {s['s']:6.2f}-{s['e']:6.2f} [{s['who']}] {s['text']}")


asyncio.run(main())
