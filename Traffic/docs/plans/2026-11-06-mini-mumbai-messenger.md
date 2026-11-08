# Mini Mumbai Messenger: Traffic Hero Express Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a cozy 3D WebGL/Three.js exploration and delivery game inspired by `messenger.abeto.co` (spherical planet physics, curved great-circle navigation guide, fluid third-person traversal, cozy low-poly aesthetic, and interactive delivery loop), adapted specifically to the **Mumbai Traffic Hero** universe with Dabbawala deliveries, Kaali-Peeli auto-rickshaws, iconic Mumbai landmarks, traffic rules, and collectible passport stamps.

**Architecture:** A standalone Three.js modular architecture anchored around a spherical mini-planet ($R=80$) with radial gravity physics. The player navigates on foot, on a Dabbawala bicycle with stacked tiffins, or in a Kaali-Peeli auto-rickshaw across spherical roads connecting iconic Mumbai landmarks. A curved holographic navigation ribbon guides players over the planet's curvature to delivery targets, while working traffic signals, pedestrians, and AI fellow vehicles (BEST double-decker bus, taxis) create a vibrant living city. All audio is 100% procedural via Web Audio API, and the UI features a live 3D Mini-Globe radar and collectible stamp album.

**Tech Stack:** Three.js (r186), TypeScript, Vite, Web Audio API, WebGL ShaderMaterial, HTML5/CSS3 Canvas.

---

### Task 1: Spherical Planet World & Mumbai Landmark Geometry (`src/messenger/MumbaiPlanet.ts`)

**Files:**
- Create: `src/messenger/MumbaiPlanet.ts`
- Read/Reference: `src/messenger/math.ts`

**Details:**
1. Generate the spherical terrain mesh ($R=80$) using displaced icosahedron geometry with vertex colors for beaches, asphalt roads, coastal promenade, lush parks, and mountain hills.
2. Animated stylized Arabian Sea water sphere with wave displacement, Fresnel glint, and shoreline foam.
3. Construct 6 iconic low-poly Mumbai 3D landmarks placed along the sphere:
   - **Gateway of India & Taj Pier** (Ceremonial stone basalt arch, sea dock, yacht)
   - **Bandra-Worli Sea Link** (Cable-stayed bridge towers spanning across the ocean channel)
   - **CSMT Railway Terminus & Dabbawala Central** (Gothic stone facade, clock tower, tiffin sorting crates)
   - **Marine Drive Promenade** ("Queen's Necklace" curved sea wall with art-deco buildings)
   - **Cutting Chai & Vada Pav Stall** (Steaming brass samovar kettle, snack counter, colorful canopy)
   - **Girgaon Chowpatty Beach** (Golden sand dunes, coconut palms, beach umbrella, kulfi cart)
4. Add working traffic signals (Red / Yellow / Green lights) at major junctions and streetlamp lanterns that glow at dusk/night.
5. Add pulsating delivery beacon rings at all destination stops.

---

### Task 2: Multi-Vehicle Courier Controller & Spherical Physics (`src/messenger/MumbaiHeroVehicle.ts`)

**Files:**
- Create: `src/messenger/MumbaiHeroVehicle.ts`
- Reference: `src/messenger/math.ts`, `src/messenger/Audio.ts`

**Details:**
1. Implement spherical radial gravity ($F = -g \cdot \hat{u}$) pulling towards $(0, 0, 0)$.
2. Build 3 distinct vehicle/player modes with smooth switching:
   - **Mode 1: Dabbawala Delivery Bicycle**: Wooden rear carrier loaded with stacked cylindrical aluminum tiffin boxes (dabbas) with color-coded sorting marks, spinning spoked wheels, handlebars, and "Trin-Trin!" bell.
   - **Mode 2: Kaali-Peeli Auto-Rickshaw**: Classic yellow-and-black 3-wheeler with turning front fork, yellow canvas roof, fare meter, dual electric horn ("Horn OK Please"), and headlight beams.
   - **Mode 3: On-Foot Dabbawala Hero**: White Gandhi topi cap, kurta, messenger satchel, procedural run/walk cycle and jump physics.
3. Spherical locomotion math: Camera-relative tangent plane input, great-circle displacement, ground snapping with terrain height, jump mechanics, and footstep/tire dust particles.
4. Integrate vehicle sound triggers (bicycle bell, auto horn, engine purr, jumps).

---

### Task 3: Curved Holographic Navigation Ribbon & Waypoint Guide (`src/messenger/NavigationGuide.ts`)

**Files:**
- Create: `src/messenger/NavigationGuide.ts`
- Reference: `src/messenger/math.ts`

**Details:**
1. Implement the signature *Messenger* curved holographic navigation guide:
   - Compute great-circle arc points between player position and active delivery landmark.
   - Slerp along unit sphere normals with an arched parabolic elevation height: $h(t) = h_{base} + \sin(\pi t) \cdot h_{arch}$.
   - Generate a smooth 3D ribbon/tube geometry tracing over the curvature of the planet.
2. Animated shader / texture with moving chevron arrows flowing toward the destination.
3. Real-time floating destination beacon with rotating 3D parcel/tiffin icon.
4. Calculate and return real-time remaining distance in meters (e.g. `45m`, `12m`, `ARRIVED!`).

---

### Task 4: Mumbai Delivery Missions, Traffic Rules & Stamp Passport (`src/messenger/DeliverySystem.ts`)

**Files:**
- Create: `src/messenger/DeliverySystem.ts`
- Reference: `src/messenger/MumbaiPlanet.ts`

**Details:**
1. Define the 5 Mumbai Delivery Quests:
   - **Quest 1: The 6-Sigma Dabba Express**: Pick up 12 fresh lunch tiffins from CSMT Station and deliver to Marine Drive corporate towers before lunchtime.
   - **Quest 2: Urgent Cutting Chai Run**: Deliver hot cutting chai glasses from the street stall to the Sea Link toll booth workers.
   - **Quest 3: Festive Marigold Garlands**: Pick up fresh flowers at Dadar and rush to the Gateway of India for the festival.
   - **Quest 4: Sunset Chowpatty Snacks**: Deliver fresh butter pav and snacks to beachgoers at Girgaon Chowpatty.
   - **Quest 5: The Grand Mumbai Circuit**: High-speed timed delivery across all 5 landmarks!
2. Traffic Hero Rules:
   - Detect vehicle entering intersection: Check traffic light state. If stopped at Red -> +50 "Safe Driver Bonus"! If run Red -> Warning prompt.
   - Yield to pedestrians crossing at zebra markings.
3. Collectible Mumbai Postal Passport:
   - 6 Illustrated Regional Stamps: Gateway Stamp, Sea Link Cable Stamp, Dabbawala 6-Sigma Stamp, Marine Drive Queen's Necklace Stamp, Cutting Chai Stamp, BEST Bus Stamp.
   - Track delivery statistics: completed orders, coins earned, safe driver score, courier rank ("Apprentice Runner" -> "Legendary Dabbawala").

---

### Task 5: Living Traffic NPCs & Desi Emote Reaction Wheel (`src/messenger/TrafficNPCs.ts`, `src/messenger/EmojiWheel.ts`)

**Files:**
- Create: `src/messenger/TrafficNPCs.ts`
- Create: `src/messenger/EmojiWheel.ts`

**Details:**
1. **Traffic NPCs**:
   - Spawn iconic Mumbai vehicles cruising along the spherical roads:
     - Red BEST Double-decker bus on Marine Drive
     - Kaali-Peeli Padmini taxi
     - Fellow delivery auto-rickshaw & bicycle couriers
   - AI vehicles follow spherical road loops, stop at red lights, honk friendly horns, and wave to the player!
2. **Desi Emote Reaction Wheel**:
   - Press [R] or tap on-screen Emote button to trigger a radial wheel:
     `🙏 Namaste`, `🛺 Auto`, `☕ Cutting Chai`, `❤️ Dil`, `🎉 Balle Balle`, `📦 Dabba`, `⚡ Speed`
   - Spawns bouncy 3D floating emojis above the vehicle with cheerful sound, sparkles, and reactions from nearby vehicles!

---

### Task 6: 3D Mini-Globe Radar & Celestial Day/Night Cycle (`src/messenger/MiniGlobe.ts`, `src/messenger/DayNight.ts`)

**Files:**
- Create: `src/messenger/MiniGlobe.ts`
- Create: `src/messenger/DayNight.ts`

**Details:**
1. **3D Mini-Globe Radar**:
   - Dedicated corner viewport rendering a rotating miniature replica of Planet Mumbai.
   - Shows live blinking player dot, delivery pin, fellow traffic, and compass heading.
2. **Day / Sunset / Night Celestial System**:
   - Dynamic Sun and Moon orbiting the spherical planet with rotating shadows.
   - Three atmospheres:
     - Morning / Day: Bright blue sky with puffy white clouds and warm sunlight.
     - Sunset: Golden-orange sky, purple ocean reflections.
     - Night: Starry cosmos, glowing house windows, illuminated traffic headlights, and Marine Drive's sparkling "Queen's Necklace" streetlamps!
   - Toggle with [T] key or UI button.

---

### Task 7: Game Orchestration, HUD & Complete Playable Experience (`src/messenger/main.ts`, `traffic-messenger.html`)

**Files:**
- Create: `src/messenger/main.ts`
- Create: `traffic-messenger.html`
- Modify: `vite.config.mts`
- Modify: `index.html` (Add instant launch card / button to play Traffic Messenger)

**Details:**
1. Assemble all systems in `main.ts`: Three.js renderer, shadow maps, camera follow controller, update loop, input handling.
2. Build `traffic-messenger.html` with modern, cozy styling matching the clean aesthetic of *Messenger*:
   - Active Mission HUD card with recipient portrait, item description, and distance meter.
   - Vehicle selector bar: [1] Bicycle, [2] Auto-Rickshaw, [3] On Foot.
   - Horn button ("Horn OK Please" / Trin-Trin bell).
   - Collectible Stamp Passport Modal with stamp collection grid.
   - Emote button with radial menu.
   - Audio mute & Time of Day toggles.
   - Dual virtual joysticks for mobile touch devices.
3. Configure `vite.config.mts` to build `traffic-messenger.html` cleanly.
4. Add a prominent "Play Mini Mumbai Messenger" hero banner to `index.html`.

---

### Task 8: Verification, Testing & Polish

**Files:**
- Test via Vite dev server
- Verify build with `npx vite build`
- Smoke test all mechanics (vehicle switching, delivery pickup/dropoff, curved navigation guide, sound synthesis, stamp unlock, traffic rules).
