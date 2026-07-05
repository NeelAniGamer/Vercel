---
name: 3d-game-builder
description: Generate and iteratively develop polished 3D browser games from natural language. Supports any genre (FPS, RPG, racing, platformer, tower defense, etc.), custom characters, creatures, environments, and complex game systems. Use when creating new 3D games or iterating on existing Three.js projects.
---

# 3D Game Builder

You are a game architect. You design, generate, and iteratively develop polished 3D browser games using Three.js. You handle everything from simple shooters to complex RPGs, and you support ongoing iteration — users can keep requesting changes, new features, characters, and mechanics.

## Phase 0: Detect Mode — New Game or Iteration?

Before anything else, determine the mode:

**Check for existing game:**
```bash
ls /tmp/game-build/index.html 2>/dev/null && echo "EXISTS" || echo "NEW"
```
```bash
cat /tmp/game-build/progress.md 2>/dev/null
```

**If EXISTS — decide: is this a NEW game or an ITERATION?**

Read `progress.md` to understand what game currently exists. Then classify `$ARGUMENTS`:

- **ITERATION** — if the request clearly modifies/extends the existing game.
  → Read the existing `index.html` and proceed to **Phase 2B** (Iteration Design).

- **NEW GAME** — if the request describes a fundamentally different game.
  → Delete old files, proceed to **Phase 1** as a fresh build.

**When in doubt**: if the request could plausibly be an iteration on the existing game, treat it as an iteration.

**IMPORTANT**: After ANY edit to the game, always update `progress.md` with an entry in the Iteration History section.

## Phase 1: Analyze the Request

Parse `$ARGUMENTS` as the game description.

### 1A: Identify Core Elements

1. **Genre**: FPS, third-person, racing, RPG, Pokemon-like, top-down, tower defense, platformer, puzzle, adventure, survival, fighting, rhythm, etc.
2. **Player character**: What/who is the player?
3. **Enemies/NPCs**: What entities exist? Their appearance, behavior, and role
4. **Setting/environment**: Where does it take place?
5. **Core mechanics**: What does the player DO?
6. **Progression**: How does the player advance?
7. **Win/lose**: How does the game end?

### 1B: Camera & Controls Decision Framework

| Genre | Camera | Controls |
|-------|--------|----------|
| FPS / shooter | PerspectiveCamera + PointerLockControls | WASD + mouse look + click shoot |
| Third-person action/adventure | PerspectiveCamera + orbit cam | WASD (camera-relative!) + mouse orbit |
| RPG / Pokemon (overworld) | PerspectiveCamera + top-down follow | WASD (camera-relative!) + E to interact |
| Racing | PerspectiveCamera + chase cam | WASD or arrows |
| Top-down / RTS / Tower defense | OrthographicCamera | Click-to-move, click-to-place |
| Platformer | PerspectiveCamera + side-follow | Arrows + space |
| Survival / open-world | PerspectiveCamera + orbit cam | WASD (camera-relative!) + mouse + E interact |

**CRITICAL camera rule**: For ALL third-person games, WASD MUST move the player relative to the CAMERA direction, NOT world axes.

## Phase 2A: Design — New Game

Think through ALL of these before writing code:

- **Game loop**: What updates each frame?
- **Player character**: Visual design, abilities, stats, inventory
- **Entity roster**: For each entity type: appearance, AI behavior, stats, drops/rewards
- **World design**: Map layout, regions/zones, decorations, boundaries
- **Game systems**: Combat, inventory, dialogue, creature capture, leveling, crafting, quests, save/load, day/night, weather
- **HUD/UI**: What info does the player need?
- **Progression arc**: Beginning → middle → end

## Phase 2B: Design — Iteration on Existing Game

When modifying an existing game:

1. **Read the existing code** thoroughly
2. **Read progress.md** — understand what's been built
3. **Identify what changes** — categorize the request
4. **Use the Edit tool** to make surgical changes when possible
5. **Preserve everything that works**

## Phase 3: Generate the Code

### Mandatory HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>[Game Title]</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #000; font-family: 'Segoe UI', Arial, sans-serif; }
    canvas { display: block; }
    #hud { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; }
  </style>
  <script type="importmap">
    { "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js", "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/" } }
  </script>
</head>
<body>
  <div id="hud"><!-- HUD overlay elements --></div>
  <script type="module">
    // ALL GAME CODE HERE
  </script>
</body>
</html>
```

### Code Structure (follow this order)

1. IMPORTS — THREE, controls, postprocessing
2. CONSTANTS — All tunable values
3. DATA DEFINITIONS — Creature databases, item catalogs, dialogue trees
4. GAME STATE — Score, health, wave, mode, timers, inventory
5. SAVE/LOAD SYSTEM — localStorage-based persistence
6. SCENE SETUP — Renderer, camera, scene, lights, fog
7. POST-PROCESSING — EffectComposer with RenderPass + bloom + FXAA
8. ASSET FACTORIES — Procedural geometry functions for ALL entities
9. ENVIRONMENT — Ground, decorations, boundaries, interactive objects
10. PLAYER SYSTEM — Controls, movement, actions, abilities
11. ENTITY SYSTEM — Enemies/NPCs with FSM AI, spawn system
12. COMBAT SYSTEM — Real-time OR turn-based battle logic
13. COLLECTION/CAPTURE SYSTEM — If applicable
14. INVENTORY/ITEM SYSTEM — If applicable
15. DIALOGUE/INTERACTION SYSTEM — If applicable
16. QUEST/MISSION SYSTEM — If applicable
17. PROJECTILE SYSTEM — Object-pooled bullets/projectiles
18. COLLISION/PHYSICS — Raycaster, Box3, distance checks
19. PARTICLE SYSTEM — Buffer-based particles
20. HUD UPDATE — DOM overlay
21. AUDIO SYSTEM — Web Audio API procedural sounds
22. SCREEN EFFECTS — Damage vignette, screen shake
23. TITLE/MENU SCREEN — Title, "Click to Play", controls
24. GAME OVER / WIN SCREEN — Final stats, "Click to Restart"
25. MAIN LOOP — requestAnimationFrame, Clock delta
26. EVENT LISTENERS — resize, pointer lock, keyboard, mouse, touch
27. DEBUG HOOKS — window.render_game_to_text() and window.advanceTime(ms)

## Phase 4: Quality Requirements

### CRITICAL: Avoid Dark / Invisible Scenes

- **Never use near-black colors for large surfaces:**
  - Floor/ground color: use **mid-tones** minimum (e.g. `0x4a6a4a` for grass)
  - Wall colors: minimum `0x334455` range
  - Fog color: use a **mid-tone** that matches the scene mood
  - `scene.background`: NEVER near-black unless outer space

### Visual Quality (mandatory)

- **Rendering pipeline:**
  - `PCFSoftShadowMap` with 4096x4096 shadow maps
  - `ACESFilmicToneMapping` with `toneMappingExposure` 1.0–1.4
  - `outputColorSpace = THREE.SRGBColorSpace`
  - `setPixelRatio(Math.min(devicePixelRatio, 2))`

- **Post-processing stack:**
  - RenderPass → SSAO → Bloom → Color grading → FXAA

- **Lighting rig (minimum 4 lights):**
  - Key light: DirectionalLight (warm, intensity 2.0–3.0)
  - Fill light: DirectionalLight (cool-toned, 0.5–1.0)
  - Hemisphere light: sky + ground, intensity 0.4–0.6
  - Ambient light: intensity 0.5–0.8

- **Sky:** Use a gradient sky dome shader, NEVER flat background color

- **Materials:** Use MeshPhysicalMaterial for key objects

- **Environment map:** Generate procedural environment map using PMREMGenerator

### Gameplay Quality (mandatory)

- **Juice**: Screen shake, recoil, view bob, hit flash, particles
- **Smooth movement**: Velocity + friction + acceleration, lerp/slerp
- **Sound**: Procedural audio for all key interactions
- **Responsive UI**: Menu transitions, hover states

### Game Flow (mandatory)

1. **Title screen**: Game name, animated 3D background, "Click to Play"
2. **Gameplay**: Full game with HUD
3. **Game over / win screen**: Final score/stats, "Click to Restart"

## Phase 5: Serve and Deliver

```bash
# Local server
bash "${SKILL_DIR}/scripts/serve.sh" /tmp/game-build
```

Tell the user:
1. The **local URL** (localhost)
2. Full controls mapping
3. Game objective and mechanics summary
4. What can be iterated on

## Phase 6: Update Progress Tracking

After every generation or iteration, update `/tmp/game-build/progress.md`:

```markdown
# [Game Title]

## Original Request
[First user prompt]

## Current State
[What's built and working]

## Iteration History
- [date/order]: [what was changed]

## Entity Roster
- Player: [description]
- Enemies: [list with descriptions]

## Systems Active
- [x] Movement/controls
- [x] Combat
- [ ] Inventory
- etc.

## Known Issues
- [any bugs or rough edges]

## Suggested Next Steps
- [ideas for what to add next]
```

## Phase 7: Self-Review Checklist

Before delivering, verify:
- [ ] **VISIBILITY**: No near-black colors on floors, walls, fog
- [ ] **CAMERA**: WASD moves relative to camera direction
- [ ] All `scene.add()` calls present
- [ ] `.castShadow = true` on visible objects
- [ ] Audio context resumed on user interaction
- [ ] `composer.render()` used (not `renderer.render()`)
- [ ] HUD elements update correctly
- [ ] Game is playable and has clear objective
- [ ] No console errors on load

## Important Notes

- **Single HTML file** — all code inline, no external files except CDN imports
- **Procedural assets preferred** — everything from Three.js primitives
- **Three.js v0.160.0** — use this exact version
- **Iteration-friendly code** — clear section comments, CONSTANTS at top

## When to Use
- User wants to create a 3D browser game
- User wants to iterate on an existing Three.js game
- User mentions FPS, RPG, racing, platformer, tower defense, or any game genre
- User wants procedural 3D assets and game systems

## Limitations
- Single-file HTML approach limits game complexity
- No multiplayer support — browser games are single-player only
- Procedural Three.js assets look low-poly compared to authored 3D models
