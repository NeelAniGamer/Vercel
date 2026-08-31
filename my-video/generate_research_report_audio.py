import asyncio
import os
import sys
import argparse
import edge_tts

sys.stdout.reconfigure(encoding='utf-8')

# Comprehensive Research Report Voiceover - faithful to the tech stack research markdown
# Each script maps to a Remotion scene. Tuned for 90s total runtime at +6% rate.
SCRIPTS = {
    "research_01_intro": (
        "Comprehensive Research: The exact Tech Stack, AI Ecosystem, and Infrastructure behind "
        "Class Of Learners. A live platform of twenty-five plus interactive 3D applications, built by six student "
        "developers in Mumbai, running for zero dollars on the modern open web."
    ),
    "research_02_ecosystem": (
        "At the top level, the architecture is three layers. "
        "The AI and Agentic Development Suite powers code generation. "
        "The 3D and Generative Asset Pipeline builds worlds with Three dot J S and Rapier physics. "
        "And the Cloud, DNS, and Deployment layer ships it globally via GitHub and Vercel, with Supabase and local Freebuff for data."
    ),
    "research_03_cloud_deployment": (
        "For Cloud and Deployment. Vercel is the primary production host, serving static files with clean URLs and Speed Insights telemetry. "
        "GitHub is the single source of truth; every push to main auto-deploys. "
        "ClouDNS provides global Anycast DNS and DDoS protection, pointing to Vercel edge servers, "
        "while Digitalplat maps our live custom domain, advanced logic labs dot D P DNS dot org, to that edge."
    ),
    "research_04_ai_suite": (
        "The AI Engineering Suite is where velocity comes from. "
        "Google Antigravity with Gemini is the active pair-programming architect, governing strict script order and config separation. "
        "Claude Code handles deep multi-file refactoring of our seven-thousand line game engines. "
        "OpenAI Codex provides Playwright MCP browser automation, while OpenCode adds visual regression checks. "
        "And Lovable rapidly prototypes dashboards that become our React components."
    ),
    "research_05_3d_generative": (
        "The 3D and Generative Pipeline is pure WebGL. "
        "Three dot J S renders both procedural backgrounds and the Mumbai Traffic Simulator. "
        "Free 3D repositories and Blender supply vehicle meshes, compressed to Draco G L B bundles like cert assets dot J S. "
        "Luma AI generates new props via text-to-3D Genie and NeRF splats, powering our showcase videos in the ads-video folder."
    ),
    "research_06_backend_data": (
        "For backend and data. Supabase is our Firebase alternative on Postgres, providing Google OAuth and email auth via col-auth dot J S, "
        "plus realtime leaderboards and achievements. "
        "Credentials are strictly separated between root config dot JSON and Traffic config dot JSON. "
        "And Freebuff embedded SQLite, desktop dot D B, caches local indexes and asset hashes for offline desktop builds."
    ),
    "research_07_supporting_outro": (
        "Finally, supporting technologies tie it together: MediaPipe and WebRTC for gesture control, "
        "Rapier3D WebAssembly for deterministic physics, Electron for native desktop packaging, "
        "Playwright for headless smoke tests, and a Service Worker PWA with cache-first offline support. "
        "Together, this stack lets a small Mumbai team ship world-class 3D web experiences at zero cost. "
        "Explore it live at class of learners dot vercel dot app."
    ),
}

DEFAULT_VOICE = "en-US-ChristopherNeural"

VOICE_PRESETS = {
    "christopher": "en-US-ChristopherNeural",
    "guy": "en-US-GuyNeural",
    "brian": "en-US-BrianMultilingualNeural",
    "andrew": "en-US-AndrewMultilingualNeural",
    "aria": "en-US-AriaNeural",
    "jenny": "en-US-JennyNeural",
    "ryan": "en-GB-RyanNeural",
    "prabhat": "en-IN-PrabhatNeural",
    "neerja": "en-IN-NeerjaExpressiveNeural",
}

async def generate_audio(voice: str, rate: str = "+6%", pitch: str = "+0Hz"):
    output_dir = os.path.join(os.path.dirname(__file__), "public", "audio")
    os.makedirs(output_dir, exist_ok=True)
    print(f"Generating Comprehensive Research Report voiceovers")
    print(f"Voice: {voice} | Rate: {rate} | Pitch: {pitch}\n")
    total_bytes = 0
    for key, text in SCRIPTS.items():
        out_path = os.path.join(output_dir, f"{key}.mp3")
        print(f"  [{key}.mp3] {len(text)} chars -> generating...")
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await communicate.save(out_path)
        size = os.path.getsize(out_path)
        total_bytes += size
        print(f"    Saved: {out_path} ({size:,} bytes)")
    print(f"\nDone. {len(SCRIPTS)} files, {total_bytes:,} bytes total.")
    # Also print durations estimate
    print("\nScripts preview:")
    for k, v in SCRIPTS.items():
        print(f" - {k}: {v[:90]}...")

def main():
    parser = argparse.ArgumentParser(description="Generate Research Report Voiceovers")
    parser.add_argument("--voice", type=str, default=DEFAULT_VOICE, help=f"Voice preset or full ID. Presets: {', '.join(VOICE_PRESETS.keys())}")
    parser.add_argument("--rate", type=str, default="+6%", help="Speech rate")
    parser.add_argument("--pitch", type=str, default="+0Hz", help="Pitch")
    args = parser.parse_args()
    selected_voice = VOICE_PRESETS.get(args.voice.lower(), args.voice)
    asyncio.run(generate_audio(selected_voice, args.rate, args.pitch))

if __name__ == "__main__":
    main()
