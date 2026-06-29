# GTA-Style Open World Upgrade Plan

I have thoroughly analyzed the codebase and the new Models folder. I have a complete plan to implement your requirements.

## 1. Fix the "Reset to Home Page" Bug & Asset Loading

**The Problem:** Currently, start.js downloads the 3D models in the background after the game starts. When it finishes downloading, it triggers a callback that accidentally resets the game and forces you back to the home screen (which is the bug you experienced). Also, because the models load after the level starts, the buildings default to "plain boxes".
**The Solution:**

- I will create a dedicated Loading Screen when you first open the website.
- It will stream all the Kenney assets, cars, and road textures before letting you enter the home page.
- This guarantees that when you start any level, the buildings and roads will be fully 3D from the very first second, and you won't be suddenly kicked back to the home menu.

## 2. GTA-Style Walking & Driving for ALL Levels

**The Problem:** Currently, only specific levels let you walk around as a pedestrian (startOutside: true), and the pedestrian controls are basic.
**The Solution:**

- I will update game_core.js so that every single level drops you into the world as a pedestrian by default (GTA style).
- You can freely walk around the open world, explore the 3D Kenney buildings, and press F to enter your assigned vehicle to start the scenario objectives.
- I will hook up the Kenney Animated Characters (from kenney_animated-characters-protagonists) if possible, or use the existing kenney_mini-characters to improve the walking experience.

## 3. High-Quality Road & Avenue Textures

**The Problem:** The game currently uses a plain yellow line and gray boxes for roads if the 3D road tile isn't perfectly placed.
**The Solution:**

- I will integrate the road__avenue__street/scene.gltf model and its high-resolution textures into the procedural road generator in game_core.js.
- I will ensure intersections (road-intersection.glb, road-crossroad.glb) align perfectly with the avenue textures so the entire city grid looks like a realistic 3D street network.

## 4. Integrate Kenney Building Models

**The Problem:** You added the Kenney models, but they aren't spawning because of the loading bug.
**The Solution:**

- I will ensure all 21 Suburban buildings and 20 Industrial buildings from the Kenney packs are loaded correctly and injected into the city generation loop.
- The procedural city builder will populate the open world with these diverse 3D buildings instead of the plain boxes.

## 5. Dynamic Scenarios & Ethical AI Behaviors (For All 20 Levels)

**The Problem:** You want specific, relatable scenarios to happen in the open world, testing the player's "common sense" and ethical driving across all levels.
**The Solution:** I analyzed all 20 levels in the codebase and found they are grouped into 5 core themes. I will program a specific, detailed GTA-style scenario for each theme:

- **Pedestrian Courtesy (Levels 1, 5, 14, 19):** Wait patiently and let pedestrians cross safely despite NPC honking.
- **Respectful Parking (Levels 2, 6, 10, 15):** Find legal parking and walk to the shop instead of illegally parking.
- **Ambulance Priority (Levels 3, 8, 12, 17):** Safely pull over to the shoulder to let ambulances pass.
- **Puddle Etiquette (Levels 4, 9, 13, 18):** Slow down around large puddles near footpaths to avoid splashing pedestrians.
- **No Honking Zone (Levels 7, 11, 16, 20):** Navigate obstacles safely without using the horn near Hospitals or Schools.

## 6. Advanced Civic Sense Mechanics (Animals, Passengers, Seatbelts)

**The Solution:** I will add these specific micro-mechanics across the game:

- Seatbelts & Passengers
- Animals on the Road
- Two-Wheeler Discipline
- Littering & Environment

## 7. Night Driving, Headlights & Signaling

- Day/Night Cycle
- High Beam vs. Low Beam
- Indicator & Hand Signals
- Hazard Lights

## 8. Distracted & Drunk Driving

- Phone Temptation (press a key to check phone causes control loss + challan)
- Impaired Vision scenarios

## 9. Speed Breakers, Zebra Crossings & School Zones

- Speed Breakers damage vehicles at high speeds.
- Zebra Crossings strict stopping rules.
- School Zones strict 30 km/h limits and no honking.

## 10. Environmental Physics & Weather

- Rain & Slippery Roads
- Fog & Reduced Visibility

## 11. Dynamic Road Signage

- Procedural placement of official traffic signs based on level zones.

## 12. Road Rage, Overtaking & Lane Discipline

- Wrong-Side Driving Detection
- Overtaking Rules (right side only)
- Road Rage NPCs

## 13. Documents & E-Challan System

- Random Police Checkpoints
- E-Challan Log for tracking all fines and violations

## 14. Auto-Rickshaw & Shared Vehicle Sense

- Auto-Rickshaw Mode (no overloading, correct routes)
- Shared Auto Chaos (NPC autos stopping abruptly)

## 15. Public Transit & Specialized Driving (Train, Metro, Bus, Gully, Markets)

- Specialized zones: Train/Metro Hubs, Bus/BRTS, Construction Zones, Bazaars, Gully Driving, Flyovers.

## 16. Coastal Areas, Boats, and Famous Monuments

- Sea Boats & Coastline
- Famous Monuments (Gateway of India)

## 17. Custom "Sneh Asha" Landmark

- Create a special 3D building mapped with the "Sneh Asha" storefront texture to serve as a key objective or destination in the game.
