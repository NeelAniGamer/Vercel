const fs = require('fs');
const content = fs.readFileSync('course.js', 'utf8');

const start = content.indexOf('juhu_speed');
console.log('Start:', start);

const rewardsStart = content.indexOf('rewards: { wallet: 30000, xp: 12500, badge: \'parking_pro\'', start);
console.log('Rewards start:', rewardsStart);

const campaignEnd = rewardsStart + 70;
console.log('Campaign end:', campaignEnd);

const oldCampaign = content.substring(start, campaignEnd);

const newCampaign = `{
    id: 'juhu_speed',
    moduleId: 4,
    name: 'Juhu Speed Control',
    description: 'Coastal cruising with strict speed management',
    icon: '🌊',
    color: '--plasma',
    prerequisite: 'bandra_discipline',
    storyIntro: 'Juhu Beach — where Mumbai comes to breathe. The coastal road stretches 5km, and every driver thinks it\\'s a race track. Your mentor, Coastal PSI Meera Deshmukh, has seen it all: "Saheb, yeh beach road hai, runway nahi. 40 km/h — ek km bhi zyada nahi."',
    missions: [
      { 
        levelId: 16, 
        missionType: 'TIME_TRIAL', 
        title: 'Coastal 40', 
        briefing: 'Maintain exactly 40 km/h. Ghost car shows perfect pace.',
        storyBeat: '05:45 AM. Juhu Tara Road — empty, misty, the Arabian Sea glimmering left. A ghost car (translucent blue) appears ahead, holding exactly 40 km/h. PSI Deshmukh on radio: "Unit 12, match the ghost. 40.0 — nahi 40.5, nahi 39.8. 40.0." A jogger steps onto the road shoulder.',
        objectives: {
          primary: 'Complete 3km maintaining 40.0 ± 0.5 km/h. Zero speed violations.',
          secondary: ['Follow ghost car within 20m', 'Brake for jogger at 800m mark', 'Zero honking'],
          bonus: 'Perfect ghost match (±0.2 km/h entire route)'
        },
        characterDialogue: [
          { speaker: 'PSI Deshmukh', line: '"40 km/h — yeh suggestion nahi, kanoon hai. Ghost car tumhara guru hai. Uske saath chalo."' },
          { speaker: 'Morning Jogger (Rohit)', line: '"Madam, main yahan 10 saal se daud raha hoon. Gaadi wale 60 pe nikal jaate hain. Aaj koi 40 pe chala — shukriya!"', context: 'At 800m mark' ],
          { speaker: 'Ghost Car (AI)', line: '"Speed: 40.0 km/h. Variance: 0.0%. Keep it steady."', context: 'HUD display' }
        ],
        consequences: {
          success: 'Deshmukh: "Theek hai. Ghost car se seekha — speed control haath mein hai." +1200₹, Speed Disciple progress',
          failure: 'Over 40.5 / under 39.5 = "Speed limit tod diya! Challan." -₹1500, retry',
          perfect: '±0.2 km/h entire route = "Coastal Cruise Control" title + Mission Token'
        },
        mumbaiContext: 'Juhu Tara Road: 5km, 40 km/h limit. 2,800 vehicles/hr peak. Speed violations: 42% (highest in Mumbai). Ghost car system: 97% compliance rate.'
      },
      { 
        levelId: 17, 
        missionType: 'PARKING', 
        title: 'Beach Parallel', 
        briefing: 'Parallel park between two cars. Tourists watch — no pressure.',
        storyBeat: '11:00 AM. Juhu Beach main stretch — tourists, families, ice cream vendors. You need to parallel park between a white Innova (tourist family) and a black Mercedes (local politician). Deshmukh: "Saheb, yeh parallel parking hai — Mumbai ka sabse bada test. Tourists dekh rahe hain, press bhi. Galat kiya toh viral ho jaayega."',
        objectives: {
          primary: 'Parallel park in 1 attempt. Centered within 15cm. Angle <2 degrees.',
          secondary: ['Complete in <90 seconds', 'Zero contact with other cars', 'Hazard lights on during maneuver'],
          bonus: 'Tourist family claps'
        },
        characterDialogue: [
          { speaker: 'PSI Deshmukh', line: '"Parallel parking — mirror, signal, reverse, straighten. Ek baar mein. Public dekh rahi hai."' },
          { speaker: 'Tourist Kid (Aryan, 8)', line: '"Mummy, woh uncle kitna acha park kar raha hai! Maine kabhi aisa nahi dekha!"', context: 'Watching from sidewalk' ],
          { speaker: 'Mercedes Owner (Mr. Shah)', line: '"Officer, meri gaadi scratch mat karna! Yeh imported paint hai."', context: 'Anxious car owner' }
        ],
        consequences: {
          success: 'Perfect center. Tourist family claps. Aryan: "Wah! Uncle ko medal do!" +1500₹, Parking Pro progress',
          failure: 'Touch other car / >2 attempts = "Scratch lag gayi! Challan + repair bill." -₹3000, retry',
          perfect: '<60s + centered + claps = "Parallel Perfectionist" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Juhu Beach parking: 1,200 spots, 94% occupancy weekends. Parallel parking test pass rate: 34%. Viral parking videos: 2.3M views avg.'
      },
      { 
        levelId: 18, 
        missionType: 'CARGO', 
        title: 'Sunset Fragile', 
        briefing: 'Transport wedding cake to Juhu. Zero sudden movements.',
        storyBeat: '05:30 PM. Golden hour. Juhu Chowpatty — crowds, hawkers, sunset photographers. You\\'re in a tempo carrying a 3-tier wedding cake (fondant, delicate flowers, 45°C melt risk). Deshmukh: "Saheb, yeh cake 45,000 ka hai. Shaam 7 baje shaadi hai. Ek bhi jhatka laga toh fondant fat jayega. Slow jao, brake maaro mat."',
        objectives: {
          primary: 'Deliver cake 100% intact (cargo integrity >98%). Zero hard braking.',
          secondary: ['Max lateral G <0.3', 'Max longitudinal G <0.4', 'Navigate 3 crowded chowk sections at <15 km/h'],
          bonus: 'Bride\\'s mother meets you: "Aapne khushiyan bacha li!"'
        },
        characterDialogue: [
          { speaker: 'PSI Deshmukh', line: '"Cake 45,000 ka. Shaadi 7 baje. Fondant 45 pe pighalta hai. Tumhara brake pedal — feather touch!"' },
          { speaker: 'Bakery Owner (Patel)', line: '"Saheb, 3-tier hai — vanilla, chocolate, strawberry. Flowers sugar ke hain. Jara sa bhi hilne pe gir jaayenge."', context: 'Loading' ],
          { speaker: 'Bride\\'s Mother (Mrs. Iyer)', line: '"Beta, tumne hamari beti ki shaadi bacha li. Bhagwan tumhe khush rakhe."', context: 'On perfect delivery' }
        ],
        consequences: {
          success: 'Cake perfect. Mrs. Iyer blesses. Patel: "Officer sahab, aapne business bacha liya." +2500₹, Fragile Handler progress',
          failure: 'Cake <98% / hard brake = "Fondant fat gaya! Shaadi kharab!" -₹5000, mandatory retry',
          perfect: '>99.5% + zero hard inputs = "Gentle Giant" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Juhu wedding deliveries: 150+/weekend. Cake damage rate: 12%. Average claim: ₹18,000. Fondant melt point: 45°C. Mumbai avg temp: 32°C.'
      },
      { 
        levelId: 19, 
        missionType: 'SCHOOL_PATROL', 
        title: 'Jogger Watch', 
        briefing: 'Morning joggers share the road. Enforce 30 km/h zone.',
        storyBeat: '06:00 AM. Juhu Beach promenade — 400+ joggers, walkers, yoga groups. A speeding biker (60 km/h) weaves through. Deshmukh: "Saheb, yeh 30 km/h zone hai. Jogger wala track road pe nahi, paas mein hai. Lekin biker track pe kyun nahi? Uske challan tum karo."',
        objectives: {
          primary: 'Catch 3 speeders in 30 km/h zone. Issue challans. Zero jogger incidents.',
          secondary: ['Maintain 30 km/h exactly while patrolling', 'Guide 2 elderly walkers across', 'Escort kids\\' running group'],
          bonus: 'Joggers\\' group chants "Thank you Police!"'
        },
        characterDialogue: [
          { speaker: 'PSI Deshmukh', line: '"Jogger track bana hai, lekin log road pe chalete hain. 30 km/h — yeh limit hai, target nahi."' },
          { speaker: 'Morning Jogger (Priya)', line: '"Madam, kal ek biker 60 pe nikal gaya — mere paas se. Dil dhakdhakane laga. Aaj aap ho toh safe lag raha hai."', context: 'Gratitude' ],
          { speaker: 'Speeding Biker (Rahul)', line: '"Madam, main late tha gym ke liye! Challan mat karo, membership fees jaati hai!"', context: 'Violation' }
        ],
        consequences: {
          success: '3 challans issued. Joggers wave. Priya: "Madam, aap ho toh hum safe hain." +1800₹, Jogger Guardian progress',
          failure: 'Missed speeder / jogger hit = "Jogger gir gaya! Challan + FIR." -₹4000, retry',
          perfect: '3 challans + escorted kids + zero jogger close calls = "Dawn Patrol" badge + Mission Token'
        },
        mumbaiContext: 'Juhu Beach joggers: 5,000+ daily (5-8 AM). 30 km/h zone: 3.5km. Biker violations: 200/day. Jogger accidents: 14/year (mostly bikers).'
      },
      { 
        levelId: 20, 
        missionType: 'EVASION', 
        title: 'Windy Bridge', 
        briefing: 'Cross the bridge in high winds. Gusts push you — compensate.',
        storyBeat: '07:00 PM. Monsoon evening. Juhu-Versova Bridge — 300m over creek, wind 45 km/h crosswind. Trucks sway. Deshmukh: "Saheb, bridge pe hawa alag hi chalti hai. Truck hilega, tum bhi hiloge. Steering pakad ke rakho. Gust aaye toh counter-steer — darr ke nahi, dimaag se."',
        objectives: {
          primary: 'Cross 300m bridge in <60s. Zero lane departures. Max sway <0.5m.',
          secondary: ['Counter-steer for 5+ gusts', 'Maintain 35-40 km/h steady', 'Give truck 3m+ lateral gap'],
          bonus: 'Truck driver flashes thanks'
        ],
        characterDialogue: [
          { speaker: 'PSI Deshmukh', line: '"Hawa se daro mat. Steering pakdo, counter-steer karo. Truck se door raho — uska sway tumhaara nahi."' },
          { speaker: 'Truck Driver (Harish)', line: '"Madam, main 20 saal se chal raha hoon. Aaj pehli baar koi car waala itna gap diya. Shukriya!"', context: 'At bridge end' ],
          { speaker: 'Wind Gust (Audio)', line: '*WHOOOOSH* — 52 km/h crosswind hits!', context: 'Environmental cue' }
        ],
        consequences: {
          success: 'Crossed steady. Harish flashes high beams. "Safe driving, Madam!" +2000₹, Wind Master progress',
          failure: 'Lane departure / sway >1m = "Bridge pe control kho diya! Challan." -₹3000, retry',
          perfect: 'Zero sway + truck thanks = "Bridge Master" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Juhu-Versova Bridge: 300m, creek crossing. Monsoon crosswind: 40-60 km/h. Truck sway: 1.2m avg. Bridge accidents: 8/year (mostly wind-related).'
      }
    ],
    rewards: { wallet: 30000, xp: 12500, badge: 'parking_pro', unlock: 'module_5' }
  }`;

const newContent = content.substring(0, start) + newCampaign + content.substring(campaignEnd);
fs.writeFileSync('course.js', newContent);
console.log('Done! Replaced Juhu Speed Control campaign.');