import asyncio
import os
import sys
import argparse
import edge_tts

# Ensure stdout handles utf-8 properly on Windows
sys.stdout.reconfigure(encoding='utf-8')

# Scene scripts for the Tech Ecosystem & Architecture Showcase
SCRIPTS = {
    "eco_01_hook": (
        "How did six student developers in Mumbai build twenty-five interactive 3D apps and driving games for zero dollars? "
        "Here is the exact master tech stack: from Antigravity and Gemini to Vercel, Supabase, and Lumalabs!"
    ),
    "eco_02_ai_agents": (
        "First, the AI coding engine. We orchestrate Antigravity and Gemini 3.7 with Claude Code and Codex for autonomous architecture. "
        "OpenCode and Playwright handle headless visual testing, while Lovable rapidly scaffolds full-stack UI components!"
    ),
    "eco_03_3d_assets": (
        "Next, the 3D graphics pipeline. We combine free open 3D assets and Lumalabs AI generation with Three.js and Rapier3D. "
        "With zero-garbage-collection object pooling, Mumbai Traffic Hero runs at a silky sixty frames per second in your browser!"
    ),
    "eco_04_cloud_stack": (
        "Finally, the cloud and edge infrastructure. Vercel deploys our zero-build static pages in seconds. "
        "ClouDNS and Digitalplat provide high-speed Anycast routing, Freebuff caches local desktop data, and Supabase powers global auth and telemetry!"
    ),
    "eco_05_outro": (
        "You do not need massive funding to build world-class software. "
        "Explore all twenty-five live applications on Class Of Learners and start building with this stack today!"
    )
}

DEFAULT_VOICE = "en-US-ChristopherNeural"  # Authoritative, deep, tech-documentary style

# Alternative top-tier voice presets
VOICE_PRESETS = {
    "christopher": "en-US-ChristopherNeural",   # Deep, cinematic tech narrator (Male)
    "guy": "en-US-GuyNeural",                   # Passionate, energetic tech host (Male)
    "brian": "en-US-BrianMultilingualNeural",   # Modern, dynamic, authentic (Male)
    "andrew": "en-US-AndrewMultilingualNeural", # Warm, confident, honest (Male)
    "aria": "en-US-AriaNeural",                 # Professional, confident tech news (Female)
    "jenny": "en-US-JennyNeural",               # Natural, crisp, engaging (Female)
    "ryan": "en-GB-RyanNeural",                 # British, sophisticated documentary (Male)
    "prabhat": "en-IN-PrabhatNeural",           # Indian English, clear tech engineer (Male)
    "neerja": "en-IN-NeerjaExpressiveNeural"   # Indian English, expressive & upbeat (Female)
}

async def generate_audio(voice: str, rate: str = "+4%", pitch: str = "+0Hz"):
    output_dir = os.path.join(os.path.dirname(__file__), "public", "audio")
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Generating voiceovers using Voice Actor: {voice}")
    print(f"Speed Rate: {rate} | Pitch: {pitch}\n")
    
    for key, text in SCRIPTS.items():
        out_path = os.path.join(output_dir, f"{key}.mp3")
        print(f"  Generating [{key}.mp3]...")
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await communicate.save(out_path)
        print(f"  [OK] Saved: {out_path} ({os.path.getsize(out_path):,} bytes)")
        
    print("\nAll audio segments generated successfully!")

def main():
    parser = argparse.ArgumentParser(description="Generate AI Voiceovers with customizable Voice Actors")
    parser.add_argument(
        "--voice", 
        type=str, 
        default=DEFAULT_VOICE, 
        help=f"Voice actor name or preset. Presets: {', '.join(VOICE_PRESETS.keys())}. Default: {DEFAULT_VOICE}"
    )
    parser.add_argument("--rate", type=str, default="+4%", help="Speech rate adjustment (e.g. +5%%, -5%%)")
    parser.add_argument("--pitch", type=str, default="+0Hz", help="Pitch adjustment (e.g. +2Hz, -2Hz)")
    
    args = parser.parse_args()
    
    # Resolve preset name if used
    selected_voice = VOICE_PRESETS.get(args.voice.lower(), args.voice)
    
    asyncio.run(generate_audio(selected_voice, args.rate, args.pitch))

if __name__ == "__main__":
    main()
