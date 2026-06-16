const fs = require('fs');
const path = require('path');

const files = [
    'feedback.html', 'terms.html'
];

for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find all <footer ... > ... </footer> tags
    const footerRegex = /<footer[^>]*>[\s\S]*?<\/footer>/gi;
    let match;
    let count = 0;
    let lastIndex = -1;
    let newContent = '';
    
    while ((match = footerRegex.exec(content)) !== null) {
        count++;
        if (count === 1) {
            newContent += content.substring(lastIndex === -1 ? 0 : lastIndex, footerRegex.lastIndex);
            lastIndex = footerRegex.lastIndex;
        } else {
            // Skip this one by just appending the space between previous and this one
            newContent += content.substring(lastIndex, match.index);
            lastIndex = footerRegex.lastIndex;
        }
    }
    
    newContent += content.substring(lastIndex);
    
    // Write back
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed footers in ${file}`);
}
