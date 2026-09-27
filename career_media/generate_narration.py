import os
import subprocess
import win32com.client

def generate_audio():
    base_dir = r"c:\Users\neelg\OneDrive\Desktop\Vercel\career_media"
    wav_out = os.path.join(base_dir, "shorts_narration.wav")
    video_in = os.path.join(base_dir, "Career_Shorts.mp4")
    video_out = os.path.join(base_dir, "Career_Shorts_Narrated.mp4")

    speaker = win32com.client.Dispatch("SAPI.SpVoice")
    stream = win32com.client.Dispatch("SAPI.SpFileStream")
    stream.Open(wav_out, 3)
    speaker.AudioOutputStream = stream
    speaker.Rate = 1  # Brisk, natural tempo calibrated for 41s video

    for v in speaker.GetVoices():
        if "Zira" in v.GetDescription():
            speaker.Voice = v
            break

    # Segments matching each slide duration exactly (39.5s total speech)
    segments = [
        # Slide 1 (00:00 - 00:03.5)
        "Forget generic career advice. Here are 436 real blueprints.",
        # Slide 2 (00:03.5 - 00:07.0)
        "Filter by school stream, degree level, or AI risk.",
        # Slide 3 (00:07.0 - 00:11.0)
        "Every career gets an unboxed dossier with 4-pillar realities.",
        # Slide 4 (00:11.0 - 00:15.0)
        "See an exact hour-by-hour timeline of what they do all day.",
        # Slide 5 (00:15.0 - 00:19.0)
        "Plus honest trade-offs and red flags for who should avoid it.",
        # Slide 6 (00:19.0 - 00:23.0)
        "Test live salary curves across US dollars, India LPA, UK, and UAE.",
        # Slide 7 (00:23.0 - 00:27.0)
        "See their daily tech stack and projects that get you hired.",
        # Slide 8 (00:27.0 - 00:30.5)
        "Take the sixty-second compass to find your match,",
        # Slide 9 (00:30.5 - 00:34.0)
        "or benchmark any two pathways side by side.",
        # Slide 10 (00:34.0 - 00:41.0)
        "Completely free. Link below: explore 436 careers on Advanced Logic Labs."
    ]

    for seg in segments:
        speaker.Speak(seg)

    stream.Close()

    # Check duration
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", wav_out]
    dur = float(subprocess.check_output(cmd).decode().strip())
    print(f"Generated audio duration: {dur:.2f} seconds")

    # Merge audio into video
    merge_cmd = [
        "ffmpeg", "-y",
        "-i", video_in,
        "-i", wav_out,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        video_out
    ]
    res = subprocess.run(merge_cmd, capture_output=True, text=True)
    if res.returncode == 0:
        size_mb = os.path.getsize(video_out) / (1024 * 1024)
        print(f"SUCCESS: Created {video_out} ({size_mb:.2f} MB)")
    else:
        print("FFmpeg error:", res.stderr)

if __name__ == "__main__":
    generate_audio()
