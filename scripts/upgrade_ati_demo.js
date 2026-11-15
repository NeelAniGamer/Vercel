const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ati-demo.html');
let content = fs.readFileSync(filePath, 'utf8');

// Ensure standard LF line endings for consistent pattern replacement
content = content.replace(/\r\n/g, '\n');

console.log('Original content length:', content.length);

// 1. Check if meta description includes free-type sandbox
if (!content.includes('free-type sandbox')) {
  content = content.replace(
    'Python and JavaScript code, and timed runs. Live speed scores, keyboard hints',
    'Python and JavaScript code, free-type sandbox tests, and timed runs. Live speed scores, key heatmap, switch sounds'
  );
}

// 2. Add styles for sandbox, heatmap, modifiers, replay, and XP rank if not present
const styleInsertTarget = '      /* Breadcrumbs */';
const newStyles = `      /* Live Heatmap Styling */
      .heatmap-on .key.heat-good {
        background: rgba(56, 189, 248, 0.22) !important;
        border-color: rgba(56, 189, 248, 0.6) !important;
        color: #38bdf8 !important;
        box-shadow: 0 0 10px rgba(56, 189, 248, 0.25) !important;
      }
      .heatmap-on .key.heat-warn {
        background: rgba(242, 184, 75, 0.22) !important;
        border-color: rgba(242, 184, 75, 0.6) !important;
        color: #f2b84b !important;
        box-shadow: 0 0 10px rgba(242, 184, 75, 0.25) !important;
      }
      .heatmap-on .key.heat-bad {
        background: rgba(244, 63, 94, 0.28) !important;
        border-color: rgba(244, 63, 94, 0.75) !important;
        color: #f43f5e !important;
        box-shadow: 0 0 12px rgba(244, 63, 94, 0.35) !important;
      }

      /* Challenge Modifiers */
      .sub-opt-btn.mod-active {
        background: var(--signal) !important;
        color: #070a14 !important;
        border-color: var(--signal) !important;
        font-weight: 700 !important;
      }
      .sub-opt-btn.mod-warn.mod-active {
        background: var(--rose) !important;
        color: #ffffff !important;
        border-color: var(--rose) !important;
      }
      .sub-opt-btn.mod-teal.mod-active {
        background: var(--ion) !important;
        color: #070a14 !important;
        border-color: var(--ion) !important;
      }

      /* Blind Mode Visual Silence */
      .blind-active .char.correct,
      .blind-active .char.wrong {
        color: var(--dim) !important;
        background: transparent !important;
        text-shadow: none !important;
      }

      /* Free-Type Sandbox */
      .sandbox-stage {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--r);
        padding: 20px;
        margin-bottom: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: var(--ati-shadow);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .sandbox-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      .sandbox-pad {
        width: 100%;
        min-height: 220px;
        background: var(--void2);
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 16px;
        color: var(--ink);
        font-family: var(--mono);
        font-size: 1.05rem;
        line-height: 1.7;
        resize: vertical;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.2s ease;
      }
      .sandbox-pad:focus {
        border-color: var(--ion);
      }
      .sandbox-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 12px;
      }
      .sandbox-metric-item {
        background: var(--void2);
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .sandbox-metric-val {
        font-family: var(--mono);
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--signal);
      }
      .sandbox-metric-lbl {
        font-size: 0.72rem;
        color: var(--dim);
        text-transform: uppercase;
        margin-top: 2px;
      }

      /* Local Rank Badge */
      .rank-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 20px;
        background: rgba(242, 184, 75, 0.12);
        border: 1px solid rgba(242, 184, 75, 0.35);
        color: var(--signal);
        font-family: var(--mono);
        font-size: 0.75rem;
        font-weight: 700;
      }
      .rank-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--signal);
        box-shadow: 0 0 6px var(--signal);
      }

      /* Keystroke Replay & Bigrams */
      .replay-box {
        margin-top: 16px;
        padding: 14px;
        background: var(--void2);
        border: 1px solid var(--line);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .replay-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        font-family: var(--mono);
        color: var(--dim);
      }
      .replay-controls {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .replay-scrubber {
        flex: 1;
        accent-color: var(--ion);
        cursor: pointer;
      }
      .replay-screen {
        min-height: 60px;
        max-height: 120px;
        overflow-y: auto;
        padding: 10px;
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        font-family: var(--mono);
        font-size: 0.9rem;
        color: var(--ink);
        white-space: pre-wrap;
        word-break: break-all;
      }
      .bigrams-box {
        margin-top: 12px;
        padding: 12px 14px;
        background: var(--void2);
        border: 1px solid var(--line);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .bigram-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .bigram-pill {
        padding: 4px 8px;
        border-radius: 6px;
        background: rgba(244, 63, 94, 0.12);
        border: 1px solid rgba(244, 63, 94, 0.35);
        color: var(--rose);
        font-family: var(--mono);
        font-size: 0.75rem;
        font-weight: 700;
      }
`;

if (!content.includes('/* Live Heatmap Styling */') && content.includes(styleInsertTarget)) {
  content = content.replace(styleInsertTarget, newStyles + '\n' + styleInsertTarget);
  console.log('Appended new styles.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Verification check complete.');
