import os
import subprocess

SCREENSHOTS_DIR = r"c:\Users\neelg\OneDrive\Desktop\Vercel\screenshots"
RECORDINGS_DIR = r"c:\Users\neelg\OneDrive\Desktop\Vercel\recordings"
os.makedirs(RECORDINGS_DIR, exist_ok=True)

scenes = [
    {
        "id": "01_solar_crisis",
        "image": os.path.join(SCREENSHOTS_DIR, "01_solar_engine.png"),
        "title": "SYSTEM 01 - SOLAR ENGINE v3.3",
        "status": "ALERT - X-CLASS SOLAR FLARE INBOUND",
        "timer": "T-MINUS 07-00",
        "zoom": "min(pzoom+0.0015,1.25)",
        "dur": 5
    },
    {
        "id": "02_gesture_takeover",
        "image": os.path.join(SCREENSHOTS_DIR, "05_gesture_ui.png"),
        "title": "SYSTEM 02 - PERCEPTUS GESTURE-UI",
        "status": "INPUT - MOUSE FRIED - AIR TRACKING ACTIVE",
        "timer": "T-MINUS 05-30",
        "zoom": "min(pzoom+0.0012,1.20)",
        "dur": 5
    },
    {
        "id": "03_terra3d_scan",
        "image": os.path.join(SCREENSHOTS_DIR, "02_terra3d.png"),
        "title": "SYSTEM 03 - TERRA3D WORLD ATLAS",
        "status": "TRIANGULATION - RELAY TOWER (19.07N, 72.87E)",
        "timer": "T-MINUS 04-10",
        "zoom": "min(pzoom+0.0015,1.22)",
        "dur": 5
    },
    {
        "id": "04_qr_cipher",
        "image": os.path.join(SCREENSHOTS_DIR, "03_qr_matrix.png"),
        "title": "SYSTEM 04 - QR MATRIX STUDIO",
        "status": "CIPHER - REED-SOLOMON ERROR REPAIR 30%",
        "timer": "T-MINUS 02-45",
        "zoom": "min(pzoom+0.0018,1.28)",
        "dur": 5
    },
    {
        "id": "05_ati_terminal",
        "image": os.path.join(SCREENSHOTS_DIR, "04_ati_terminal.png"),
        "title": "SYSTEM 05 - ATI TYPING TERMINAL",
        "status": "FINAL CLIMAX - 94 WPM | OVERRIDE-DELTA-99",
        "timer": "T-MINUS 00-45",
        "zoom": "min(pzoom+0.0020,1.30)",
        "dur": 5
    }
]

generated_clips = []

for sc in scenes:
    out_mp4 = os.path.join(RECORDINGS_DIR, f"{sc['id']}.mp4")
    out_gif = os.path.join(RECORDINGS_DIR, f"{sc['id']}.gif")
    
    # Filter with zoompan, title badge, status badge, and timer badge
    vf = (
        f"zoompan=z='{sc['zoom']}':d={sc['dur']*25}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720,"
        f"drawtext=text='{sc['title']}':fontcolor=white:fontsize=28:x=40:y=40:box=1:boxcolor=black@0.65:boxborderw=10,"
        f"drawtext=text='{sc['status']}':fontcolor=0x38bdf8:fontsize=22:x=40:y=85:box=1:boxcolor=black@0.65:boxborderw=8,"
        f"drawtext=text='{sc['timer']}':fontcolor=0xfacc15:fontsize=30:x=w-280:y=40:box=1:boxcolor=black@0.75:boxborderw=10"
    )
    
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", sc["image"],
        "-vf", vf,
        "-t", str(sc["dur"]),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        out_mp4
    ]
    
    print(f"[*] Rendering {sc['id']}.mp4...")
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    generated_clips.append(out_mp4)
    
    # Also render an animated GIF for direct visual embeds
    cmd_gif = [
        "ffmpeg", "-y",
        "-i", out_mp4,
        "-vf", "fps=10,scale=640:-1:flags=lanczos",
        out_gif
    ]
    subprocess.run(cmd_gif, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"[+] Generated {out_mp4} and {out_gif}")

# Create master concatenation list
concat_list_file = os.path.join(RECORDINGS_DIR, "concat_list.txt")
with open(concat_list_file, "w") as f:
    for clip in generated_clips:
        # Escape path for ffmpeg concat
        safe_path = clip.replace("\\", "/")
        f.write(f"file '{safe_path}'\n")

master_mp4 = os.path.join(RECORDINGS_DIR, "Cyber_Blackout_Master_Reel.mp4")

# Synthesize sound effects: Tension drone + ticking pulse
cmd_master = [
    "ffmpeg", "-y",
    "-f", "concat", "-safe", "0", "-i", concat_list_file,
    "-f", "lavfi", "-i", "anoisesrc=c=pink:r=44100:a=0.015",
    "-f", "lavfi", "-i", "sine=frequency=65:duration=25",
    "-filter_complex", "[1:a][2:a]amix=inputs=2:duration=first[a]",
    "-map", "0:v", "-map", "[a]",
    "-c:v", "copy",
    "-c:a", "aac",
    "-shortest",
    master_mp4
]

print(f"[*] Rendering Master Reel: {master_mp4}...")
subprocess.run(cmd_master, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print(f"[+] Master Reel successfully generated at: {master_mp4} ({os.path.getsize(master_mp4)} bytes)!")
