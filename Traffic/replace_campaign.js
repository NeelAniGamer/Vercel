const fs = require('fs');
const content = fs.readFileSync('course.js', 'utf8');

// Find the andheri_initiation campaign
const start = content.indexOf('andheri_initiation');
console.log('Start:', start);

// Find the end - the rewards line after this campaign
const rewardsStart = content.indexOf('rewards: { wallet: 15000, xp: 5000, badge: \'signal_master\'', start);
console.log('Rewards start:', rewardsStart);

const campaignEnd = rewardsStart + 70;
console.log('Campaign end:', campaignEnd);

console.log('--- Current campaign ---');
console.log(content.substring(start, campaignEnd));