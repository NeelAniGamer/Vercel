import os
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

def make_showcase_video():
    media_dir = r"c:\Users\neelg\OneDrive\Desktop\Vercel\career_media"
    output_mp4 = os.path.join(media_dir, "Career_Detailed_Showcase.mp4")

    # List of shots with durations (in seconds) and subtitles/captions
    shots_info = [
        {
            "file": "shot1_hero.png",
            "duration": 4.0,
            "title": "Class of Learners · Career Explorer",
            "desc": "416 Verified Career Pathways & 50,000+ Searchable Job Titles"
        },
        {
            "file": "shot2_controls_grid.png",
            "duration": 4.0,
            "title": "Interactive Stream Filters & BLS Directory",
            "desc": "Filtered by Academic Stream, Degree Level, and AI Shield Rating"
        },
        {
            "file": "shot3_two_boxes_top.png",
            "duration": 5.0,
            "title": "Two-Box Detail Layout · Info & Pathways",
            "desc": "Box 1: Core Career Info · Box 2: Compensation & Seniority Slider"
        },
        {
            "file": "shot4_two_boxes_middle.png",
            "duration": 4.5,
            "title": "Day-to-Day Reality & Tradeoffs",
            "desc": "Honest Pros & Cons, Questions to Ask, Degrees & Entrance Exams"
        },
        {
            "file": "shot5_two_boxes_roadmap.png",
            "duration": 4.5,
            "title": "AI Shield Rating & 3-Phase Roadmap",
            "desc": "Automation Resilience, Years 0-10+ Progression, and Core Skills"
        },
        {
            "file": "shot6_career_compass.png",
            "duration": 3.5,
            "title": "60-Second Career Compass Quiz",
            "desc": "Step-by-Step Personalized Pathway & Stream Matching"
        },
        {
            "file": "shot7_job_titles_map.png",
            "duration": 3.5,
            "title": "50,000+ Searchable Job Titles Map",
            "desc": "Comprehensive Global Taxonomy Aligned with Bureau of Labor Statistics"
        },
        {
            "file": "shot8_comparison.png",
            "duration": 4.0,
            "title": "Side-by-Side Career Comparison",
            "desc": "Directly Compare Salaries, Exams, AI Impact, and Educational Tracks"
        }
    ]

    target_w = 1920
    target_h = 1080
    fps = 30
    bg_color = (7, 10, 20)  # CoL #070A14 midnight navy

    # Load and prepare images
    loaded_images = []
    for s in shots_info:
        p = os.path.join(media_dir, s["file"])
        if not os.path.exists(p):
            print(f"Error: Missing {p}")
            return False
        im = Image.open(p).convert("RGB")
        loaded_images.append({
            "img": im,
            "duration": s["duration"],
            "title": s["title"],
            "desc": s["desc"]
        })

    # Prepare ffmpeg command with stdin pipe
    cmd = [
        "ffmpeg",
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{target_w}x{target_h}",
        "-pix_fmt", "rgb24",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        output_mp4
    ]

    print(f"Starting ffmpeg to render {output_mp4} at {target_w}x{target_h} @ {fps}fps...")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    # Frame generator
    total_shots = len(loaded_images)
    transition_frames = 15  # 0.5s crossfade between shots

    for idx, item in enumerate(loaded_images):
        src_img = item["img"]
        src_w, src_h = src_img.size
        duration = item["duration"]
        n_frames = int(duration * fps)

        title = item["title"]
        desc = item["desc"]

        # Base scaled canvas
        scale = min(target_w / src_w, target_h / src_h)
        base_w = int(src_w * scale)
        base_h = int(src_h * scale)
        base_img = src_img.resize((base_w, base_h), Image.Resampling.LANCZOS)

        for f in range(n_frames):
            # Subtle smooth zoom: from 1.0 to 1.03
            progress = f / max(n_frames - 1, 1)
            zoom = 1.0 + 0.025 * progress
            cur_w = int(base_w * zoom)
            cur_h = int(base_h * zoom)

            # Center crop or center paste
            zoomed = base_img.resize((cur_w, cur_h), Image.Resampling.BILINEAR)
            x_offset = (target_w - cur_w) // 2
            y_offset = (target_h - cur_h) // 2

            frame = Image.new("RGB", (target_w, target_h), bg_color)
            frame.paste(zoomed, (x_offset, y_offset))

            # Bottom info banner
            draw = ImageDraw.Draw(frame)
            banner_h = 74
            banner_y = target_h - banner_h - 24
            banner_w = 980
            banner_x = (target_w - banner_w) // 2

            # Semi-transparent sleek dark card for caption
            overlay = Image.new("RGBA", (banner_w, banner_h), (12, 18, 36, 235))
            overlay_draw = ImageDraw.Draw(overlay)
            overlay_draw.rectangle([0, 0, banner_w - 1, banner_h - 1], outline=(242, 184, 75, 120), width=1)
            
            # Simple text rendering
            overlay_draw.text((24, 14), title, fill=(242, 184, 75)) # Gold
            overlay_draw.text((24, 40), desc, fill=(232, 227, 216))  # Ivory

            frame.paste(overlay, (banner_x, banner_y), overlay)

            # Push raw bytes to ffmpeg
            proc.stdin.write(frame.tobytes())

    proc.stdin.close()
    proc.wait()

    if proc.returncode == 0:
        file_size = os.path.getsize(output_mp4)
        print(f"SUCCESS: Video rendered successfully! Size: {file_size / (1024*1024):.2f} MB")
        return True
    else:
        print(f"FFmpeg failed with returncode {proc.returncode}")
        return False

if __name__ == "__main__":
    success = make_showcase_video()
    sys.exit(0 if success else 1)
