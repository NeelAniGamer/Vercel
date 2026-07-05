# Traffic Game - Implementation Plan

## Overview
This document outlines a comprehensive set of improvements to the Traffic game including:
- Level content matching (festival crowds, etc.)
- AI improvements for pedestrians and vehicles
- Character model visibility fixes
- 2D demo replacing 2D game
- Footpath improvements
- UI for different grade levels (Std 1-10)
- Touch/mouse control fixes

---

## Phase 1: Content Matching & Level Fixes

### 1.1 Festival Crowd Level Fixes (Levels 33, 38, 41, 46)
**Problem**: Levels describe festival crowds but actual gameplay doesn't show them

**Current State**:
- `level38.js` has `crowdFestival: true` and `themeType: 'festival'`
- Code in game_core.js at line 2153 spawns 80+ crowd when `crowdFestival` is true
- But spawn position is on sidewalks at distance 9+ from road center

**Solution**:
1. Increase `crowdFestival` crowd count from 80 to 150 for visibility
2. Spawn some crowd ON the road edge (not just sidewalks) to block lanes
3. Add festive decorations (lights, banners) in the scene
4. Add music vehicle (decorated truck with speakers)
5. Reduce vehicle speed in crowd areas automatically

**Files to Modify**:
- `game_core.js`: lines 2154-2220 (festival crowd burst)
- `levels/level38.js`: increase npcDensity to 'heavy'

### 1.2 Level Content vs Description Alignment
**Problem**: Level description says one thing, gameplay shows another

**Solution**:
Create a mapping system where each level's actual behavior matches its description:

| Level | Description | Current Issue | Fix |
|-------|-------------|---------------|-----|
| 38 | Festival traffic, crowd blocking road | Crowd stays on sidewalks | Spawn 30% of crowd on road edge |
| 33 | Festival Traffic! | No decorations | Add festival decorations |
| 19 | School Zone | No school building visible | Add school building mesh |
| 46 | Night Festival | Dark but no festival lights | Add string lights, lanterns |

---

## Phase 2: AI Improvements

### 2.1 Pedestrian AI Improvements
**Current Issues**:
- Pedestrians walk in straight lines only
- No reaction to vehicles approaching
- They don't use crosswalks intelligently

**Solution**:
1. **Crosswalk Detection**: Pedestrians wait at crosswalks until vehicles yield
2. **Vehicle Reaction**: Pedestrians step back when vehicle approaches fast (>30 units close)
3. **Idle States**: Pedestrians stop, look at phone, check both ways randomly
4. **Jaywalk Detection**: Penalize when pedestrian crosses where there's no crosswalk nearby
5. **Group Behavior**: Families walk together, pedestrians follow each other

**Files to Modify**: `game_core.js` lines 3900-4120

### 2.2 Vehicle AI Improvements
**Current Issues**:
- NPCs drive too mechanically (waypoint following only)
- No reaction to traffic lights
- No lane changes when blocked

**Solution**:
1. **Traffic Light Response**: NPCs stop at red, proceed on green
2. **Blocked Lane Avoidance**: NPCs change lanes when ahead is blocked
3. **Stuck Detection**: Already exists but increase sensitivity
4. **Honk Before Overtake**: NPCs honk before passing slow vehicles
5. **Emergency Response**: NPCs pull over for ambulance (already exists, verify)

**Files to Modify**: `game_core.js` lines 2000-2500 (NPC spawning and behavior)

---

## Phase 3: Character Model Visibility

### 3.1 Why Character Models Aren't Showing
**Root Cause Analysis**:
- Models ARE loaded in `PRELOADED_MODELS` (char_f_a, char_m_a, etc.) - these are in `CORE_ASSETS`
- `_buildHuman()` in ui.js tries to use them from PRELOADED_MODELS
- But scale might be wrong - GLB loaded at 4.5x, then human scaled to 1.2 or 1.5
- Fallback procedural human is used when GLB fails

**Solution**:
1. Verify model loading - check console for errors
2. Ensure correct scale (4.5 * 1.2 = 5.4, should be visible)
3. Add debug flag to force show model loading status
4. Make fallback less aggressive - only use when model truly fails

**Files to Modify**:
- `ui.js`: lines 1562-1645 (`_buildHuman` function)
- `start.js`: verify char models are loaded correctly

### 3.2 Make Pedestrian Mode More Visible
When player is in pedestrian mode (e.g., level 1):
- Current: Player is a small boxy human
- Improve: Make player stand taller, add walking animation
- Add "Get out of vehicle" button for levels with both modes

---

## Phase 4: 2D Demo Replacement

### 4.1 Current 2D Game Issues
**Problem**: The 2D scenario game in `scenario2d.js` is disconnected from actual level content

**Solution**: Create a 2D DEMO mode that:
1. Shows a top-down animated view of what the level teaches
2. Auto-plays with correct behaviors to demonstrate the concept
3. Shows traffic rules in action (don't jump red, yield to pedestrians, etc.)
4. Has "Your Turn" button to try the 2D version

### 4.2 Implementation
**New 2D Demo Screen**:
```javascript
// Top-down animated visualization
// Shows correct driver behavior for that level
// Auto-plays a "perfect run" demonstration
// User can tap "Try It" to play 2D mini-game
```

**Structure**:
- Auto-demo mode: Watch correct behavior (30 seconds)
- Interactive mode: User tries themselves
- Educational overlay: Shows what's happening and why

**Files to Create/Modify**:
- Create `scenario2d-demo.js` (new file)
- Modify `Academy.html` to show demo before 3D game
- Modify `ui.js` to integrate demo mode

---

## Phase 5: Footpath/Path Improvements

### 5.1 Colored Footpaths
**Current Issue**: Ground is one color (green/gray), no distinct footpath

**Solution**:
1. Add separate footpath geometry on both sides of roads
2. Color footpaths with concrete gray: `#b0b0b0`
3. Add tactile paving (dots) near crosswalks in yellow: `#ffd700`
4. Add curb detail - slight raised edge

**Implementation**:
- In `_buildScene()` where roads are created, add sidewalk meshes
- Sidewalk position: road edge ± (laneWidth/2 + 3)
- Sidewalk width: 3 units
- Sidewalk height: 0.2 units (raised)

**Files to Modify**:
- `game_core.js`: around line 1550-1650 (road building)
- Add new function `_buildSidewalks()`

### 5.2 Node Ring Placement
**Current**: Checkpoint rings always on road

**Solution**:
- In vehicle mode: rings on left side of road (current behavior)
- In pedestrian mode: rings on sidewalk/path
- Use `isPedestrian` flag to determine position

**Implementation**:
```javascript
// In _buildArrows() around line 2945
const ringOffset = this.isPedestrian ? 8 : 3; // sidewalk vs road offset
const ringSide = this.isPedestrian ? -1 : -1; // left side
```

---

## Phase 6: Different Scenarios Per Level

### 6.1 Level Mode Configuration
Each level should define what types of entities appear:

| Level Type | Vehicles | Pedestrians | Notes |
|------------|----------|-------------|-------|
| Car learning | Cars only | Minimal | Focus on driving |
| Pedestrian crossing | Cars, buses | Many | Learn to yield |
| Mixed traffic | Cars, autos, bikes | Some | Real-world simulation |
| Emergency | Cars + ambulance | Few | Learn emergency protocols |
| Festival | Reduced cars | Many | Crowded situations |
| Highway | Cars, trucks | None | High-speed driving |

### 6.2 Implementation
Add to each level config:
```javascript
// In level configuration
scenarioType: 'mixed_traffic', // 'cars_only' | 'peds_only' | 'mixed' | 'emergency' | 'festival'
vehicleTypes: ['car', 'auto', 'bike'], // which vehicles spawn
pedestrianDensity: 'heavy', // 'light' | 'moderate' | 'heavy'
```

Filter spawning based on these settings.

---

## Phase 7: UI for Std 1-10 (Age-Based)

### 7.1 Current Age Handling
- Already exists in `ui.js` at lines 274-308 (`getAgeTier()`)
- Age stored in localStorage from profile
- Tiers: child (≤12), teen (13-17), young (18-25), adult (26-50)

### 7.2 New Grade-Based UI
**Requirement**: User selects their grade (Std 1-10), UI adjusts accordingly

**Implementation**:
1. Add grade selector in Academy.html profile section
2. Map grades to age groups:
   - Std 1-3 (ages 6-9): Very childish - bright colors, large buttons, simple language
   - Std 4-6 (ages 9-12): Childish but more text - some icons, medium buttons
   - Std 7-9 (ages 12-15): Teen - normal UI, some guidance
   - Std 10 (ages 15-16): Young adult - minimal guidance, more text

3. UI Adjustments per grade:
   - Button size: Large for Std 1-3, normal for Std 7+
   - Language complexity: Simple for young, formal for older
   - Tutorial hints: Frequent for young, rare for older
   - Colors: Bright/warm for young, neutral for older

**Grade Configuration**:
```javascript
const GRADE_CONFIG = {
  1: { buttonSize: 'large', hints: 'max', lang: 'simple', theme: 'bright' },
  2: { buttonSize: 'large', hints: 'max', lang: 'simple', theme: 'bright' },
  3: { buttonSize: 'large', hints: 'max', lang: 'simple', theme: 'bright' },
  4: { buttonSize: 'medium', hints: 'frequent', lang: 'simple', theme: 'warm' },
  5: { buttonSize: 'medium', hints: 'frequent', lang: 'simple', theme: 'warm' },
  6: { buttonSize: 'medium', hints: 'frequent', lang: 'simple', theme: 'warm' },
  7: { buttonSize: 'normal', hints: 'some', lang: 'normal', theme: 'neutral' },
  8: { buttonSize: 'normal', hints: 'some', lang: 'normal', theme: 'neutral' },
  9: { buttonSize: 'normal', hints: 'minimal', lang: 'normal', theme: 'neutral' },
  10: { buttonSize: 'normal', hints: 'minimal', lang: 'formal', theme: 'professional' }
};
```

### 7.3 Implementation Files
- Modify `Academy.html`: Add grade selector dropdown
- Modify `ui.js`: Add `getGradeConfig()` function, apply UI changes
- Modify `Driving.html`: Add grade-specific CSS classes to controls

---

## Phase 8: Touch & Mouse Controls Fixes

### 8.1 Touch Swipe Issue
**Current Problem**: Swiping doesn't turn character toward swipe direction

**Solution**:
1. Track touch start position
2. On touch move, calculate direction vector
3. Rotate player toward swipe direction
4. Add threshold to prevent accidental turns

**Implementation**:
```javascript
// In game_core.js touch handlers
let touchStartX = 0, touchStartY = 0;
const SWIPE_THRESHOLD = 30;

wheel.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

wheel.addEventListener('touchmove', (e) => {
  const dx = e.touches[0].clientX - touchStartX;
  const dy = e.touches[0].clientY - touchStartY;
  
  if (Math.abs(dx) > SWIPE_THRESHOLD) {
    // Turn player toward swipe direction
    const targetAngle = Math.atan2(dx, -dy);
    this.player.rotation.y = targetAngle;
  }
});
```

### 8.2 Mouse Controls (Up/Down/Left/Right)
**Current**: Mouse only controls camera

**Solution**:
1. Enable WASD or Arrow keys for mouse users
2. Add on-screen buttons for mobile-style on desktop
3. Make mouse movement turn the player when not in pointer lock

**Implementation**:
- Enable `this.keys` for arrow keys and WASD
- Add `pointerdown` event for mouse steering
- Map mouse position relative to center to steering angle

**Files to Modify**:
- `game_core.js`: lines 550-630 (input handling)
- `Driving.html`: Add mouse control buttons

---

## Phase 9: Bug Fixes

### 9.1 Known Bugs to Fix
1. **Checkpoint not registering**: Increase checkpoint radius
2. **Vehicle stuck in geometry**: Improve collision detection
3. **Pedestrians falling through road**: Add ground plane for pedestrians
4. **Audio not playing**: Verify audio context creation
5. **Level not loading**: Add better error handling for missing assets
6. **Score not saving**: Ensure localStorage write succeeds
7. **Certificate not generating**: Fix canvas rendering issues

### 9.2 Files to Audit
- `ui.js`: Certificate generation
- `game_core.js`: Checkpoint detection, collision
- `course.js`: Score tracking

---

## Phase 10: Remove Unused Files

### 10.1 Identify Unused Files
Check for:
- Files referenced in HTML but not used
- Duplicate functions
- Empty/comment-only files
- Old backup files

### 10.2 Common Candidates
- Any `*.backup` files
- Any `test*.js` not in `/tests/` folder
- Unused images or assets

### 10.3 Cleanup Actions
1. Document all files in the project
2. Cross-reference with HTML script tags
3. Remove confirmed unused files
4. Document removal in CHANGELOG

---

## Implementation Order

```
Phase 1: Level Content Matching (Week 1)
  → Fix festival levels
  → Align descriptions with gameplay

Phase 2: AI Improvements (Week 1-2)
  → Pedestrian behavior
  → Vehicle behavior

Phase 3: Character Models (Week 2)
  → Debug visibility issues
  → Verify loading

Phase 4: 2D Demo (Week 2-3)
  → Create demo mode
  → Integrate with Academy

Phase 5: Footpaths (Week 3)
  → Add colored sidewalks
  → Fix checkpoint placement

Phase 6: Scenarios (Week 3)
  → Define scenario types
  → Implement per-level config

Phase 7: Grade UI (Week 4)
  → Add grade selector
  → Adjust UI per grade

Phase 8: Controls (Week 4)
  → Fix touch swipe
  → Add mouse controls

Phase 9: Bug Fixes (Week 4-5)
  → Fix known issues
  → Test thoroughly

Phase 10: Cleanup (Week 5)
  → Remove unused files
  → Final audit
```

---

## Files to Modify Summary

| File | Changes |
|------|---------|
| `game_core.js` | AI, checkpoints, footpaths, controls, scenarios |
| `ui.js` | Character models, grade config, age tier |
| `Academy.html` | Grade selector, 2D demo link |
| `Driving.html` | Mouse controls |
| `scenario2d.js` | Convert to demo mode |
| `levels/*.js` | Add scenario types, fix crowdFestival |
| `start.js` | Verify model loading |

---

## Testing Checklist

- [ ] Festival level shows visible crowd
- [ ] Pedestrians react to vehicles
- [ ] Vehicles stop at red lights
- [ ] Character models visible in pedestrian mode
- [ ] 2D demo auto-plays and shows correct behavior
- [ ] Footpaths colored and visible
- [ ] Checkpoints on sidewalk in pedestrian mode
- [ ] Grade selector works and changes UI
- [ ] Touch swipe turns character
- [ ] Mouse can control character direction
- [ ] All levels load without errors
- [ ] No console errors on normal gameplay

---

## Phase 11: Level Content vs Implementation Analysis

### 11.1 Detailed Gap Analysis

| Level | Name | Description Says | Current Implementation | Gap to Fix |
|-------|------|------------------|------------------------|------------|
| **1** | Red Light Patience | "NPC cars honk aggressively behind you" | No NPC honking | Add NPC honk when stuck behind player |
| **4** | Puddle Etiquette | Puddles at footpath edges, pedestrians walking | Generic puddle theme | Spawn puddles near sidewalks |
| **5** | School Zone | Children crossing between parked cars | No school building, no children | Add school mesh, more child pedestrians |
| **6** | Hospital Zone | No parking within 100m of hospital | Generic parking | Add hospital building, parking restrictions |
| **7** | Hospital Silence | NPC ahead braking, "Silence Zone" sign | Generic no-honking | Add hospital building, silence zone |
| **8** | Narrow Street Ambulance | Stuck behind ambulance, parked cars everywhere | One narrow road | Add more parked cars, tighter gaps |
| **9** | Bus Stop Flooded | Bus stop flooded, commuters wading | Just puddle theme | Add bus stop mesh, water effect |
| **10** | Market Parking | Vendors on road, parked autos haphazardly | Just parking zone | Add vendor stalls on road edge |
| **11** | Library Zone | Students near open windows, NPC blocking | Just no-honking | Add library building, students |
| **12** | Highway Ambulance | Multi-lane highway, ambulance from behind | Regular roads | Use highway theme, proper lanes |
| **13** | Night Rain | Dark, puddles, pedestrian with broken umbrella | Dark rain | Add broken umbrella NPC, more puddles |
| **14** | Night Crossing | Elderly crossing at unmarked point | Generic night | Add elderly NPC with walking stick |
| **15** | Residential Parking | Resident at gate pointing at bumper | Just parking | Add house/gate mesh, resident NPC |
| **16** | Residential Night | Sleeping dog in road, GPS through narrow lanes | Generic residential | Add sleeping dog, night environment |
| **17** | Traffic Jam Ambulance | Gridlock, ambulance trapped behind | Has ambulance | Add traffic jam density, jammed cars |
| **18** | School Zone Puddles | Children in uniforms walking through puddles | School + puddle | Add uniformed children, more puddles |
| **19** | Festival Crowd | Festival procession, police volunteer directing | Is pedestrian only | Enable car mode, add volunteer |
| **20** | Temple & Prayer | Temple during aarti, cow in road, devotees | Generic no-honking | Add temple, aarti sound, cow |
| **21** | Signal Discipline | Delivery truck jumps red light ahead | Regular signal | Add NPC jumping red |
| **22** | Road Rage | Taxi cut you off aggressively | Regular traffic | Add aggressive cut-off NPC |
| **23** | Heavy Rain | Roads flooded, pedestrians running | Rain theme | Add flood water, running NPCs |
| **24** | Pedestrian Priority | Elderly at zebra crossing | Generic priority | Add elderly NPC at zebra |
| **25** | Know Your Signs! | Three sign types together | Signs appear | Show all three together |
| **26** | Cows on Road | Cow in middle, cars honking | Generic animals | Add cow blocking road, honking NPCs |
| **27** | Narrow Street | Auto coming opposite, barely room | Narrow road | Add opposite auto, tighter fit |
| **28** | Parking Rules | Fire hydrant, no-parking, legal spot | Parking zones | Add hydrant mesh |
| **29** | Auto-Rickshaw Dance | Auto stopping suddenly, swerving | Regular traffic | Add erratic auto behavior |
| **30** | Toll Plaza | FASTag or cash lanes, booth | Toll theme | Add toll booth meshes |
| **31** | Blind Corner | Can't see oncoming, honk then crawl | Corners exist | Add blind turn effect |
| **32** | Hill Driving | Hairpin bends, steep gradient | Hill theme | Add hairpin route |
| **33** | Bus Stop Yield | Bus stopped, passengers may cross | Bus stop | Add passengers boarding |
| **34** | Construction Zone | Flagman, detour signs | Construction | Add flagman NPC |
| **35** | One-Way Wonder | Enter correct end, never go against | One-way exists | Proper one-way enforcement |
| **36** | Sign Recognition | Complex intersection, three signs | Signs | Show all three together |
| **37** | Hospital Quiet | No honking, ambulances entering | Hospital theme | Add hospital, ambulance spawns |
| **38** | Festival Traffic | Procession blocking road, music vehicles | Has crowd | Add music vehicle, decorations |
| **39** | Cyclist Safety | Cyclist on left, 1m space needed | Regular traffic | Add cyclist on left lane |
| **40** | Grand Test | Everything combined | Combined theme | Should have all elements |
| **41** | Night Monsoon | Zero visibility, flooded roads | Dark rain | Add flood water, fog |
| **42** | Wrong Side | Vehicles on wrong side | Regular traffic | Add wrong-side NPCs |
| **43** | Highway Merge | Heavy truck/bus, merge smoothly | Highway theme | More trucks, merge ramp |
| **44** | Night Construction | Road work at night, dim lights | Construction night | Add night lights, workers |
| **45** | Zero Visibility | Dense fog, barely see 10m | Fog theme | Increase fog density |
| **46** | Night Festival | Lights, music, crowds at night | Dark scene | Add string lights, lanterns |
| **47** | Mountain Night | Hairpin turns, steep drops, no lights | Mountain night | Add hairpins, darkness |
| **48** | Rural Village | Unpaved, potholes, animals, tractors | Rural exists | Add dirt texture, animals |
| **49** | Multi-Modal Chaos | Buses, trucks, autos, bikes, peds | Mixed traffic | Add more density |
| **50** | Ultimate Test | All conditions combined | Grand test | Should exceed level 40 |
| **51** | Highway Lane Discipline | Multi-lane, trucks, overtake from right | Highway | Proper lane markings |
| **52** | Lane Change Practice | Change lanes to overtake bus | Practice lanes | Specific lane geometry |

### 11.2 Key Missing Elements to Add

1. **Buildings**: School, library, hospital, temple, market stalls
2. **Special NPCs**: 
   - Honking NPCs when stuck behind player
   - Aggressive drivers cutting off
   - Jumping red light
   - Erratic auto-rickshaws
   - Elderly with walking sticks
   - Children in school uniforms
   - Cyclists on left
   - Cows blocking road
3. **Scene Elements**:
   - Festival decorations/lights
   - Music vehicle (decorated truck)
   - Fire hydrants
   - Bus stops with shelters
   - Construction barriers, flagmen
   - Toll booths
4. **Environment Effects**:
   - Flooded roads (water plane)
   - Dirt/unpaved roads
   - Night string lights
   - Fog for visibility challenges
5. **Behavioral Changes**:
   - NPCs respond to traffic lights
   - NPCs honk when player doesn't move
   - NPCs change lanes when blocked
   - Pedestrians react to vehicles

### 11.3 Level Config Fixes Needed

```javascript
// Levels needing crowdFestival: true
level19: Add crowdFestival: true
level38: Already has it
level46: Add crowdFestival: true

// Levels needing npcDensity: 'heavy'  
level19: Already heavy
level38: Already heavy
level41, 46, 49: Add heavy density

// Levels missing isPedestrian when needed
level10, 19: Already has it
level14: Add for night crossing scenario

// Theme type corrections
level20: 'temple_zone' (new) instead of 'no_honking'
level21: Already 'signal_jump' - verify NPC jumps red
level22: Already 'road_rage' - verify cut-off behavior
level26: Already 'animals' - verify cow blocking
level47: 'mountain_night' instead of 'hill_driving'
level48: 'rural_unpaved' instead of 'narrow_street'
```

### 11.4 Humanized Content Descriptions

Make descriptions more natural and friendly for students:

| Level | Old | New (Humanized) |
|-------|-----|-----------------|
| 1 | "NPC cars honk aggressively" | "Cars behind you are honking - stay calm and wait!" |
| 5 | "Children in uniforms crossing randomly" | "School kids in blue uniforms are crossing - slow down!" |
| 17 | "Complete gridlock, ambulance trapped" | "Traffic jam! An ambulance is behind you - make space!" |
| 19 | "Police volunteer directing traffic" | "A police uncle is helping direct traffic - follow his hand signals!" |
| 20 | "Temple during aarti, cow in road" | "There's a temple with beautiful aarti happening - and a cow is resting on the road!" |
| 22 | "Taxi driver cut you off" | "That taxi driver was very rude! Don't get angry - just keep driving safely." |
| 26 | "A cow is sitting right in the middle" | "There's a holy cow on the road - cows are special in India, so wait patiently!" |
| 29 | "Auto keeps stopping suddenly" | "That auto-wala keeps stopping suddenly - keep extra distance!" |

---

## Implementation Priority (Revised)

```
Phase 1: AI Improvements ✅ COMPLETED
  → 2.1 Pedestrian AI (crosswalk, reactions, idle states) ✅
  → 2.2 Vehicle AI (traffic lights, lane changes, honking) ✅
  ✓ NPC honks when stuck behind player
  ✓ Pedestrians wait at crosswalks
  ✓ Green light boost for NPCs

Phase 2: Level Content Matching ✅ COMPLETED
  → Fix festival levels (19, 38, 46) ✅
  → Add music vehicle, police volunteer, festival lights ✅

Phase 3: Character Models ✅ COMPLETED
  → Debug visibility ✅
  → Fixed scale calculation ✅

Phase 4: 2D Demo ✅ COMPLETED
  → showScenario2DDemo() ✅

Phase 5: Footpaths ✅ COMPLETED
  → Colored sidewalks (0xb0b0a0) ✅
  → Checkpoint radius increased to 4.5 ✅

Phase 6: Scenarios ✅ COMPLETED
  → Added scenarioType to levels: 3, 5, 6, 11, 20, 28, 30, 33, 34, 39, 41, 46, 49 ✅

Phase 7: Grade UI ✅ COMPLETED
  → getGradeTier(), getGradeConfig() ✅
  → prof-grade dropdown ✅
  → CSS classes ✅

Phase 8: Controls ✅ COMPLETED
  → _initSwipeTurn() ✅
  → _initMouseSteer() ✅

Phase 9: Bug Fixes ✅ COMPLETED
  → Checkpoint radius: 3.2 → 4.5 ✅
  → Audio context ✅

Phase 11.2: Scene Elements ✅ COMPLETED
  → Added handlers for: hasTemple, hasBusStop, hasFireHydrant, hasTollBooth, hasConstruction, hasFlagman, hasCyclist ✅

Phase 11.3: Level Configs ✅ COMPLETED
  → Added npcDensity heavy: 41, 49 ✅
  → Added scenarioType: emergency, mixed, cars_only, peds_only, highway ✅
  → Added hasSchool, hasSilentZone, hasHospital, hasTemple, etc. ✅

Phase 10: Cleanup - PENDING
  → Remove unused files
```