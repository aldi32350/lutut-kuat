"""Buat suara narasi kakek (edge-tts, id-ID) + timing tiap kata.
Output: voice.wav, words.json (kata, mulai, selesai, kalimat), env.json (kekerasan suara per frame untuk gerak mulut).
"""
import asyncio, json, pathlib, subprocess, wave
import numpy as np
import edge_tts, imageio_ffmpeg

HERE = pathlib.Path(__file__).parent
FF = imageio_ffmpeg.get_ffmpeg_exe()
CFG = json.loads((HERE / "naskah.json").read_text(encoding="utf-8"))
SR, FPS = 48000, 30
LEAD = 0.6  # jeda sebelum kalimat pertama


async def synth(text, path):
    com = edge_tts.Communicate(text, CFG["voice"], rate=CFG["rate"], pitch=CFG["pitch"], boundary="WordBoundary")
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
    pcm, words, sents, t = [np.zeros(int(LEAD * SR), np.float32)], [], [], LEAD
    for i, s in enumerate(CFG["sentences"]):
        mp3 = tmp / f"{i}.mp3"
        ws = await synth(s["text"], mp3)
        a = decode(mp3)
        # buang hening di awal/akhir klip TTS
        nz = np.where(np.abs(a) > 0.01)[0]
        a0, a1 = (nz[0], nz[-1] + 1) if len(nz) else (0, len(a))
        a0 = max(0, a0 - int(0.03 * SR)); a1 = min(len(a), a1 + int(0.08 * SR))
        shift = a0 / SR
        a = a[a0:a1]
        for w in ws:
            words.append({"w": w["w"], "s": round(t + w["s"] - shift, 3), "e": round(t + w["e"] - shift, 3), "i": i})
        sents.append({"id": s["id"], "text": s["text"], "s": round(t, 3), "e": round(t + len(a) / SR, 3)})
        pcm.append(a)
        t += len(a) / SR
        gap = CFG["gap"] + (0.25 if s["text"].endswith(".") and i in (1, 4) else 0)
        pcm.append(np.zeros(int(gap * SR), np.float32)); t += gap
    pcm.append(np.zeros(int(1.0 * SR), np.float32))
    full = np.concatenate(pcm)
    full = full / max(1e-6, np.max(np.abs(full))) * 0.89
    with wave.open(str(HERE / "voice.wav"), "wb") as wv:
        wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR)
        wv.writeframes((full * 32767).astype(np.int16).tobytes())
    # amplop suara per frame (0..1) untuk gerak mulut
    hop = SR // FPS
    env = [float(np.sqrt(np.mean(full[k:k + hop] ** 2))) for k in range(0, len(full), hop)]
    m = max(env) or 1
    env = [round(min(1, (e / m) ** 0.7 * 1.25), 3) for e in env]
    dur = len(full) / SR
    (HERE / "words.json").write_text(json.dumps({"duration": round(dur, 3), "sentences": sents, "words": words}, ensure_ascii=False, indent=1), encoding="utf-8")
    (HERE / "env.json").write_text(json.dumps(env), encoding="utf-8")
    print(f"durasi suara {dur:.2f}s, {len(words)} kata")
    for s in sents:
        print(f"  {s['s']:6.2f}-{s['e']:6.2f}  {s['text']}")


asyncio.run(main())
