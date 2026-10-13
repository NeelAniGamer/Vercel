"""
Measure the pacing of an authored film in story/campaign.js against the numbers
taken from the Vaseline Noodles transcripts (median 151 wpm, median 7s silence).

WHY A SCRIPT FOR THIS
  "Make it feel like a movie" is not an action you can apply by feel. The only
  version of it that survives contact with the code is a number, and the two
  numbers that describe comedy/cinema pacing are both measurable from a shot
  list: how fast the dialogue runs, and how long the film is willing to say
  nothing. So this reads the film and reports them.

WHAT IT REPORTS
  per shot      duration, words spoken, delivery wpm inside the spoken window
  per film      total duration, spoken words, overall wpm, silence map
  the reference median 151 wpm / 7s silence

WHAT IT DOES NOT DO
  It does not grade the film or decide that a number is wrong. It prints numbers
  and marks the one deviation worth arguing about — a film that never sits silent
  longer than a cut. That judgement is editorial and stays with a human.

USAGE
  python scripts/analyze_film.py 1
  python scripts/analyze_film.py 1 --ref VaselineNoodles
"""

import argparse
import json
import pathlib
import re
import statistics
import sys

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = pathlib.Path(__file__).resolve().parent.parent
CAMPAIGN = ROOT / "story" / "campaign.js"
REF = ROOT / "scratch" / "ref"

# The reference median from scripts/analyze_ref.py over 12 transcripts.
REF_WPM = 151.0
REF_SILENCE = 7.0

# Mirrors story/shots.js MIN_SHOT. Duplicated rather than imported because that
# file is browser JS wrapped in an IIFE that needs window; the number is short
# and this is the file that has to stand alone when the film is being authored.
MIN_SHOT = 4
MAX_SHOT = 12
MAX_HOLD = 10


def load_films(level_id):
    """Return window.STORY as parsed by the real campaign.js.

    Delegates to scripts/_dump_story.js, which requires the actual module under a
    shimmed `window`. Re-parsing the source with a regex here would let this
    report disagree with what the browser registers, which is the one thing a
    pacing report must never do.
    """
    import subprocess

    dumper = ROOT / "scripts" / "_dump_story.js"
    p = subprocess.run(
        ["node", str(dumper)], capture_output=True, text=True, encoding="utf-8"
    )
    if p.returncode != 0:
        sys.exit("campaign.js failed to evaluate:\n" + (p.stderr or "")[:2000])
    return json.loads(p.stdout)


def words_in(line):
    if not line:
        return 0
    return len(re.sub(r"[^\w']+", " ", line).split())


def shot_words(shot):
    """Total words a shot speaks, counting both its sub and its sayThen."""
    total = 0
    sub = shot.get("sub") or {}
    total += words_in(re.sub(r'^"|"$', "", sub.get("line") or ""))
    then = shot.get("sayThen") or {}
    total += words_in(re.sub(r'^"|"$', "", then.get("line") or ""))
    return total


def report(level_id, film, name):
    def shots_of(seq):
        return seq if isinstance(seq, list) else []

    prologue = shots_of(film.get("prologue"))
    beats = film.get("beats") or []

    films = [("PROLOGUE", prologue)]
    for b in beats:
        films.append(("BEAT · " + (b.get("title") or b.get("after")), shots_of(b.get("shots"))))

    print(f"\n{'=' * 78}\nLevel {level_id} · {name}\n{'=' * 78}")

    grand_total = 0.0
    grand_words = 0
    grand_holds = []

    for label, shots in films:
        if not shots:
            continue
        print(f"\n{label}  ({len(shots)} shots)")
        print(f"  {'#':>2} {'dur':>6} {'words':>6} {'wpm':>6} {'hold':>7}  title / speaker")
        print("  " + "-" * 74)

        for i, s in enumerate(shots, 1):
            dur = float(s.get("dur") or 6)
            then = s.get("sayThen") or {}

            w1 = words_in(re.sub(r'^"|"$', "", (s.get("sub") or {}).get("line") or ""))
            w2 = words_in(re.sub(r'^"|"$', "", then.get("line") or ""))

            # Measure EACH utterance in its own window. Pooling a two-line shot
            # into one rate produces a number that belongs to neither line — an
            # 11s shot carrying 16 words then 13 reads as "330 wpm", which is
            # nonsense, because each line had its own five-and-a-half seconds.
            w1_end = dur * float(then.get("at") or 1.0) if then else dur
            rate1 = (w1 / (w1_end / 60.0)) if w1 and w1_end > 0 else 0.0
            rate2 = (w2 / ((dur - w1_end) / 60.0)) if w2 else 0.0

            # Seconds after the last word with nobody speaking. An authored `hold`
            # counts as deliberate; the slack inside a shot that has none does not,
            # because slack is a leftover, not a choice.
            authored_hold = min(float(s.get("hold") or 0.0), MAX_HOLD)
            tail_speak_end = w1_end if not w2 else dur
            tail = max(0.0, dur - tail_speak_end) if (w1 or w2) else dur

            if not w1 and not w2:
                slack = dur
            else:
                slack = authored_hold

            grand_holds.append((authored_hold if slack else 0.0, slack, i))
            grand_total += dur

            tag = s.get("title") or (s.get("sub") or {}).get("speaker") or "(silent)"
            rates = "/".join(
                f"{r:.0f}" for r in (rate1, rate2) if r
            ) or "-"
            print(f"  {i:>2} {dur:>5.0f}s {w1 + w2:>6} {rates:>7} "
                  f"{authored_hold:>5.1f}s  {tag[:30]}")

            line = re.sub(r'^"|"$', "", (s.get("sub") or {}).get("line") or "")
            if line:
                print(f"     {'':<27}{line[:56]}")
            if then:
                t2 = re.sub(r'^"|"$', "", then.get("line") or "")
                print(f"     {'':<27}» {t2[:52]}")

        f_words = sum(shot_words(s) for s in shots)
        f_dur = sum(float(s.get("dur") or 6) for s in shots)
        grand_words += f_words
        fwpm = (f_words / f_dur * 60) if f_dur else 0
        print("  " + "-" * 74)
        print(f"  {'':>2} {f_dur:>5.0f}s {f_words:>6} {fwpm:>6.0f}")

    all_moves = [
        float(s.get("dur") or 6) - min(float(s.get("hold") or 0.0), MAX_HOLD)
        for _, ss in films for s in ss
    ]
    under = [d for d in all_moves if d < MIN_SHOT]
    over = [d for d in all_moves if d > MAX_SHOT + 0.001]

    # Deliberate holds only. A shot that happens to end a second after its last
    # word is not a held beat, and counting it as one would let a film pad its
    # runtime with slack and then call the result paced.
    authored = sorted(h for h, _, _ in grand_holds if h > 0)
    silent_shots = [i for _, s, i in grand_holds if s > 0 and _ == 0]

    print(f"\n  film total      {grand_total:.0f}s  ({grand_total / 60:.1f} min)")
    print(f"  spoken words    {grand_words}")
    print(f"  overall wpm     {grand_words / grand_total * 60:.0f}   "
          f"reference median {REF_WPM:.0f}")

    if authored:
        print(f"  authored holds  {len(authored)}   "
              f"median {statistics.median(authored):.1f}s   "
              f"longest {max(authored):.1f}s")
        deep = [h for h in authored if h >= REF_SILENCE]
        print(f"    >= {REF_SILENCE:.0f}s: {len(deep)}   "
              f"(reference median is {REF_SILENCE:.0f}s)")
    else:
        print("  authored holds  0   — the film cannot express a deliberate silence")

    if under:
        print(f"  UNDER move floor: {[round(d) for d in under]}")
    if over:
        print(f"  over MAX move:     {[round(d) for d in over]}")
    print()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("level", help="level id, e.g. 1")
    ap.add_argument("--ref", help="also print the reference table for this channel")
    args = ap.parse_args()

    films = load_films(args.level)
    film = films.get(args.level)
    if not film:
        sys.exit(f"No window.STORY['{args.level}'] in campaign.js. "
                 f"Has: {sorted(films)}")
    report(args.level, film, film.get("title") or "")


if __name__ == "__main__":
    main()