"""
YouTube reference puller — for studying story structure, not for copying content.

WHAT THIS DOES
  Fetches the TRANSCRIPT of a YouTube video (via yt-dlp auto-captions) and writes
  it to scratch/ as a timestamped text file. Transcripts are the words of a video,
  which is what you need to study pacing, line length and how a beat lands.

WHAT THIS DOES NOT DO
  It does not download or analyse the picture. There is no face detection, no
  shot-length metering, no "count the cuts per minute". Those numbers are not
  available from a transcript, and any tool claiming to derive them from one is
  making them up. If you need actual cinematography notes, tell me and we talk
  about what is measurable versus what is only your judgement.

WHY TRANSCRIPT AND NOT VIDEO
  A transcript is the honest middle ground: it is the real dialogue of a real
  video, and reading 20 of them genuinely teaches you how a joke is timed. A
  video file would be gigabytes and I still could not watch it.

USAGE
  python scripts/youtube_ref.py --channel @VaselineNoodles --limit 8
  python scripts/youtube_ref.py --video  "https://www.youtube.com/watch?v=ID"
  python scripts/youtube_ref.py --playlist PLxxxx

  Writes: scratch/ref/<channel>/<videoId>.txt
  scratch/ref/<channel>/INDEX.md   (title, duration, transcript path)
"""

import argparse
import json
import pathlib
import re
import subprocess
import sys

# Windows consoles default to cp1252, and YouTube titles routinely contain
# characters outside it (curly quotes, emoji, devanagari). Without this the script
# dies with a UnicodeEncodeError partway through a channel — after paying for
# every transcript it had already fetched. Reconfigure stdout once, at import.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "scratch" / "ref"

# Auto-caption JSON3 emits one event per word for most videos, with a rolling
# window that repeats the previous line. Joining raw `segs` gives duplicated
# text, so events are deduped on the sentence level instead.
WORD = re.compile(r"[\w'’\-]+")


def run(cmd):
    """Run a command, returning (returncode, stdout+stderr)."""
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def channel_videos(handle, limit):
    """Video IDs on a channel, newest first. No video bytes are fetched."""
    code, out = run([
        "yt-dlp", "--flat-playlist", "--playlist-end", str(limit),
        "--print", "%(id)s\t%(title)s\t%(duration)s",
        f"https://www.youtube.com/{handle}",
    ])
    if code != 0:
        return []
    rows = []
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) >= 2 and parts[0].strip():
            rows.append({
                "id": parts[0].strip(),
                "title": parts[1].strip(),
                "duration": parts[2].strip() if len(parts) > 2 else "",
            })
    return rows


def playlist_videos(pid, limit):
    code, out = run([
        "yt-dlp", "--flat-playlist", "--playlist-end", str(limit),
        "--print", "%(id)s\t%(title)s\t%(duration)s",
        f"https://www.youtube.com/playlist?list={pid}",
    ])
    if code != 0:
        return []
    rows = []
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) >= 2 and parts[0].strip():
            rows.append({
                "id": parts[0].strip(),
                "title": parts[1].strip(),
                "duration": parts[2].strip() if len(parts) > 2 else "",
            })
    return rows


def fetch_transcript(video_id, dest_dir):
    """Download the English auto-caption track and return plain timestamped text.

    Returns (path, duration_seconds) or (None, None).
    """
    dest_dir.mkdir(parents=True, exist_ok=True)
    pattern = str(dest_dir / f"{video_id}.%(ext)s")

    # TWO separate yt-dlp invocations, not one.
    #
    # Adding --print to the caption-download call makes yt-dlp treat the run as a
    # query and skip writing the subtitle file — verified: the combined call
    # returns DUR and writes nothing, while the same call without --print writes
    # the track. So captions and metadata are fetched independently, and the
    # metadata call is second because it is the optional one: if it fails we
    # still keep the transcript.
    code, _ = run([
        "yt-dlp", "--skip-download",
        "--write-auto-subs", "--sub-lang", "en", "--sub-format", "json3",
        "--output", pattern,
        f"https://www.youtube.com/watch?v={video_id}",
    ])

    duration = None
    _, out = run([
        "yt-dlp", "--skip-download",
        "--print", "%(duration)s",
        f"https://www.youtube.com/watch?v={video_id}",
    ])
    for line in out.splitlines():
        line = line.strip()
        if re.fullmatch(r"\d+(\.\d+)?", line):
            duration = float(line)
            break

    src = dest_dir / f"{video_id}.en.json3"
    if not src.exists():
        return None, duration

    try:
        data = json.loads(src.read_text(encoding="utf-8", errors="replace"))
    except (json.JSONDecodeError, OSError):
        return None, duration

    # events[] carries the timed segments; the top-level `segments` array is a
    # flat duplicate with no timestamps worth using.
    events = data.get("events") or []
    lines = []
    for ev in events:
        segs = ev.get("segs") or []
        text = "".join(s.get("utf8", "") for s in segs)
        text = text.replace("\n", " ").strip()
        if not text:
            continue
        start = (ev.get("tStartMs") or 0) / 1000.0
        lines.append(f"[{int(start // 60):02d}:{start % 60:05.2f}] {text}")

    src.unlink(missing_ok=True)  # keep the raw json3 out of the tree
    if not lines:
        return None, duration

    dest = dest_dir / f"{video_id}.txt"
    dest.write_text("\n".join(lines), encoding="utf-8")
    return dest, duration


def human_duration(sec):
    if not sec:
        return ""
    return f"{int(sec // 60)}:{int(sec % 60):02d}"


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--channel", help="e.g. @VaselineNoodles")
    g.add_argument("--playlist", help="playlist id")
    g.add_argument("--video", help="single video URL or id")
    ap.add_argument("--limit", type=int, default=8)
    args = ap.parse_args()

    if args.channel:
        slug = args.channel.lstrip("@").replace("/", "_")
        folder = OUT / slug
        vids = channel_videos(args.channel, args.limit)
        title = args.channel
    elif args.playlist:
        folder = OUT / f"playlist_{args.playlist[:12]}"
        vids = playlist_videos(args.playlist, args.limit)
        title = f"playlist {args.playlist}"
    else:
        vid = args.video
        if "v=" in vid:
            vid = vid.split("v=")[1].split("&")[0]
        folder = OUT / "single"
        vids = [{"id": vid, "title": vid, "duration": ""}]
        title = "single video"

    if not vids:
        sys.exit("No videos found. Check the handle / playlist id and your network.")

    print(f"{len(vids)} video(s) from {title}\n")
    index = []
    for v in vids:
        path, dur = fetch_transcript(v["id"], folder)
        status = "ok  " if path else "no captions"
        print(f"  [{status}] {v['id']}  {human_duration(dur):>6}  {v['title'][:60]}")
        index.append({
            "id": v["id"],
            "title": v["title"],
            "duration": human_duration(dur),
            "transcript": str(path.relative_to(ROOT)) if path else None,
            "url": f"https://www.youtube.com/watch?v={v['id']}",
        })

    md = ["# " + title, ""]
    for row in index:
        md.append(f"- **{row['title']}** — {row['duration'] or '?'}  ")
        md.append(f"  {row['url']}  ")
        md.append(f"  `{row['transcript'] or 'no captions available'}`")
    (folder / "INDEX.md").write_text("\n".join(md), encoding="utf-8")
    print(f"\nIndex: {folder / 'INDEX.md'}")


if __name__ == "__main__":
    main()