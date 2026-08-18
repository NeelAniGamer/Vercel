const fs = require('fs');
const content = fs.readFileSync('course.js', 'utf8');

const start = content.indexOf('dadar_courtesy');
console.log('Start:', start);

const rewardsStart = content.indexOf('rewards: { wallet: 20000, xp: 7500, badge: \'crossing_guard\'', start);
console.log('Rewards start:', rewardsStart);

const campaignEnd = rewardsStart + 70;
console.log('Campaign end:', campaignEnd);

const oldCampaign = content.substring(start, campaignEnd);
console.log('--- Current campaign ---');
console.log(oldCampaign);