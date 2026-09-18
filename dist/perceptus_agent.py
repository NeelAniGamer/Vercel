# perceptus_agent.py — Reference Windows receiver for the Perceptus Engine
# Dependencies: pip install flask flask-cors pyautogui pygetwindow
#
# Run: python perceptus_agent.py
# Then in the Perceptus Web Console set the endpoint to: http://localhost:8765/perceptus

import os
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import pyautogui

# Safety fail-safe: moving mouse to any corner will abort PyAutoGUI
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.01

API_KEY = os.environ.get("PERCEPTUS_KEY", "")  # Optional auth key matching X-API-Key
COOLDOWN = 0.35                                # Seconds between physical action triggers
_last = {}

app = Flask("perceptus_agent")
CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers=["Content-Type", "X-API-Key"])

STATE = {
    "frame_count": 0,
    "last_event": None,
    "last_frame": None,
    "screen_context": None,
    "status": "ready"
}

def cooled(key):
    now = time.time()
    if now - _last.get(key, 0) < COOLDOWN:
        return False
    _last[key] = now
    return True

@app.route("/perceptus", methods=["POST", "OPTIONS"])
def handle_perceptus():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    # Optional API key verification
    if API_KEY:
        header_key = request.headers.get("X-API-Key", "")
        if header_key != API_KEY:
            return jsonify({"error": "unauthorized"}), 401

    payload = request.get_json(force=True, silent=True)
    if not payload:
        return jsonify({"error": "invalid json payload"}), 400

    kind = payload.get("kind")
    screen_w, screen_h = pyautogui.size()

    # ── 1. GESTURE EVENT DISPATCHER ─────────────────────────
    if kind == "event":
        event_type = payload.get("type")
        gesture_name = payload.get("name", "")
        confidence = payload.get("confidence", 1.0)
        data = payload.get("payload", {})
        STATE["last_event"] = payload

        # Pointer movement / coordinate mapping
        pointer = data.get("pointer")
        if pointer:
            target_x = int(pointer.get("x", 0.5) * screen_w)
            target_y = int(pointer.get("y", 0.5) * screen_h)
            # Bound within physical screen
            target_x = max(0, min(screen_w - 1, target_x))
            target_y = max(0, min(screen_h - 1, target_y))

            if event_type in ("gesture.start", "pinch.start", "move"):
                pyautogui.moveTo(target_x, target_y)

        # Discrete gesture triggers with cooldown protection
        if event_type == "gesture.start":
            if gesture_name in ("Closed_Fist", "Pinch") and cooled("click_left"):
                pyautogui.click(button="left")
                print(f"[ACTION] Left Click triggered (gesture: {gesture_name})")

            elif gesture_name in ("Victory", "Peace") and cooled("click_right"):
                pyautogui.click(button="right")
                print(f"[ACTION] Right Click triggered (gesture: {gesture_name})")

            elif gesture_name == "Pointing_Up" and cooled("scroll_up"):
                pyautogui.scroll(120)
                print("[ACTION] Scroll Up")

            elif gesture_name == "Thumb_Down" and cooled("scroll_down"):
                pyautogui.scroll(-120)
                print("[ACTION] Scroll Down")

        elif event_type == "pinch.start" and cooled("pinch_click"):
            pyautogui.click(button="left")
            print("[ACTION] Pinch Click triggered")

        return jsonify({
            "status": "ok",
            "handled": event_type,
            "ts": time.time()
        }), 200

    # ── 2. FRAME STREAMING TELEMETRY (~10 Hz) ───────────────
    elif kind == "frame":
        STATE["frame_count"] += 1
        STATE["last_frame"] = payload
        
        hands = payload.get("hands", [])
        face = payload.get("face", {})
        screen = payload.get("screen", {})

        # Direct pointer tracking if hand is active
        if hands and len(hands) > 0:
            primary_hand = hands[0]
            pointer = primary_hand.get("pointer")
            if pointer:
                px = int(pointer.get("x", 0.5) * screen_w)
                py = int(pointer.get("y", 0.5) * screen_h)
                pyautogui.moveTo(px, py)

        return jsonify({
            "status": "ok",
            "frame_ack": STATE["frame_count"],
            "fps": payload.get("fps", 0),
            "ts": time.time()
        }), 200

    return jsonify({"status": "ignored", "reason": "unrecognized kind"}), 200

@app.route("/status", methods=["GET"])
def get_status():
    return jsonify({
        "status": "online",
        "agent": "Perceptus Windows Agent v1.0",
        "frames_received": STATE["frame_count"],
        "screen_resolution": list(pyautogui.size()),
        "last_event": STATE["last_event"]
    }), 200

if __name__ == "__main__":
    port = int(os.environ.get("PERCEPTUS_PORT", 8765))
    print(f"=======================================================")
    print(f"  PERCEPTUS Machine Vision Windows Agent               ")
    print(f"  Listening on http://localhost:{port}/perceptus       ")
    print(f"  Fail-Safe: Move cursor to any corner to abort        ")
    print(f"=======================================================")
    app.run(host="0.0.0.0", port=port, debug=False)
