"""
Pre-render every cutscene line to audio with SarvamAI Bulbul TTS.

WHY A BUILD-TIME SCRIPT AND NOT A RUNTIME CALL
  The Sarvam API key cannot live in the browser — anything shipped to the client
  is public the moment the page loads. So this script runs on YOUR machine, reads
  the key from Traffic/.env, and writes .mp3 files into the repo. The game then
  plays local files. No key in the bundle, no per-playback network cost, no
  latency mid-cutscene, and it works offline once built.

VOICE CAST
  Each character gets one speaker, chosen for register rather than for novelty.
  The film's whole tone is a dead man's colleagues, a witness and a driver — it
  wants ordinary voices that sound like people, not a gallery of novelty samples.
  Bulbul's `*_suspense` and `*_documentary` variants exist for exactly this.

  Vikram Sawant  manisha   — steady mid-register man; the man who holds the line
  Fortuner Driver rahul     — younger, clipped; impatience without caricature
  Mrs. Iyer       ratan     — older female, warm; a witness, not a villain
  Arjun Kadam     aditya    — low, measured; authority he has not yet earned
  Havildar Desai  sumit     — clipped, procedural; radio discipline

  `ratan_latenight_warm` is used for Mrs. Iyer's Shanti Galli beat, where the
  register needs to drop.

USAGE
  cd Traffic
  python scripts/precompute_voices.py            # only lines with no audio yet
  python scripts/precompute_voices.py --force    # re-render everything
  python scripts/precompute_voices.py --speaker "The Fortuner Driver"   # one speaker

OUTPUT
  story/voices/<speaker-slug>/<line-hash>.mp3
  story/voices/manifest.json   (line -> file, so cutscene.js can resolve it)
"""

import argparse
import hashlib
import json
import os
import pathlib
import re
import sys

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = pathlib.Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env"
OUT_DIR = ROOT / "story" / "voices"
MANIFEST = OUT_DIR / "manifest.json"

# speaker (as written in story.dialogue[]) -> (Bulbul speaker, language, pace)
#
# Language is per-line in the engine, not per-speaker: the campaign deliberately
# mixes Hindi and English in one character's mouth. This map is the DEFAULT and
# the engine falls back to it when it cannot detect Hindi in a line.
VOICE_CAST = {
    "Vikram Sawant": ("manisha", "hi-IN", 0.95),
    "The Fortuner Driver": ("rahul", "hi-IN", 1.0),
    "Mrs. Iyer": ("ratan", "hi-IN", 0.9),
    "Insp. Arjun Kadam": ("aditya", "hi-IN", 0.95),
    "Havildar Desai (Radio)": ("sumit", "hi-IN", 1.05),
    "Ansh Taxi": ("rahul", "hi-IN", 1.15),   # deliberately fast: he is panicking
    "Aarush": ("manisha", "hi-IN", 1.1),
    "Shamika (Kirana Store)": ("priya", "hi-IN", 1.0),
    "System": ("advait", "en-IN", 1.0),
}

# Devanagari range. The engine already has a `isHindiText` test (story/audio.js);
# this is the same rule, kept here so the script does not import browser code.
DEVANAGARI = re.compile(r"[\u0900-\u097F]")

# Aliases for speakers whose name in a level file does not match the cast key.
#
# The dry run surfaced six of them, and two are genuine inconsistencies rather
# than cosmetic: the SAME constable is spelled "Havildar Desai" in some levels
# and "Havaldar Desai" in others, and this campaign keys the radio bank on
# "Havildar Desai (Radio)". Left alone that constable gets two different voices
# depending on which level he speaks in — which is exactly the kind of thing
# that reads as a bug in the audio, not as a naming choice. The aliases below
# fix the spelling; the campaign rename is a separate, deliberate change.
VOICE_ALIASES = {
    "Havaldar Desai": "Havildar Desai (Radio)",              # sic → same constable
    "Havaldar Desai (Radio)": "Havildar Desai (Radio)",      # sic, in parens
    "Crossing Guard Shinde": "Havildar Desai (Radio)",
    "Family Voice": "Ansh Taxi",
    "Sanjana": "Ansh Taxi",
    "Neel & Principal": "Shamika (Kirana Store)",
}


def canonical_speaker(s):
    return VOICE_ALIASES.get(s.strip(), s.strip())


def slugify(s):
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    return s or "unknown"


def load_key():
    if not os.environ.get("SARVAM_API_KEY") and ENV_PATH.exists():
        for raw in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if line.startswith("SARVAM_API_KEY") and "=" in line:
                val = line.split("=", 1)[1].strip().strip("\"'")
                if val:
                    os.environ["SARVAM_API_KEY"] = val
                break
    key = os.environ.get("SARVAM_API_KEY")
    if not key:
        sys.exit(f"SARVAM_API_KEY is not set. Add it to {ENV_PATH} as:  SARVAM_API_KEY=<your key>")
    return key


def collect_lines():
    """Every (speaker, line, triggerZ) across every numbered level.

    Read from levels/*.js by regex rather than by evaluating the file, because
    those files push objects onto window.LVS and need a DOM-ish global to run.
    """
    out = []
    for path in sorted((ROOT / "levels").glob("level*.js")):
        src = path.read_text(encoding="utf-8", errors="replace")
        if "story:" not in src or "dialogue:" not in src:
            continue
        # Each dialogue entry is on one line in every level file:
        #   { triggerZ: -128, speaker: 'X', line: '"..."' },
        for m in re.finditer(
            r"\{\s*triggerZ:\s*(-?[\d.]+)\s*,\s*speaker:\s*'((?:[^'\\]|\\.)*)'\s*,\s*line:\s*'((?:[^'\\]|\\.)*)'\s*\}",
            src,
        ):
            z, speaker, line = m.group(1), m.group(2), m.group(3)
            line = line.replace("\\'", "'").replace('\\"', '"').strip()
            line = line.strip('"').strip()
            if speaker and line:
                out.append({
                    "level": path.stem,
                    "triggerZ": float(z),
                    "speaker": canonical_speaker(speaker),
                    "speakerRaw": speaker,
                    "line": line,
                })
    # De-duplicate AFTER aliasing, so a line spoken by "Havaldar Desai" in L5 and
    # "Havildar Desai (Radio)" in L12 collapses to one file and one voice.
    seen = set()
    uniq = []
    for r in out:
        k = (r["speaker"], r["line"])
        if k in seen:
            continue
        seen.add(k)
        uniq.append(r)
    return uniq


def voice_key(speaker, line):
    """Manifest key: "speaker||line".

    Deliberately a plain composite string, NOT a hash. story/audio.js looks this up
    synchronously from inside say(), so a hash would have meant hand-writing
    SHA-1 in the browser file to match hashlib here — and when that was tried, the
    hand-written digest was wrong, so every line silently fell back to the browser
    voice instead of erroring. A lookup that degrades quietly is the worst place to
    be clever. This string cannot drift.

    It MUST stay identical to voiceKey() in story/audio.js.
    """
    return f"{speaker}||{line}"


def slugify_line(line):
    """A short, stable filename stem for the mp3.

    Not the key: keys contain full sentences and punctuation. This is only for the
    filesystem, so a re-render reuses the same file rather than orphaning it.
    """
    return hashlib.sha1(line.encode("utf-8")).hexdigest()[:12]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="re-render lines that already have audio")
    ap.add_argument("--speaker", help="only this speaker (substring match)")
    ap.add_argument("--dry-run", action="store_true", help="list what would be rendered, make no API calls")
    args = ap.parse_args()

    rows = collect_lines()
    if args.speaker:
        rows = [r for r in rows if args.speaker.lower() in r["speaker"].lower()]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {}
    if MANIFEST.exists():
        try:
            manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            manifest = {}

    todo = []
    for r in rows:
        k = voice_key(r["speaker"], r["line"])
        rel = f"{slugify(r['speaker'])}/{slugify_line(k)}.mp3"
        r["key"] = k
        r["path"] = rel
        if not args.force and (OUT_DIR / rel).exists():
            manifest[k] = {**r, "cached": True}
            continue
        todo.append(r)

    if args.dry_run:
        print(f"{len(rows)} line(s) total, {len(todo)} would be rendered.\n")
        for r in todo:
            voice, lang, pace = VOICE_CAST.get(r["speaker"], ("advait", "en-IN", 1.0))
            if DEVANAGARI.search(r["line"]):
                lang = "hi-IN"
            print(f"  {r['speaker'][:26]:<26} -> {voice:<8} {lang}  {r['line'][:52]}")
        print("\nUnmapped speakers: " + (", ".join(sorted({
            r["speaker"] for r in rows if r["speaker"] not in VOICE_CAST
        })) or "none"))
        return

    if not todo:
        print("Nothing to do — every line already has audio. Use --force to re-render.")
        return

    key = load_key()
    from sarvamai import SarvamAI

    client = SarvamAI(api_subscription_key=key)

    print(f"Rendering {len(todo)} line(s) with Bulbul...\n")
    done = 0
    for i, r in enumerate(todo, 1):
        voice, default_lang, pace = VOICE_CAST.get(r["speaker"], ("advait", "en-IN", 1.0))
        lang = "hi-IN" if DEVANAGARI.search(r["line"]) else default_lang

        dest = OUT_DIR / r["path"]
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            resp = client.text_to_speech.convert(
                text=r["line"],
                language_code=lang,
                speaker=voice,
                model="bulbul:v2",
                pace=pace,
                output_audio_codec="mp3",
            )
        except Exception as exc:                       # noqa: BLE001 - report and continue
            print(f"  [{i}/{len(todo)}] FAIL {r['speaker']}: {type(exc).__name__}: {exc}")
            continue

        data = getattr(resp, "audios", None)
        if isinstance(data, list) and data:
            b64 = data[0]
        elif isinstance(data, str):
            b64 = data
        else:
            print(f"  [{i}/{len(todo)}] FAIL {r['speaker']}: no audio in response")
            continue

        import base64
        dest.write_bytes(base64.b64decode(b64))
        manifest[r["key"]] = {**r, "voice": voice, "language": lang, "pace": pace, "cached": False}
        done += 1
        print(f"  [{i}/{len(todo)}] {r['speaker'][:26]:<26} -> {r['path']}")

    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n{done} rendered, {len(manifest)} total in manifest.")
    print(f"Manifest: {MANIFEST}")


if __name__ == "__main__":
    main()