# 🎮 Kalashnikov Online — Full Development Plan

> A GTA Online-inspired multiplayer open-world driving game built on the existing Traffic Simulator (Three.js r128 + Supabase).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Architecture Overview](#3-architecture-overview)
4. [Phase 1: Open World Foundation](#4-phase-1-open-world-foundation)
5. [Phase 2: Multiplayer Networking](#5-phase-2-multiplayer-networking)
6. [Phase 3: Mission & Heist System](#6-phase-3-mission--heist-system)
7. [Phase 4: Ethical Economy](#7-phase-4-ethical-economy)
8. [Phase 5: Player Customization](#8-phase-5-player-customization)
9. [Phase 6: City Expansion & World Building](#9-phase-6-city-expansion--world-building)
10. [Database Schema](#10-database-schema)
11. [Tech Stack & Dependencies](#11-tech-stack--dependencies)
12. [Roadmap & Milestones](#12-roadmap--milestones)

---

## 1. Executive Summary

**Vision:** Transform the existing single-player Traffic Driving Simulator into a persistent, open-world multiplayer experience inspired by GTA Online. Players join a shared Mumbai-themed city, complete heist missions with friends, earn currency, customize their vehicles and characters, and explore a living world — all in the browser.

**Key Differentiators from GTA Online:**
- **Ethical economy** — No pay-to-win. Real money only buys cosmetics.
- **Browser-based** — No download. Runs on any device with WebGL.
- **Educational backbone** — Built on a driving safety simulator, so gameplay reinforces real-world driving awareness.
- **Mumbai theme** — Unique cultural setting with Indian vehicles (auto-rickshaws, buses, bikes).

---

## 2. Current State Analysis

### What Exists Today

| System | Status | Notes |
|--------|--------|-------|
| **3D Engine** | ✅ Complete | Three.js r128 with Pacejka MF 5.2 tire physics |
| **Vehicle Types** | ✅ Complete | Bike, car, bus, truck, auto-rickshaw |
| **Road Network** | ✅ Complete | `road-graph.js` with A* pathfinding |
| **NPC Traffic** | ✅ Complete | AI-driven vehicles following routes |
| **Object Pooling** | ✅ Complete | `pools.js` — zero-GC gameplay |
| **Render Pipeline** | ✅ Complete | `render_core.js` — Low/Med/High/Ultra presets |
| **Level System** | ✅ Complete | 30+ driving lesson levels in `course.js` |
| **Auth** | ✅ Complete | Supabase OTP login |
| **Multiplayer** | ❌ None | Purely single-player |
| **Mission System** | ❌ None | Only driving lessons/quizzes |
| **Economy** | ❌ None | No currency or rewards system |
| **Character Customization** | ❌ None | Fixed player models |
| **World Boundaries** | ⚠️ Limited | Player clamped to ±1550 units (expandable to ±25500 in 50km mode) |
| **Camera** | ✅ Working | Follows player with orbit/chase modes — NOT locked |

### Critical Finding: Camera is NOT Locked

The camera in `game_core.js` already follows the player dynamically:
- **Driving mode**: Chase camera behind vehicle (line 7713)
- **Pedestrian mode**: Orbit camera around character (line 7680)
- **Transitions**: Smooth interpolation between modes (line 7710)

The camera is **not locked to a single location**. It tracks the player correctly. The "locked" feeling may come from the **world boundary** (`_wBound = 1550`), which prevents the player from exploring beyond a ~3km² area. This is the primary thing to fix for open-world feel.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER CLIENT (Three.js)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Rendering │ │ Physics  │ │ UI/HUD   │ │ Input System │   │
│  │ (WebGL)   │ │(Pacejka) │ │(SafeZone)│ │ (KB/Touch)   │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘   │
│       │             │            │               │            │
│  ┌────┴─────────────┴────────────┴───────────────┴────────┐  │
│  │              GAME CLIENT ENGINE (game_core.js)          │  │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌────────────┐  │  │
│  │  │ World   │ │ Mission  │ │ Economy │ │ Multiplayer│  │  │
│  │  │ Stream  │ │ Manager  │ │ Client  │ │ Client     │  │  │
│  │  └────┬────┘ └────┬─────┘ └────┬────┘ └─────┬──────┘  │  │
│  └───────┼───────────┼────────────┼─────────────┼─────────┘  │
└──────────┼───────────┼────────────┼─────────────┼────────────┘
           │           │            │             │
     WebSocket / Supabase Realtime / REST
           │           │            │             │
┌──────────┼───────────┼────────────┼─────────────┼────────────┐
│          ▼           ▼            ▼             ▼            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              MULTIPLAYER SERVER (Colyseus)             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────────┐ │  │
│  │  │ Game Room │ │ Heist    │ │ Economy │ │ Auth/     │ │  │
│  │  │ (Open     │ │ Room     │ │ Service │ │ Profile   │ │  │
│  │  │  World)   │ │ (Instanced│ │         │ │ Service   │ │  │
│  │  └──────────┘ └──────────┘ └─────────┘ └───────────┘ │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────┴───────────────────────────┐  │
│  │              DATABASE (Supabase PostgreSQL)            │  │
│  │  player_profiles | inventory | missions | economy      │  │
│  └───────────────────────────────────────────────────────┘  │
│                    BACKEND SERVER                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Phase 1: Open World Foundation

**Goal:** Unlock the world, expand the map, and create a seamless open-world feel.

### 4.1 Remove / Expand World Boundaries

**Current code** (`game_core.js` line 5370):
```javascript
const _wBound = this.mapCfg && this.mapCfg.is50km ? 25500 : 1550;
this.player.position.x = Math.max(-_wBound, Math.min(_wBound, this.player.position.x));
this.player.position.z = Math.max(-_wBound, Math.min(_wBound, this.player.position.z));
```

**Changes needed:**
1. Increase default `_wBound` to `5000` (10km × 10km playable area)
2. For the full city, target `10000` (20km × 20km)
3. Add soft boundaries (visual barriers, not hard clamps) at map edges
4. Add a "leaving city" warning when approaching edges

### 4.2 Chunked World Streaming

The current game loads the entire level at once. For a large open world, we need chunked loading:

```
World Grid: 10km × 10km = 100 chunks (1km × 1km each)
Render Distance: 3 chunks (3km visibility)
Memory Budget: ~50MB loaded at any time
```

**Implementation:**
```javascript
// New file: world-streamer.js
class WorldStreamer {
  constructor(game, chunkSize = 1000) {
    this.chunkSize = chunkSize;
    this.loadedChunks = new Map();
    this.renderDistance = 3; // chunks
  }

  update(playerPos) {
    const cx = Math.floor(playerPos.x / this.chunkSize);
    const cz = Math.floor(playerPos.z / this.chunkSize);

    // Load chunks within render distance
    for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
        const key = `${cx+dx},${cz+dz}`;
        if (!this.loadedChunks.has(key)) {
          this.loadChunk(cx+dx, cz+dz);
        }
      }
    }

    // Unload chunks beyond render distance + 1
    for (const [key, chunk] of this.loadedChunks) {
      const [chunkX, chunkZ] = key.split(',').map(Number);
      if (Math.abs(chunkX - cx) > this.renderDistance + 1 ||
          Math.abs(chunkZ - cz) > this.renderDistance + 1) {
        this.unloadChunk(key);
      }
    }
  }
}
```

### 4.3 District System

Divide the city into named districts, each with unique character:

| District | Theme | Vehicles | Buildings | Mission Type |
|----------|-------|----------|-----------|--------------|
| **Andheri** | Urban commercial | Cars, taxis | Offices, shops | Heist planning |
| **Bandra** | Coastal luxury | Sports cars, bikes | Condos, hotels | Racing |
| **Dharavi** | Dense residential | Autos, bikes | Compact housing | Smuggling |
| **Worli** | Business district | Sedans, buses | Skyscrapers | Corporate heists |
| **Colaba** | Heritage/tourism | Classic cars | Colonial buildings | Investigation |
| **Powai** | Tech park | EVs, bikes | Modern offices | Hacking missions |
| **Juhu** | Beachfront | Convertibles, autos | Beach houses | Social events |
| **Borivali** | Suburban | Family cars, buses | Houses, parks | Patrol missions |

### 4.4 Minimap & GPS

Add a real-time minimap showing:
- Player position and heading
- Nearby players (multiplayer)
- Mission objectives
- District boundaries
- Points of interest (shops, garages, mission triggers)

---

## 5. Phase 2: Multiplayer Networking

**Goal:** Get 2-8 players in a shared world in real-time.

### 5.1 Why Colyseus (Not Socket.io Direct)

| Feature | Colyseus | Raw Socket.io |
|---------|----------|---------------|
| State sync | ✅ Automatic delta sync | ❌ Manual |
| Schema validation | ✅ Built-in | ❌ Manual |
| Room management | ✅ Built-in | ❌ Manual |
| Matchmaking | ✅ Built-in | ❌ Manual |
| Reconnection | ✅ Built-in | ❌ Manual |
| Binary protocol | ✅ Automatic | ❌ Manual |
| **Learning curve** | Medium | Low |
| **Performance** | High | High |

**Recommendation:** Use Colyseus for game state, Supabase Realtime for social features (chat, presence, leaderboards).

### 5.2 Server Architecture

```
Colyseus Server (Node.js + Colyseus)
├── OpenWorldRoom (shared city)
│   ├── State: player positions, vehicle states, world events
│   ├── Max players: 32 per room
│   ├── Tick rate: 20 Hz (server), 60 Hz (client interpolation)
│   └── Features: proximity chat, vehicle sync, NPC sync
│
├── HeistRoom (instanced, per-heist)
│   ├── State: mission phase, objectives, enemy positions
│   ├── Max players: 4 (heist crew)
│   ├── Tick rate: 30 Hz
│   └── Features: objective tracking, fail conditions, rewards
│
└── LobbyRoom (matchmaking)
    ├── State: available heists, player readiness
    └── Features: invite system, crew formation
```

### 5.3 State Synchronization Strategy

**What to sync:**
- Player position + rotation (20 Hz)
- Vehicle position + rotation + speed (20 Hz)
- Chat messages (event-driven)
- Mission state changes (event-driven)
- Economy transactions (server-authoritative)

**What NOT to sync (client-side only):**
- Camera state
- UI animations
- Particle effects
- Sound
- Local physics predictions

**Interpolation:**
```javascript
// Client-side interpolation for smooth remote player movement
class RemotePlayerInterpolator {
  constructor() {
    this.buffer = []; // ring buffer of received states
    this.interpolateDelay = 100; // ms
  }

  update(localTime) {
    const targetTime = localTime - this.interpolateDelay;
    // Find two states bracketing targetTime
    // Lerp between them for smooth rendering
  }
}
```

### 5.4 Anti-Cheat Strategy

| Attack | Defense |
|--------|---------|
| Speed hacking | Server validates max speed per vehicle |
| Teleporting | Server checks position delta per tick |
| Money duplication | Server-authoritative economy (all transactions server-side) |
| Mission skipping | Server tracks objective completion |
| Wall hacking | Server doesn't send data for players behind walls (future) |

### 5.5 Player Limits & Matchmaking

- **Free Roam**: 32 players per city instance
- **Heist**: 2-4 players (invite only or matchmaking)
- **Race**: 2-8 players (matchmaking by skill level)
- **Crew**: Up to 8 players (persistent group)

---

## 6. Phase 3: Mission & Heist System

**Goal:** Create GTA Online-style heists with prep missions, setup, and finale.

### 6.1 Mission Hierarchy

```
HEIST (Multi-session, 4 players)
├── PLANNING PHASE (Solo, in planning room)
│   ├── Choose approach (Stealth / Loud / Smart)
│   ├── Buy equipment (from economy)
│   └── Recruit crew (invite friends)
│
├── PREP MISSIONS (Solo or Duo, 3-5 missions)
│   ├── Gather intel (scout location)
│   ├── Steal equipment (vehicles, weapons, tools)
│   ├── Neutralize threats (optional)
│   └── each prep unlocks options in finale
│
├── SETUP MISSIONS (Full crew, 2-3 missions)
│   ├── Getaway vehicle positioning
│   ├── Equipment delivery
│   └── Final reconnaissance
│
└── FINALE (Full crew, 1 mission)
    ├── Execute the plan
    ├── Split loot
    └── Escape
```

### 6.2 Heist: "The Gateway of India Job"

**Difficulty:** ★★☆☆☆ (Starter Heist)
**Players:** 2-4
**Reward:** ₹50,000 per player (base)

#### Prep Missions:

| # | Mission | Description | Time | Reward |
|---|---------|-------------|------|--------|
| 1 | **Intel Gathering** | Drive to Gateway of India, photograph security, mark entry points | 5 min | ₹5,000 |
| 2 | **Tool Acquisition** | Steal a van from the docks containing drilling equipment | 8 min | ₹8,000 |
| 3 | **Getaway Route** | Complete a timed drive through 5 checkpoints to lock in escape route | 6 min | ₹6,000 |
| 4 | **Insider Contact** | Meet a contact at a tea stall, deliver a package, avoid police | 7 min | ₹7,000 |

#### Setup Missions:

| # | Mission | Description | Time | Reward |
|---|---------|-------------|------|--------|
| 1 | **Position Equipment** | Drive the tool van to the staging area without being detected | 10 min | ₹10,000 |
| 2 | **Disable Cameras** | Infiltrate the building, reach the security room, complete a mini-game | 8 min | ₹10,000 |

#### Finale:

| Phase | Description | Mechanic |
|-------|-------------|----------|
| **Infiltration** | Enter through service entrance | Stealth: avoid guards. Loud: shoot cameras |
| **The Job** | Reach the vault, complete drilling mini-game | Team coordination, timing |
| **Escape** | Get to getaway vehicle, lose cops | Driving skill test, 3-star chase |
| **Split** | Divide loot based on approach chosen | Stealth = 40% bonus, Loud = combat bonus |

### 6.3 Heist: "D-Block Express"

**Difficulty:** ★★★☆☆
**Players:** 3-4
**Reward:** ₹150,000 per player

A train heist on the local railway. Players must:
1. Steal a maintenance vehicle (prep)
2. Hack the signaling system (prep)
3. Board the moving train (setup)
4. Rob the cargo car while navigating obstacles (finale)
5. Escape by jumping to a bridge (finale)

### 6.4 Heist: "The Tower Job"

**Difficulty:** ★★★★☆
**Players:** 4
**Reward:** ₹300,000 per player

A skyscraper heist requiring:
1. Acquire a helicopter (prep)
2. Map the building's ventilation system (prep)
3. Bypass electronic locks (setup)
4. Rooftop infiltration via helicopter (finale)
5. Descend through floors collecting targets (finale)
6. Escape via parachute (finale)

### 6.5 Mission Types (Non-Heist)

| Type | Frequency | Reward Range | Description |
|------|-----------|--------------|-------------|
| **Delivery** | Every 5 min | ₹2,000-5,000 | Transport goods across city |
| **Chase** | Every 10 min | ₹5,000-10,000 | Pursue and stop a target vehicle |
| **Race** | On demand | ₹3,000-8,000 | Point-to-point or circuit race |
| **Patrol** | Every 15 min | ₹4,000-7,000 | Follow a route, report incidents |
| **Stunt** | On demand | ₹2,000-15,000 | Complete a stunt jump or challenge |
| **Smuggle** | Every 20 min | ₹10,000-20,000 | Transport contraband without detection |

### 6.6 Mission State Machine

```javascript
// Server-side mission state machine
const MissionPhase = {
  UNAVAILABLE: 'unavailable',
  AVAILABLE: 'available',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  CHECKPOINT: 'checkpoint',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

class MissionInstance {
  constructor(missionDef, players) {
    this.def = missionDef;
    this.players = players;
    this.phase = MissionPhase.ACCEPTED;
    this.objectives = missionDef.objectives.map(o => ({
      ...o,
      status: 'pending',
      progress: 0
    }));
    this.timer = missionDef.timeLimit;
    this.retries = 0;
  }

  updateObjective(index, progress) {
    this.objectives[index].progress = progress;
    if (progress >= 100) {
      this.objectives[index].status = 'completed';
      this.checkAllComplete();
    }
  }

  checkAllComplete() {
    if (this.objectives.every(o => o.status === 'completed')) {
      this.phase = MissionPhase.COMPLETED;
      this.reward();
    }
  }

  reward() {
    const bonus = this.calculateBonus();
    this.players.forEach(p => {
      EconomyService.addCurrency(p.id, this.def.baseReward + bonus);
    });
  }
}
```

---

## 7. Phase 4: Ethical Economy

**Goal:** Fun, balanced economy with no pay-to-win.

### 7.1 Currency System

| Currency | Earned By | Spent On | Max Balance |
|----------|-----------|----------|-------------|
| **₹ (Rupees)** | Missions, heists, daily rewards | Vehicles, properties, items | 10,000,000 |
| **Reputation (Rep)** | Completing missions, helping others | Unlock new missions, districts | No cap |
| **Tokens** | Daily login, achievements | Cosmetic items only | 500 |

### 7.2 Earning Sources

| Source | Amount | Frequency | Notes |
|--------|--------|-----------|-------|
| Delivery missions | ₹2,000-5,000 | Unlimited | Base income |
| Heist prep | ₹5,000-10,000 | Per heist | Skill-based |
| Heist finale | ₹50,000-300,000 | Per heist | Team-based split |
| Daily bonus | ₹10,000 | Once/day | Login reward |
| First heist bonus | ₹100,000 | Once | New player boost |
| Streak bonus | ₹5,000/day | Daily login streak | Up to 7 days |
| Passive income | ₹1,000/hr | After buying property | Up to 3 properties |

### 7.3 Spending Sources

| Item | Cost | Category |
|------|------|----------|
| **Vehicles** | | |
| Basic bike | ₹10,000 | Transport |
| Sedan | ₹50,000 | Transport |
| Sports car | ₹200,000 | Performance |
| Superbike | ₹150,000 | Performance |
| Truck | ₹100,000 | Utility |
| Auto-rickshaw | ₹25,000 | Transport |
| **Properties** | | |
| Small garage | ₹50,000 | Storage |
| Apartment | ₹200,000 | Spawn point, planning room |
| Warehouse | ₹500,000 | Heist staging, passive income |
| Penthouse | ₹2,000,000 | Status, crew hub |
| **Upgrades** | | |
| Engine upgrade (L1-3) | ₹10,000-50,000 | Vehicle performance |
| Brake upgrade (L1-3) | ₹8,000-40,000 | Vehicle performance |
| Armor upgrade (L1-3) | ₹15,000-60,000 | Vehicle durability |
| **Cosmetics** | | |
| Vehicle paint | ₹5,000 | Visual |
| Vehicle wrap | ₹10,000 | Visual |
| Character outfit | ₹3,000-15,000 | Visual |
| Character emote | ₹2,000 | Social |

### 7.4 Ethical Monetization Rules

1. **No pay-to-win**: Real money (₹ Tokens) can ONLY buy cosmetics.
2. **No artificial scarcity**: All vehicles and properties are earnable through gameplay.
3. **No loot boxes**: All purchases show exactly what you get.
4. **No FOMO timers**: Items rotate monthly but always return.
5. **No energy systems**: Play as long as you want.
6. **Transparent pricing**: Show real-time cost in play-time equivalent.
7. **No predatory offers**: No "limited time" bundles or pressure tactics.

### 7.5 Inflation Control

- **Sinks**: Vehicle maintenance (₹500/repair), property taxes (weekly), insurance
- **Caps**: Daily earning cap of ₹500,000 from missions (heists exempt)
- **Balancing**: Server monitors economy health weekly

---

## 8. Phase 5: Player Customization

**Goal:** Let players express themselves through character and vehicle customization.

### 8.1 Character Customization

**Avatar System (Modular "Paper Doll"):**

```
Character
├── Head
│   ├── Face shape (6 options)
│   ├── Skin tone (12 options)
│   ├── Hair style (15 options)
│   └── Hair color (10 options)
├── Body
│   ├── Shirt/top (20 options)
│   ├── Pants/bottom (15 options)
│   ├── Shoes (10 options)
│   └── Accessories (glasses, watches, hats)
├── Vehicle (linked)
│   ├── Primary color
│   ├── Secondary color
│   ├── Livery/wrap
│   ├── Window tint
│   └── Plate text
└── Expressions
    ├── Wave
    ├── Thumbs up
    ├── Dance
    └── Celebration
```

**Implementation:**
- Use modular GLB meshes (head, torso, legs, arms)
- Swap textures and geometry parts via `Material.clone()`
- Cache loaded character models in `ThreePools`
- Sync `skinId` across network (not full mesh data)

### 8.2 Vehicle Customization

```javascript
// Vehicle customization data
const VehicleCustomization = {
  paint: {
    primary: { r: 255, g: 0, b: 0 },    // RGB color
    secondary: { r: 0, g: 0, b: 0 },
    finish: 'metallic' | 'matte' | 'chrome' | 'pearlescent'
  },
  performance: {
    engine: 1,    // Level 1-3
    brakes: 1,    // Level 1-3
    armor: 0,     // Level 0-3
    transmission: 1  // Level 1-2
  },
  visual: {
    livery: 'none' | 'racing' | 'flames' | 'camo' | ...,
    windowTint: 0,    // 0-100% darkness
    neonColor: null,   // RGB or null
    plateText: 'MUMBAI'
  }
};
```

### 8.3 Outfit System

| Category | Items | Unlock Method |
|----------|-------|---------------|
| **Street** | T-shirts, jeans, sneakers | Default |
| **Formal** | Suits, dress shoes, watches | Reputation Level 10 |
| **Racing** | Helmets, racing suits, gloves | Complete 5 races |
| **Work** | Mechanic overalls, construction vest | Buy garage property |
| **Criminal** | Masks, dark clothing, gloves | Complete first heist |
| **Festival** | Traditional Indian wear, accessories | Login during festival events |

---

## 9. Phase 6: City Expansion & World Building

**Goal:** Create a living, breathing Mumbai-inspired city.

### 9.1 City Map Layout

```
                    ┌─────────────────────┐
                    │    BORIVALI          │
                    │    (Suburban)        │
                    │    Houses, Parks     │
    ┌───────────────┼─────────────────────┼───────────────┐
    │   ANDHERI     │      POWAI          │   THANE       │
    │   (Commercial)│      (Tech Park)    │   (Industrial)│
    │   Offices     │      Modern HQs     │   Warehouses  │
    ├───────────────┼─────────────────────┼───────────────┤
    │   BANDRA      │    ★ CENTRAL ★      │   GHATKOPAR   │
    │   (Luxury)    │    (Downtown)       │   (Residential│
    │   Hotels      │    Skyscrapers      │    Housing)   │
    ├───────────────┼─────────────────────┼───────────────┤
    │   JUHU        │     WORLI           │   DADAR       │
    │   (Beach)     │     (Business)      │   (Market)    │
    │   Beachfront  │     Corporate       │   Street Market│
    ├───────────────┼─────────────────────┼───────────────┤
    │   DHARAVI     │     COLABA          │   FORT        │
    │   (Residential│     (Heritage)      │   (Historic)  │
    │    Dense)     │     Tourism         │   Finance     │
    └───────────────┼─────────────────────┼───────────────┘
                    │   ★ GATEWAY ★       │
                    │   (Waterfront)      │
                    │   Landmark Heists   │
                    └─────────────────────┘
```

### 9.2 Points of Interest

| Location | Type | Function |
|----------|------|----------|
| Gateway of India | Landmark | Heist target, photo spot |
| Marine Drive | Scenic route | Racing, cruising |
| Dharavi Market | Shop hub | Buy cheap items, sell loot |
| Bandra-Worli Sea Link | Highway | High-speed racing |
| Chhatrapati Shivaji Terminus | Station | Fast travel, missions |
| Haji Ali Dargah | Landmark | Social meeting point |
| Siddhivinayak Temple | Landmark | Daily bonus pickup |
| Powai Lake | Scenic | Fishing, relaxation |
| Juhu Beach | Beach | Stunt challenges, social |
| Airport | Hub | Heist planning, vehicle spawn |

### 9.3 Day/Night Cycle

```javascript
// Dynamic time system
const TimeSystem = {
  realMinutesPerGameHour: 2,  // 1 real min = 30 game min
  phases: {
    dawn:    { hours: [5, 7],   ambient: 0.6, sky: 0xffa07a },
    morning: { hours: [7, 12],  ambient: 0.9, sky: 0x87ceeb },
    afternoon:{ hours: [12, 17], ambient: 1.0, sky: 0x4682b4 },
    evening: { hours: [17, 20], ambient: 0.7, sky: 0xff8c00 },
    night:   { hours: [20, 5],  ambient: 0.3, sky: 0x0a0a2e }
  },
  // Time affects:
  // - Traffic density (rush hour)
  // - Mission availability (some only at night)
  // - NPC behavior (pedestrians减少 at night)
  // - Lighting and atmosphere
};
```

### 9.4 Dynamic Events

| Event | Trigger | Reward | Frequency |
|-------|---------|--------|-----------|
| Street Race | Random location | ₹10,000 | Every 15 min |
| Police Chase | Crime committed | Survival bonus | On crime |
| VIP Escort | Random | ₹20,000 | Every 30 min |
| Street Fight | Random location | ₹5,000 | Every 20 min |
| Festival | Real-world dates | Special cosmetics | Seasonal |

---

## 10. Database Schema

### Supabase PostgreSQL Tables

```sql
-- Player profiles (extends Supabase auth)
CREATE TABLE player_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  level INT DEFAULT 1,
  reputation INT DEFAULT 0,
  rupees BIGINT DEFAULT 50000,  -- starting money
  tokens INT DEFAULT 100,       -- premium currency
  play_time_seconds INT DEFAULT 0,
  last_daily_bonus TIMESTAMPTZ,
  current_vehicle TEXT DEFAULT 'car',
  current_outfit JSONB DEFAULT '{}',
  customization JSONB DEFAULT '{}',
  properties UUID[] DEFAULT '{}',
  crew_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle ownership
CREATE TABLE player_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES player_profiles(id),
  vehicle_type TEXT NOT NULL,  -- 'car', 'bike', 'bus', etc.
  name TEXT NOT NULL,
  customization JSONB DEFAULT '{}',
  performance JSONB DEFAULT '{}',
  purchase_price BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mission progress
CREATE TABLE mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES player_profiles(id),
  mission_id TEXT NOT NULL,
  status TEXT DEFAULT 'available',  -- available, in_progress, completed, failed
  phase TEXT,
  objectives JSONB DEFAULT '[]',
  attempts INT DEFAULT 0,
  best_time INT,
  rewards_earned BIGINT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Heist instances
CREATE TABLE heist_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  heist_id TEXT NOT NULL,
  leader_id UUID REFERENCES player_profiles(id),
  approach TEXT,  -- 'stealth', 'loud', 'smart'
  phase TEXT DEFAULT 'planning',
  crew UUID[] DEFAULT '{}',
  objectives JSONB DEFAULT '{}',
  loot_total BIGINT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Transaction log (economy audit)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES player_profiles(id),
  type TEXT NOT NULL,  -- 'earn', 'spend', 'transfer'
  source TEXT NOT NULL,  -- 'mission', 'heist', 'shop', 'daily', etc.
  amount BIGINT NOT NULL,
  balance_after BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboards (materialized view for performance)
CREATE MATERIALIZED VIEW leaderboard AS
SELECT
  id, username, level, reputation, rupees,
  ROW_NUMBER() OVER (ORDER BY reputation DESC) as rep_rank,
  ROW_NUMBER() OVER (ORDER BY rupees DESC) as wealth_rank,
  ROW_NUMBER() OVER (ORDER BY level DESC) as level_rank
FROM player_profiles;

-- Crews (groups of players)
CREATE TABLE crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tag TEXT UNIQUE NOT NULL,  -- short tag like "KAL"
  leader_id UUID REFERENCES player_profiles(id),
  members UUID[] DEFAULT '{}',
  max_members INT DEFAULT 8,
  total_earnings BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties
CREATE TABLE player_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES player_profiles(id),
  property_type TEXT NOT NULL,  -- 'garage', 'apartment', 'warehouse', 'penthouse'
  location TEXT NOT NULL,
  level INT DEFAULT 1,
  last_tax_paid TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Players can only read/write their own profile
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_own_profile" ON player_profiles
  FOR ALL USING (auth.uid() = id);

-- Players can read other players' public info
CREATE POLICY "public_profile_read" ON player_profiles
  FOR SELECT USING (true);

-- Players can only modify their own vehicles
ALTER TABLE player_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_own_vehicles" ON player_vehicles
  FOR ALL USING (auth.uid() = player_id);

-- Transactions are append-only
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "append_only_transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "read_own_transactions" ON transactions
  FOR SELECT USING (auth.uid() = player_id);
```

---

## 11. Tech Stack & Dependencies

### Current Stack (Keep)
- Three.js r128 — 3D rendering
- Pacejka MF 5.2 — Vehicle physics
- Supabase — Auth, database, real-time
- Vercel — Static hosting

### New Dependencies

| Package | Purpose | Size | Cost |
|---------|---------|------|------|
| **colyseus** | Multiplayer server framework | ~50KB client | Free (self-hosted) |
| **@colyseus/ws-transport** | WebSocket transport | ~10KB | Free |
| **draco3d** | 3D model compression | ~200KB | Free |
| **socket.io** | (via Colyseus) Real-time | ~30KB | Free |
| **node-cron** | Scheduled tasks (daily rewards) | ~15KB | Free |

### Server Requirements

| Metric | Minimum | Recommended |
|--------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 2GB | 4GB |
| Storage | 10GB | 50GB |
| Bandwidth | 100GB/mo | 500GB/mo |
| **Provider** | Railway / Fly.io | AWS EC2 / DigitalOcean |
| **Cost** | ~$5/mo | ~$20/mo |

---

## 12. Roadmap & Milestones

### Phase 1: Open World Foundation (Weeks 1-3)
- [ ] Expand world boundaries from ±1550 to ±5000
- [ ] Implement chunked world streaming
- [ ] Add district system with named areas
- [ ] Create minimap with GPS
- [ ] Add soft boundaries and edge warnings
- **Milestone**: Players can explore a 10km² city freely

### Phase 2: Multiplayer Core (Weeks 4-6)
- [ ] Set up Colyseus server
- [ ] Implement player position sync
- [ ] Add vehicle sync with interpolation
- [ ] Create lobby and matchmaking system
- [ ] Add proximity chat
- [ ] Test with 8 players
- **Milestone**: 8 players can drive together in the same world

### Phase 3: First Heist (Weeks 7-10)
- [ ] Create planning room UI
- [ ] Implement prep mission system (4 missions)
- [ ] Build "Gateway of India Job" heist
- [ ] Add mission state machine
- [ ] Implement loot split system
- [ ] Test full heist flow with 4 players
- **Milestone**: Players can complete their first full heist

### Phase 4: Economy & Progression (Weeks 11-13)
- [ ] Implement rupee currency system
- [ ] Add vehicle shop
- [ ] Create property system
- [ ] Add daily bonus and streaks
- [ ] Implement performance upgrades
- [ ] Add leaderboard
- **Milestone**: Players can earn, spend, and progress

### Phase 5: Customization (Weeks 14-16)
- [ ] Build character customization screen
- [ ] Implement modular avatar system
- [ ] Add vehicle paint shop
- [ ] Create outfit system
- [ ] Sync customization across network
- [ ] Add emotes
- **Milestone**: Players can personalize their character and vehicle

### Phase 6: City Expansion (Weeks 17-20)
- [ ] Build 8 districts with unique themes
- [ ] Add dynamic events (street races, etc.)
- [ ] Implement day/night cycle
- [ ] Add weather system (rain, fog)
- [ ] Create 3 more heists
- [ ] Add 10+ mission types
- **Milestone**: Full city with 20+ hours of content

### Phase 7: Polish & Launch (Weeks 21-24)
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Tutorial/onboarding flow
- [ ] Anti-cheat hardening
- [ ] Load testing (32 players)
- [ ] Beta testing
- **Milestone**: Production-ready launch

---

## Appendix A: GTA Online Feature Comparison

| GTA Online Feature | Our Implementation | Priority |
|--------------------|-------------------|----------|
| Open world | Chunked 10km² city | P0 |
| Multiplayer (32 players) | Colyseus rooms | P0 |
| Heists (4 players) | Instanced heist rooms | P0 |
| Vehicle customization | Paint shop + performance | P1 |
| Character customization | Modular avatar system | P1 |
| Properties | Apartments, garages, warehouses | P1 |
| Economy (GTA$) | Rupees + Tokens | P0 |
| Daily objectives | Daily bonus + streaks | P1 |
| Passive income | Property-based | P2 |
| Races | Point-to-point + circuit | P1 |
| Jobs (missions) | 6 mission types | P0 |
| CEO/VIP work | Crew-based missions | P2 |
| Nightclubs | Social hubs | P3 |
| bunkers | Heist planning rooms | P1 |
| Arena War | PvP races | P3 |
| Casino | ❌ Not included (ethical) | — |
| Shark Cards | ❌ Not included (ethical) | — |

---

## Appendix B: Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Server costs spike | High | Implement player caps, use serverless for low traffic |
| Cheating/hacking | Medium | Server-authoritative physics + economy |
| Performance on mobile | High | Aggressive LOD, reduce sync rate on mobile |
| Player retention | High | Daily bonuses, progression hooks, social features |
| Scope creep | High | Strict phased approach, MVP first |
| Three.js r128 limitations | Medium | Keep all new features compatible with r128 |

---

*Last updated: July 27, 2026*
*Author: Buffy (AI Planning Assistant)*
*Status: Draft — Awaiting Review*
