"""
stage_assets.py — copy the usable slice of "Models And SFX" into the runtime tree.

WHY A SCRIPT AND NOT A COPY
  The dump is 1.3 GB across 4354 files. Almost none of it can ship: Godot
  (.tscn/.gd/.import), source DCC formats (.blend/.fbx/.obj), 1.09 GB of
  uncompressed WAV, and 54 MB of anonymously-named .ogg files (1.ogg … 8.ogg)
  that cannot be identified. Copying the folder wholesale would put 1.3 GB of
  dead weight into a build whose committed output is already ~1 GB of models.

  So this copies a CURATED set, converts what needs converting, writes a
  manifest, and prints the size delta. Re-running is idempotent.

WHAT SHIPS
  Models  free city pack props — real traffic lights, street lights, cones,
          a fire hydrant, stop sign, bins, benches, trees, and road tiles.
          These are the props the film builds procedurally today, and a real
          traffic light is worth more to a noir junction than any amount of
          lighting maths.
  SFX     vehicle-sfx-free-assets — engine loops, skids, crashes, doors,
          a police siren, air horn, indicator, reverse beeper.
  Amb     rain ambience from the NOX pack, converted from 8.4 MB WAV to ogg.

WHAT DOES NOT SHIP, AND WHY
  NOX_SOUND      1644 WAV / 1.09 GB. Only the two rain loops are taken, and
                 only after conversion; the rest is footsteps, voices and ice
                 ambience that this game already synthesises.
  g-rcp2         100 ogg / 54 MB named 1.ogg … 8.ogg. Unidentifiable.
  KayKit bits    320 .gltf kits for city/furniture/prototype/restaurant. The
                 game already ships six Kenney environment kits; these would be
                 a third art direction for the same job.
  Car/kart packs .fbx and .obj only. Cars are already covered by kenney_car-kit
                 plus five hero vehicles.

USAGE
  python scripts/stage_assets.py            # copy + convert
  python scripts/stage_assets.py --dry-run  # report only, touch nothing
  python scripts/stage_assets.py --models-only
  python scripts/stage_assets.py --audio-only
"""

import argparse
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = pathlib.Path(__file__).resolve().parent.parent
DUMP = ROOT / "Models And SFX"
MODEL_OUT = ROOT / "Models" / "props"
SFX_OUT = ROOT / "audio" / "sfx"
AMB_OUT = ROOT / "audio" / "amb"
MANIFEST = ROOT / "story" / "asset_manifest.json"

# ── models ───────────────────────────────────────────────────────────────────
# key -> (source relative path, notes)
#
# Keys are namespaced `prop_*` so they cannot collide with the ~400 existing
# ASSET_MANIFEST entries in start.js, which are named things like `car_sedan_kenney`.
CITY_PACK = "free city pack/free city pack/glb or gltf city free  pack"

MODELS = {
    # Film-critical: a junction with no real signal head is the whole problem.
    "prop_traffic_light": (f"{CITY_PACK}/trafficLight.glb", "Mast-mounted signal head"),
    "prop_street_light":  (f"{CITY_PACK}/streetLight.glb",  "Sodium street lamp"),
    "prop_traffic_cone":  (f"{CITY_PACK}/trafficCone.glb",  "Hazard cone — crime-scene dressing"),
    "prop_stop_sign":     (f"{CITY_PACK}/stopSign.glb",     "STOP plate"),
    # Lesson 2 teaches a 5m clearance rule around hydrants, so one has to exist.
    "prop_fire_hydrant":  (f"{CITY_PACK}/fireHydrant.glb",  "Hydrant — parking-clearance lesson"),
    # Colonnade dressing.
    "prop_bench":         (f"{CITY_PACK}/bench2.glb",       "Bench"),
    "prop_bin":           (f"{CITY_PACK}/garbageBin.glb",   "Municipal bin"),
    "prop_trash_bag":     (f"{CITY_PACK}/trashBag1.glb",    "Refuse sack"),
    "prop_trash_bag_2":   (f"{CITY_PACK}/trashBag2.glb",    "Refuse sack, variant"),
    "prop_tree_small":    (f"{CITY_PACK}/tree2.glb",        "Street tree"),
    "prop_tree_large":    (f"{CITY_PACK}/tree6.glb",        "Street tree, larger"),
    "prop_garden":        (f"{CITY_PACK}/garden1.glb",      "Planter / garden bed"),
    "prop_block":         (f"{CITY_PACK}/block2.glb",       "Low city block"),
    "prop_building":      (f"{CITY_PACK}/building3.glb",    "City building"),
    "prop_car_red":       (f"{CITY_PACK}/redCar.glb",        "Parked saloon"),
    # Road tiles — the stage map hand-builds its carriageway geometry today.
    "prop_road_straight": (f"{CITY_PACK}/straightRoad.glb",  "Straight road tile"),
    "prop_road_curved":   (f"{CITY_PACK}/curvedRoad.glb",    "Curved road tile"),
    "prop_road_junction": (f"{CITY_PACK}/intersectionRoad.glb", "Junction tile"),
}

# ── models: FBX ───────────────────────────────────────────────────────────────
# WHY THESE AND NOT THE OTHER 640 FBX
#   KayKit ships every environment kit twice — as .gltf/.bin and as .fbx, and often
#   again in a "(unity)" folder. That is 662 FBX files of maybe 310 distinct
#   models, and the environment kits are a third art direction for street dressing
#   this game already has six Kenney kits for. They stay in the dump.
#
#   The CHARACTER rigs are a different proposition, and the animations are FBX-only.
#   Verified by loading them through the game's own FBXLoader rather than by
#   trusting filenames:
#
#     Rig_Medium_MovementBasic  138 bones, 11 clips
#         Walking_A/B/C, Running_A/B, Jump_Start/Land/Idle/Full_Short/Full_Long,
#         T-Pose
#     Rig_Medium_General        138 bones, 15 clips
#         Idle_A/B, Death_A/B, Death_A_Pose, Death_B_Pose, Hit_A/B, PickUp,
#         Throw, Interact, Use_Item, Spawn_Ground, Spawn_Air, T-Pose
#
#   L1's film builds its cast from procedural geometry — a static buildCutsceneArjun
#   with no skeleton at all. A constable who is shot needs a death clip; a man
#   standing on a footpath for eleven seconds needs an idle. These are the only
#   assets in the entire dump that supply either.
#
#   Both rigs are SELF-CONTAINED: no external texture references, zero "Video"
#   nodes. They load with nothing else present.
FBX_MODELS = {
    "char_rig_medium_movement": (
        "KayKit_Character_Animations_1.1/Animations/fbx/Rig_Medium/Rig_Medium_MovementBasic.fbx",
        "Rig, 138 bones - Walking_A/B/C, Running_A/B, Jump_*"),
    "char_rig_medium_general": (
        "KayKit_Character_Animations_1.1/Animations/fbx/Rig_Medium/Rig_Medium_General.fbx",
        "Rig, 138 bones - Idle_A/B, Death_A/B, Hit_A/B, Interact, Throw"),
    "char_mannequin_medium": (
        "KayKit_Character_Animations_1.1/Mannequin Character/characters/Mannequin_Medium.fbx",
        "Base mannequin, 126 bones, no clips"),
    # 70 meshes / ~48k tris of vans, trucks and buses in one file. The heaviest
    # single asset staged here and still only 1.1 MB.
    "vehicles_truck_collection": (
        "Truck_collection.fbx",
        "70 meshes, ~48k tris - vans, trucks, buses"),
}

# FBX THAT LOOK USEFUL AND ARE NOT, WITH THE REASON
#
#   Designersoup Low Poly Car Pack — five good-looking cars, 1.1 MB total. Every
#   one references its texture by ABSOLUTE WINDOWS PATH:
#
#       1\rexports\Landyroamer.fbm\387359c5580f06c08c266126b3b46db47e48ba44.png
#
#   which cannot resolve once the file is served over HTTP. FBXLoader builds a
#   material with a broken texture path, and the result is either a load failure or
#   an untextured white car — and a white low-poly car on a Mumbai street reads as a
#   bug, not a placeholder. Copying the 4 KB PNG alongside it does not help: the
#   reference is absolute, not relative to the FBX. Shipping these needs either an
#   FBX re-export with relative paths or a material override at load time. Until
#   one of those exists they stay out, and that is a deliberate choice, not an
#   oversight.
#
#   Free Kart Model — a kart. This is a road-simulation game about the Motor
#   Vehicles Act; a go-kart is not the tone.
#
#   Platformer assets.fbx — platformer geometry.

# ── sfx ──────────────────────────────────────────────────────────────────────
# key -> (source file name under vehicle-sfx-free-assets, loop?, gain, purpose)
#
# `loop` matters: looping clips must not be re-triggered per frame, and a
# one-shot played as a loop produces an audible seam every cycle length.
SFX = {
    # Engine — gameplay
    "sfx_engine_start":   ("car_start.ogg",          False, 0.9,  "Ignition"),
    "sfx_engine_accel":   ("car_accelerate.ogg",     True,  0.45, "Throttle"),
    "sfx_engine_rev":     ("car_rev.ogg",            False, 0.8,  "Rev on pull-away"),
    "sfx_idle_loop":      ("car_idle_loop.ogg",      True,  0.35, "Stationary idle"),
    "sfx_mid_loop":       ("car_mid_loop.ogg",       True,  0.4,  "Cruise"),
    # Tyres
    "sfx_skid_long":      ("skid_long_01.ogg",       False, 0.7,  "Wheel slip, sustained"),
    "sfx_skid_short":     ("skid_short_01.ogg",      False, 0.6,  "Wheel slip, brief"),
    "sfx_tyre_burst":     ("tyre_burst.ogg",         False, 0.85, "Puncture"),
    "sfx_air_brake":      ("air_brake_01.ogg",       False, 0.55, "Hiss on lift-off"),
    "sfx_reverse_beep":   ("reverse_beeper_loop.ogg", True,  0.3,  "Reverse warning"),
    # Impacts
    "sfx_crash_car":      ("crash_car_01.ogg",       False, 1.0,  "Vehicle impact"),
    "sfx_crash_wall":     ("crash_wall_01.ogg",      False, 1.0,  "Wall impact"),
    "sfx_windscreen":     ("windscreen_shatter_01.ogg", False, 0.9, "Windscreen"),
    "sfx_metal_scrape":   ("metal_scrape_01.ogg",    False, 0.8,  "Body scrape"),
    # Bodywork
    "sfx_door_open":      ("door_open_01.ogg",       False, 0.6,  "Door"),
    "sfx_door_close":     ("door_close_01.ogg",      False, 0.6,  "Door"),
    "sfx_trunk_close":    ("trunk_close.ogg",        False, 0.6,  "Boot"),
    "sfx_keys":           ("keys_jingle_01.ogg",     False, 0.5,  "Keys"),
    "sfx_lock":           ("lock_chirp.ogg",         False, 0.55, "Central locking"),
    # Signalling
    "sfx_indicator":      ("indicator_loop.ogg",      True,  0.3,  "Indicator relay"),
    "sfx_horn_short":     ("car_horn_short_01.ogg",  False, 0.6,  "Car horn"),
    "sfx_air_horn":       ("truck_air_horn_01.ogg",  False, 0.7,  "Truck air horn"),
    "sfx_bicycle_bell":   ("bicycle_bell_01.ogg",    False, 0.55, "Cycle bell"),
    # Traffic / law
    "sfx_passby":         ("car_passby.ogg",         False, 0.5,  "Vehicle passes camera"),
    # THE ONE THE FILM WANTS MOST.
    "sfx_police_siren":   ("police_wail_loop.ogg",   True,  0.5,  "Two-tone wail — crime scene"),
}

# ── ambience ─────────────────────────────────────────────────────────────────
# NOX rain loops are 8.4 MB WAV each. Converted to mono 96k ogg (~350 KB), which
# is the difference between shipping ambience and shipping a download.
AMB = {
    "amb_rain_calm":  ("Nature_Essentials_NOX_SOUND/Ambiance_Rain_Calm_Loop_Stereo.wav", "Monsoon, light"),
    "amb_rain_heavy": ("Nature_Essentials_NOX_SOUND/Ambiance_Rain_Strong_Loop_Stereo.wav", "Monsoon, heavy"),
}


def human(n):
    for unit in ("B", "KB", "MB", "GB"):
        if abs(n) < 1024 or unit == "GB":
            return f"{n:.1f} {unit}" if unit != "B" else f"{int(n)} B"
        n /= 1024


def find_ffmpeg():
    return shutil.which("ffmpeg")


def convert(src, dst, extra=()):
    """Convert to mono 96k ogg. Returns True on success."""
    ff = find_ffmpeg()
    if not ff:
        print("  ! ffmpeg not found — cannot convert", src.name)
        return False
    cmd = [
        ff, "-y", "-loglevel", "error", "-i", str(src),
        "-vn",
        "-ac", "1",                       # mono: this is a rain BED, not a stereo image
        "-c:a", "libvorbis", "-q:a", "3",  # ~96 kbps
        *extra,
        str(dst),
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0 or not dst.exists():
        print("  ! convert failed:", src.name, (p.stderr or "")[:160])
        return False
    return True


def do_models(dry):
    print("\n── MODELS ──────────────────────────────────────────────")
    total = 0
    ok = 0
    MODEL_OUT.mkdir(parents=True, exist_ok=True)
    for key, (rel, note) in sorted(MODELS.items()):
        src = DUMP / rel
        dst = MODEL_OUT / f"{key}.glb"
        if not src.exists():
            print(f"  MISSING  {key:<22} ({rel})")
            continue
        total += src.stat().st_size
        if not dry:
            shutil.copy2(src, dst)
        ok += 1
        print(f"  {'ok' if not dry else 'plan'}      {key:<22} {human(src.stat().st_size):>10}  {note}")
    print(f"  {ok} models, {human(total)}")
    return ok, total


def do_fbx_models(dry):
    print("\n-- FBX MODELS ------------------------------------------------")
    out = ROOT / "Models" / "fbx"
    out.mkdir(parents=True, exist_ok=True)
    total = 0
    ok = 0
    for key, (rel, note) in sorted(FBX_MODELS.items()):
        src = DUMP / rel
        dst = out / f"{key}.fbx"
        if not src.exists():
            print(f"  MISSING  {key:<26} ({rel})")
            continue
        total += src.stat().st_size
        if not dry:
            shutil.copy2(src, dst)
        ok += 1
        print(f"  {'ok' if not dry else 'plan'}      {key:<26} {human(src.stat().st_size):>10}  {note}")
    print(f"  {ok} fbx models, {human(total)}")
    return ok, total


def do_sfx(dry):
    print("\n── SFX ─────────────────────────────────────────────────")
    src_dir = None
    for cand in DUMP.rglob("vehicle-sfx-free-assets"):
        if cand.is_dir():
            src_dir = cand
            break
    if not src_dir:
        print("  ! vehicle-sfx-free-assets not found")
        return 0, 0
    total = 0
    ok = 0
    SFX_OUT.mkdir(parents=True, exist_ok=True)
    for key, (name, is_loop, gain, purpose) in sorted(SFX.items()):
        found = list(src_dir.rglob(name))
        if not found:
            print(f"  MISSING  {key:<22} ({name})")
            continue
        src = found[0]
        total += src.stat().st_size
        if not dry:
            shutil.copy2(src, SFX_OUT / f"{key}.ogg")
        ok += 1
        print(f"  {'ok' if not dry else 'plan'}      {key:<22} {human(src.stat().st_size):>10}  "
              f"{'loop' if is_loop else '1x  '}  {purpose}")
    print(f"  {ok} sfx, {human(total)}")
    return ok, total


def do_amb(dry):
    print("\n── AMBIENCE (converted) ─────────────────────────────────")
    base = None
    for cand in DUMP.rglob("Essentials_Series_NOX_SOUND"):
        if cand.is_dir():
            base = cand / "Essentials_Series_NOX_SOUND"
            break
    if not base or not base.exists():
        print("  ! NOX pack not found")
        return 0, 0
    AMB_OUT.mkdir(parents=True, exist_ok=True)
    total_before = 0
    total_after = 0
    ok = 0
    for key, (rel, note) in sorted(AMB.items()):
        src = base / rel
        if not src.exists():
            # The dump nests the pack one directory deeper than expected in some
            # copies; fall back to a recursive name match rather than giving up.
            hit = [p for p in base.rglob(pathlib.Path(rel).name) if p.suffix.lower() == ".wav"]
            src = hit[0] if hit else None
        if not src:
            print(f"  MISSING  {key} ({rel})")
            continue
        dst = AMB_OUT / f"{key}.ogg"
        before = src.stat().st_size
        total_before += before
        if dry:
            print(f"  plan      {key:<22} {human(before):>10}  →  ~350 KB   {note}")
            total_after += 350 * 1024
            ok += 1
            continue
        if convert(src, dst):
            total_after += dst.stat().st_size
            ok += 1
            print(f"  ok        {key:<22} {human(before):>10}  →  {human(dst.stat().st_size):>10}  {note}")
    print(f"  {ok} ambience, {human(total_before)} → {human(total_after)}")
    return ok, total_after


def write_manifest(dry, m_count, s_count, a_count):
    if dry:
        print("\n(manifest not written — dry run)")
        return
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "_comment": [
            "Generated by scripts/stage_assets.py. Do not hand-edit.",
            "Paths are relative to the Traffic/ root and are fetched at runtime.",
            "Every consumer must degrade gracefully when a file 404s — the build",
            "runs from a cache that may predate any given asset.",
        ],
        "models": {
            k: {"path": f"Models/props/{k}.glb", "note": v[1]}
            for k, v in sorted(MODELS.items())
        },
        "modelsFbx": {
            k: {"path": f"Models/fbx/{k}.fbx", "note": v[1]}
            for k, v in sorted(FBX_MODELS.items())
        },
        "sfx": {
            k: {"path": f"audio/sfx/{k}.ogg", "loop": v[1], "gain": v[2], "note": v[3]}
            for k, v in sorted(SFX.items())
        },
        "ambience": {
            k: {"path": f"audio/amb/{k}.ogg", "loop": True, "note": v[1]}
            for k, v in sorted(AMB.items())
        },
    }
    MANIFEST.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nmanifest → {MANIFEST.relative_to(ROOT)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--models-only", action="store_true")
    ap.add_argument("--audio-only", action="store_true")
    args = ap.parse_args()

    if not DUMP.exists():
        sys.exit(f"Dump folder not found: {DUMP}")

    grand = 0
    mc = sc = ac = 0
    if not args.audio_only:
        mc, mt = do_models(args.dry_run)
        fc, ft = do_fbx_models(args.dry_run)
        grand += mt + ft
    else:
        fc = 0
    if not args.models_only:
        sc, st = do_sfx(args.dry_run)
        ac, at = do_amb(args.dry_run)
        grand += st + at

    print("\n" + "=" * 62)
    print(f"TOTAL ADDED TO THE RUNTIME TREE: {human(grand)}")
    print(f"  glb models {mc} · fbx models {fc} · sfx {sc} · ambience {ac}")
    print("=" * 62)

    write_manifest(args.dry_run, mc, sc, ac)


if __name__ == "__main__":
    main()