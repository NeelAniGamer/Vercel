const fs = require('fs');

// 1. Modify Academy.html
let ac = fs.readFileSync('Academy.html', 'utf8');
// Remove 3D scripts
ac = ac.replace(/<script src="https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/three.js\/r128\/three.min.js"><\/script>/, '');
ac = ac.replace(/<script defer src="start.js"><\/script>/, '');
ac = ac.replace(/<script defer src="game_core.js"><\/script>/, '');
// Remove Game Canvas
ac = ac.replace(/<div id="gc"><\/div>/, '');
// Change title to reflect Hub
ac = ac.replace(/<title>Mumbai Traffic Hero Academy<\/title>/, '<title>Mumbai Traffic Hero Academy - Hub</title>');
fs.writeFileSync('Academy.html', ac);
console.log('Academy.html cleaned');

// 2. Modify Driving.html
let dr = fs.readFileSync('Driving.html', 'utf8');
dr = dr.replace(/<title>Mumbai Traffic Hero Academy<\/title>/, '<title>Mumbai Traffic Hero Academy - Simulation</title>');
// In Driving.html, we don't need the levels screen, but keeping the HTML structure is fine since UI handles hiding it.
fs.writeFileSync('Driving.html', dr);
console.log('Driving.html updated');

// 3. Modify ui.js
let ui = fs.readFileSync('ui.js', 'utf8');
// Change startLevel button injection
const slBtnOld = "game.startLevel()";
const slBtnNew = "ui.dispatchStart()"; // We will add dispatchStart to ui
if (!ui.includes('dispatchStart() {')) {
    const dispatchStartFunc = `
      dispatchStart() {
          const isDrivingPage = window.location.pathname.includes('Driving.html');
          if (!isDrivingPage) {
              // Redirect to Driving.html
              window.location.href = 'Driving.html?lv=' + this.cur.id + '&mode=' + this.curMode;
          } else {
              // Already on driving page
              if (window.game) window.game.startLevel();
          }
      },
      showLevels() {`;
    ui = ui.replace('showLevels() {', dispatchStartFunc);
}
// Update the start buttons to use dispatchStart
ui = ui.replace(/onclick="game\.startLevel\(\)"/g, 'onclick="ui.dispatchStart()"');
ui = ui.replace(/ui\.curMode='(.*?)'; ui\.cur\.vehMode = ui\.curMode; game\.startLevel\(\)/g, "ui.curMode='$1'; ui.cur.vehMode = ui.curMode; ui.dispatchStart()");
fs.writeFileSync('ui.js', ui);
console.log('ui.js patched');

// 4. Modify start.js for Driving.html URL parsing
let st = fs.readFileSync('start.js', 'utf8');
const parseUrlBlock = `
    const urlParams = new URLSearchParams(window.location.search);
    const lvId = urlParams.get('lv');
    const mode = urlParams.get('mode');
    if (lvId && mode) {
        // Wait for UI to load config, then auto-start
        const autoStart = setInterval(() => {
            if (ui.cfg && ui.cfg.levels) {
                clearInterval(autoStart);
                const lv = ui.cfg.levels.find(l => l.id == lvId);
                if (lv) {
                    ui.cur = lv;
                    ui.curMode = mode;
                    ui.cur.vehMode = mode;
                    game.startLevel();
                }
            }
        }, 100);
    }
`;
if (!st.includes('URLSearchParams')) {
    st = st.replace(/let game;\s*document\.addEventListener\('DOMContentLoaded', \(\) => {/g, "let game;\n" + parseUrlBlock + "\ndocument.addEventListener('DOMContentLoaded', () => {");
    fs.writeFileSync('start.js', st);
    console.log('start.js patched');
}

// 5. Modify game_core.js to redirect back
let gc = fs.readFileSync('game_core.js', 'utf8');
const redirectOld = `this._go('Level Failed');`;
const redirectNew = `
        const isDrivingPage = window.location.pathname.includes('Driving.html');
        if (isDrivingPage) {
            setTimeout(() => { window.location.href = 'Academy.html'; }, 3000);
        }
`;
if (!gc.includes('isDrivingPage')) {
    // In stopPlay(), if we quit, we go back.
    const stopPlayOld = `if(this.dom['ow']) this.dom['ow'].classList.remove('on'); }`;
    const stopPlayNew = `if(this.dom['ow']) this.dom['ow'].classList.remove('on'); 
        if (window.location.pathname.includes('Driving.html')) window.location.href = 'Academy.html';
    }`;
    gc = gc.replace(stopPlayOld, stopPlayNew);
    
    // In _go() (game over), we go back after displaying message.
    const goOld = `const scr = document.getElementById('screen-go');`;
    const goNew = `const scr = document.getElementById('screen-go');
      if (window.location.pathname.includes('Driving.html')) {
          setTimeout(() => { window.location.href = 'Academy.html'; }, 4000);
      }
    `;
    gc = gc.replace(goOld, goNew);
    fs.writeFileSync('game_core.js', gc);
    console.log('game_core.js patched');
}
