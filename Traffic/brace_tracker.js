const fs = require('fs');
const lines = fs.readFileSync('game_core.js', 'utf8').split('\n');
let stack = [];
let inBlockComment = false;
for (let i = 0; i < 3218; i++) {
  let line = lines[i];
  let inString = false, stringChar = '';
  let inLineComment = false;
  
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    const next = line[j+1];
    
    if (inBlockComment) {
      if (c === '*' && next === '/') { inBlockComment = false; j++; }
      continue;
    }
    if (inLineComment) continue;
    if (inString) {
      if (c === '\\') { j++; continue; }
      if (c === stringChar) { inString = false; }
      continue;
    }
    
    if (c === '/' && next === '/') { inLineComment = true; j++; continue; }
    if (c === '/' && next === '*') { inBlockComment = true; j++; continue; }
    if (c === '"' || c === "'" || c === '`') { inString = true; stringChar = c; continue; }
    
    if (c === '{') { stack.push(i + 1); }
    if (c === '}') { stack.pop(); }
  }
}
console.log('Unclosed braces opened at lines:', stack);
