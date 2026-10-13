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
#
# The Bulbul roster is PER MODEL VERSION and the two versions barely overlap.
# v3 offers 36 speakers; v2 offered 7, and of those only `rahul`-class names
# carry over. `manisha` — the voice this cast originally assigned to SI Vikram
# and to Aarush — is a v2 name with no v3 equivalent, so both were remapped
# rather than left to fail 29 identical HTTP 400s.
#
# ROSTERS AS OF 2026-10-08, read back off the API rather than from docs, because
# docs lag and this list is what the server actually enforces:
#   v3: aditya ritu ashutosh priya neha rahul pooja rohan simran kavya amit dev
#       ishita shreya ratan varun manan sumit roopa kabir aayan shubh advait anand
#       tanya tarun sunny mani gokul vijay shruti suhani mohit kavitha rehan
#       soham rupali
#   v2: anushka abhilash manisha vidya arya karun hitesh
BULBUL_V3_SPEAKERS = frozenset("""
aditya ritu ashutosh priya neha rahul pooja rohan simran kavya amit dev ishita
shreya ratan varun manan sumit roopa kabir aayan shubh advait anand tanya tarun
sunny mani gokul vijay shruti suhani mohit kavitha rehan soham rupali
""".split())

VOICE_CAST = {
    "Vikram Sawant": ("ashutosh", "hi-IN", 0.95),
    "The Fortuner Driver": ("rahul", "hi-IN", 1.0),
    "Mrs. Iyer": ("ratan", "hi-IN", 0.9),
    "Insp. Arjun Kadam": ("aditya", "hi-IN", 0.95),
    "Havildar Desai (Radio)": ("sumit", "hi-IN", 1.05),
    "Ansh Taxi": ("rahul", "hi-IN", 1.15),   # deliberately fast: he is panicking
    "Aarush": ("rohan", "hi-IN", 1.1),
    "Shamika (Kirana Store)": ("priya", "hi-IN", 1.0),
    "System": ("advait", "en-IN", 1.0),
    # ── Characters who exist only in the FILM ──────────────────────────────
    # These two have no in-world `story.dialogue[]` entry, so the level-file scan
    # never saw them and they were absent from this cast entirely. Absent means
    # `System`, which gave four separate characters the same voice — including
    # the VIP and the police wireless, who are supposed to sound like nothing
    # else in the film.
    #
    # PROVISIONAL. The speaker names below were chosen by register on the face of
    # it (anand: low and unhurried for a man we never see; vijay: clipped and
    # procedural for a dispatcher) because nobody has heard these voices yet.
    # Swap them freely — one dict, then `precompute_voices.py --force --speaker X`.
    "Shadowed VIP Passenger": ("anand", "hi-IN", 0.88),
    "Mumbai Police Wireless": ("vijay", "hi-IN", 1.02),
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
    # The FILM names its characters by RANK, because a police procedural does that
    # in the dialogue slate: the level files call him "Vikram Sawant" and the film
    # calls him "SI Vikram Sawant". Same constable, and without these two he ends
    # up cast twice — once properly, once as `System` — which is worse than either
    # spelling being wrong on its own.
    "SI Vikram Sawant": "Vikram Sawant",
    "Fortuner Escort Driver": "The Fortuner Driver",
}


def canonical_speaker(s):
    return VOICE_ALIASES.get(s.strip(), s.strip())


# The model is a constant, not an inline string, because the speaker roster is
# version-specific and the two have to move together. `bulbul:v2` is deprecated —
# the API now answers it with "Model 'bulbul:v2' has been deprecated. Please use
# 'bulbul:v3' instead." — and the failure mode is expensive to discover: every
# single line 400s, and the error names the speaker problem and the model problem
# in the same response, so it reads like two unrelated faults.
BULBUL_MODEL = "bulbul:v3"


def validate_voice_cast():
    """Fail fast on a speaker the model will not accept.

    Without this the script spends 29 HTTP round-trips to discover one bad name,
    and every line's error is identical, so the real cause is easy to miss in the
    noise. One line of output, before any audio is requested.
    """
    bad = {}
    for who, (voice, _lang, _pace) in VOICE_CAST.items():
        if voice not in BULBUL_V3_SPEAKERS:
            bad.setdefault(voice, []).append(who)
    if bad:
        print("  VOICE CAST INVALID for " + BULBUL_MODEL + ":")
        for voice, who in sorted(bad.items()):
            print(f"    {voice!r} -> {', '.join(who)}")
        sys.exit(1)


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
    # ── The FILM's own dialogue ──────────────────────────────────────────────
    # A cutscene speaks through a completely different channel from the in-world
    # dialogue above, and rendering only the in-world channel left the film half
    # voiced: 7 of 14 lines in story/campaign.js had a recording and the other 7
    # silently fell back to the browser voice. That is worse than either being
    # consistent — a film where some characters have a voice actor and others have
    # a text-to-speech reader.
    #
    # The runtime key for a film line is `speaker||stripQuotes(line)`, because
    # story/audio.js calls `say(stripQuotes(shot.sub.line), {speaker})` before
    # building the key. So the quotes in `line: '"Control Room, ..."'` are part of
    # the SOURCE and must NOT be part of the key, or the lookup misses.
    #
    # Two shapes appear in campaign.js and both are handled positionally:
    #     sub: { speaker: 'X', line: 'Y' }      shot subtitle
    #     speaker: 'X', ... line: 'Y'           beat-level line
    # In both, `speaker` immediately precedes `line`, so pairing the next `line:`
    # after each `speaker:` within a short window is correct and needs no parser.
    for path in sorted((ROOT / "story").glob("*.js")):
        src = path.read_text(encoding="utf-8", errors="replace")
        if "speaker:" not in src:
            continue
        for m in re.finditer(
            r"speaker:\s*'((?:[^'\\]|\\.)*)'(?:(?!\bspeaker:).){0,400}?line:\s*'((?:[^'\\]|\\.)*)'",
            src,
            re.S,
        ):
            speaker = m.group(1).replace("\\'", "'").replace('\\"', '"').strip()
            line = m.group(2).replace("\\'", "'").replace('\\"', '"').strip()
            # Strip exactly what stripQuotes() strips in story/audio.js.
            line = re.sub(r'^\s*["“”\']+', "", line)
            line = re.sub(r'["“”\']+\s*$', "", line).strip()
            if speaker and line:
                out.append({
                    "level": path.stem,
                    "triggerZ": 0.0,
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

    # Before anything else, and before the API is even constructed: a bad speaker
    # name is a content bug in this file, not a runtime condition, and it should
    # stop the run rather than produce one HTTP failure per line.
    validate_voice_cast()

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
                model=BULBUL_MODEL,
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
        # ALSO write the key under the RAW speaker name, pointing at the SAME file.
        #
        # The alias above lives only in this script. The browser does no aliasing:
        # story/audio.js builds its key from `shot.sub.speaker` verbatim, so a line
        # the film attributes to "SI Vikram Sawant" is looked up as
        # "SI Vikram Sawant||..." while this script had filed the audio under
        # "Vikram Sawant||...". The mp3 existed and was still never played —
        # a silent half-voiced film that a manifest-full-of-entries check passes,
        # because the entries are all there and none of them are the one being
        # asked for.
        #
        # Two keys, one file: no duplicated audio bytes.
        if r.get("speakerRaw") and r["speakerRaw"] != r["speaker"]:
            raw_key = voice_key(r["speakerRaw"], r["line"])
            manifest.setdefault(raw_key, {**r, "speaker": r["speakerRaw"],
                                          "voice": voice, "language": lang,
                                          "pace": pace, "cached": False,
                                          "aliasOf": r["key"]})
        done += 1
        print(f"  [{i}/{len(todo)}] {r['speaker'][:26]:<26} -> {r['path']}")

    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n{done} rendered, {len(manifest)} total in manifest.")
    print(f"Manifest: {MANIFEST}")


if __name__ == "__main__":
    main()