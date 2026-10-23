"""Generate natural-voice MP3s for every Chinese text in the app (Edge TTS).

Usage:  npm run tts            (= node scripts/tts-jobs.ts > tts-jobs.json; python3 scripts/tts.py tts-jobs.json)
Needs:  pip install edge-tts ; ffmpeg (optional, re-encodes to 32 kbps mono to keep the repo small)

Existing files are skipped, so after adding content only new texts are
synthesized, and public/data/audio-index.json lists the files that exist.
--prune deletes files no longer used by any text. Edge TTS is an unofficial
endpoint: if it stops working, the app falls back to the device voice.
Behind a TLS-inspecting proxy, set TTS_CA_FILE to its CA bundle.
"""

import asyncio
import json
import os
import shutil
import ssl
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts
import edge_tts.communicate as communicate

VOICE = "zh-CN-XiaoxiaoNeural"  # keep in sync with NATURAL_VOICE in src/speaking/audioKey.ts
OUT = Path("public/audio/zh")
INDEX = Path("public/data/audio-index.json")
CONCURRENCY = 8

if os.environ.get("TTS_CA_FILE"):
    communicate._SSL_CTX = ssl.create_default_context(cafile=os.environ["TTS_CA_FILE"])
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
FFMPEG = shutil.which("ffmpeg")


def compress(src: Path, dst: Path) -> None:
    if not FFMPEG:
        src.replace(dst)
        return
    subprocess.run(
        [FFMPEG, "-loglevel", "error", "-y", "-i", str(src), "-ac", "1", "-ar", "24000", "-b:a", "32k", str(dst)],
        check=True,
    )
    src.unlink()


async def synth(sem: asyncio.Semaphore, text: str, dst: Path, done: list) -> None:
    async with sem:
        # Temp file outside public/ so a concurrent `vite build` never sees it.
        tmp = Path(tempfile.gettempdir()) / f"zv-tts-{dst.name}"
        for attempt in range(4):
            try:
                await edge_tts.Communicate(text, VOICE, proxy=PROXY).save(str(tmp))
                compress(tmp, dst)
                break
            except Exception as e:  # network hiccups: retry with backoff
                if attempt == 3:
                    print(f"FAILED {dst.name} ({text}): {e}", file=sys.stderr)
                    tmp.unlink(missing_ok=True)
                    return
                await asyncio.sleep(2 ** attempt)
        done.append(dst)
        if len(done) % 50 == 0:
            print(f"  {len(done)} files", flush=True)


async def main() -> None:
    jobs = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    keys = {j["key"] for j in jobs}
    if "--prune" in sys.argv:
        for f in OUT.glob("*.mp3"):
            if f.stem not in keys:
                f.unlink()
    sem = asyncio.Semaphore(CONCURRENCY)
    done: list = []
    tasks = [synth(sem, j["text"], OUT / f"{j['key']}.mp3", done) for j in jobs if not (OUT / f"{j['key']}.mp3").exists()]
    print(f"{len(jobs)} texts, {len(tasks)} files to generate")
    await asyncio.gather(*tasks)
    print(f"done: {len(done)} generated")
    index = {"version": 1, "voice": VOICE, "keys": sorted(f.stem for f in OUT.glob("*.mp3"))}
    INDEX.write_text(json.dumps(index, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {INDEX}")
    if tasks and not done:
        sys.exit("no audio generated")


if __name__ == "__main__":
    asyncio.run(main())
