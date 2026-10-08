"""
Reference analysis — what the Vaseline Noodles transcripts actually show about
their pacing, as opposed to what it feels like watching.

Run after scripts/youtube_ref.py:
    python scripts/analyze_ref.py VaselineNoodles

This reports only things measurable from a transcript: line lengths, words per
minute, silence gaps, question frequency, and where the turns fall.

WHAT IT DELIBERATELY DOES NOT CLAIM
  Nothing here measures cinematography. A transcript contains no cuts, no camera
  angles, no shot lengths. If you want "how often do they cut" that is not this
  tool and I will not invent a number for it.
"""

import argparse
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
REF = ROOT / "scratch" / "ref"

STAMP = re.compile(r"^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$")


def parse(path):
    """-> list of (seconds, text)"""
    out = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        m = STAMP.match(line.strip())
        if m:
            out.append((int(m.group(1)) * 60 + float(m.group(2)), m.group(3)))
    return out


def analyse(path):
    rows = parse(path)
    if len(rows) < 5:
        return None

    times = [t for t, _ in rows]
    texts = [x for _, x in rows]

    # Gaps between consecutive caption events. Auto-captions break on natural
    # pauses, so a long gap is where a beat is sitting silent — the number that
    # matters for comedy timing.
    gaps = [b - a for a, b in zip(times, times[1:])]
    pauses = sorted(g for g in gaps if g >= 0.8)

    words = sum(len(t.split()) for t in texts)
    dur = times[-1] - times[0]
    wpm = (words / dur * 60) if dur > 0 else 0

    words_per_line = [len(t.split()) for t in texts]

    return {
        "duration": dur,
        "lines": len(rows),
        "words": words,
        "wpm": wpm,
        "median_words_per_line": statistics.median(words_per_line),
        "max_words_per_line": max(words_per_line),
        "questions": sum(1 for t in texts if "?" in t),
        "pause_count": len(pauses),
        "longest_pause": max(pauses) if pauses else 0.0,
        "median_pause": statistics.median(pauses) if pauses else 0.0,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("channel", help="folder under scratch/ref, e.g. VaselineNoodles")
    ap.add_argument("--show-longest", type=int, default=0, help="print the N longest pauses")
    args = ap.parse_args()

    folder = REF / args.channel
    if not folder.is_dir():
        sys.exit(f"No reference folder at {folder}. Run scripts/youtube_ref.py --channel @{args.channel} first.")

    files = sorted(folder.glob("*.txt"))
    if not files:
        sys.exit(f"No transcripts in {folder}.")

    results = []
    for f in files:
        r = analyse(f)
        if r:
            r["file"] = f
            results.append(r)

    if not results:
        sys.exit("No transcript had enough lines to analyse.")

    results.sort(key=lambda r: r["duration"])

    print(f"\n{args.channel} — {len(results)} transcript(s)\n")
    hdr = f"{'file':<22}{'dur':>7}{'lines':>7}{'wpm':>7}{'med w/l':>9}{'?':>4}{'pauses':>8}{'longest':>9}"
    print(hdr)
    print("-" * len(hdr))
    for r in results:
        name = r["file"].stem[:20]
        print(f"{name:<22}{r['duration']:>6.0f}s{r['lines']:>7}{r['wpm']:>7.0f}"
              f"{r['median_words_per_line']:>9.1f}{r['questions']:>4}{r['pause_count']:>8}"
              f"{r['longest_pause']:>8.1f}s")

    all_wpm = [r["wpm"] for r in results]
    all_med = [r["median_words_per_line"] for r in results]
    all_pause = [r["longest_pause"] for r in results]
    print("-" * len(hdr))
    print(f"{'MEDIAN':<22}{'':>7}{'':>7}{statistics.median(all_wpm):>7.0f}"
          f"{statistics.median(all_med):>9.1f}{'':>4}{'':>8}{statistics.median(all_pause):>8.1f}s")

    if args.show_longest:
        target = max(results, key=lambda r: r["duration"])
        rows = parse(target["file"])
        gaps = [(rows[i + 1][0] - rows[i][0], rows[i][1], rows[i + 1][1]) for i in range(len(rows) - 1)]
        print(f"\nLongest pauses in {target['file'].name}:")
        for g, before, after in sorted(gaps, reverse=True)[:args.show_longest]:
            print(f"  {g:5.1f}s  {before[-44:]!r}  ->  {after[:44]!r}")

    print()


if __name__ == "__main__":
    main()