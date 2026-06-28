const fs = require('fs');
const path = require('path');

const levelsDir = path.join(__dirname, 'levels');
for (let i = 1; i <= 20; i++) {
  const filePath = path.join(levelsDir, `level${i}.js`);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  // Regex to match "name": "Some Title - Location"
  // and replace it with "name": "Some Title"
  let newContent = content.replace(/"name"\s*:\s*"([^"]+?)\s*-\s*[a-zA-Z\s]+"/, '"name": "$1"');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated level ${i}`);
  }
}
