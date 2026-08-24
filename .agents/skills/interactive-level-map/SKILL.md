---
name: interactive-level-map
description: "Use when designing, building, or debugging SVG/Canvas interactive level progression maps, winding roadmaps, game journey trees, and Duolingo/Candy Crush style quest maps."
metadata:
  category: game-development
  triggers: level-map, roadmap, game-progression, svg-path, duolingo-map, journey-map, road-graph, milestone-map
---

# Interactive Level Progression Map (Game Roadmap Architecture)

A comprehensive architectural pattern and implementation guide for building performant, responsive, interactive SVG/Canvas-based game level maps (similar to Duolingo, Candy Crush, Mario World, and Driving Academies).

---

## 🧭 Core Architectural Principles

An interactive level progression roadmap consists of five core layers:

```
┌────────────────────────────────────────────────────────┐
│ 1. Viewport Container & Header Progress Summary        │
│    (Fixed or Sticky Bar with 0/N Completion Stats)     │
├────────────────────────────────────────────────────────┤
│ 2. Centered SVG Coordinate System & Canvas             │
│    (viewBox="0 0 960 ${maxY}" + CSS max-width: 960px)  │
├────────────────────────────────────────────────────────┤
│ 3. Procedural S-Curve Road / Path Generator            │
│    (Cubic Bezier Spline SVG Curves with Asphalt & Curbs)│
├────────────────────────────────────────────────────────┤
│ 4. Milestone Checkpoint Archways & Section Banners     │
│    (Category transitions spanning the road axis)       │
├────────────────────────────────────────────────────────┤
│ 5. Interactive Level Nodes & Floating Metadata Cards   │
│    (State badges: Active/Pulsing, Completed, Locked)   │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ Step-by-Step Implementation

### 1. Coordinate Space & Centering (Eliminating Left-Shift Bugs)

Never compute `svgWidth` dynamically from parent element width if it can vary across 4K, 1080p, and mobile screens. Instead, pin a deterministic virtual coordinate space using SVG `viewBox`.

```javascript
// Fixed virtual canvas coordinate system
const VIRTUAL_WIDTH = 960;
const CENTER_X = VIRTUAL_WIDTH / 2; // 480
const AMPLITUDE_X = 190;            // S-curve lateral swing
const STEP_Y = 135;                 // Vertical distance per level node
const TOTAL_LEVELS = 54;
const TOTAL_HEIGHT = (TOTAL_LEVELS + 1) * STEP_Y + 120;

// Set viewBox
svg.setAttribute('viewBox', `0 0 ${VIRTUAL_WIDTH} ${TOTAL_HEIGHT}`);
svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
```

```css
/* Centering CSS */
.map-scroll-area {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  scroll-behavior: smooth;
}

.level-path-svg {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  display: block;
}
```

---

### 2. Smooth S-Curve Road Generation (Cubic Bézier)

Generate a serpentine road by oscillating each node's X position with a sine wave or alternating offset, and connect consecutive points using SVG Cubic Bézier `C cp1X cp1Y, cp2X cp2Y, endX endY` curves.

```javascript
// 1. Calculate node coordinates
const nodes = levels.map((lvl, index) => {
  // Oscillate left and right down the road
  const x = CENTER_X + Math.sin(index * 0.9) * AMPLITUDE_X;
  const y = (index + 1) * STEP_Y;
  return { ...lvl, x, y, index };
});

// 2. Build multi-layer SVG path (asphalt base, road border, center dashes)
let pathD = `M ${nodes[0].x} ${nodes[0].y}`;
for (let i = 1; i < nodes.length; i++) {
  const prev = nodes[i - 1];
  const curr = nodes[i];
  const midY = (prev.y + curr.y) / 2;
  // Smooth S-curve control points
  pathD += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
}

// 3. Render 3 distinct SVG stroke layers:
// Layer A: Road Curb / Outer Glow (width: 44px, stroke: rgba(255,255,255,0.08))
// Layer B: Asphalt Surface (width: 36px, stroke: #1e2433)
// Layer C: Dashed Centerline (width: 3px, stroke: #f2b84b, strokeDasharray: "8 8")
```

---

### 3. Critical Gotcha: SVG XML Transform vs. CSS Animations

> [!WARNING]
> **Never apply a CSS animation with `transform: scale(...)` or `transform: translate(...)` directly to an SVG `<g>` tag that already has an XML attribute `transform="translate(x, y)"`!**
>
> In all modern browsers, CSS transforms completely **override** the XML translation attribute, causing all SVG nodes to collapse to `(0, 0)` or vanish offscreen.

#### ✅ Correct Pattern:
Apply the position translation to the parent `<g>`, and apply hover/scale transforms exclusively to a child `<g>` with `transform-box: fill-box; transform-origin: center;`.

```xml
<!-- Parent coordinates (untouched by CSS scale) -->
<g class="level-node" transform="translate(480, 270)" onclick="onSelectLevel(1)">
  <!-- Child inner circle (receives CSS hover/pulse animations) -->
  <g class="node-outer">
    <circle r="34" class="node-bg" />
    <circle r="38" class="active-pulse-ring" />
    <text class="node-number">1</text>
  </g>
  
  <!-- Interactive Floating Side Card -->
  <g class="level-tag-card" transform="translate(56, -20)">
    <rect width="180" height="42" rx="10" />
    <text class="tag-meta" x="12" y="16">LESSON 1 · ACTIVE</text>
    <text class="tag-title" x="12" y="32">Red Light Discipline</text>
  </g>
</g>
```

```css
/* CSS for child elements */
.level-node {
  cursor: pointer;
}

.level-node .node-outer {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.level-node:hover .node-outer {
  transform: scale(1.15);
}

.level-tag-card {
  transition: transform 0.2s ease, opacity 0.2s ease;
  pointer-events: all;
}

.level-node:hover .level-tag-card {
  transform: translate(62px, -20px);
}
```

---

### 4. Interactive Node States & Visual Language

| Node State | Background Color | Ring Style | Center Glyph | Status Pill |
|---|---|---|---|---|
| **Active / Current** | Gold Gradient (`#f59e0b` → `#fbbf24`) | Rotating Dashed Neon Ring | Gold Star ⭐ / Lesson # | `LESSON N · ACTIVE` |
| **Completed** | Emerald (`#10b981`) | Solid Glow (`#34d399`) | Crisp White Checkmark `✓` | `COMPLETED · 100%` |
| **Locked** | Slate (`#1e293b`) | Faint Border (`#334155`) | Padlock `🔒` + Lesson # | `LOCKED` |

---

### 5. Milestone Checkpoint Banners

Span milestone archways at category boundaries across the road coordinate space:

```javascript
function renderMilestoneBanner(categoryName, yPos) {
  return `
    <g class="checkpoint-banner" transform="translate(${CENTER_X - 160}, ${yPos - 45})">
      <rect width="320" height="34" rx="17" fill="rgba(15, 23, 42, 0.85)" stroke="var(--signal)" stroke-width="1.5" />
      <text x="160" y="22" text-anchor="middle" font-weight="800" font-size="12" fill="#fff" letter-spacing="1">
        ${categoryName.toUpperCase()}
      </text>
    </g>
  `;
}
```

---

### 6. Auto-Scroll to Active Level

When opening the roadmap, smoothly scroll the container to center the player's active level:

```javascript
function scrollToActiveNode(activeNodeId) {
  const scrollContainer = document.getElementById('map-scroll');
  const activeElement = document.querySelector(`.level-node[data-level="${activeNodeId}"]`);
  if (!scrollContainer || !activeElement) return;

  const containerRect = scrollContainer.getBoundingClientRect();
  const elemRect = activeElement.getBoundingClientRect();
  const relativeTop = elemRect.top - containerRect.top + scrollContainer.scrollTop;
  
  // Center in viewport
  scrollContainer.scrollTo({
    top: Math.max(0, relativeTop - scrollContainer.clientHeight / 2 + 50),
    behavior: 'smooth'
  });
}
```

---

## 🧪 Verification & QA Checklist

When building or updating interactive level roadmaps:
- [ ] **Centered on Ultrawide & 1080p**: SVG is centered in the container without hardcoded horizontal client pixel clamping.
- [ ] **Coordinate Transform Isolation**: No CSS keyframe transforms target `<g class="level-node">` directly.
- [ ] **All Nodes Clickable**: Clicking circle OR side metadata card invokes the level briefing modal.
- [ ] **Locked Feedback**: Clicking a locked node triggers an auditory cue, toast message, or shake animation without breaking navigation.
- [ ] **Mobile Touch Targets**: All node circles have an effective hit target of ≥ 48px.
