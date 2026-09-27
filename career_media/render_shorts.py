import os
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

def render_shorts():
    base_dir = r"c:\Users\neelg\OneDrive\Desktop\Vercel\career_media"
    src_dir = os.path.join(base_dir, "shorts_src")
    output_mp4 = os.path.join(base_dir, "Career_Shorts.mp4")

    # Dimensions: 1080 x 1920 (9:16 Vertical)
    W, H = 1080, 1920
    bg_color = (7, 10, 20)  # CoL #070A14

    slides_info = [
        {
            "src": "short_shot1.png",
            "out": "short_slide1.png",
            "duration": 3.5,
            "badge": "THE DIRECTORY",
            "title": "436 CAREERS. ZERO AI HYPE.",
            "desc": "Real-world pathways with zero generic summaries",
            "accent": (242, 184, 75)  # Gold
        },
        {
            "src": "short_shot2.png",
            "out": "short_slide2.png",
            "duration": 3.5,
            "badge": "STREAM & EXAM FILTERS",
            "title": "FIND YOUR FIELD BY STREAM",
            "desc": "Filter by PCM, PCB, Commerce, Arts & Degree Level",
            "accent": (94, 212, 245)  # Cyan
        },
        {
            "src": "short_shot3.png",
            "out": "short_slide3.png",
            "duration": 4.0,
            "badge": "UNBOXED DOSSIER",
            "title": "ZERO-CONGESTION BLUEPRINT",
            "desc": "4-Pillar Reality: Pay, 10-Yr Outlook, Degree & AI Risk",
            "accent": (52, 211, 153)  # Emerald
        },
        {
            "src": "short_shot4.png",
            "out": "short_slide4.png",
            "duration": 4.0,
            "badge": "DAILY REALITY",
            "title": "WHAT DO THEY ACTUALLY DO ALL DAY?",
            "desc": "Chronological 06:30 to 17:30 hour-by-hour workflow",
            "accent": (242, 184, 75)  # Gold
        },
        {
            "src": "short_shot5.png",
            "out": "short_slide5.png",
            "duration": 4.0,
            "badge": "UNVARNISHED TRUTH",
            "title": "HONEST TRADE-OFFS & RED FLAGS",
            "desc": "The Upside vs The Hard Reality + Who Should Avoid",
            "accent": (248, 113, 113) # Coral Red
        },
        {
            "src": "short_shot6.png",
            "out": "short_slide6.png",
            "duration": 4.0,
            "badge": "GLOBAL COMPENSATION",
            "title": "GLOBAL PAY & SENIORITY CURVE",
            "desc": "Live Tenure Slider: US $, India ₹ LPA, UK £ & UAE AED",
            "accent": (52, 211, 153)  # Emerald
        },
        {
            "src": "short_shot7.png",
            "out": "short_slide7.png",
            "duration": 4.0,
            "badge": "PROOF OF WORK",
            "title": "PORTFOLIO PROJECTS THAT GET HIRED",
            "desc": "3 Concrete projects & tools hiring managers look for",
            "accent": (94, 212, 245)  # Cyan
        },
        {
            "src": "short_shot8.png",
            "out": "short_slide8.png",
            "duration": 3.5,
            "badge": "60-SECOND QUIZ",
            "title": "PERSONALIZED CAREER COMPASS",
            "desc": "Answer 3 quick questions to find your top matches",
            "accent": (242, 184, 75)  # Gold
        },
        {
            "src": "short_shot9.png",
            "out": "short_slide9.png",
            "duration": 3.5,
            "badge": "DECISION MATRIX",
            "title": "BENCHMARK CAREERS SIDE-BY-SIDE",
            "desc": "Directly compare salaries, entrance exams & AI impact",
            "accent": (94, 212, 245)  # Cyan
        },
        {
            "src": "short_shot3.png",
            "out": "short_slide10.png",
            "duration": 3.5,
            "badge": "100% FREE RESOURCE",
            "title": "EXPLORE ALL 436 PATHWAYS NOW",
            "desc": "advancedlogiclabs.dpdns.org/Career · FutureScape",
            "accent": (242, 184, 75)  # Gold
        }
    ]

    total_duration = sum(s["duration"] for s in slides_info)

    # Fonts
    try:
        font_hero = ImageFont.truetype("segoeuib.ttf", 44)
        font_sub = ImageFont.truetype("segoeui.ttf", 26)
        font_badge = ImageFont.truetype("segoeuib.ttf", 20)
        font_cta = ImageFont.truetype("segoeuib.ttf", 22)
    except:
        font_hero = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_badge = ImageFont.load_default()
        font_cta = ImageFont.load_default()

    current_time = 0.0
    concat_lines = []

    for idx, s in enumerate(slides_info):
        src_path = os.path.join(src_dir, s["src"])
        out_path = os.path.join(base_dir, s["out"])

        im = Image.open(src_path).convert("RGB")
        src_w, src_h = im.size

        # Canvas: 1080 x 1920
        canvas = Image.new("RGB", (W, H), bg_color)

        # Scale image to fit within viewport below header card
        # Frame area: y: 270 to y: 1770 (height: 1500)
        frame_top = 270
        frame_h = 1500
        frame_w = 1020
        frame_x = (W - frame_w) // 2

        # Scale image keeping aspect ratio
        scale = min(frame_w / src_w, frame_h / src_h)
        new_w, new_h = int(src_w * scale), int(src_h * scale)
        scaled = im.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # Center in frame area
        img_x = frame_x + (frame_w - new_w) // 2
        img_y = frame_top + (frame_h - new_h) // 2

        # Background subtle border for screenshot frame
        draw_base = ImageDraw.Draw(canvas)
        draw_base.rectangle([img_x - 3, img_y - 3, img_x + new_w + 2, img_y + new_h + 2], outline=(30, 42, 70), width=2)
        canvas.paste(scaled, (img_x, img_y))

        # Top Header Pill (y = 48)
        top_pill_w = 420
        top_pill_h = 42
        top_pill_x = (W - top_pill_w) // 2
        top_pill_y = 44

        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw_ov = ImageDraw.Draw(overlay)

        # Pill background
        draw_ov.rounded_rectangle([top_pill_x, top_pill_y, top_pill_x + top_pill_w, top_pill_y + top_pill_h], radius=21, fill=(15, 23, 42, 240), outline=(242, 184, 75, 180), width=1)
        # Pill text
        draw_ov.text((top_pill_x + 30, top_pill_y + 9), "CLASS OF LEARNERS · CAREER EXPLORER", fill=(242, 184, 75), font=font_badge)

        # Header Title Card (y = 100 to y = 250)
        card_x = 36
        card_y = 102
        card_w = W - 72
        card_h = 148

        # Glass background
        draw_ov.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=16, fill=(10, 16, 32, 245), outline=(35, 48, 80, 200), width=1)
        # Top accent bar on card
        draw_ov.line([(card_x + 16, card_y), (card_x + card_w - 16, card_y)], fill=s["accent"] + (255,), width=3)

        # Badge pill inside card
        badge_text = s["badge"]
        badge_w = len(badge_text) * 11 + 24
        draw_ov.rounded_rectangle([card_x + 24, card_y + 18, card_x + 24 + badge_w, card_y + 44], radius=6, fill=s["accent"] + (40,), outline=s["accent"] + (180,), width=1)
        draw_ov.text((card_x + 36, card_y + 21), badge_text, fill=s["accent"], font=font_badge)

        # Counter pill on right of card
        counter_text = f"{idx + 1} / {len(slides_info)}"
        draw_ov.text((card_x + card_w - 90, card_y + 22), counter_text, fill=(136, 145, 170), font=font_badge)

        # Title text
        draw_ov.text((card_x + 24, card_y + 56), s["title"], fill=(232, 227, 216), font=font_hero)
        # Subtitle text
        draw_ov.text((card_x + 24, card_y + 108), s["desc"], fill=(136, 145, 170), font=font_sub)

        # Bottom Call to Action Ribbon (y = 1810)
        bot_y = 1800
        bot_h = 75
        draw_ov.rounded_rectangle([card_x, bot_y, card_x + card_w, bot_y + bot_h], radius=14, fill=(12, 18, 36, 240), outline=(242, 184, 75, 120), width=1)
        draw_ov.text((card_x + 30, bot_y + 24), "✦ Explore 436 Verified Blueprints at", fill=(232, 227, 216), font=font_cta)
        draw_ov.text((card_x + 470, bot_y + 24), "advancedlogiclabs.dpdns.org/Career", fill=(242, 184, 75), font=font_cta)

        # Progress bar at very bottom (y = 1908 to y = 1916)
        prog_pct = (idx + 1) / len(slides_info)
        draw_ov.rectangle([0, 1908, W, 1916], fill=(20, 30, 50, 255))
        draw_ov.rectangle([0, 1908, int(W * prog_pct), 1916], fill=(242, 184, 75, 255))

        # Composite overlay
        canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
        canvas.save(out_path, quality=95)
        print(f"Generated Shorts slide {idx + 1}: {out_path}")

        concat_lines.append(f"file '{out_path.replace(os.sep, '/')}'")
        concat_lines.append(f"duration {s['duration']}")

    # Concat file requires repeating last file
    last_slide = os.path.join(base_dir, slides_info[-1]["out"]).replace(os.sep, "/")
    concat_lines.append(f"file '{last_slide}'")

    concat_file = os.path.join(base_dir, "shorts_concat.txt")
    with open(concat_file, "w", encoding="utf-8") as f:
        f.write("\n".join(concat_lines))

    # FFmpeg render: 1080x1920 60fps
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", concat_file,
        "-vf", "fps=60,format=yuv420p",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        output_mp4
    ]

    print("Running FFmpeg render for Career Shorts (1080x1920 9:16)...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
        print(f"SUCCESS: Career Shorts rendered: {output_mp4} ({size_mb:.2f} MB)")
    else:
        print("FFmpeg error:", res.stderr)

if __name__ == "__main__":
    render_shorts()
