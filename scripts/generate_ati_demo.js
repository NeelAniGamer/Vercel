const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'ati-demo.html');

const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7939810376745995" crossorigin="anonymous"></script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="description" content="Advanced Typing Instructor (ATI 1.4) Web Velocity Studio — Master touch typing, Python, C++, and JavaScript code syntax with AI typist simulation, WebAudio mechanical switch sound synthesis, live WPM telemetry, and keyboard radar." />
    <title>ATI Velocity Studio · Advanced Typing Instructor 1.4 · Class Of Learners</title>
    <link rel="icon" type="image/png" href="Icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
    
    <script>
      (function () {
        var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (isIOS) document.documentElement.classList.add('is-iphone');
        try {
          if (localStorage.getItem('theme') === 'light') {
            document.documentElement.classList.add('lm');
          }
        } catch (e) {}
      })();
    </script>
    <script defer src="col-router.js"></script>
    <link rel="stylesheet" href="col-ui.css?v=20260923-nav3" />
    <link rel="stylesheet" href="col-mobile.css" />
    <link rel="stylesheet" href="liquid-glass.css" />
    <link rel="stylesheet" href="mobile-perf.css" />
    <script defer src="pull-refresh.js"></script>
    <script defer src="col-ui.js"></script>
    <script defer src="col-auth.js"></script>

    <style>
      :root {
        --void: #070a14;
        --void2: #0c1224;
        --panel: #0e1526;
        --panel-glass: rgba(14, 21, 38, 0.78);
        --line: rgba(255, 255, 255, 0.08);
        --lineb: rgba(56, 189, 248, 0.24);
        --ink: #f1f5f9;
        --dim: #8492a6;
        --signal: #f2b84b;
        --ion: #38bdf8;
        --teal: #a3e635;
        --plasma: #fb923c;
        --em: #34d399;
        --rose: #f43f5e;
        --violet: #a855f7;
        --nav: rgba(7, 10, 20, 0.72);
        --serif: 'Instrument Serif', Georgia, serif;
        --sans: 'Inter', system-ui, sans-serif;
        --mono: 'Space Mono', monospace;
        --ease: cubic-bezier(0.16, 1, 0.3, 1);
        --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
        --r: 16px;
      }

      html.lm,
      body.lm {
        --void: #f8fafc;
        --void2: #f1f5f9;
        --panel: #ffffff;
        --panel-glass: rgba(255, 255, 255, 0.92);
        --line: rgba(0, 0, 0, 0.08);
        --lineb: rgba(2, 132, 199, 0.25);
        --ink: #0f172a;
        --dim: #475569;
        --signal: #d97706;
        --ion: #0284c7;
        --teal: #4d7c0f;
        --plasma: #ea580c;
        --em: #059669;
        --rose: #e11d48;
        --violet: #9333ea;
        --nav: rgba(248, 250, 252, 0.92);
      }

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body {
        background: var(--void);
        color: var(--ink);
        font-family: var(--sans);
        line-height: 1.6;
        overflow-x: hidden;
        -webkit-font-smoothing: antialiased;
        transition: background 0.3s var(--ease), color 0.3s var(--ease);
      }

      .page-wrap {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px 90px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      /* Breadcrumbs & Navigation Header */
      .ati-nav-breadcrumb {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }
      .crumb-left {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
      }
      .ati-back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--ion);
        text-decoration: none;
        font-family: var(--mono);
        font-size: 0.82rem;
        font-weight: 700;
        padding: 7px 14px;
        background: rgba(56, 189, 248, 0.08);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 10px;
        transition: all 0.2s var(--ease);
      }
      .ati-back-link:hover {
        background: var(--ion);
        color: #070a14;
        transform: translateY(-2px);
      }
      .ati-desktop-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--teal);
        text-decoration: none;
        font-family: var(--mono);
        font-size: 0.82rem;
        font-weight: 700;
        padding: 7px 14px;
        background: rgba(163, 230, 53, 0.08);
        border: 1px solid rgba(163, 230, 53, 0.25);
        border-radius: 10px;
        transition: all 0.2s var(--ease);
      }
      .ati-desktop-link:hover {
        background: var(--teal);
        color: #070a14;
        transform: translateY(-2px);
      }

      /* Hero Header */
      .ati-hero {
        text-align: center;
        margin-bottom: 30px;
      }
      .ati-eyebrow {
        font-family: var(--mono);
        font-size: 0.72rem;
        letter-spacing: 0.28em;
        color: var(--signal);
        text-transform: uppercase;
        margin-bottom: 12px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(242, 184, 75, 0.1);
        padding: 6px 14px;
        border-radius: 20px;
        border: 1px solid rgba(242, 184, 75, 0.25);
      }
      .ati-hero h1 {
        font-family: var(--serif);
        font-size: clamp(2.4rem, 5vw, 3.8rem);
        font-weight: 400;
        line-height: 1.15;
        margin-bottom: 10px;
      }
      .ati-hero h1 em {
        font-style: italic;
        color: var(--signal);
      }
      .ati-hero p {
        font-size: 1.05rem;
        color: var(--dim);
        max-width: 62ch;
        margin: 0 auto;
        line-height: 1.6;
      }

      /* Control Deck */
      .control-deck {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--r);
        padding: 16px 20px;
        margin-bottom: 20px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      body.lm .control-deck {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      }

      .deck-row-primary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      .mode-pills-bar {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .mode-pill {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--line);
        color: var(--dim);
        padding: 7px 13px;
        border-radius: 10px;
        font-family: var(--mono);
        font-size: 0.76rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s var(--ease);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .mode-pill:hover {
        color: var(--ink);
        border-color: var(--lineb);
        background: rgba(255, 255, 255, 0.06);
      }
      .mode-pill.active {
        background: rgba(242, 184, 75, 0.15);
        color: var(--signal);
        border-color: var(--signal);
      }
      body.lm .mode-pill {
        background: #f1f5f9;
        color: #475569;
      }
      body.lm .mode-pill.active {
        background: rgba(217, 119, 6, 0.12);
        color: #b45309;
        border-color: #d97706;
      }

      .deck-row-secondary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        padding-top: 10px;
        border-top: 1px solid var(--line);
      }

      .sub-options-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .sub-opt-label {
        font-family: var(--mono);
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--dim);
        text-transform: uppercase;
        margin-right: 2px;
      }
      .sub-opt-btn {
        background: transparent;
        border: 1px solid var(--line);
        color: var(--dim);
        padding: 5px 10px;
        border-radius: 8px;
        font-family: var(--mono);
        font-size: 0.72rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.18s;
      }
      .sub-opt-btn:hover {
        color: var(--ink);
        border-color: var(--lineb);
      }
      .sub-opt-btn.active {
        background: rgba(56, 189, 248, 0.14);
        color: var(--ion);
        border-color: var(--ion);
      }

      .sim-deck-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .deck-select {
        background: var(--void);
        border: 1px solid var(--lineb);
        color: var(--ink);
        padding: 6px 10px;
        border-radius: 8px;
        font-family: var(--mono);
        font-size: 0.74rem;
        font-weight: 600;
        outline: none;
      }
      body.lm .deck-select {
        background: #f8fafc;
        border-color: rgba(0, 0, 0, 0.15);
      }

      .btn-auto-sim {
        background: linear-gradient(135deg, #10b981, #059669);
        color: #f7fee7;
        border: none;
        padding: 7px 14px;
        border-radius: 9px;
        font-family: var(--mono);
        font-size: 0.76rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 3px 12px rgba(16, 185, 129, 0.35);
        transition: all 0.2s;
      }
      .btn-auto-sim:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 16px rgba(16, 185, 129, 0.45);
      }
      .btn-auto-sim.running {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        box-shadow: 0 3px 12px rgba(239, 68, 68, 0.4);
      }

      /* Telemetry Strip */
      .telemetry-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 10px;
        margin-bottom: 20px;
      }
      .tel-card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--r);
        padding: 14px 12px;
        text-align: center;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
      }
      .tel-val {
        font-size: 1.85rem;
        font-weight: 800;
        color: var(--signal);
        font-family: var(--mono);
        line-height: 1.1;
      }
      .tel-val.time { color: var(--ion); }
      .tel-val.acc { color: var(--em); }
      .tel-val.cpm { color: var(--teal); }
      .tel-val.streak { color: var(--plasma); }
      .tel-val.best { color: var(--violet); }
      .tel-lbl {
        font-family: var(--mono);
        font-size: 0.6rem;
        font-weight: 700;
        color: var(--dim);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-top: 5px;
      }

      /* Ghost AI Pacer Track */
      .ghost-track-container {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 10px 16px;
        margin-bottom: 14px;
        display: none;
        align-items: center;
        gap: 16px;
      }
      .ghost-track-container.show {
        display: flex;
      }
      .ghost-track-label {
        font-family: var(--mono);
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--signal);
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ghost-track-bar {
        flex: 1;
        height: 10px;
        background: var(--void);
        border-radius: 6px;
        position: relative;
        overflow: visible;
        border: 1px solid var(--line);
      }
      .ghost-player-pin {
        position: absolute;
        top: -6px;
        width: 14px;
        height: 22px;
        background: var(--ion);
        border-radius: 4px;
        transform: translateX(-50%);
        transition: left 0.15s ease-out;
        box-shadow: 0 0 10px var(--ion);
        z-index: 2;
      }
      .ghost-ai-pin {
        position: absolute;
        top: -6px;
        width: 14px;
        height: 22px;
        background: var(--plasma);
        border-radius: 4px;
        transform: translateX(-50%);
        transition: left 0.15s linear;
        box-shadow: 0 0 10px var(--plasma);
        z-index: 1;
      }
      .ghost-delta-badge {
        font-family: var(--mono);
        font-size: 0.72rem;
        font-weight: 700;
        white-space: nowrap;
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.05);
      }
      .ghost-delta-badge.ahead { color: var(--em); background: rgba(52, 211, 153, 0.1); }
      .ghost-delta-badge.behind { color: var(--rose); background: rgba(244, 63, 94, 0.1); }

      /* Typing Terminal Arena */
      .terminal {
        background: rgba(10, 15, 30, 0.85);
        border: 1px solid var(--lineb);
        border-radius: var(--r);
        overflow: hidden;
        position: relative;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(20px);
        margin-bottom: 20px;
        transition: border-color 0.3s, box-shadow 0.3s;
      }
      body.lm .terminal {
        background: rgba(255, 255, 255, 0.95);
        border-color: rgba(0, 0, 0, 0.12);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.06);
      }

      .terminal.glow-1 { border-color: var(--teal); box-shadow: 0 0 35px rgba(163, 230, 53, 0.25); }
      .terminal.glow-2 { border-color: var(--signal); box-shadow: 0 0 50px rgba(242, 184, 75, 0.35); }
      .terminal.glow-3 { border-color: var(--rose); box-shadow: 0 0 70px rgba(244, 63, 94, 0.45); }

      .term-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 18px;
        background: rgba(255, 255, 255, 0.03);
        border-bottom: 1px solid var(--line);
      }
      body.lm .term-bar {
        background: rgba(0, 0, 0, 0.02);
        border-bottom-color: rgba(0, 0, 0, 0.06);
      }
      .term-dots { display: flex; gap: 6px; }
      .term-dot { width: 10px; height: 10px; border-radius: 50%; }
      .term-dot.red { background: #ef4444; }
      .term-dot.yellow { background: #eab308; }
      .term-dot.green { background: #22c55e; }

      .term-meta {
        font-family: var(--mono);
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--dim);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .term-focus-badge {
        font-size: 0.65rem;
        padding: 3px 8px;
        border-radius: 12px;
        background: rgba(163, 230, 53, 0.1);
        color: var(--teal);
        border: 1px solid rgba(163, 230, 53, 0.25);
      }
      .term-focus-badge.unfocused {
        background: rgba(244, 63, 94, 0.1);
        color: var(--rose);
        border-color: rgba(244, 63, 94, 0.25);
      }

      /* Arena Stage & Word Area */
      .typing-stage {
        padding: 30px 28px;
        min-height: 190px;
        max-height: 230px;
        overflow-y: hidden;
        position: relative;
        cursor: text;
        user-select: none;
      }
      .words-wrapper {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 10px;
        font-family: var(--mono);
        font-size: 1.35rem;
        line-height: 1.85;
        position: relative;
        transition: transform 0.2s var(--ease);
      }

      .word {
        display: inline-flex;
        position: relative;
      }
      .char {
        color: var(--dim);
        opacity: 0.55;
        transition: color 0.08s, opacity 0.08s, text-shadow 0.08s;
      }
      .char.correct {
        color: var(--ink);
        opacity: 1;
        text-shadow: 0 0 10px rgba(241, 245, 249, 0.3);
      }
      .char.incorrect {
        color: #ef4444 !important;
        opacity: 1;
        background: rgba(239, 68, 68, 0.18);
        border-radius: 3px;
        border-bottom: 2px solid #ef4444;
      }
      .char.extra {
        color: #f43f5e !important;
        opacity: 0.85;
        background: rgba(244, 63, 94, 0.2);
        border-radius: 2px;
      }
      .char.newline-char {
        opacity: 0.4;
        font-size: 0.95rem;
      }

      /* Real Syntax Highlighting */
      .char.tok-keyword.correct { color: var(--plasma); text-shadow: 0 0 8px rgba(251, 146, 60, 0.4); }
      .char.tok-string.correct { color: var(--em); text-shadow: 0 0 8px rgba(52, 211, 153, 0.4); }
      .char.tok-function.correct { color: var(--ion); text-shadow: 0 0 8px rgba(56, 189, 248, 0.4); }
      .char.tok-number.correct { color: var(--signal); text-shadow: 0 0 8px rgba(242, 184, 75, 0.4); }
      .char.tok-type.correct { color: var(--violet); text-shadow: 0 0 8px rgba(168, 85, 247, 0.4); }
      .char.tok-comment { opacity: 0.45; font-style: italic; }

      /* Caret Animation & Styling */
      .caret {
        position: absolute;
        pointer-events: none;
        z-index: 10;
        transition: left 0.08s var(--ease), top 0.08s var(--ease);
      }
      .caret.style-line {
        width: 2.5px;
        height: 1.45rem;
        background: var(--signal);
        border-radius: 2px;
        box-shadow: 0 0 10px var(--signal);
        animation: blink 1s infinite;
      }
      .caret.style-block {
        width: 14px;
        height: 1.45rem;
        background: rgba(242, 184, 75, 0.35);
        border: 1px solid var(--signal);
        border-radius: 3px;
        animation: pulseBlock 1.2s infinite;
      }
      .caret.style-underline {
        width: 14px;
        height: 3px;
        margin-top: 1.25rem;
        background: var(--signal);
        border-radius: 2px;
        box-shadow: 0 0 8px var(--signal);
        animation: blink 1s infinite;
      }
      @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      @keyframes pulseBlock { 0%, 100% { opacity: 0.8; } 50% { opacity: 0.3; } }

      /* Tap to focus prompt */
      .focus-overlay-prompt {
        position: absolute;
        inset: 0;
        background: rgba(7, 10, 20, 0.4);
        backdrop-filter: blur(2px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 15;
        cursor: pointer;
      }
      .focus-overlay-prompt.show {
        display: flex;
      }
      .focus-prompt-badge {
        padding: 10px 20px;
        border-radius: 30px;
        background: var(--panel);
        border: 1px solid var(--lineb);
        color: var(--ink);
        font-family: var(--mono);
        font-size: 0.85rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        animation: floatPrompt 2s infinite ease-in-out;
      }
      @keyframes floatPrompt { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

      /* Sparkline Telemetry Bar */
      .sparkline-box {
        padding: 10px 20px;
        background: rgba(0, 0, 0, 0.2);
        border-top: 1px solid var(--line);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      body.lm .sparkline-box {
        background: rgba(0, 0, 0, 0.02);
      }
      #wpmCanvas {
        height: 38px;
        width: 320px;
      }

      /* Virtual Keyboard Radar */
      .kb-container {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--r);
        padding: 18px 20px;
        margin-bottom: 24px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      }
      .kb-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
        flex-wrap: wrap;
        gap: 10px;
      }
      .kb-title {
        font-family: var(--mono);
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--dim);
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .finger-guide-legend {
        display: flex;
        gap: 12px;
        font-size: 0.68rem;
        font-family: var(--mono);
        flex-wrap: wrap;
      }
      .legend-item { display: flex; align-items: center; gap: 5px; color: var(--dim); }
      .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

      .kb-layout {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .kb-row {
        display: flex;
        gap: 6px;
        justify-content: center;
      }
      .key {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--line);
        border-radius: 8px;
        min-width: 44px;
        height: 44px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: var(--mono);
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--dim);
        transition: transform 0.08s, background 0.12s, box-shadow 0.12s, border-color 0.12s;
        user-select: none;
        position: relative;
        cursor: pointer;
      }
      body.lm .key {
        background: #ffffff;
        border-color: rgba(0, 0, 0, 0.1);
        color: #334155;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      }

      /* Finger top bar indicator */
      .key::before {
        content: "";
        position: absolute;
        top: 0;
        left: 6px;
        right: 6px;
        height: 2.5px;
        border-radius: 0 0 2px 2px;
        opacity: 0.5;
        transition: opacity 0.15s;
      }
      .key[data-finger="lp"]::before, .key[data-finger="rp"]::before { background: #fb923c; } /* Pinky */
      .key[data-finger="lr"]::before, .key[data-finger="rr"]::before { background: #3b82f6; } /* Ring */
      .key[data-finger="lm"]::before, .key[data-finger="rm"]::before { background: #10b981; } /* Middle */
      .key[data-finger="li"]::before, .key[data-finger="ri"]::before { background: #eab308; } /* Index */
      .key[data-finger="th"]::before { background: #84cc16; } /* Thumb */

      .key.active {
        background: var(--signal) !important;
        color: #070a14 !important;
        transform: translateY(2px) scale(0.96);
        box-shadow: 0 0 16px rgba(242, 184, 75, 0.7) !important;
      }
      .key.target-next {
        border-color: var(--ion) !important;
        color: var(--ion) !important;
        background: rgba(56, 189, 248, 0.12) !important;
        animation: pulseTarget 1s infinite alternate;
      }
      .key.shift-needed {
        border-color: var(--plasma) !important;
        color: var(--plasma) !important;
        background: rgba(251, 146, 60, 0.14) !important;
        animation: pulseShift 1s infinite alternate;
      }
      @keyframes pulseTarget {
        from { box-shadow: 0 0 2px var(--ion); }
        to { box-shadow: 0 0 14px var(--ion); }
      }
      @keyframes pulseShift {
        from { box-shadow: 0 0 2px var(--plasma); }
        to { box-shadow: 0 0 14px var(--plasma); }
      }

      .key.space { min-width: 280px; }
      .key.backspace, .key.tab, .key.caps, .key.enter, .key.shift { min-width: 72px; font-size: 0.72rem; }

      /* Results Overlay Modal */
      .results-overlay {
        position: fixed;
        inset: 0;
        background: rgba(7, 10, 20, 0.88);
        backdrop-filter: blur(16px);
        z-index: 1000;
        display: none;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s var(--ease);
        padding: 20px;
      }
      body.lm .results-overlay {
        background: rgba(248, 250, 252, 0.88);
      }
      .results-overlay.show {
        display: flex;
        opacity: 1;
      }
      .res-modal-card {
        background: var(--panel);
        border: 1px solid var(--lineb);
        border-radius: var(--r);
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.55);
        padding: 32px 28px;
        max-width: 680px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        animation: popModal 0.3s var(--spring);
      }
      @keyframes popModal {
        from { transform: scale(0.92); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      body.lm .res-modal-card {
        background: #ffffff;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
      }
      .res-hero-badge {
        font-size: 5rem;
        font-weight: 800;
        font-family: var(--serif);
        line-height: 1;
        margin-bottom: 4px;
      }
      .grade-Splus { color: #f43f5e; text-shadow: 0 0 30px rgba(244, 63, 94, 0.6); }
      .grade-S { color: var(--plasma); text-shadow: 0 0 25px rgba(251, 146, 60, 0.5); }
      .grade-A { color: var(--teal); text-shadow: 0 0 20px rgba(163, 230, 53, 0.4); }
      .grade-B { color: var(--em); text-shadow: 0 0 20px rgba(52, 211, 153, 0.4); }
      .grade-C { color: var(--signal); }
      .grade-F { color: #ef4444; }

      .res-title-text {
        font-family: var(--mono);
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--dim);
        margin-bottom: 12px;
      }
      .res-score-row {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 8px;
        margin-bottom: 20px;
      }
      .res-score {
        font-size: 4rem;
        font-weight: 800;
        font-family: var(--mono);
        line-height: 1;
        color: var(--ink);
      }
      .res-unit {
        font-family: var(--mono);
        font-size: 0.85rem;
        color: var(--dim);
        text-transform: uppercase;
        letter-spacing: 0.15em;
      }

      .res-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        width: 100%;
        max-width: 680px;
        margin-bottom: 20px;
      }
      .res-stat-card {
        background: rgba(255, 255, 255, 0.04);
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid var(--line);
        text-align: center;
      }
      body.lm .res-stat-card {
        background: #f8fafc;
      }
      .res-stat-val {
        font-size: 1.4rem;
        font-weight: 800;
        font-family: var(--mono);
        color: var(--ink);
      }
      .res-stat-lbl {
        font-family: var(--mono);
        font-size: 0.6rem;
        letter-spacing: 0.12em;
        color: var(--dim);
        text-transform: uppercase;
        margin-top: 3px;
      }

      .weak-keys-box {
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.25);
        border-radius: 10px;
        padding: 10px 16px;
        font-family: var(--mono);
        font-size: 0.8rem;
        margin-bottom: 22px;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 680px;
        width: 100%;
        justify-content: space-between;
        flex-wrap: wrap;
      }

      .res-actions-bar {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
      }
      .btn-res-action {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        border-radius: 10px;
        font-family: var(--mono);
        font-size: 0.82rem;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s var(--ease);
        border: none;
      }
      .btn-res-action.primary {
        background: var(--signal);
        color: #070a14;
        box-shadow: 0 4px 15px rgba(242, 184, 75, 0.35);
      }
      .btn-res-action.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(242, 184, 75, 0.5);
      }
      .btn-res-action.teal {
        background: var(--teal);
        color: #070a14;
      }
      .btn-res-action.teal:hover {
        transform: translateY(-2px);
      }
      .btn-res-action.secondary {
        background: rgba(255, 255, 255, 0.06);
        color: var(--ink);
        border: 1px solid var(--lineb);
      }
      .btn-res-action.secondary:hover {
        background: rgba(255, 255, 255, 0.12);
        transform: translateY(-2px);
      }

      /* Custom Text Modal */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(12px);
        z-index: 1000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .modal-backdrop.show { display: flex; }
      .modal-card {
        background: var(--panel);
        border: 1px solid var(--lineb);
        border-radius: var(--r);
        width: 100%;
        max-width: 580px;
        padding: 24px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
      }
      .modal-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; }
      .modal-textarea {
        width: 100%;
        height: 160px;
        background: var(--void);
        border: 1px solid var(--line);
        border-radius: 10px;
        color: var(--ink);
        padding: 12px;
        font-family: var(--mono);
        font-size: 0.85rem;
        resize: none;
        margin-bottom: 14px;
        outline: none;
      }
      .modal-textarea:focus { border-color: var(--ion); }

      /* Mobile input trap */
      .mobile-input-trap {
        position: absolute;
        top: 0;
        left: 0;
        width: 1px;
        height: 1px;
        opacity: 0.001;
        pointer-events: none;
        border: none;
        outline: none;
      }

      /* Playbook & Doubt Solver */
      .ati-section-title {
        font-family: var(--mono);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: var(--signal);
        text-align: center;
        margin: 44px 0 18px;
      }
      .tips-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
        margin-bottom: 12px;
      }
      .tip-card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--r);
        padding: 18px;
      }
      .tip-card h3 {
        font-size: 0.95rem;
        margin-bottom: 8px;
        color: var(--ink);
      }
      .tip-card h3 span {
        color: var(--teal);
        font-family: var(--mono);
        margin-right: 8px;
      }
      .tip-card p {
        font-size: 0.86rem;
        color: var(--dim);
        line-height: 1.6;
      }

      .doubt-panel {
        background: var(--panel);
        border: 1px solid var(--lineb);
        border-radius: var(--r);
        padding: 24px 22px;
        margin-bottom: 24px;
      }
      .doubt-note {
        font-size: 0.82rem;
        color: var(--dim);
        margin-bottom: 14px;
      }
      .doubt-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 14px;
      }
      .doubt-chip {
        padding: 7px 14px;
        border-radius: 20px;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--dim);
        background: rgba(163, 230, 53, 0.06);
        border: 1px solid var(--lineb);
        cursor: pointer;
        transition: all 0.2s;
      }
      .doubt-chip:hover {
        color: #070a14;
        background: var(--teal);
      }
      .doubt-row {
        display: flex;
        gap: 10px;
      }
      .doubt-input {
        flex: 1;
        min-width: 0;
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid var(--lineb);
        background: var(--void2);
        color: var(--ink);
        font-size: 15px;
        outline: none;
      }
      .doubt-input:focus {
        border-color: var(--teal);
      }
      .doubt-ask {
        padding: 12px 24px;
        border-radius: 12px;
        border: none;
        background: var(--teal);
        color: #070a14;
        font-weight: 800;
        font-size: 0.9rem;
        cursor: pointer;
        white-space: nowrap;
      }
      .doubt-answer {
        margin-top: 14px;
        padding: 14px 16px;
        border-radius: 12px;
        background: var(--void2);
        border-left: 3px solid var(--teal);
        font-size: 0.9rem;
        line-height: 1.65;
        color: var(--ink);
      }
      .doubt-answer strong {
        color: var(--teal);
      }

      /* Responsive Media Queries */
      @media (max-width: 900px) {
        .page-wrap {
          padding: 85px 14px 90px;
        }
        .telemetry-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .tel-val { font-size: 1.5rem; }
        .res-stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .words-wrapper {
          font-size: 1.15rem;
          line-height: 1.8;
        }
        .sparkline-box {
          flex-direction: column;
          gap: 8px;
        }
        #wpmCanvas { width: 100%; height: 42px; }
      }
      @media (max-width: 768px) {
        .kb-row { gap: 3px; }
        .key {
          flex: 1 1 0;
          min-width: 0;
          height: 38px;
          font-size: 0.7rem;
        }
        .key.backspace, .key.tab, .key.caps, .key.enter, .key.shift {
          flex: 1.6 1 0;
          min-width: 0;
          font-size: 0;
        }
        .key.space { flex: 5 1 0; min-width: 0; }
        .key.backspace::after { content: "\\232B"; font-size: 0.8rem; }
        .key.tab::after { content: "\\21E5"; font-size: 0.8rem; }
        .key.caps::after { content: "\\21EA"; font-size: 0.8rem; }
        .key.enter::after { content: "\\23CE"; font-size: 0.8rem; }
        .key.shift::after { content: "\\21E7"; font-size: 0.8rem; }
        .doubt-row { flex-direction: column; }
        .doubt-ask { width: 100%; }
      }
    </style>
  </head>
  <body>
    <!-- Navigation Bar -->
    <nav class="top-nav" id="topNav">
      <a href="/" class="nav-brand">
        <img src="Class.png" alt="Class Of Learners Logo" class="brand-logo" width="56" height="56" fetchpriority="high" decoding="async" />
        <span class="brand-name">Class Of Learners</span>
      </a>
      <div class="nav-links" id="navLinks">
        <a href="/" class="nav-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>Home
        </a>
        <a href="about" class="nav-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>About
        </a>
        <a href="school" class="nav-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          </svg>School
        </a>
        <a href="sneh-asha" class="nav-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>Sneh Asha
        </a>
        <a href="making" class="nav-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>Making
        </a>
        <div class="dropdown" id="projDD">
          <button class="dropdown-btn act" aria-haspopup="true" aria-expanded="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>Projects <span class="darr">&#9660;</span>
          </button>
          <div class="dropdown-content">
            <div class="dropdown-content-inner">
              <a href="ati" class="act">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="4 7 4 4 20 4 20 7" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>Typing Instructor
              </a>
              <a href="solar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>Solar Engine
              </a>
              <a href="gesture">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8h1a4 4 0 010 8h-1" />
                  <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>Perceptus Flow
              </a>
              <a href="rpg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>RPG Game
              </a>
              <a href="qr">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="8" height="8" rx="1" />
                  <rect x="14" y="2" width="8" height="8" rx="1" />
                  <rect x="2" y="14" width="8" height="8" rx="1" />
                  <rect x="14" y="14" width="4" height="4" />
                  <rect x="20" y="14" width="2" height="2" />
                  <rect x="14" y="20" width="2" height="2" />
                  <rect x="20" y="20" width="2" height="2" />
                </svg>QR Studio Matrix
              </a>
              <a href="Terra3D/">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>Terra3D Atlas
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="nav-actions">
        <div class="hz-toggle" onclick="hzToggle()">
          <div class="hz-clouds"></div>
          <div class="hz-stars"></div>
          <div class="hz-orb"></div>
        </div>
        <button class="nav-login-btn" id="navLoginBtn" onclick="if (window.openGlobalLogin) window.openGlobalLogin(); else if (window.openLogin) window.openLogin();">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>Sign In
        </button>
        <div class="nav-user-profile" id="navUserProfile" onclick="if (window.openGlobalLogin) window.openGlobalLogin(); else if (window.openLogin) window.openLogin();">
          <div class="nav-user-avatar" id="navUserAv">?</div>
          <span class="nun" id="navUserName">User</span>
        </div>
        <a href="download" class="nav-dl-btn desktop-dl">Downloads Hub</a>
        <button class="mmb" id="mmb" aria-label="Toggle menu">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3 6H21M3 12H21M3 18H21" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </nav>

    <!-- Main Container -->
    <div class="page-wrap">
      <!-- Breadcrumb Header -->
      <div class="ati-nav-breadcrumb">
        <div class="crumb-left">
          <a href="ati" class="ati-back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            <span>Back to ATI 1.4 Overview</span>
          </a>
          <a href="ati-lite" class="ati-back-link" style="color: var(--teal); border-color: rgba(163, 230, 53, 0.3); background: rgba(163, 230, 53, 0.08);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Play ATI 3.2 Lite Arcade</span>
          </a>
        </div>
        <a href="download" class="ati-desktop-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Download Native App (Win &bull; Linux &bull; APK)</span>
        </a>
      </div>

      <!-- Hero Header -->
      <div class="ati-hero">
        <div class="ati-eyebrow">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          ATI v1.4 &bull; Flagship Interactive Velocity Studio
        </div>
        <h1>Syntax &amp; <em>Velocity Studio</em></h1>
        <p>Engineered touch-typing evaluation suite with real-time keystroke telemetry, tactile WebAudio switches, code syntax recognition, Ghost AI racing, and dynamic key radar.</p>
      </div>

      <!-- Studio Control Deck -->
      <div class="control-deck">
        <div class="deck-row-primary">
          <div class="mode-pills-bar" id="modePillsBar">
            <button class="mode-pill active" data-mode="time" onclick="setStudioMode('time')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Time
            </button>
            <button class="mode-pill" data-mode="words" onclick="setStudioMode('words')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
              Words
            </button>
            <button class="mode-pill" data-mode="js" onclick="setStudioMode('js')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              JavaScript
            </button>
            <button class="mode-pill" data-mode="py" onclick="setStudioMode('py')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/></svg>
              Python
            </button>
            <button class="mode-pill" data-mode="rust" onclick="setStudioMode('rust')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              Rust / C++
            </button>
            <button class="mode-pill" data-mode="quotes" onclick="setStudioMode('quotes')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>
              Quotes
            </button>
            <button class="mode-pill" data-mode="symbols" onclick="setStudioMode('symbols')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
              Symbols
            </button>
            <button class="mode-pill" data-mode="custom" onclick="openCustomTextModal()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Custom
            </button>
          </div>

          <div class="sim-deck-controls">
            <button class="btn-auto-sim" id="btnAutoSim" onclick="toggleAutoSim()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>Run Auto-Test</span>
            </button>
            <select class="deck-select" id="simSpeedSelect" title="Simulation Speed">
              <option value="45">45 WPM (Human)</option>
              <option value="75" selected>75 WPM (Pro)</option>
              <option value="120">120 WPM (Speed Demon)</option>
              <option value="180">180 WPM (Cyber Typist)</option>
            </select>
          </div>
        </div>

        <div class="deck-row-secondary">
          <div class="sub-options-bar" id="subOptionsBar">
            <span class="sub-opt-label" id="subOptLabel">Duration:</span>
            <div id="subOptionButtons" style="display: flex; gap: 6px;">
              <button class="sub-opt-btn" data-val="15" onclick="setSubOption(15)">15s</button>
              <button class="sub-opt-btn active" data-val="30" onclick="setSubOption(30)">30s</button>
              <button class="sub-opt-btn" data-val="60" onclick="setSubOption(60)">60s</button>
              <button class="sub-opt-btn" data-val="120" onclick="setSubOption(120)">120s</button>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="sub-opt-label">Ghost Pacer:</span>
              <select class="deck-select" id="ghostSelect" onchange="setGhostPacer(this.value)">
                <option value="0" selected>Off</option>
                <option value="40">40 WPM</option>
                <option value="60">60 WPM</option>
                <option value="80">80 WPM</option>
                <option value="100">100 WPM</option>
                <option value="130">130 WPM</option>
                <option value="best">Personal Best</option>
              </select>
            </div>

            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="sub-opt-label">Caret:</span>
              <select class="deck-select" id="caretSelect" onchange="setCaretStyle(this.value)">
                <option value="style-line" selected>Line</option>
                <option value="style-block">Block</option>
                <option value="style-underline">Underline</option>
              </select>
            </div>

            <button class="sub-opt-btn" id="audioSwitchBtn" onclick="cycleAudioProfile()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              <span id="audioProfileName">Blue (Clicky)</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Telemetry Strip -->
      <div class="telemetry-grid">
        <div class="tel-card">
          <div class="tel-val time" id="telTime">30</div>
          <div class="tel-lbl" id="telTimeLbl">Time Left (s)</div>
        </div>
        <div class="tel-card">
          <div class="tel-val" id="telNetWPM">0</div>
          <div class="tel-lbl">Net WPM</div>
        </div>
        <div class="tel-card">
          <div class="tel-val cpm" id="telRawCPM">0</div>
          <div class="tel-lbl">Raw CPM</div>
        </div>
        <div class="tel-card">
          <div class="tel-val acc" id="telAcc">100%</div>
          <div class="tel-lbl">Accuracy</div>
        </div>
        <div class="tel-card">
          <div class="tel-val streak" id="telStreak">0</div>
          <div class="tel-lbl" id="telStreakLbl">Combo Streak</div>
        </div>
        <div class="tel-card">
          <div class="tel-val best" id="telBest">0</div>
          <div class="tel-lbl">Personal Best</div>
        </div>
      </div>

      <!-- Ghost AI Pacer Track -->
      <div class="ghost-track-container" id="ghostTrackContainer">
        <div class="ghost-track-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/></svg>
          <span id="ghostLabelText">Ghost (60 WPM)</span>
        </div>
        <div class="ghost-track-bar">
          <div class="ghost-player-pin" id="ghostPlayerPin" style="left: 0%;" title="You"></div>
          <div class="ghost-ai-pin" id="ghostAiPin" style="left: 0%;" title="Ghost Pacer"></div>
        </div>
        <div class="ghost-delta-badge" id="ghostDeltaBadge">Even Pace</div>
      </div>

      <!-- Typing Terminal -->
      <div class="terminal" id="terminal">
        <div class="term-bar">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="term-dots">
              <div class="term-dot red"></div>
              <div class="term-dot yellow"></div>
              <div class="term-dot green"></div>
            </div>
            <span class="term-meta" id="termMetaTitle">ati_velocity_core.exe &bull; Ready</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="term-focus-badge" id="focusBadge">Focused</span>
            <button class="sub-opt-btn" onclick="resetGame()" style="padding: 4px 10px; font-size: 0.72rem;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 3px;"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              <span>Reset (Esc)</span>
            </button>
          </div>
        </div>

        <!-- Words Typing Area -->
        <div class="typing-stage" id="typingStage" onclick="focusTypingInput()">
          <div class="caret style-line" id="caret"></div>
          <div class="words-wrapper" id="wordsWrapper">
            <!-- Dynamically populated word and character spans -->
          </div>

          <div class="focus-overlay-prompt" id="focusPrompt">
            <div class="focus-prompt-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Click or tap here to focus &amp; type
            </div>
          </div>
        </div>
        </div>

        <!-- Live Sparkline Telemetry -->
        <div class="sparkline-box">
          <span style="font-family: var(--mono); font-size: 0.7rem; color: var(--dim);">VELOCITY ACCELERATION CURVE</span>
          <canvas id="wpmCanvas" width="320" height="38"></canvas>
        </div>
      </div>

      <!-- Interactive QWERTY Keyboard Radar -->
      <div class="kb-container">
        <div class="kb-header">
          <span class="kb-title">Interactive QWERTY Finger Anatomy &amp; Shift Radar</span>
          <div class="finger-guide-legend">
            <div class="legend-item"><div class="legend-dot" style="background: #fb923c;"></div> Pinky</div>
            <div class="legend-item"><div class="legend-dot" style="background: #3b82f6;"></div> Ring</div>
            <div class="legend-item"><div class="legend-dot" style="background: #10b981;"></div> Middle</div>
            <div class="legend-item"><div class="legend-dot" style="background: #eab308;"></div> Index</div>
            <div class="legend-item"><div class="legend-dot" style="background: #84cc16;"></div> Thumb</div>
          </div>
        </div>

        <div class="kb-layout" id="virtualKeyboard">
          <!-- Dynamically populated keys -->
        </div>
      </div>

      <!-- Hidden Input Trap For Soft Mobile / Touch Keyboards -->
      <input type="text" class="mobile-input-trap" id="mobileInputTrap" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />

      <!-- Typing Playbook -->
      <div class="ati-section-title">Typing Playbook</div>
      <div class="tips-grid">
        <div class="tip-card">
          <h3><span>01</span>Accuracy Before Speed</h3>
          <p>Every mistake breaks rhythm and penalizes your net velocity. Anchor at 95%+ accuracy first, then steadily accelerate.</p>
        </div>
        <div class="tip-card">
          <h3><span>02</span>Home Row Anchoring</h3>
          <p>Rest fingers on A S D F and J K L ;. Feel for the tactile bumps on F and J to verify your position without glancing down.</p>
        </div>
        <div class="tip-card">
          <h3><span>03</span>Fifteen Focused Minutes</h3>
          <p>Daily micro-drills yield dramatically higher neuroplastic retention than long, sporadic weekend marathons.</p>
        </div>
        <div class="tip-card">
          <h3><span>04</span>Eyes On The Screen</h3>
          <p>Never watch the physical keyboard. Trust muscle memory and let the next-key radar guide your finger assignments.</p>
        </div>
        <div class="tip-card">
          <h3><span>05</span>Opposite-Hand Shift</h3>
          <p>Use your opposite pinky for capital letters: right shift for left-hand letters, left shift for right-hand letters.</p>
        </div>
        <div class="tip-card">
          <h3><span>06</span>Loose Wrists &amp; Rhythm</h3>
          <p>Tense fingers slow down keystrokes. Float wrists slightly above desk surface and maintain a relaxed metronome cadence.</p>
        </div>
      </div>

      <!-- Typing Doubt Solver -->
      <div class="ati-section-title">Doubt Solver</div>
      <div class="doubt-panel">
        <p class="doubt-note">Ask any doubt regarding touch-typing ergonomics, switch acoustics, grading rubrics, or training techniques.</p>
        <div class="doubt-chips" id="atiDoubtChips"></div>
        <div class="doubt-row">
          <input type="text" class="doubt-input" id="atiDoubtInput" placeholder="Ask anything, for example: How do I break past 80 WPM?" aria-label="Ask a typing doubt" autocomplete="off" />
          <button class="doubt-ask" id="atiDoubtAsk" type="button">Ask</button>
        </div>
        <div class="doubt-answer" id="atiDoubtAnswer" role="status" aria-live="polite" hidden></div>
      </div>
    </div>

    <!-- Evaluation Overlay Modal -->
    <div class="results-overlay" id="resultsOverlay">
      <div class="res-modal-card">
        <div class="res-title-text">Evaluation Finalized</div>
        <div class="res-hero-badge grade-A" id="resGrade">A</div>
        <div class="res-score-row">
          <div class="res-score" id="resWPM">0</div>
          <div class="res-unit">Net WPM</div>
        </div>

        <div class="res-stats-grid">
          <div class="res-stat-card">
            <div class="res-stat-val" id="resAcc" style="color: var(--em);">100%</div>
            <div class="res-stat-lbl">Accuracy</div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-val" id="resRawCPM" style="color: var(--teal);">0</div>
            <div class="res-stat-lbl">Raw CPM</div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-val" id="resStreak" style="color: var(--plasma);">0</div>
            <div class="res-stat-lbl">Max Nitro Streak</div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-val" id="resConsistency" style="color: var(--signal);">100%</div>
            <div class="res-stat-lbl">Consistency</div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-val" id="resKeys">0</div>
            <div class="res-stat-lbl">Total Keystrokes</div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-val" id="resErrors" style="color: var(--rose);">0</div>
            <div class="res-stat-lbl">Mistakes</div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-val" id="resBackspaces">0</div>
            <div class="res-stat-lbl">Backspaces</div>
          </div>
          <div class="res-stat-card">
            <div class="res-stat-val" id="resTimeElapsed">0s</div>
            <div class="res-stat-lbl">Elapsed Time</div>
          </div>
        </div>

        <div class="weak-keys-box" id="weakKeysBox" style="display: none;">
          <span id="weakKeysText">Weak Keys: none</span>
          <button class="btn-res-action teal" style="padding: 6px 12px; font-size: 0.75rem;" onclick="drillWeakKeys()">Drill Weak Keys</button>
        </div>

        <div class="res-actions-bar">
          <button class="btn-res-action primary" onclick="resetGame()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            <span>Restart (Esc)</span>
          </button>
          <button class="btn-res-action secondary" onclick="copyShareCard()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span id="copyBtnText">Copy Share Card</span>
          </button>
          <a href="download" class="btn-res-action secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Get Native App</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Custom Text Modal -->
    <div class="modal-backdrop" id="customTextModal">
      <div class="modal-card">
        <h3 class="modal-title">Paste Custom Typing Text</h3>
        <textarea class="modal-textarea" id="customTextInput" placeholder="Paste your article, code snippet, or custom paragraph here..."></textarea>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; gap: 6px;">
            <button class="sub-opt-btn" onclick="insertCustomPreset('code')">Sample Code</button>
            <button class="sub-opt-btn" onclick="insertCustomPreset('quote')">Sample Quote</button>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="sub-opt-btn" onclick="closeCustomTextModal()">Cancel</button>
            <button class="btn-res-action primary" style="padding: 8px 16px;" onclick="applyCustomText()">Apply &amp; Practice</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Script Engine -->
    <script>
      // Practice Corpus Database
      const CORPUS = {
        words: [
          "algorithm", "binary", "compiler", "database", "encryption", "framework", "gigabyte", "hardware",
          "iteration", "javascript", "kernel", "latency", "memory", "network", "optimization", "protocol",
          "quantum", "recursion", "syntax", "telemetry", "variable", "websocket", "yield", "async",
          "boolean", "closure", "decrypt", "executor", "frontend", "heap", "immutable", "lambda",
          "multithreading", "opcode", "parser", "queue", "register", "runtime", "semaphore", "throughput",
          "thread", "universe", "vector", "zeroize", "array", "buffer", "callback", "daemon",
          "endpoint", "factory", "garbage", "handler", "iterator", "jitter", "layout", "middleware",
          "node", "payload", "query", "router", "stream", "token", "utility", "worker",
          "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "with",
          "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "his", "from",
          "say", "her", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
          "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make",
          "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year",
          "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look",
          "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how",
          "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these",
          "give", "day", "most", "us"
        ],
        js: [
          "async function calculateMetrics(data) {\\n  const clean = data.filter(d => d.valid);\\n  return clean.map(x => x.score * 1.5);\\n}",
          "export const useDebounce = (value, delay) => {\\n  const [debounced, setDebounced] = useState(value);\\n  useEffect(() => {\\n    const handler = setTimeout(() => setDebounced(value), delay);\\n    return () => clearTimeout(handler);\\n  }, [value, delay]);\\n  return debounced;\\n};",
          "const connection = await pool.connect();\\nconst results = await connection.query('SELECT * FROM telemetry');\\nconsole.log(results.rows);",
          "function binarySearch(arr, target) {\\n  let left = 0, right = arr.length - 1;\\n  while (left <= right) {\\n    const mid = Math.floor((left + right) / 2);\\n    if (arr[mid] === target) return mid;\\n    if (arr[mid] < target) left = mid + 1;\\n    else right = mid - 1;\\n  }\\n  return -1;\\n}"
        ],
        py: [
          "def quick_sort(arr):\\n    if len(arr) <= 1:\\n        return arr\\n    pivot = arr[len(arr) // 2]\\n    left = [x for x in arr if x < pivot]\\n    middle = [x for x in arr if x == pivot]\\n    right = [x for x in arr if x > pivot]\\n    return quick_sort(left) + middle + quick_sort(right)",
          "import asyncio\\nimport aiohttp\\n\\nasync def fetch_telemetry(session, endpoint):\\n    async with session.get(endpoint) as response:\\n        return await response.json()",
          "class NeuralNetwork:\\n    def __init__(self, layers):\\n        self.layers = layers\\n        self.weights = [np.random.randn(y, x) for x, y in zip(layers[:-1], layers[1:])]\\n        self.biases = [np.random.randn(y, 1) for y in layers[1:]]"
        ],
        rust: [
          "fn fibonacci(n: u64) -> u64 {\\n    match n {\\n        0 => 0,\\n        1 => 1,\\n        _ => fibonacci(n - 1) + fibonacci(n - 2),\\n    }\\n}",
          "pub struct NeuralLayer {\\n    pub weights: Vec<f32>,\\n    pub biases: Vec<f32>,\\n    pub activation: String,\\n}",
          "impl<T: Clone> Stack<T> {\\n    pub fn new() -> Self {\\n        Stack { items: Vec::new() }\\n    }\\n    pub fn push(&mut self, item: T) {\\n        self.items.push(item);\\n    }\\n}"
        ],
        quotes: [
          "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
          "The saddest aspect of life right now is that science gathers knowledge faster than society gathers wisdom.",
          "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
          "Sometimes it is the people no one can imagine anything of who do the things no one can imagine.",
          "Simplicity is prerequisite for reliability. Premature optimization is the root of all evil.",
          "Talk is cheap. Show me the code. Clean architecture outlives fleeting syntax frameworks.",
          "Stay hungry, stay foolish. Innovation distinguishes between a leader and a follower."
        ],
        symbols: [
          "const fn = (x, y) => { return [x * 2, y / 3, (x + y) % 5]; };",
          "let pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;",
          "arr.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.value }), {});",
          "Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) <= radius;"
        ]
      };

      // State Management
      let currentMode = 'time'; // 'time' | 'words' | 'js' | 'py' | 'rust' | 'quotes' | 'symbols' | 'custom' | 'weak'
      let currentSubVal = 30; // 30s or 25 words
      let rawText = '';
      let wordsData = []; // Array of words: [{ word: 'abc', chars: ['a','b','c'], tokens: ['tok-keyword', ...] }]
      let currentWordIndex = 0;
      let currentCharIndex = 0;
      let typedWords = []; // Array of strings typed by player for each word
      
      // Timing & Telemetry
      let isPlaying = false;
      let startTime = null;
      let testDurationSec = 30; // For time mode
      let elapsedTotalSec = 0;
      let timerRafId = null;
      let totalKeystrokes = 0;
      let correctKeystrokes = 0;
      let mistakeKeystrokes = 0;
      let backspaceCount = 0;
      let currentStreak = 0;
      let maxStreak = 0;
      let wpmHistory = [];
      let lastSparklineSec = 0;
      let missedKeyFreq = {}; // e.g. { 'p': 3, 'r': 1 }
      let strokeIntervals = [];
      let lastStrokeTime = null;

      // Ghost AI Pacer
      let ghostWpm = 0;
      let ghostStartTime = null;

      // Audio Synthesis
      let audioCtx = null;
      let audioProfileIndex = 0;
      const audioProfiles = ['Blue (Clicky)', 'Brown (Thocky)', 'Red (Linear)', 'Holy Panda', 'Muted'];

      // AI Simulation
      let isSimulating = false;
      let simTimeout = null;

      // Caret styling
      let caretStyle = 'style-line';
      let lastKeyHandledAt = 0;

      function updateHUD() {
        if (!isPlaying || !startTime) return;
        const now = performance.now();
        const elapsedSec = Math.max(0.1, (now - startTime) / 1000);
        const elapsedMin = elapsedSec / 60;
        const netWPM = Math.max(0, Math.round((correctKeystrokes / 5) / elapsedMin));
        const rawCPM = Math.max(0, Math.round(totalKeystrokes / elapsedMin));
        const acc = totalKeystrokes > 0 ? Math.max(0, Math.min(100, Math.round((correctKeystrokes / totalKeystrokes) * 100))) : 100;

        document.getElementById('telNetWPM').textContent = netWPM;
        document.getElementById('telRawCPM').textContent = rawCPM;
        document.getElementById('telAcc').textContent = acc + '%';
        document.getElementById('telStreak').textContent = currentStreak;
      }

      function initAudioContext() {
        if (!audioCtx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
          }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }

      function playKeySound(isError) {
        if (audioProfileIndex === 4) return; // Muted
        initAudioContext();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;

        if (isError) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120, now);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.08);
          return;
        }

        // Mechanical switch profiles
        if (audioProfileIndex === 0) { // Blue Clicky: crisp tactile ping + housing snap
          const click = audioCtx.createOscillator();
          const clickGain = audioCtx.createGain();
          click.type = 'triangle';
          click.frequency.setValueAtTime(2100 + Math.random() * 200, now);
          clickGain.gain.setValueAtTime(0.14, now);
          clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
          click.connect(clickGain);
          clickGain.connect(audioCtx.destination);
          click.start(now);
          click.stop(now + 0.025);

          const thock = audioCtx.createOscillator();
          const thockGain = audioCtx.createGain();
          thock.type = 'sine';
          thock.frequency.setValueAtTime(580 + Math.random() * 60, now + 0.008);
          thockGain.gain.setValueAtTime(0.09, now + 0.008);
          thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
          thock.connect(thockGain);
          thockGain.connect(audioCtx.destination);
          thock.start(now + 0.008);
          thock.stop(now + 0.045);
        } else if (audioProfileIndex === 1) { // Brown Thocky: warm rounded bump
          const osc = audioCtx.createOscillator();
          const filter = audioCtx.createBiquadFilter();
          const gain = audioCtx.createGain();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(550, now);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(460 + Math.random() * 40, now);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 0.05);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
        } else if (audioProfileIndex === 2) { // Red Linear: smooth cushioned landing
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320 + Math.random() * 30, now);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.002, now + 0.038);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.038);
        } else if (audioProfileIndex === 3) { // Holy Panda: heavy crisp pop
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(840 + Math.random() * 80, now);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.002, now + 0.04);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
        }
      }

      function cycleAudioProfile() {
        audioProfileIndex = (audioProfileIndex + 1) % audioProfiles.length;
        document.getElementById('audioProfileName').textContent = audioProfiles[audioProfileIndex];
        playKeySound(false);
      }

      // Keyboard Definition with True Touch Finger Annotations
      const KB_CONFIG = [
        [
          { k: '\`', alt: '~', f: 'lp' }, { k: '1', alt: '!', f: 'lp' }, { k: '2', alt: '@', f: 'lr' },
          { k: '3', alt: '#', f: 'lm' }, { k: '4', alt: '$', f: 'li' }, { k: '5', alt: '%', f: 'li' },
          { k: '6', alt: '^', f: 'ri' }, { k: '7', alt: '&', f: 'ri' }, { k: '8', alt: '*', f: 'rm' },
          { k: '9', alt: '(', f: 'rr' }, { k: '0', alt: ')', f: 'rp' }, { k: '-', alt: '_', f: 'rp' },
          { k: '=', alt: '+', f: 'rp' }, { k: 'Backspace', f: 'rp', cls: 'backspace' }
        ],
        [
          { k: 'Tab', f: 'lp', cls: 'tab' }, { k: 'q', f: 'lp' }, { k: 'w', f: 'lr' },
          { k: 'e', f: 'lm' }, { k: 'r', f: 'li' }, { k: 't', f: 'li' },
          { k: 'y', f: 'ri' }, { k: 'u', f: 'ri' }, { k: 'i', f: 'rm' },
          { k: 'o', f: 'rr' }, { k: 'p', f: 'rp' }, { k: '[', alt: '{', f: 'rp' },
          { k: ']', alt: '}', f: 'rp' }, { k: '\\\\', alt: '|', f: 'rp' }
        ],
        [
          { k: 'Caps', f: 'lp', cls: 'caps' }, { k: 'a', f: 'lp' }, { k: 's', f: 'lr' },
          { k: 'd', f: 'lm' }, { k: 'f', f: 'li' }, { k: 'g', f: 'li' },
          { k: 'h', f: 'ri' }, { k: 'j', f: 'ri' }, { k: 'k', f: 'rm' },
          { k: 'l', f: 'rr' }, { k: ';', alt: ':', f: 'rp' }, { k: \"'\", alt: '\"', f: 'rp' },
          { k: 'Enter', f: 'rp', cls: 'enter' }
        ],
        [
          { k: 'Shift', f: 'lp', cls: 'shift', side: 'left' }, { k: 'z', f: 'lp' }, { k: 'x', f: 'lr' },
          { k: 'c', f: 'lm' }, { k: 'v', f: 'li' }, { k: 'b', f: 'li' },
          { k: 'n', f: 'ri' }, { k: 'm', f: 'ri' }, { k: ',', alt: '<', f: 'rm' },
          { k: '.', alt: '>', f: 'rr' }, { k: '/', alt: '?', f: 'rp' },
          { k: 'Shift', f: 'rp', cls: 'shift', side: 'right' }
        ],
        [
          { k: 'Space', f: 'th', cls: 'space' }
        ]
      ];

      function buildVirtualKeyboard() {
        const container = document.getElementById('virtualKeyboard');
        container.innerHTML = '';

        KB_CONFIG.forEach(row => {
          const rowEl = document.createElement('div');
          rowEl.className = 'kb-row';

          row.forEach(item => {
            const keyEl = document.createElement('div');
            keyEl.className = 'key';
            if (item.cls) keyEl.classList.add(item.cls);
            keyEl.dataset.key = item.k.toLowerCase();
            keyEl.dataset.finger = item.f;
            if (item.alt) keyEl.dataset.alt = item.alt;
            if (item.side) keyEl.dataset.side = item.side;

            keyEl.textContent = item.k;
            if (item.k === 'Space') keyEl.dataset.key = ' ';

            keyEl.addEventListener('pointerdown', (e) => {
              e.preventDefault();
              focusTypingInput();
              if (item.k === 'Backspace') {
                handleBackspace();
              } else if (item.k === 'Enter') {
                handleInputCharacter('\\n');
              } else if (item.k === 'Space') {
                handleSpace();
              } else if (item.k.length === 1) {
                handleInputCharacter(item.k);
              }
            });

            rowEl.appendChild(keyEl);
          });

          container.appendChild(rowEl);
        });
      }

      // Syntax Tokenizer for Code Modes
      function tokenizeCodeLine(line) {
        const KEYWORDS = new Set([
          'async', 'await', 'function', 'return', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
          'import', 'export', 'from', 'class', 'def', 'elif', 'pass', 'yield', 'lambda', 'in', 'is',
          'not', 'and', 'or', 'fn', 'pub', 'struct', 'impl', 'match', 'mut', 'use', 'enum', 'Self', 'self'
        ]);

        const tokens = [];
        let i = 0;
        while (i < line.length) {
          const ch = line[i];

          // String
          if (ch === '\"' || ch === \"'\" || ch === '\`') {
            const quote = ch;
            let str = quote;
            i++;
            while (i < line.length && line[i] !== quote) {
              if (line[i] === '\\\\' && i + 1 < line.length) { str += line[i] + line[i + 1]; i += 2; }
              else { str += line[i]; i++; }
            }
            if (i < line.length) { str += line[i]; i++; }
            tokens.push({ text: str, type: 'tok-string' });
            continue;
          }

          // Number
          if (/\\d/.test(ch) && (i === 0 || /[^a-zA-Z0-9_]/.test(line[i - 1]))) {
            let num = '';
            while (i < line.length && /[0-9.]/.test(line[i])) { num += line[i]; i++; }
            tokens.push({ text: num, type: 'tok-number' });
            continue;
          }

          // Word / Keyword / Function
          if (/[a-zA-Z_$]/.test(ch)) {
            let w = '';
            while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i])) { w += line[i]; i++; }
            let type = 'tok-normal';
            if (KEYWORDS.has(w)) type = 'tok-keyword';
            else if (i < line.length && line[i] === '(') type = 'tok-function';
            else if (/^[A-Z]/.test(w)) type = 'tok-type';
            tokens.push({ text: w, type });
            continue;
          }

          // Single char (whitespace, operators, brackets)
          tokens.push({ text: ch, type: 'tok-normal' });
          i++;
        }
        return tokens;
      }

      function generateTextCorpus() {
        let text = '';

        if (currentMode === 'time') {
          // Generate 120 randomized words from corpus
          const list = CORPUS.words;
          const words = [];
          for (let i = 0; i < 120; i++) {
            words.push(list[Math.floor(Math.random() * list.length)]);
          }
          text = words.join(' ');
        } else if (currentMode === 'words') {
          const count = currentSubVal || 25;
          const list = CORPUS.words;
          const words = [];
          for (let i = 0; i < count; i++) {
            words.push(list[Math.floor(Math.random() * list.length)]);
          }
          text = words.join(' ');
        } else if (currentMode === 'js' || currentMode === 'py' || currentMode === 'rust') {
          const snippets = CORPUS[currentMode];
          text = snippets[Math.floor(Math.random() * snippets.length)];
        } else if (currentMode === 'quotes') {
          const quotes = CORPUS.quotes;
          text = quotes[Math.floor(Math.random() * quotes.length)];
        } else if (currentMode === 'symbols') {
          const syms = CORPUS.symbols;
          text = syms[Math.floor(Math.random() * syms.length)];
        } else if (currentMode === 'custom') {
          text = rawText || 'Technology is best when it brings people together.';
        } else if (currentMode === 'weak') {
          // Weak keys drill generator
          const weakKeys = Object.keys(missedKeyFreq);
          if (weakKeys.length === 0) {
            text = 'great speed practice touch typing precision rhythm consistency';
          } else {
            const list = CORPUS.words.filter(w => weakKeys.some(k => w.includes(k)));
            const words = [];
            for (let i = 0; i < 30; i++) {
              if (list.length > 0) words.push(list[Math.floor(Math.random() * list.length)]);
              else words.push(weakKeys[i % weakKeys.length].repeat(4));
            }
            text = words.join(' ');
          }
        }

        rawText = text;
        parseWordsData(rawText);
      }

      function parseWordsData(text) {
        wordsData = [];
        typedWords = [];
        currentWordIndex = 0;
        currentCharIndex = 0;

        const isCode = (currentMode === 'js' || currentMode === 'py' || currentMode === 'rust');

        if (isCode) {
          // For code, split into word chunks preserving spaces and newlines
          const tokens = tokenizeCodeLine(text);
          let currentChars = [];
          let currentTokens = [];

          tokens.forEach(tok => {
            for (let c = 0; c < tok.text.length; c++) {
              const ch = tok.text[c];
              if (ch === ' ' || ch === '\\n') {
                if (currentChars.length > 0) {
                  wordsData.push({
                    word: currentChars.join(''),
                    chars: [...currentChars],
                    tokens: [...currentTokens],
                    hasNewlineAfter: false
                  });
                  currentChars = [];
                  currentTokens = [];
                }
                if (ch === '\\n') {
                  if (wordsData.length > 0) wordsData[wordsData.length - 1].hasNewlineAfter = true;
                }
              } else {
                currentChars.push(ch);
                currentTokens.push(tok.type);
              }
            }
          });
          if (currentChars.length > 0) {
            wordsData.push({
              word: currentChars.join(''),
              chars: currentChars,
              tokens: currentTokens,
              hasNewlineAfter: false
            });
          }
        } else {
          // Standard space-separated words
          const split = text.trim().split(/\\s+/);
          split.forEach((w, idx) => {
            wordsData.push({
              word: w,
              chars: w.split(''),
              tokens: new Array(w.length).fill('tok-normal'),
              hasNewlineAfter: false
            });
          });
        }

        typedWords = wordsData.map(() => '');
      }

      function renderWords() {
        const wrapper = document.getElementById('wordsWrapper');
        wrapper.innerHTML = '';
        wrapper.style.transform = 'translateY(0px)';

        wordsData.forEach((wObj, wIdx) => {
          const wordEl = document.createElement('div');
          wordEl.className = 'word';
          wordEl.id = 'w_' + wIdx;

          wObj.chars.forEach((ch, cIdx) => {
            const charSpan = document.createElement('span');
            charSpan.className = 'char ' + (wObj.tokens[cIdx] || 'tok-normal');
            charSpan.id = 'c_' + wIdx + '_' + cIdx;
            charSpan.textContent = ch;
            wordEl.appendChild(charSpan);
          });

          if (wObj.hasNewlineAfter) {
            const nlSpan = document.createElement('span');
            nlSpan.className = 'char newline-char';
            nlSpan.textContent = ' ↵';
            wordEl.appendChild(nlSpan);
          }

          wrapper.appendChild(wordEl);
        });

        updateCaret();
        highlightRadarKeys();
      }

      function updateCaret() {
        const caret = document.getElementById('caret');
        const activeWordEl = document.getElementById('w_' + currentWordIndex);
        if (!activeWordEl) {
          caret.style.display = 'none';
          return;
        }

        caret.style.display = 'block';
        const currentTyped = typedWords[currentWordIndex] || '';
        const wObj = wordsData[currentWordIndex];

        let targetLeft = 0;
        let targetTop = 0;

        if (currentTyped.length < wObj.chars.length) {
          const charSpan = document.getElementById('c_' + currentWordIndex + '_' + currentTyped.length);
          if (charSpan) {
            targetLeft = charSpan.offsetLeft;
            targetTop = charSpan.offsetTop;
          }
        } else {
          // At the end of word or extra chars
          const spans = activeWordEl.querySelectorAll('.char:not(.newline-char)');
          if (spans.length > 0) {
            const lastSpan = spans[spans.length - 1];
            targetLeft = lastSpan.offsetLeft + lastSpan.offsetWidth;
            targetTop = lastSpan.offsetTop;
          } else {
            targetLeft = activeWordEl.offsetLeft;
            targetTop = activeWordEl.offsetTop;
          }
        }

        caret.style.left = targetLeft + 'px';
        caret.style.top = targetTop + 'px';

        // Auto-scroll container when moving to lower lines
        const stage = document.getElementById('typingStage');
        const wrapper = document.getElementById('wordsWrapper');
        const lineOffset = activeWordEl.offsetTop;

        if (lineOffset > 70) {
          wrapper.style.transform = \`translateY(-\${lineOffset - 35}px)\`;
        } else {
          wrapper.style.transform = 'translateY(0px)';
        }
      }

      function highlightRadarKeys() {
        document.querySelectorAll('.key.target-next').forEach(k => k.classList.remove('target-next'));
        document.querySelectorAll('.key.shift-needed').forEach(k => k.classList.remove('shift-needed'));

        const wObj = wordsData[currentWordIndex];
        if (!wObj) return;

        const currentTyped = typedWords[currentWordIndex] || '';
        let expectedChar = '';

        if (currentTyped.length < wObj.chars.length) {
          expectedChar = wObj.chars[currentTyped.length];
        } else {
          expectedChar = ' '; // Space for next word
        }

        if (!expectedChar) return;

        let baseKey = expectedChar.toLowerCase();
        let needsShift = false;

        // Shift detection
        if (/[A-Z]/.test(expectedChar)) {
          needsShift = true;
          baseKey = expectedChar.toLowerCase();
        } else {
          // Shift symbols on number row and punctuation
          const shiftMap = {
            '~': '\`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
            '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-',
            '+': '=', '{': '[', '}': ']', '|': '\\\\', ':': ';', '\"': \"'\",
            '<': ',', '>': '.', '?': '/'
          };
          if (shiftMap[expectedChar]) {
            needsShift = true;
            baseKey = shiftMap[expectedChar];
          }
        }

        const allKeys = document.querySelectorAll('.key');
        let targetKeyEl = null;

        for (let i = 0; i < allKeys.length; i++) {
          if (allKeys[i].dataset.key === baseKey) {
            targetKeyEl = allKeys[i];
            targetKeyEl.classList.add('target-next');
            break;
          }
        }

        if (needsShift && targetKeyEl) {
          const finger = targetKeyEl.dataset.finger || '';
          const isLeftHand = finger.startsWith('l');
          // Opposite shift rule
          const shiftKeySide = isLeftHand ? 'right' : 'left';
          const shiftKey = document.querySelector(\`.key.shift[data-side="\${shiftKeySide}"]\`) || document.querySelector('.key.shift');
          if (shiftKey) shiftKey.classList.add('shift-needed');
        }
      }

      function flashVirtualKey(keyChar) {
        let lookup = keyChar.toLowerCase();
        if (keyChar === '\\n') lookup = 'enter';
        else if (keyChar === ' ') lookup = ' ';

        const match = Array.from(document.querySelectorAll('.key')).find(k => k.dataset.key === lookup);
        if (match) {
          match.classList.add('active');
          setTimeout(() => match.classList.remove('active'), 110);
        }
      }

      function handleInputCharacter(char) {
        if (!isPlaying) startTest();
        if (currentWordIndex >= wordsData.length) return;

        const wObj = wordsData[currentWordIndex];
        const typed = typedWords[currentWordIndex];
        const now = performance.now();

        // Stroke interval for consistency metric
        if (lastStrokeTime) {
          strokeIntervals.push(now - lastStrokeTime);
        }
        lastStrokeTime = now;

        totalKeystrokes++;
        const targetChar = wObj.chars[typed.length];

        if (targetChar === char) {
          correctKeystrokes++;
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
          playKeySound(false);
        } else {
          mistakeKeystrokes++;
          currentStreak = 0;
          playKeySound(true);
          if (targetChar) {
            missedKeyFreq[targetChar] = (missedKeyFreq[targetChar] || 0) + 1;
          }
        }

        typedWords[currentWordIndex] += char;
        updateWordDOM(currentWordIndex);
        flashVirtualKey(char);
        updateCaret();
        highlightRadarKeys();
        updateHUD();
      }

      function handleSpace() {
        if (!isPlaying) startTest();
        if (currentWordIndex >= wordsData.length) return;

        const typed = typedWords[currentWordIndex];
        const wObj = wordsData[currentWordIndex];

        // Do not advance if nothing typed in current word
        if (typed.length === 0) return;

        totalKeystrokes++;
        if (typed === wObj.word) {
          correctKeystrokes++;
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
          playKeySound(false);
        } else {
          mistakeKeystrokes++;
          currentStreak = 0;
          playKeySound(true);
          missedKeyFreq[' '] = (missedKeyFreq[' '] || 0) + 1;
        }

        currentWordIndex++;
        flashVirtualKey(' ');
        updateCaret();
        highlightRadarKeys();
        updateHUD();

        // Check completion in word mode
        if (currentWordIndex >= wordsData.length) {
          endTest();
        }
      }

      function handleBackspace(ctrlKey = false) {
        if (currentWordIndex >= wordsData.length && !isPlaying) return;
        backspaceCount++;

        if (ctrlKey) {
          // Delete entire word
          if (typedWords[currentWordIndex].length > 0) {
            typedWords[currentWordIndex] = '';
          } else if (currentWordIndex > 0) {
            currentWordIndex--;
            typedWords[currentWordIndex] = '';
          }
        } else {
          // Single character backspace
          if (typedWords[currentWordIndex].length > 0) {
            typedWords[currentWordIndex] = typedWords[currentWordIndex].slice(0, -1);
          } else if (currentWordIndex > 0) {
            // Jump back to previous word if it was wrong
            const prevWord = typedWords[currentWordIndex - 1];
            const expectedPrev = wordsData[currentWordIndex - 1].word;
            if (prevWord !== expectedPrev) {
              currentWordIndex--;
            }
          }
        }

        updateWordDOM(currentWordIndex);
        updateCaret();
        highlightRadarKeys();
        updateHUD();
        playKeySound(false);
      }

      function updateWordDOM(wIdx) {
        const wordEl = document.getElementById('w_' + wIdx);
        if (!wordEl) return;

        const typed = typedWords[wIdx];
        const wObj = wordsData[wIdx];

        // Clean extra chars
        wordEl.querySelectorAll('.char.extra').forEach(el => el.remove());

        wObj.chars.forEach((ch, cIdx) => {
          const span = document.getElementById('c_' + wIdx + '_' + cIdx);
          if (!span) return;

          if (cIdx < typed.length) {
            if (typed[cIdx] === ch) {
              span.className = 'char correct ' + (wObj.tokens[cIdx] || 'tok-normal');
            } else {
              span.className = 'char incorrect';
            }
          } else {
            span.className = 'char ' + (wObj.tokens[cIdx] || 'tok-normal');
          }
        });

        // Extra characters typed past word length
        if (typed.length > wObj.chars.length) {
          for (let i = wObj.chars.length; i < typed.length; i++) {
            const extraSpan = document.createElement('span');
            extraSpan.className = 'char extra';
            extraSpan.textContent = typed[i];
            wordEl.appendChild(extraSpan);
          }
        }
      }

      function startTest() {
        if (isPlaying) return;
        isPlaying = true;
        startTime = performance.now();
        lastStrokeTime = startTime;
        strokeIntervals = [];
        wpmHistory = [];
        lastSparklineSec = 0;

        document.getElementById('termMetaTitle').textContent = 'ati_velocity_core.exe • Active Evaluation';

        // Start 60 FPS animation loop
        runTimerLoop();
      }

      function runTimerLoop() {
        if (!isPlaying) return;

        const now = performance.now();
        const elapsedSec = (now - startTime) / 1000;
        elapsedTotalSec = elapsedSec;

        // Time mode countdown
        if (currentMode === 'time') {
          const remaining = Math.max(0, Math.ceil(testDurationSec - elapsedSec));
          document.getElementById('telTime').textContent = remaining;

          if (remaining <= 0) {
            endTest();
            return;
          }
        } else {
          // Word count or passage progress
          document.getElementById('telTime').textContent = Math.round(elapsedSec) + 's';
        }

        // Live stats computation
        const elapsedMin = Math.max(0.001, elapsedSec / 60);
        const netWPM = Math.max(0, Math.round((correctKeystrokes / 5) / elapsedMin));
        const rawCPM = Math.max(0, Math.round(totalKeystrokes / elapsedMin));
        const acc = totalKeystrokes > 0 ? Math.max(0, Math.min(100, Math.round((correctKeystrokes / totalKeystrokes) * 100))) : 100;

        document.getElementById('telNetWPM').textContent = netWPM;
        document.getElementById('telRawCPM').textContent = rawCPM;
        document.getElementById('telAcc').textContent = acc + '%';
        document.getElementById('telStreak').textContent = currentStreak;

        // Multiplier badges on streak
        const streakLbl = document.getElementById('telStreakLbl');
        if (currentStreak >= 50) streakLbl.innerHTML = 'Nitro Streak <span style=\"color: var(--rose); font-weight: 800;\">&times;3.0</span>';
        else if (currentStreak >= 25) streakLbl.innerHTML = 'Nitro Streak <span style=\"color: var(--signal); font-weight: 800;\">&times;2.0</span>';
        else if (currentStreak >= 10) streakLbl.innerHTML = 'Nitro Streak <span style=\"color: var(--ion); font-weight: 800;\">&times;1.5</span>';
        else streakLbl.textContent = 'Combo Streak';

        // Sparkline sample every 1 sec
        if (elapsedSec - lastSparklineSec >= 1) {
          wpmHistory.push(netWPM);
          lastSparklineSec = elapsedSec;
          drawSparkline();
        }

        // Ghost AI update
        if (ghostWpm > 0) {
          updateGhostPacer(elapsedSec, netWPM);
        }

        // Terminal glow
        const term = document.getElementById('terminal');
        if (currentStreak >= 40) term.className = 'terminal glow-3';
        else if (currentStreak >= 25) term.className = 'terminal glow-2';
        else if (currentStreak >= 12) term.className = 'terminal glow-1';
        else term.className = 'terminal';

        timerRafId = requestAnimationFrame(runTimerLoop);
      }

      function updateGhostPacer(elapsedSec, playerWpm) {
        const totalWords = wordsData.length;
        const playerProgress = Math.min(100, (currentWordIndex / totalWords) * 100);
        const ghostTargetWords = (ghostWpm / 60) * elapsedSec;
        const ghostProgress = Math.min(100, (ghostTargetWords / totalWords) * 100);

        document.getElementById('ghostPlayerPin').style.left = playerProgress + '%';
        document.getElementById('ghostAiPin').style.left = ghostProgress + '%';

        const delta = Math.round(currentWordIndex - ghostTargetWords);
        const badge = document.getElementById('ghostDeltaBadge');
        if (delta > 0) {
          badge.textContent = '+' + delta + ' words ahead';
          badge.className = 'ghost-delta-badge ahead';
        } else if (delta < 0) {
          badge.textContent = Math.abs(delta) + ' words behind';
          badge.className = 'ghost-delta-badge behind';
        } else {
          badge.textContent = 'Even Pace';
          badge.className = 'ghost-delta-badge';
        }
      }

      function setGhostPacer(val) {
        if (val === '0') {
          ghostWpm = 0;
          document.getElementById('ghostTrackContainer').classList.remove('show');
        } else if (val === 'best') {
          const pb = parseInt(localStorage.getItem('ati_best_wpm_' + currentMode) || '60', 10);
          ghostWpm = pb || 60;
          document.getElementById('ghostLabelText').textContent = 'Ghost (PB: ' + ghostWpm + ' WPM)';
          document.getElementById('ghostTrackContainer').classList.add('show');
        } else {
          ghostWpm = parseInt(val, 10);
          document.getElementById('ghostLabelText').textContent = 'Ghost (' + ghostWpm + ' WPM)';
          document.getElementById('ghostTrackContainer').classList.add('show');
        }
      }

      function setCaretStyle(style) {
        caretStyle = style;
        const caret = document.getElementById('caret');
        caret.className = 'caret ' + caretStyle;
      }

      function endTest() {
        isPlaying = false;
        isSimulating = false;
        cancelAnimationFrame(timerRafId);
        clearTimeout(simTimeout);

        const simBtn = document.getElementById('btnAutoSim');
        simBtn.innerHTML = '<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\"/></svg><span>Run Auto-Test</span>';
        simBtn.classList.remove('running');

        const elapsedMin = Math.max(0.001, elapsedTotalSec / 60);
        const finalNetWPM = Math.max(0, Math.round((correctKeystrokes / 5) / elapsedMin));
        const finalRawCPM = Math.max(0, Math.round(totalKeystrokes / elapsedMin));
        const finalAcc = totalKeystrokes > 0 ? Math.max(0, Math.min(100, Math.round((correctKeystrokes / totalKeystrokes) * 100))) : 100;

        // Consistency metric based on inter-keystroke variance
        let consistency = 98;
        if (strokeIntervals.length > 5) {
          const mean = strokeIntervals.reduce((a, b) => a + b, 0) / strokeIntervals.length;
          const variance = strokeIntervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / strokeIntervals.length;
          const stdDev = Math.sqrt(variance);
          const cv = mean > 0 ? (stdDev / mean) : 0;
          consistency = Math.max(65, Math.min(100, Math.round((1 - (cv * 0.4)) * 100)));
        }

        // Personal best handling
        const bestKey = 'ati_best_wpm_' + currentMode;
        let prevBest = parseInt(localStorage.getItem(bestKey) || '0', 10);
        let isNewPB = false;
        if (finalNetWPM > prevBest && finalAcc >= 90) {
          prevBest = finalNetWPM;
          localStorage.setItem(bestKey, String(finalNetWPM));
          isNewPB = true;
        }
        document.getElementById('telBest').textContent = prevBest;

        // Grade calculation
        let grade = 'F';
        let gradeCls = 'grade-F';
        if (finalNetWPM >= 120 && finalAcc >= 97) { grade = 'S+'; gradeCls = 'grade-Splus'; }
        else if (finalNetWPM >= 100 && finalAcc >= 95) { grade = 'S'; gradeCls = 'grade-S'; }
        else if (finalNetWPM >= 75 && finalAcc >= 92) { grade = 'A'; gradeCls = 'grade-A'; }
        else if (finalNetWPM >= 50 && finalAcc >= 86) { grade = 'B'; gradeCls = 'grade-B'; }
        else if (finalNetWPM >= 30 && finalAcc >= 78) { grade = 'C'; gradeCls = 'grade-C'; }

        // Populate Results Modal
        const gradeBadge = document.getElementById('resGrade');
        gradeBadge.textContent = grade;
        gradeBadge.className = 'res-hero-badge ' + gradeCls;

        document.getElementById('resWPM').textContent = finalNetWPM;
        document.getElementById('resAcc').textContent = finalAcc + '%';
        document.getElementById('resRawCPM').textContent = finalRawCPM;
        document.getElementById('resStreak').textContent = maxStreak;
        document.getElementById('resConsistency').textContent = consistency + '%';
        document.getElementById('resKeys').textContent = totalKeystrokes;
        document.getElementById('resErrors').textContent = mistakeKeystrokes;
        document.getElementById('resBackspaces').textContent = backspaceCount;
        document.getElementById('resTimeElapsed').textContent = Math.round(elapsedTotalSec) + 's';

        // Weak keys callout
        const weakEntries = Object.entries(missedKeyFreq).sort((a, b) => b[1] - a[1]);
        const weakBox = document.getElementById('weakKeysBox');
        if (weakEntries.length > 0) {
          const topMissed = weakEntries.slice(0, 3).map(e => \`\${e[0].toUpperCase()} (\${e[1]})\`).join(', ');
          document.getElementById('weakKeysText').textContent = 'Weak Keys: ' + topMissed;
          weakBox.style.display = 'flex';
        } else {
          weakBox.style.display = 'none';
        }

        document.getElementById('resultsOverlay').classList.add('show');
      }

      function drillWeakKeys() {
        document.getElementById('resultsOverlay').classList.remove('show');
        setStudioMode('weak');
      }

      function copyShareCard() {
        const wpm = document.getElementById('resWPM').textContent;
        const acc = document.getElementById('resAcc').textContent;
        const grade = document.getElementById('resGrade').textContent;
        const text = \`⚡ ATI Velocity Studio: \${wpm} WPM · \${acc} Accuracy · Grade \${grade} · https://advancedlogiclabs.dpdns.org/ati-demo\`;
        navigator.clipboard.writeText(text).then(() => {
          const btn = document.getElementById('copyBtnText');
          btn.textContent = 'Copied to Clipboard!';
          setTimeout(() => { btn.textContent = 'Copy Share Card'; }, 2000);
        });
      }

      function resetGame() {
        cancelAnimationFrame(timerRafId);
        clearTimeout(simTimeout);
        isPlaying = false;
        isSimulating = false;
        startTime = null;
        lastStrokeTime = null;
        totalKeystrokes = 0;
        correctKeystrokes = 0;
        mistakeKeystrokes = 0;
        backspaceCount = 0;
        currentStreak = 0;
        maxStreak = 0;
        wpmHistory = [];
        missedKeyFreq = {};
        strokeIntervals = [];

        document.getElementById('resultsOverlay').classList.remove('show');
        document.getElementById('terminal').className = 'terminal';

        const simBtn = document.getElementById('btnAutoSim');
        simBtn.innerHTML = '<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\"/></svg><span>Run Auto-Test</span>';
        simBtn.classList.remove('running');

        // Setup timer or word display
        if (currentMode === 'time') {
          testDurationSec = currentSubVal || 30;
          document.getElementById('telTime').textContent = testDurationSec;
          document.getElementById('telTimeLbl').textContent = 'Time Left (s)';
        } else {
          document.getElementById('telTime').textContent = '0s';
          document.getElementById('telTimeLbl').textContent = 'Time Elapsed';
        }

        document.getElementById('telNetWPM').textContent = '0';
        document.getElementById('telRawCPM').textContent = '0';
        document.getElementById('telAcc').textContent = '100%';
        document.getElementById('telStreak').textContent = '0';
        document.getElementById('telStreakLbl').textContent = 'Combo Streak';

        const bestKey = 'ati_best_wpm_' + currentMode;
        document.getElementById('telBest').textContent = localStorage.getItem(bestKey) || '0';

        document.getElementById('termMetaTitle').textContent = 'ati_velocity_core.exe • Ready';

        generateTextCorpus();
        renderWords();
        drawSparkline();
        focusTypingInput();
      }

      function setStudioMode(mode) {
        currentMode = mode;
        document.querySelectorAll('.mode-pill').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Configure sub-option bar based on mode
        const subBar = document.getElementById('subOptionButtons');
        const subLbl = document.getElementById('subOptLabel');

        if (mode === 'time') {
          subLbl.textContent = 'Duration:';
          subBar.innerHTML = \`
            <button class="sub-opt-btn" data-val="15" onclick="setSubOption(15)">15s</button>
            <button class="sub-opt-btn active" data-val="30" onclick="setSubOption(30)">30s</button>
            <button class="sub-opt-btn" data-val="60" onclick="setSubOption(60)">60s</button>
            <button class="sub-opt-btn" data-val="120" onclick="setSubOption(120)">120s</button>
          \`;
          currentSubVal = 30;
        } else if (mode === 'words') {
          subLbl.textContent = 'Word Count:';
          subBar.innerHTML = \`
            <button class="sub-opt-btn" data-val="10" onclick="setSubOption(10)">10</button>
            <button class="sub-opt-btn active" data-val="25" onclick="setSubOption(25)">25</button>
            <button class="sub-opt-btn" data-val="50" onclick="setSubOption(50)">50</button>
            <button class="sub-opt-btn" data-val="100" onclick="setSubOption(100)">100</button>
          \`;
          currentSubVal = 25;
        } else {
          subLbl.textContent = 'Difficulty:';
          subBar.innerHTML = \`
            <button class="sub-opt-btn active" data-val="standard" onclick="setSubOption('standard')">Standard</button>
            <button class="sub-opt-btn" data-val="pro" onclick="setSubOption('pro')">Pro</button>
          \`;
          currentSubVal = 'standard';
        }

        resetGame();
      }

      function setSubOption(val) {
        currentSubVal = val;
        document.querySelectorAll('#subOptionButtons .sub-opt-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.val === String(val));
        });
        resetGame();
      }

      function drawSparkline() {
        const canvas = document.getElementById('wpmCanvas');
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h - 2);
        ctx.lineTo(w, h - 2);
        ctx.stroke();

        if (wpmHistory.length < 2) return;

        const maxVal = Math.max(...wpmHistory, 75);
        const pts = wpmHistory.map((val, idx) => ({
          x: (idx / (wpmHistory.length - 1)) * w,
          y: h - (val / maxVal) * (h - 10) - 4
        }));

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(163, 230, 53, 0.28)');
        grad.addColorStop(1, 'rgba(163, 230, 53, 0.0)');

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          const xc = (pts[i].x + pts[i - 1].x) / 2;
          const yc = (pts[i].y + pts[i - 1].y) / 2;
          ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          const xc = (pts[i].x + pts[i - 1].x) / 2;
          const yc = (pts[i].y + pts[i - 1].y) / 2;
          ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.strokeStyle = '#a3e635';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = 'rgba(163, 230, 53, 0.7)';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // AI Simulation Engine
      function toggleAutoSim() {
        if (isSimulating) {
          clearTimeout(simTimeout);
          isSimulating = false;
          const simBtn = document.getElementById('btnAutoSim');
          simBtn.innerHTML = '<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\"/></svg><span>Run Auto-Test</span>';
          simBtn.classList.remove('running');
          return;
        }

        resetGame();
        isSimulating = true;
        const simBtn = document.getElementById('btnAutoSim');
        simBtn.innerHTML = '<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"6\" y=\"6\" width=\"12\" height=\"12\" rx=\"2\"/></svg><span>Stop Simulation</span>';
        simBtn.classList.add('running');

        const speedWpm = parseInt(document.getElementById('simSpeedSelect').value, 10) || 75;
        const msPerChar = 60000 / (speedWpm * 5);

        function stepSimulation() {
          if (!isSimulating || currentWordIndex >= wordsData.length) {
            isSimulating = false;
            return;
          }

          const wObj = wordsData[currentWordIndex];
          const typed = typedWords[currentWordIndex];

          if (typed.length < wObj.chars.length) {
            const nextChar = wObj.chars[typed.length];
            handleInputCharacter(nextChar);
          } else {
            handleSpace();
          }

          // Natural human cadence variance
          const variance = msPerChar * (0.8 + Math.random() * 0.4);
          simTimeout = setTimeout(stepSimulation, variance);
        }

        stepSimulation();
      }

      // Focus Management
      function focusTypingInput() {
        const trap = document.getElementById('mobileInputTrap');
        if (trap) {
          trap.focus();
        }
        document.getElementById('focusPrompt').classList.remove('show');
        document.getElementById('focusBadge').textContent = 'Focused';
        document.getElementById('focusBadge').classList.remove('unfocused');
      }

      function handleBlur() {
        if (!isPlaying) {
          document.getElementById('focusPrompt').classList.add('show');
          document.getElementById('focusBadge').textContent = 'Tap to Focus';
          document.getElementById('focusBadge').classList.add('unfocused');
        }
      }

      // Keyboard Listeners
      window.addEventListener('keydown', (e) => {
        // Ignore if user is inside modal or doubt solver
        const t = e.target;
        if (t && (t.id === 'atiDoubtInput' || t.id === 'customTextInput')) {
          return;
        }

        if (e.key === 'Escape') {
          resetGame();
          return;
        }

        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
          e.preventDefault();
          toggleAutoSim();
          return;
        }

        if (isSimulating) return;

        if (e.key === 'Backspace') {
          e.preventDefault();
          lastKeyHandledAt = performance.now();
          handleBackspace(e.ctrlKey || e.metaKey);
          return;
        }

        if (e.key === ' ') {
          e.preventDefault();
          lastKeyHandledAt = performance.now();
          handleSpace();
          return;
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          lastKeyHandledAt = performance.now();
          handleInputCharacter('\\n');
          return;
        }

        if (e.key === 'Tab') {
          e.preventDefault();
          lastKeyHandledAt = performance.now();
          resetGame();
          return;
        }

        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          lastKeyHandledAt = performance.now();
          handleInputCharacter(e.key);
        }
      });

      // Mobile Soft Keyboard Input Trap
      const mobileInputTrap = document.getElementById('mobileInputTrap');
      if (mobileInputTrap) {
        mobileInputTrap.addEventListener('input', (e) => {
          if (isSimulating) return;
          if (performance.now() - lastKeyHandledAt < 40) {
            mobileInputTrap.value = '';
            return;
          }
          if (e.inputType === 'deleteContentBackward') {
            handleBackspace();
          } else if (e.data) {
            for (let i = 0; i < e.data.length; i++) {
              if (e.data[i] === ' ') handleSpace();
              else handleInputCharacter(e.data[i]);
            }
          }
          mobileInputTrap.value = '';
        });
        mobileInputTrap.addEventListener('blur', handleBlur);
      }

      // Custom Text Modal
      function openCustomTextModal() {
        document.getElementById('customTextModal').classList.add('show');
      }
      function closeCustomTextModal() {
        document.getElementById('customTextModal').classList.remove('show');
      }
      function insertCustomPreset(type) {
        if (type === 'code') {
          document.getElementById('customTextInput').value = 'const calculateTrajectory = (velocity, angle) => {\\n  const radians = angle * (Math.PI / 180);\\n  return { x: velocity * Math.cos(radians), y: velocity * Math.sin(radians) };\\n};';
        } else {
          document.getElementById('customTextInput').value = 'The greatest glory in living lies not in never falling, but in rising every time we fall.';
        }
      }
      function applyCustomText() {
        const val = document.getElementById('customTextInput').value.trim();
        if (val.length > 5) {
          rawText = val;
          setStudioMode('custom');
        }
        closeCustomTextModal();
      }

      // Initial Bootstrap
      buildVirtualKeyboard();
      setStudioMode('time');
      window.debugGetTyped = () => (typedWords && typedWords[currentWordIndex]) || '';

      // Typing Doubt Solver (Built-in Knowledge Engine)
      ;(function () {
        var TYPING_KB = [
          { keys: ['wpm', 'speed', 'fast', 'words per minute', 'net'], title: 'Net WPM vs Raw WPM', answer: '<strong>Net WPM vs Raw WPM:</strong> Net WPM = (Correct Characters ÷ 5) ÷ Elapsed Minutes. Mistakes penalize your net score. Raw CPM tracks every single keystroke. Most beginners average 30–40 WPM, while 75+ WPM is professional grade and 100+ WPM enters the top 1%.' },
          { keys: ['accuracy', 'accurate', 'mistake', 'error', 'penalty'], title: 'Accuracy Priority', answer: '<strong>Accuracy Rate:</strong> Computed as (Correct Keystrokes ÷ Total Keystrokes) &times; 100. Always train accuracy before pure velocity: making mistakes breaks muscle memory rhythm and streak multipliers. Target 96%+ accuracy consistently.' },
          { keys: ['home row', 'homerow', 'finger', 'asdf', 'jkl', 'bump'], title: 'Home Row Foundation', answer: '<strong>Home Row Technique:</strong> Rest your left fingers on A S D F and right fingers on J K L ;. The tactile bumps on F and J provide immediate tactile confirmation without needing to look down. Each finger owns its vertical lane; thumbs actuate Space.' },
          { keys: ['improve', 'better', 'practice', 'tips', 'learn', 'beginner', 'faster'], title: 'How To Accelerate', answer: '<strong>How To Improve:</strong> 1) Do 15 focused minutes every day rather than weekend cramming. 2) Never glance at the physical keyboard; trust muscle memory. 3) Practice with opposite-hand Shift. 4) Use our Weak Keys Drill to isolate error patterns.' },
          { keys: ['switch', 'mechanical', 'sound', 'blue', 'brown', 'red', 'panda', 'audio'], title: 'Mechanical Switch Acoustics', answer: '<strong>Switch Acoustics:</strong> <strong>Blue</strong> delivers crisp tactile clicks with high-frequency feedback. <strong>Brown</strong> offers creamy, dampened tactile thocks. <strong>Red</strong> provides smooth linear gliding. <strong>Holy Panda</strong> features a heavy tactile pop. Audio feedback anchors typing tempo.' },
          { keys: ['code', 'javascript', 'python', 'rust', 'syntax', 'programming'], title: 'Code Syntax Typing', answer: '<strong>Coding Practice:</strong> Typing code introduces dense symbols: braces {}, brackets [], arrows =>, and indentation. Practicing code syntax builds muscle memory for operator combos and speeds up programming significantly.' },
          { keys: ['ghost', 'pacer', 'race', 'ai', 'target'], title: 'Ghost AI Pacing', answer: '<strong>Ghost AI Pacer:</strong> The ghost runner races alongside you at a constant velocity (e.g. 60 or 100 WPM). Watching the distance delta helps you maintain a smooth, steady cadence without sudden surges.' },
          { keys: ['grade', 'rank', 's', 's+', 'a', 'b', 'c', 'score'], title: 'Grading Rubric', answer: '<strong>Grading Standards:</strong> <strong>S+</strong> (120+ WPM at 97%+ Acc), <strong>S</strong> (100+ WPM at 95%+ Acc), <strong>A</strong> (75+ WPM at 92%+ Acc), <strong>B</strong> (50+ WPM at 86%+ Acc), <strong>C</strong> (30+ WPM at 78%+ Acc). Strive for S-tier mastery!' },
          { keys: ['streak', 'nitro', 'combo', 'multiplier'], title: 'Nitro Combo Streaks', answer: '<strong>Nitro Streaks:</strong> Consecutive error-free keystrokes build your streak combo: 10+ unlocks x1.5 Nitro, 25+ unlocks x2.0 Overdrive, and 50+ ignites x3.0 Hyperdrive with terminal aura glow.' },
          { keys: ['ergonomics', 'posture', 'wrist', 'pain', 'relax'], title: 'Typing Ergonomics', answer: '<strong>Ergonomics & Posture:</strong> Keep your wrists straight and slightly floating above the desk. Relax your shoulders and keep your elbows at a 90-degree angle. Take short 30-second wrist release breaks every 20 minutes.' }
        ];

        var STOPWORDS = ['what', 'why', 'how', 'when', 'where', 'which', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'tell', 'me', 'about', 'the', 'a', 'an', 'of', 'in', 'on', 'and', 'or', 'for', 'to', 'it', 'its', 'please'];
        var CHIPS = ['How To Accelerate', 'Net WPM vs Raw WPM', 'Home Row Foundation', 'Mechanical Switch Acoustics', 'Code Syntax Typing', 'Grading Rubric'];

        function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' '); }
        function queryWords(q) {
          return norm(q).split(/\\s+/).filter(w => w.length > 2 && !STOPWORDS.includes(w));
        }
        function findAnswers(q) {
          var words = queryWords(q);
          if (!words.length) return [];
          var scored = TYPING_KB.map(entry => {
            var score = 0;
            entry.keys.forEach(k => {
              if (words.some(w => k.includes(w) || w.includes(k))) score += 2;
            });
            return { entry, score };
          }).filter(x => x.score > 0);
          scored.sort((a, b) => b.score - a.score);
          return scored.slice(0, 2).map(x => x.entry);
        }

        var input = document.getElementById('atiDoubtInput');
        var askBtn = document.getElementById('atiDoubtAsk');
        var answerBox = document.getElementById('atiDoubtAnswer');
        var chipsBox = document.getElementById('atiDoubtChips');

        if (!input || !askBtn || !answerBox) return;

        CHIPS.forEach(chipText => {
          var chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'doubt-chip';
          chip.textContent = chipText;
          chip.addEventListener('click', () => {
            input.value = chipText;
            renderAnswer(chipText);
          });
          chipsBox.appendChild(chip);
        });

        function renderAnswer(q) {
          var hits = findAnswers(q);
          answerBox.hidden = false;
          if (hits.length === 2) {
            answerBox.innerHTML = hits[0].answer + '<br><br><strong>Related Insights:</strong><br>' + hits[1].answer;
          } else if (hits.length === 1) {
            answerBox.innerHTML = hits[0].answer;
          } else {
            answerBox.innerHTML = '<strong>Study Notes Insight:</strong> For optimal results, aim for steady rhythm and 95%+ accuracy before pushing raw speed. Try asking about Home Row, WPM, Switch Acoustics, or Coding Syntax.';
          }
        }

        function askNow() {
          var q = input.value.trim();
          if (!q) {
            answerBox.hidden = false;
            answerBox.innerHTML = '<strong>Type your doubt above,</strong> or tap any suggested topic chip.';
            return;
          }
          renderAnswer(q);
        }

        askBtn.addEventListener('click', askNow);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') askNow();
          e.stopPropagation();
        });
      })();
    </script>

    <!-- Footer -->
    <footer class="sf">
      <div class="fi">
        <div class="fb"><span>CoL</span> &middot; Class Of Learners</div>
        <div class="fl">
          <a href="making">Making</a>
          <a href="privacy">Privacy</a>
          <a href="terms">Terms</a>
          <a href="feedback">Feedback</a>
          <a href="download">Downloads</a>
        </div>
        <div class="fc">&copy; 2026 Neel, Ansh, &amp; Aarush (Co‑Founders).</div>
      </div>
    </footer>

    <script>
      (function () {
        var pdd = document.getElementById('projDD');
        if (pdd) {
          var btn = pdd.querySelector('.dropdown-btn');
          if (btn) {
            btn.addEventListener('click', function (e) {
              e.stopPropagation();
              var isOpen = pdd.classList.toggle('active');
              btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
          }
        }
        document.addEventListener('click', function (e) {
          var d = document.getElementById('projDD');
          if (d && !d.contains(e.target)) {
            d.classList.remove('active');
            var b = d.querySelector('.dropdown-btn');
            if (b) b.setAttribute('aria-expanded', 'false');
          }
        });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            var d = document.getElementById('projDD');
            if (d && d.classList.contains('active')) {
              d.classList.remove('active');
              var b = d.querySelector('.dropdown-btn');
              if (b) b.setAttribute('aria-expanded', 'false');
            }
          }
        });

        var topNav = document.getElementById('topNav');
        if (topNav) {
          var ticking = false;
          window.addEventListener('scroll', function () {
            if (!ticking) {
              requestAnimationFrame(function () {
                topNav.classList.toggle('s', window.scrollY > 40);
                ticking = false;
              });
              ticking = true;
            }
          }, { passive: true });
        }
      })();

      function applyTheme(isLight) {
        document.documentElement.classList.toggle('lm', isLight);
        document.body.classList.toggle('lm', isLight);
        try {
          localStorage.setItem('theme', isLight ? 'light' : 'dark');
        } catch (_e) {}
        var tsck = document.getElementById('tsck');
        if (tsck) tsck.checked = !isLight;
        var lbl = document.getElementById('tLabel');
        if (lbl) lbl.textContent = isLight ? 'Light Mode' : 'Dark Mode';
      }
      window.applyTheme = applyTheme;
      window.hzToggle = function () {
        var isLight = !document.documentElement.classList.contains('lm');
        applyTheme(isLight);
      };
      window.toggleTheme = function (elem) {
        var isLight = elem ? !elem.checked : !document.documentElement.classList.contains('lm');
        applyTheme(isLight);
      };
    </script>
  </body>
</html>
`;

fs.writeFileSync(targetPath, htmlContent, 'utf8');
console.log('Successfully wrote remade ati-demo.html, size:', htmlContent.length);
