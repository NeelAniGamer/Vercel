const fs = require('fs');

const getFunc = (code, funcName) => {
    let startIdx = code.indexOf(funcName);
    if (startIdx === -1) return null;
    let braceCount = 0;
    let endIdx = -1;
    let started = false;
    for (let i = startIdx; i < code.length; i++) {
        if (code[i] === '{') {
            braceCount++;
            started = true;
        } else if (code[i] === '}') {
            braceCount--;
        }
        if (started && braceCount === 0) {
            endIdx = i + 1;
            break;
        }
    }
    return code.substring(startIdx, endIdx);
};

const cur = fs.readFileSync('game_core.js', 'utf8');
const backup = fs.readFileSync('game_core.backup.js', 'utf8');

const curFunc = getFunc(cur, '_buildScene(mode)');
const backupFunc = getFunc(backup, '_buildScene(mode)');

fs.writeFileSync('cur_buildScene.js', curFunc || '');
fs.writeFileSync('backup_buildScene.js', backupFunc || '');

console.log('Saved both versions of _buildScene.');
