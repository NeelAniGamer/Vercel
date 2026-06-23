const fs = require('fs');

const code = fs.readFileSync('c:/Users/neelg/OneDrive/Desktop/Current Projects/Traffic Project/Traffic - Major Updates/Mumbai Traffic.html', 'utf-8');

const mapConfigMatch = code.match(/_getMapConfig\s*\(\s*lvId\s*\)\s*\{([\s\S]*?)return\s+M\[lvId\]\s*\|\|\s*M\[1\];/);
const mapLogic = mapConfigMatch[1];

function testGetMapConfig(lvId) {
    // Evaluate the logic inside _getMapConfig
    // M is already declared inside mapLogic.
    const func = new Function('lvId', mapLogic + ' return M[lvId] || M[1];');
    return func(lvId);
}

try {
    const map15 = testGetMapConfig(15);
    console.log("Map 15 Config Output:");
    console.log("Is 50km flag:", map15.is50km);
    console.log("Road Count:", map15.roads ? map15.roads.length : 0);
    console.log("Intersection Count:", map15.ints ? map15.ints.length : 0);
    
    // Verify bounds
    let minX = 0, maxX = 0, minZ = 0, maxZ = 0;
    for(let r of map15.roads) {
        if(r.x !== undefined) {
            if(r.x < minX) minX = r.x;
            if(r.x > maxX) maxX = r.x;
        }
        if(r.z !== undefined) {
            if(r.z < minZ) minZ = r.z;
            if(r.z > maxZ) maxZ = r.z;
        }
    }
    console.log(`Bounds X: ${minX} to ${maxX}`);
    console.log(`Bounds Z: ${minZ} to ${maxZ}`);
    
    if (maxX - minX >= 50000 && maxZ - minZ >= 50000) {
        console.log("VERIFIED: Map is at least 50km in diameter!");
    } else {
        console.log("FAILED: Map is smaller than 50km.");
    }
} catch (e) {
    console.error("Error evaluating map config:", e);
}
