import os
import cv2
import numpy as np
import subprocess
import math

SCREENSHOTS_DIR = r"c:\Users\neelg\OneDrive\Desktop\Vercel\screenshots"
RECORDINGS_DIR = r"c:\Users\neelg\OneDrive\Desktop\Vercel\recordings"
os.makedirs(RECORDINGS_DIR, exist_ok=True)

WIDTH = 1280
HEIGHT = 720
FPS = 24
DURATION_PER_SCENE = 4.5  # seconds
TOTAL_FRAMES = int(FPS * DURATION_PER_SCENE)

def draw_hud_box(img, x, y, w, h, bg_color=(15, 23, 42), border_color=(56, 189, 248), alpha=0.75):
    sub_img = img[y:y+h, x:x+w]
    rect = np.full(sub_img.shape, bg_color, dtype=np.uint8)
    res = cv2.addWeighted(sub_img, 1.0 - alpha, rect, alpha, 1.0)
    img[y:y+h, x:x+w] = res
    cv2.rectangle(img, (x, y), (x+w, y+h), border_color, 2)

def create_scene_1(base_img, frame_idx):
    # Scene 1: Solar Engine - Slow dramatic zoom toward the Sun + pulsing warning
    scale = 1.0 + (frame_idx / TOTAL_FRAMES) * 0.22
    h, w = base_img.shape[:2]
    nh, nw = int(h * scale), int(w * scale)
    scaled = cv2.resize(base_img, (nw, nh), interpolation=cv2.INTER_LINEAR)
    
    # Center crop back to 1280x720
    cx, cy = nw // 2, nh // 2
    crop = scaled[cy - HEIGHT//2 : cy + HEIGHT//2, cx - WIDTH//2 : cx + WIDTH//2]
    frame = crop.copy()
    
    # Pulse calculation
    pulse = (math.sin(frame_idx * 0.3) + 1.0) / 2.0
    alert_color = (0, int(50 * pulse), int(255 * (0.6 + 0.4 * pulse))) # BGR Red
    
    # Top Left Badge
    draw_hud_box(frame, 30, 30, 480, 85, bg_color=(20, 20, 30), border_color=alert_color)
    cv2.putText(frame, "SYSTEM 01: SOLAR ENGINE v3.3", (45, 65), cv2.FONT_HERSHEY_DUPLEX, 0.75, (255, 255, 255), 2)
    cv2.putText(frame, "ALERT: X-CLASS CME SOLAR FLARE DETECTED", (45, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.55, alert_color, 2)
    
    # Top Right Timer
    seconds_left = max(0, 7.0 - (frame_idx / FPS) * 0.3)
    timer_str = f"T-MINUS 06:{int(50 - (frame_idx/FPS)*4):02d}"
    draw_hud_box(frame, WIDTH - 270, 30, 240, 50, border_color=(0, 200, 255))
    cv2.putText(frame, timer_str, (WIDTH - 255, 66), cv2.FONT_HERSHEY_DUPLEX, 0.8, (0, 230, 255), 2)
    
    # Bottom Telemetry Bar
    draw_hud_box(frame, 30, HEIGHT - 70, 400, 40, border_color=(100, 200, 100))
    cv2.putText(frame, f"ORBITAL ANGLE: {19.07 + frame_idx*0.02:.2f} DEG | VELOCITY: 2.4M MPH", (45, HEIGHT - 45), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 255, 100), 1)
    
    return frame

def create_scene_2(base_img, frame_idx):
    # Scene 2: GestureUI - Green tracking reticle on hand + "MOUSE OFFLINE"
    frame = base_img.copy()
    
    # Pulsing hand target crosshair
    cx = int(WIDTH * 0.68 + math.sin(frame_idx * 0.15) * 25)
    cy = int(HEIGHT * 0.52 + math.cos(frame_idx * 0.15) * 15)
    r = int(35 + math.sin(frame_idx * 0.2) * 5)
    
    cv2.circle(frame, (cx, cy), r, (0, 255, 128), 2)
    cv2.line(frame, (cx - r - 15, cy), (cx + r + 15, cy), (0, 255, 128), 1)
    cv2.line(frame, (cx, cy - r - 15), (cx, cy + r + 15), (0, 255, 128), 1)
    cv2.putText(frame, "POINT: INDEX (LM 8)", (cx - 70, cy - r - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 128), 1)
    
    # Top Badges
    draw_hud_box(frame, 30, 30, 500, 85, bg_color=(20, 20, 30), border_color=(0, 255, 128))
    cv2.putText(frame, "SYSTEM 02: PERCEPTUS GESTURE-UI", (45, 65), cv2.FONT_HERSHEY_DUPLEX, 0.75, (255, 255, 255), 2)
    cv2.putText(frame, "STATUS: MOUSE FRIED -> NEURAL AIR TRACKING", (45, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 128), 2)
    
    # Top Right Timer
    draw_hud_box(frame, WIDTH - 270, 30, 240, 50, border_color=(0, 200, 255))
    cv2.putText(frame, "T-MINUS 05:22", (WIDTH - 255, 66), cv2.FONT_HERSHEY_DUPLEX, 0.8, (0, 230, 255), 2)
    
    return frame

def create_scene_3(base_img, frame_idx):
    # Scene 3: Terra3D - Scanning across globe to lock India coordinates
    pan_x = int((frame_idx / TOTAL_FRAMES) * 60)
    pan_y = int((frame_idx / TOTAL_FRAMES) * 20)
    
    h, w = base_img.shape[:2]
    scale = 1.08
    scaled = cv2.resize(base_img, (int(w * scale), int(h * scale)))
    crop = scaled[pan_y : pan_y + HEIGHT, pan_x : pan_x + WIDTH]
    frame = crop.copy()
    
    # Target lock on India (approx center right)
    tx, ty = int(WIDTH * 0.58), int(HEIGHT * 0.48)
    bracket_size = 40
    cv2.line(frame, (tx - bracket_size, ty - bracket_size), (tx - bracket_size + 15, ty - bracket_size), (0, 255, 255), 3)
    cv2.line(frame, (tx - bracket_size, ty - bracket_size), (tx - bracket_size, ty - bracket_size + 15), (0, 255, 255), 3)
    cv2.line(frame, (tx + bracket_size, ty - bracket_size), (tx + bracket_size - 15, ty - bracket_size), (0, 255, 255), 3)
    cv2.line(frame, (tx + bracket_size, ty - bracket_size), (tx + bracket_size, ty - bracket_size + 15), (0, 255, 255), 3)
    cv2.line(frame, (tx - bracket_size, ty + bracket_size), (tx - bracket_size + 15, ty + bracket_size), (0, 255, 255), 3)
    cv2.line(frame, (tx - bracket_size, ty + bracket_size), (tx - bracket_size, ty + bracket_size - 15), (0, 255, 255), 3)
    cv2.line(frame, (tx + bracket_size, ty + bracket_size), (tx + bracket_size - 15, ty + bracket_size), (0, 255, 255), 3)
    cv2.line(frame, (tx + bracket_size, ty + bracket_size), (tx + bracket_size, ty + bracket_size - 15), (0, 255, 255), 3)
    cv2.putText(frame, "TARGET LOCK: OMEGA-7 (19.07 N, 72.87 E)", (tx - 160, ty + bracket_size + 25), cv2.FONT_HERSHEY_DUPLEX, 0.55, (0, 255, 255), 2)
    
    # Top Badges
    draw_hud_box(frame, 30, 30, 480, 85, bg_color=(20, 20, 30), border_color=(0, 200, 255))
    cv2.putText(frame, "SYSTEM 03: TERRA3D WORLD ATLAS", (45, 65), cv2.FONT_HERSHEY_DUPLEX, 0.75, (255, 255, 255), 2)
    cv2.putText(frame, "STATUS: AIR-GESTURE SATELLITE TRIANGULATION", (45, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (56, 189, 248), 2)
    
    # Top Right Timer
    draw_hud_box(frame, WIDTH - 270, 30, 240, 50, border_color=(0, 200, 255))
    cv2.putText(frame, "T-MINUS 04:10", (WIDTH - 255, 66), cv2.FONT_HERSHEY_DUPLEX, 0.8, (0, 230, 255), 2)
    
    return frame

def create_scene_4(base_img, frame_idx):
    # Scene 4: QR Matrix Studio - Laser scanline decoding the matrix
    frame = base_img.copy()
    
    # Laser scanline
    scan_y = int((frame_idx / TOTAL_FRAMES) * HEIGHT)
    cv2.line(frame, (0, scan_y), (WIDTH, scan_y), (0, 255, 100), 2)
    
    # Top Badges
    draw_hud_box(frame, 30, 30, 520, 85, bg_color=(20, 20, 30), border_color=(16, 185, 129))
    cv2.putText(frame, "SYSTEM 04: QR MATRIX STUDIO", (45, 65), cv2.FONT_HERSHEY_DUPLEX, 0.75, (255, 255, 255), 2)
    cv2.putText(frame, "CIPHER: REED-SOLOMON ERROR REPAIR (30% MAX)", (45, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (52, 211, 153), 2)
    
    # Decoded Payload Banner at bottom
    draw_hud_box(frame, WIDTH//2 - 250, HEIGHT - 80, 500, 55, bg_color=(10, 30, 20), border_color=(16, 185, 129))
    cv2.putText(frame, "DECRYPTED: OVERRIDE-DELTA-99", (WIDTH//2 - 220, HEIGHT - 45), cv2.FONT_HERSHEY_DUPLEX, 0.7, (52, 211, 153), 2)
    
    # Top Right Timer
    draw_hud_box(frame, WIDTH - 270, 30, 240, 50, border_color=(0, 200, 255))
    cv2.putText(frame, "T-MINUS 02:45", (WIDTH - 255, 66), cv2.FONT_HERSHEY_DUPLEX, 0.8, (0, 230, 255), 2)
    
    return frame

def create_scene_5(base_img, frame_idx):
    # Scene 5: ATI Terminal Climax - Intense WPM climb + combo sparks
    wpm = int(72 + (frame_idx / TOTAL_FRAMES) * 22)
    combo = min(12, int(frame_idx / 8) + 1)
    
    frame = base_img.copy()
    
    # Top Badges
    draw_hud_box(frame, 30, 30, 520, 85, bg_color=(20, 20, 30), border_color=(244, 63, 94))
    cv2.putText(frame, "SYSTEM 05: A.T.I. TYPING TERMINAL", (45, 65), cv2.FONT_HERSHEY_DUPLEX, 0.75, (255, 255, 255), 2)
    cv2.putText(frame, f"LIVE TELEMETRY: {wpm} WPM | COMBO: {combo}x MULTIPLIER", (45, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (251, 113, 133), 2)
    
    # Final 10-second panic clock
    draw_hud_box(frame, WIDTH - 270, 30, 240, 50, border_color=(244, 63, 94))
    sec = max(1, 12 - int((frame_idx / TOTAL_FRAMES) * 11))
    cv2.putText(frame, f"CUTOFF: 00:{sec:02d}s", (WIDTH - 255, 66), cv2.FONT_HERSHEY_DUPLEX, 0.8, (244, 63, 94), 2)
    
    # Bottom Center: Target prompt stream
    draw_hud_box(frame, WIDTH//2 - 320, HEIGHT - 75, 640, 50, bg_color=(20, 10, 15), border_color=(244, 63, 94))
    cv2.putText(frame, ">> OVERRIDING SATELLITE SOLAR SHIELD... [OK]", (WIDTH//2 - 300, HEIGHT - 43), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
    
    return frame

scene_configs = [
    ("01_solar_crisis", "01_solar_engine.png", create_scene_1),
    ("02_gesture_takeover", "05_gesture_ui.png", create_scene_2),
    ("03_terra3d_scan", "02_terra3d.png", create_scene_3),
    ("04_qr_cipher", "03_qr_matrix.png", create_scene_4),
    ("05_ati_terminal", "04_ati_terminal.png", create_scene_5),
]

generated_mp4s = []
generated_gifs = []

for sc_id, img_name, render_fn in scene_configs:
    img_path = os.path.join(SCREENSHOTS_DIR, img_name)
    raw_img = cv2.imread(img_path)
    base_img = cv2.resize(raw_img, (WIDTH, HEIGHT))
    
    raw_mp4 = os.path.join(RECORDINGS_DIR, f"{sc_id}_raw.mp4")
    final_mp4 = os.path.join(RECORDINGS_DIR, f"{sc_id}.mp4")
    final_gif = os.path.join(RECORDINGS_DIR, f"{sc_id}.gif")
    
    print(f"[*] Rendering frames for {sc_id}...")
    writer = cv2.VideoWriter(raw_mp4, cv2.VideoWriter_fourcc(*'mp4v'), FPS, (WIDTH, HEIGHT))
    
    for f in range(TOTAL_FRAMES):
        frame = render_fn(base_img, f)
        writer.write(frame)
    writer.release()
    
    # Transcode to H.264
    cmd_h264 = [
        "ffmpeg", "-y",
        "-i", raw_mp4,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "20",
        final_mp4
    ]
    subprocess.run(cmd_h264, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.remove(raw_mp4) # clean up raw
    generated_mp4s.append(final_mp4)
    
    # Create animated GIF for instant preview
    cmd_gif = [
        "ffmpeg", "-y",
        "-i", final_mp4,
        "-vf", "fps=12,scale=540:-1:flags=lanczos",
        final_gif
    ]
    subprocess.run(cmd_gif, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    generated_gifs.append(final_gif)
    print(f"[+] Created {final_mp4} ({os.path.getsize(final_mp4)} B) & {final_gif}")

# Stitch all clips together into Master Reel
concat_list = os.path.join(RECORDINGS_DIR, "reel_list.txt")
with open(concat_list, "w") as f:
    for mp4 in generated_mp4s:
        f.write(f"file '{mp4.replace('\\', '/')}'\n")

master_mp4 = os.path.join(RECORDINGS_DIR, "Cyber_Blackout_Master_Reel.mp4")

# Add ambient synth drone & alarm tone with ffmpeg
cmd_master = [
    "ffmpeg", "-y",
    "-f", "concat", "-safe", "0", "-i", concat_list,
    "-f", "lavfi", "-i", "sine=frequency=70:duration=23",
    "-f", "lavfi", "-i", "anoisesrc=c=pink:r=44100:a=0.01",
    "-filter_complex", "[1:a][2:a]amix=inputs=2:duration=first[a]",
    "-map", "0:v", "-map", "[a]",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-shortest",
    master_mp4
]
print(f"[*] Rendering Master Reel: {master_mp4}...")
subprocess.run(cmd_master, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print(f"[+] All Done! Master Video created at: {master_mp4} ({os.path.getsize(master_mp4)} bytes)!")
