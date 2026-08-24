---
name: interactive-syllabus-briefing
description: "Use when designing, building, or upgrading multi-step interactive lesson briefing screens, syllabus readers, step-by-step topic navigators, curriculum tables of contents, and interactive training modules."
metadata:
  category: ui-design
  triggers: syllabus, briefing, lesson-briefing, curriculum-stepper, topic-navigator, study-guide, interactive-course, multi-step-guide
---

# Interactive Syllabus & Lesson Briefing Navigation System

A comprehensive architectural pattern and UI/UX standard for building rich, accessible, multi-step educational lesson briefings, training syllabi, and step-by-step walkthrough screens in web apps and games.

---

## 🧭 Architectural Overview

An effective interactive syllabus / briefing system bridges high-level curriculum discovery and focused, distraction-free study:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Sticky Header Bar (Lesson Title, Search / Level Jump, Close / Back Button)  │
├───────────────────────┬─────────────────────────────────────────────────────┤
│ Left Sticky Sidebar   │ Right Main Content Area                             │
│ (Topic Directory)     │                                                     │
│                       │ 1. Breadcrumb Stepper (Module › Step X/Y › Topic)   │
│  [01 Overview]        │ 2. Topic Step Dots ([•] [•] [○] [○] [○])            │
│  [02 Guidelines]      │ 3. Rich Lesson Card (Law, Science, Execution, Chaos)│
│  [03 Law & Fines]     │ 4. Curriculum Table of Contents (on Intro/Overview) │
│  [04 Science]         │ 5. Footer Sequential Controls                       │
│  [05 Execution]       │    [← Prev: Guidelines]  Step 2/6  [Next: Law →]    │
│  [06 Chaos / Exam]    │                                                     │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

---

## 📐 Key UX & Engineering Principles

### 1. The Overview Curriculum Hub (Interactive Table of Contents)
Never leave the initial `intro` / Overview card as just plain paragraphs. Always provide an **Interactive Curriculum Index** that previews every upcoming module topic with one-click direct jump buttons.

```javascript
// Render interactive Table of Contents on the Intro / Overview slide
function renderCurriculumIndex(topics, onSelectTopic) {
  const indexHtml = topics.map((t, idx) => `
    <div class="syl-curriculum-row" onclick="onSelectTopic('${t.id}')">
      <div class="syl-curriculum-num">${String(idx + 1).padStart(2, '0')}</div>
      <div class="syl-curriculum-info">
        <div class="syl-curriculum-title">${t.icon || '📌'} ${t.title}</div>
        <div class="syl-curriculum-desc">${t.summary || 'Essential knowledge and rules.'}</div>
      </div>
      <div class="syl-curriculum-arrow">Jump →</div>
    </div>
  `).join('');

  return `
    <div class="syl-curriculum-index">
      <div class="syl-curriculum-hdr">📚 What You Will Learn in this Lesson</div>
      <div class="syl-curriculum-list">${indexHtml}</div>
    </div>
  `;
}
```

---

### 2. Topic Breadcrumb Bar with Interactive Stepper Dots
Every topic card should present a top navigation bar showing exact progression context and interactive dot indicators:

```html
<div class="syl-breadcrumb-bar">
  <div class="syl-breadcrumb-text">
    <span class="syl-bc-module">MODULE 01</span>
    <span class="syl-bc-sep">›</span>
    <span class="syl-bc-step">STEP 3 OF 6</span>
    <span class="syl-bc-sep">›</span>
    <span class="syl-bc-topic">⚖️ Law & Fines</span>
  </div>
  <div class="syl-dots-wrap">
    <!-- Active dot (gold), Completed dot (emerald), Pending dot (slate) -->
    <div class="syl-dot done" onclick="switchTopic('intro')" title="Overview"></div>
    <div class="syl-dot done" onclick="switchTopic('guidelines')" title="Guidelines"></div>
    <div class="syl-dot active" onclick="switchTopic('law')" title="Law & Fines"></div>
    <div class="syl-dot" onclick="switchTopic('science')" title="Science"></div>
    <div class="syl-dot" onclick="switchTopic('execution')" title="Execution"></div>
    <div class="syl-dot" onclick="switchTopic('chaos')" title="Chaos Run"></div>
  </div>
</div>
```

---

### 3. Unified Sequential Footer Navigation
Prevent users from feeling stuck or confused about how to proceed by placing contextual footer buttons at the base of every card:

- **First Topic (Intro)**: `[Start Learning Topic 1 →]`
- **Intermediate Topics**: `[← Previous: <Prev Title>]` + `Step X of Y` + `[Next: <Next Title> →]`
- **Final Topic (Exam / Practical)**: `[← Previous Topic]` + `[🚀 Launch Practical Test / Simulation →]`

```javascript
function renderCardFooterNav(currentIndex, totalCount, prevTopic, nextTopic, onAction) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalCount - 1;

  return `
    <div class="syl-footer-nav">
      ${!isFirst ? `
        <button class="syl-btn-prev" onclick="goToTopic('${prevTopic.id}')">
          ← Previous: ${prevTopic.title}
        </button>
      ` : `<div></div>`}
      
      <div class="syl-step-counter">Topic ${currentIndex + 1} of ${totalCount}</div>

      ${!isLast ? `
        <button class="syl-btn-next" onclick="goToTopic('${nextTopic.id}')">
          Next: ${nextTopic.title} →
        </button>
      ` : `
        <button class="syl-btn-launch" onclick="launchSimulation()">
          🚀 Launch Practical Test →
        </button>
      `}
    </div>
  `;
}
```

---

### 4. Responsive CSS Grid Layout (No Rigid Margins)

Avoid hardcoded fixed height or top margins (such as `margin-top: 118px`). Use a fluid CSS grid layout with CSS variable tokens:

```css
/* Briefing Container */
.br-w {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  max-width: 1440px;
  margin: 24px auto;
  padding: 0 24px 80px;
  align-items: start;
}

/* Sticky Sidebar */
.br-l {
  position: sticky;
  top: 90px;
  background: var(--card, rgba(13, 17, 26, 0.75));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 16px;
  backdrop-filter: blur(16px);
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

/* Main Content Area */
.br-r {
  background: var(--card, rgba(13, 17, 26, 0.75));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 32px;
  backdrop-filter: blur(16px);
  min-height: 500px;
}

/* Mobile Responsiveness */
@media (max-width: 900px) {
  .br-w {
    grid-template-columns: 1fr;
    margin: 12px auto;
    padding: 0 12px 60px;
  }
  .br-l {
    position: static;
    max-height: none;
    order: -1;
  }
}
```

---

## 🎨 Theme Tokens & Design Language

- **Active Accent**: `--signal` (`#f2b84b` gold) with subtle radial box shadow.
- **Completed Accent**: `--green` (`#10b981` emerald) with glowing badge tag.
- **Background Layering**: Multi-tier glassmorphism (`rgba(13, 17, 26, 0.75)` + `backdrop-filter: blur(16px)`).
- **Typography Hierarchy**:
  - Module Title: 1.6rem bold Inter (`#fff`).
  - Section Headings: 1.15rem semi-bold (`var(--signal)`).
  - Body Text: 0.95rem relaxed line-height (1.65) in `--dim` (`#94a3b8`).

---

## 🧪 Verification & Accessibility Checklist

- [ ] **Direct URL / Hash Deep Linking**: Opening `?screen=briefing&level=5&topic=law` restores exact card and sidebar active state.
- [ ] **Keyboard Accessibility**: Arrow Left (`←`) and Arrow Right (`→`) navigate sequentially between curriculum steps.
- [ ] **State Persistence**: Track viewed topics in `localStorage` to display emerald checkmarks on completed items.
- [ ] **No Class Collisions**: Namespace sidebar items separately from level grid cards (e.g. `.syl-item` for sidebar vs `.level-grid-card` for level selection grids).
