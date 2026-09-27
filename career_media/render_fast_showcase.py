import os
import subprocess
import sys
from PIL import Image, ImageDraw

def render_showcase():
    media_dir = r"c:\Users\neelg\OneDrive\Desktop\Vercel\career_media"
    output_mp4 = os.path.join(media_dir, "Career_Detailed_Showcase.mp4")

    shots = [
        {
            "src": "shot1_hero.png",
            "out": "slide1.png",
            "duration": 4.0,
            "title": "Class of Learners · Career Explorer",
            "desc": "436 Comprehensive Career Blueprints & 50,000+ Searchable Job Titles"
        },
        {
            "src": "shot2_controls_grid.png",
            "out": "slide2.png",
            "duration": 4.0,
            "title": "Interactive Stream Filters & BLS Directory",
            "desc": "Filtered by Academic Stream, Degree Level, and AI Shield Rating"
        },
        {
            "src": "shot3_dossier_hero.png",
            "out": "slide3.png",
            "duration": 5.0,
            "title": "Tabbed Career Dossier · Un-Congested & Spacious",
            "desc": "Hour-by-Hour Daily Rhythm, Workplace Flexibility Matrix, and 4-Card Hero Ribbon"
        },
        {
            "src": "shot4_dossier_tradeoffs.png",
            "out": "slide4.png",
            "duration": 4.5,
            "title": "Honest Trade-Offs & Unvarnished Reality",
            "desc": "The Upside vs The Hard Reality, and Honest Red Flags: Who Should Avoid"
        },
        {
            "src": "shot5_dossier_roadmap.png",
            "out": "slide5.png",
            "duration": 4.5,
            "title": "Global Compensation Benchmarks & 10-Yr Roadmap",
            "desc": "Multi-Currency Pay (US, India, UK, UAE), Seniority Curve Slider, and 3-Phase Milestones"
        },
        {
            "src": "shot6_career_compass.png",
            "out": "slide6.png",
            "duration": 3.5,
            "title": "60-Second Career Compass Quiz",
            "desc": "Step-by-Step Personalized Pathway & Stream Matching"
        },
        {
            "src": "shot7_job_titles_map.png",
            "out": "slide7.png",
            "duration": 3.5,
            "title": "50,000+ Searchable Job Titles Map",
            "desc": "Comprehensive Global Taxonomy Aligned with Bureau of Labor Statistics"
        },
        {
            "src": "shot8_comparison.png",
            "out": "slide8.png",
            "duration": 4.0,
            "title": "Side-by-Side Career Comparison",
            "desc": "Directly Compare Salaries, Exams, AI Impact, and Educational Tracks"
        }
    ]

    target_w, target_h = 1920, 1080
    bg_color = (7, 10, 20)  # CoL #070A14

    # 1. Create the composite slides
    concat_lines = []
    for s in shots:
        src_path = os.path.join(media_dir, s["src"])
        out_path = os.path.join(media_dir, s["out"])

        im = Image.open(src_path).convert("RGB")
        src_w, src_h = im.size

        scale = min(target_w / src_w, target_h / src_h)
        new_w, new_h = int(src_w * scale), int(src_h * scale)
        scaled = im.resize((new_w, new_h), Image.Resampling.LANCZOS)

        canvas = Image.new("RGB", (target_w, target_h), bg_color)
        x_off = (target_w - new_w) // 2
        y_off = (target_h - new_h) // 2
        canvas.paste(scaled, (x_off, y_off))

        # Bottom info card
        banner_w = 1000
        banner_h = 76
        banner_x = (target_w - banner_w) // 2
        banner_y = target_h - banner_h - 22

        overlay = Image.new("RGBA", (banner_w, banner_h), (12, 18, 36, 240))
        draw = ImageDraw.Draw(overlay)
        # Gold accent top border
        draw.line([(0, 0), (banner_w, 0)], fill=(242, 184, 75, 255), width=2)
        draw.rectangle([0, 0, banner_w - 1, banner_h - 1], outline=(255, 255, 255, 30), width=1)

        draw.text((24, 13), s["title"], fill=(242, 184, 75))
        draw.text((24, 40), s["desc"], fill=(232, 227, 216))

        canvas.paste(overlay, (banner_x, banner_y), overlay)
        canvas.save(out_path, quality=95)

        concat_lines.append(f"file '{s['out']}'")
        concat_lines.append(f"duration {s['duration']}")

    # Need to repeat last file for ffmpeg concat demuxer
    concat_lines.append(f"file '{shots[-1]['out']}'")

    concat_file = os.path.join(media_dir, "slides.txt")
    with open(concat_file, "w") as f:
        f.write("\n".join(concat_lines) + "\n")

    print(f"Generated 8 1080p slides. Running FFmpeg concat...")

    # 2. Run FFmpeg concat with 60fps smoothing
    cmd = [
        "ffmpeg",
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_file,
        "-vf", "fps=60,format=yuv420p",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-movflags", "+faststart",
        output_mp4
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
        print(f"SUCCESS: Video rendered: {output_mp4} ({size_mb:.2f} MB)")
        return True
    else:
        print("FFmpeg stderr:", res.stderr)
        return False

if __name__ == "__main__":
    success = render_showcase()
    sys.exit(0 if success else 1)
