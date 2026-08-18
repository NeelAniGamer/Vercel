const fs = require('fs');
const content = fs.readFileSync('course.js', 'utf8');

const start = content.indexOf('bandra_discipline');
console.log('Start:', start);

const rewardsStart = content.indexOf('rewards: { wallet: 25000, xp: 10000, badge: \'chase_master\'', start);
console.log('Rewards start:', rewardsStart);

const campaignEnd = rewardsStart + 70;
console.log('Campaign end:', campaignEnd);

const oldCampaign = content.substring(start, campaignEnd);
console.log('--- Current campaign ---');
console.log(oldCampaign);