import asyncio
import os
import sys
import edge_tts

sys.stdout.reconfigure(encoding='utf-8')

# YouTube Shorts - 60s condensed research report
SCRIPTS = {
    "shorts_01_hook": (
        "How did six students in Mumbai build twenty-five 3D games and apps for zero dollars? "
        "Here is the exact master tech stack."
    ),
    "shorts_02_cloud": (
        "Vercel hosts everything with clean URLs and Speed Insights. "
        "GitHub auto-deploys on every push to main. "
        "ClouDNS and Digitalplat route our live domain, advanced logic labs dot D P DNS dot org, via global Anycast."
    ),
    "shorts_03_ai": (
        "Velocity comes from five AI agents. "
        "Antigravity with Gemini architects the code. "
        "Claude refactors seven thousand lines. "
        "Codex and OpenCode test with Playwright browser automation. "
        "And Lovable rapidly prototypes the UI."
    ),
    "shorts_04_3d": (
        "For 3D, Three dot J S and Rapier physics render the worlds at sixty frames per second. "
        "Free open assets become Draco compressed bundles. "
        "And Luma AI generates new props and showcase videos."
    ),
    "shorts_05_backend": (
        "Supabase powers Google OAuth and realtime leaderboards. "
        "Freebuff SQLite caches local builds offline. "
        "And configs are strictly isolated."
    ),
    "shorts_06_outro": (
        "Plus PWA offline, Electron desktop, and Playwright testing. "
        "Explore all twenty-five live at class of learners dot vercel dot app. "
        "Star us on GitHub!"
    ),
}

VOICE = "en-US-ChristopherNeural"

async def gen():
    out_dir = os.path.join(os.path.dirname(__file__), "public", "audio")
    os.makedirs(out_dir, exist_ok=True)
    for k, text in SCRIPTS.items():
        path = os.path.join(out_dir, f"{k}.mp3")
        print(f"Generating {k}.mp3 ...")
        comm = edge_tts.Communicate(text, VOICE, rate="+4%", pitch="+0Hz")
        await comm.save(path)
        print(f"  saved {path} {os.path.getsize(path)} bytes")
    print("done shorts audio")

asyncio.run(gen())
