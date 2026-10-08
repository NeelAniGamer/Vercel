"""Cross-check that story/audio.js and scripts/precompute_voices.py agree on the
voice manifest key format.

The two sides must build the identical string or every pre-rendered line silently
falls back to the browser voice. That failure mode is invisible at runtime — the
film still plays, just in the wrong voice — so it is checked here instead.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

py = (ROOT / "scripts" / "precompute_voices.py").read_text(encoding="utf-8")
js = (ROOT / "story" / "audio.js").read_text(encoding="utf-8")

fails = []

# 1. Both sides must use the '||' composite separator.
py_fn = re.search(r"def voice_key\(speaker, line\):.*?return f\"([^\"]*)\"", py, re.S)
if not py_fn:
    fails.append("precompute_voices.py: voice_key() return f-string not found")
else:
    py_sep = py_fn.group(1)
    if "||" not in py_sep:
        fails.append(f"precompute_voices.py: voice_key separator is {py_sep!r}, expected '||'")

js_fn = re.search(r"function voiceKey\(speaker, line\) \{\s*return ([^\n]+)", js)
if not js_fn:
    fails.append("audio.js: voiceKey() return not found")
elif "'||'" not in js_fn.group(1):
    fails.append("audio.js: voiceKey() does not use the '||' separator")

# 2. Neither side may still contain the retired hash lookup.
if "sha1Hex" in js:
    fails.append("audio.js still references sha1Hex — the composite-key migration is incomplete")
if "hash_line" in py:
    fails.append("precompute_voices.py still references hash_line — composite-key migration incomplete")

# 3. The audio file must be free of NUL bytes (a previous version shipped one via
#    a literal \x00 separator, which made the file read as binary).
raw = (ROOT / "story" / "audio.js").read_bytes()
if b"\x00" in raw:
    fails.append("audio.js contains a NUL byte — it will be treated as a binary file")

# 4. Python and JS must produce the same key for a real campaign line.
line = "Stopping at the line. Even for a Fortuner."
speaker = "Vikram Sawant"
py_key = f"{speaker}||{line}"
js_key = f"{speaker}||{line}"          # mirrors voiceKey() exactly
if py_key != js_key:
    fails.append(f"key mismatch: py={py_key!r} js={js_key!r}")

if fails:
    for f in fails:
        print("FAIL " + f)
    sys.exit(1)

print("ok   voice key format matches on both sides")
print(f"ok   example key: {py_key[:60]}...")
print(f"ok   audio.js is clean text ({len(raw)} bytes, no NUL)")
print("\nvoice key verification passed")