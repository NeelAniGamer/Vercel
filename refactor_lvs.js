const fs = require('fs');
let content = fs.readFileSync('lvs.js', 'utf8');

const badgesIndex = content.indexOf('const BADGES =');
let lvsSection = content.substring(0, badgesIndex);
const restOfFile = content.substring(badgesIndex);

lvsSection = lvsSection.replace('const LVS =', 'global.LVS =');

try {
  eval(lvsSection);
  
  global.LVS.forEach(lv => {
    lv.modes = ['car', 'pedestrian'];
    if (lv.id === 3 || lv.id === 12) lv.modes.push('bike');
    
    let originalQuiz = lv.quiz || [];
    lv.quiz = {
      car: JSON.parse(JSON.stringify(originalQuiz)),
      pedestrian: JSON.parse(JSON.stringify(originalQuiz)),
      final: JSON.parse(JSON.stringify(originalQuiz))
    };
    if (lv.modes.includes('bike')) lv.quiz.bike = JSON.parse(JSON.stringify(originalQuiz));
    
    delete lv.mode;
  });
  
  const newLVSStr = 'const LVS = ' + JSON.stringify(global.LVS, null, 2) + ';\n\n    ';
  const finalContent = newLVSStr + restOfFile;
  
  fs.writeFileSync('lvs.js', finalContent, 'utf8');
  console.log("Refactoring complete.");
} catch (e) {
  console.error("Failed:", e);
}
