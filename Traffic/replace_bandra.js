const fs = require('fs');
const content = fs.readFileSync('course.js', 'utf8');

const start = content.indexOf('bandra_discipline');
console.log('Start:', start);

const rewardsStart = content.indexOf('rewards: { wallet: 25000, xp: 10000, badge: \'chase_master\'', start);
console.log('Rewards start:', rewardsStart);

const campaignEnd = rewardsStart + 70;
console.log('Campaign end:', campaignEnd);

const oldCampaign = content.substring(start, campaignEnd);

const newCampaign = `{
    id: 'bandra_discipline',
    moduleId: 3,
    name: 'Bandra Discipline',
    description: 'Lane discipline and overtaking etiquette on backroads',
    icon: '🛣️',
    color: '--signal',
    prerequisite: 'dadar_courtesy',
    storyIntro: 'Bandra Backroads — where the city forgets its rules. Your mentor, Senior Inspector Khan, has patrolled these gullies for 18 years. His mantra: "Lane mein chalo, signal do, overtake karo — warna challan pakka."',
    missions: [
      { 
        levelId: 11, 
        missionType: 'CHECKPOINT', 
        title: 'Single Lane Flow', 
        briefing: 'Narrow roads demand discipline. Stay in lane, signal early.',
        storyBeat: '06:15 AM. Hill Road — 3.5m wide, two-way, parked cars both sides. Auto-rickshaws, bikes, cycles, handcarts — all in one lane. Inspector Khan: "Yahan lane nahi hai, line hai. Us line pe chalo. Signal do, phir badlo." A parked car door opens suddenly.',
        objectives: {
          primary: 'Traverse 800m Hill Road maintaining single-file discipline. Zero lane departures.',
          secondary: ['Signal 3+ seconds before every move', 'Yield to 2+ oncoming vehicles in passing bays', 'Stop for 1 pedestrian at informal crossing'],
          bonus: 'Zero honking from oncoming traffic'
        },
        characterDialogue: [
          { speaker: 'Inspector Khan', line: '"Yahan do gaadi ek saath nahi chal sakti. Pehle tum, phir woh. Signal do, phir badlo."' },
          { speaker: 'Auto Driver (Raju)', line: '"Saheb, main side mein khada hoon. Aap nikal jao!"', context: 'Yielding in passing bay' },
          { speaker: 'Cyclist (Meera)', line: '"Uncle, main left mein hoon. Aap right se nikal jao."', context: 'Sharing narrow lane' }
        ],
        consequences: {
          success: 'Khan nods. "Theek hai. Line pe chalna seekh gaya." +1000₹, Lane Disciple progress',
          failure: 'Lane departure / no signal = "Lane tod diya! Challan." -₹1500, retry',
          perfect: 'Zero departures + 3 signals = "Single Lane Master" badge + Mission Token'
        },
        mumbaiContext: 'Hill Road: 1.2km, 3.5m wide, 2,400 vehicles/hr peak. 47% violations: lane departure. 12 passing bays.'
      },
      { 
        levelId: 12, 
        missionType: 'CHASE', 
        title: 'Overtaking Rules', 
        briefing: 'A reckless driver forces passes. Stop them before they cause a crash.',
        storyBeat: '07:30 AM. Linking Road — wider but chaotic. A white SUV (MH-01-XX-9999) forces overtakes on blind curves, crosses solid yellow line, nearly hits a scooter. Khan on radio: "Unit 3, intercept white SUV. Forced overtakes, solid line violations, near-miss scooter. Apprehend. No ramming — civilian density high."',
        objectives: {
          primary: 'Close to <10m. Perform PIT at <30 km/h on straight stretch. Zero civilian contact.',
          secondary: ['Maintain visual on SUV through 3 curves', 'Call out violations on radio (3+)', 'Clear intersection ahead of SUV'],
          bonus: 'Apprehend before Waterfield Road junction'
        },
        characterDialogue: [
          { speaker: 'Inspector Khan (radio)', line: '"Driver, usko pakadna hai — lekin scooter wale ko kuch na ho. Straight pe PIT. Curve pe nahi."' },
          { speaker: 'SUV Driver (muffled)', line: '"Kaun pakdega? Main Bandra ka raja hoon!"', context: 'Arrogant taunt' },
          { speaker: 'Scooter Rider (Anjali)', line: '"Thank you, officer! Woh mujhe udaake nikal gaya. Haath toot ta bach gaya."', context: 'At apprehension' }
        ],
        consequences: {
          success: 'SUV stopped. Driver: 5 prior challans, suspended license. Anjali gives thumbs up. "Officer, aaj bach gayi." +3000₹, Overtake Enforcer progress',
          failure: 'Civilian contact / escape = "Suspect at large. Review intercept policy." -₹2000, debrief',
          perfect: 'Sub-2 min + zero damage + called 3 violations = "Precision Interceptor" title + Mission Token'
        },
        mumbaiContext: 'Linking Road: 2.8km, 4 lanes but 2 used for parking. Overtaking violations: 1,800/month. 67% on curves/solid lines.'
      },
      { 
        levelId: 13, 
        missionType: 'ESCORT', 
        title: 'Bus Lane Honor', 
        briefing: 'Escort a BEST bus through its dedicated lane. Protect public transport.',
        storyBeat: '08:00 AM. SV Road — dedicated bus lane (red painted). BEST Route 213 — 42 passengers, running late. Khan: "Bus lane public transport ka haq hai. Car wale ghus ke baith jaate hain. Tum bus ke saath chalo, lane clear karo." A taxi cuts into the bus lane.',
        objectives: {
          primary: 'Escort Bus 213 through 2.5km bus lane. Zero vehicles in lane ahead of bus.',
          secondary: ['Push 3+ violators out of lane', 'Maintain 5m gap behind bus', 'Clear 2 intersections before bus arrives'],
          bonus: 'Bus arrives on schedule (8:22 AM)'
        },
        characterDialogue: [
          { speaker: 'Inspector Khan', line: '"Bus lane sirf bus ke liye. Car wala ghus gaya toh usko nikaalo. Public transport pehle."' },
          { speaker: 'Bus Driver (Santosh)', line: '"Officer sahab, aaj lane clear hai! Pehli baar time pe pohochenge."', context: 'Gratitude' },
          { speaker: 'Taxi Driver (cutting in)', line: '"Arre sir, passenger late hai! Ek minute hi toh chahiye!"', context: 'Violation' }
        ],
        consequences: {
          success: 'Bus arrives 3 min early. Santosh: "Officer sahab, aaj dil khush kar diya." +2500₹, Bus Lane Guardian progress',
          failure: 'Taxi not cleared / bus delayed = "Bus late hui. Commuter pareshaan." -₹2000, retry',
          perfect: 'Zero lane violators + on-time = "BEST Friend" title + 2 Mission Tokens'
        },
        mumbaiContext: 'SV Road bus lane: 4.2km, red paint, camera enforced. 350 BEST buses/day. Violators: 400/day. Fine: ₹500 + 3 points.'
      },
      { 
        levelId: 14, 
        missionType: 'SIDEWALK_PATROL', 
        title: 'Cycle Track', 
        briefing: 'Cyclists have their lane. Ensure cars respect the boundary.',
        storyBeat: '06:30 PM. Carter Road promenade — 2m green cycle track, separated by bollards. Cyclists: delivery boys, fitness riders, kids. Cars park over bollards, drift into track. Khan: "Cycle track cycle ke liye. Car wala ghus gaya toh challan. Cycle wala safe rehna chahiye."',
        objectives: {
          primary: 'Patrol 1.5km cycle track. Clear 4 parked cars. Guide 6 cyclists past obstructions.',
          secondary: ['Issue 4 challans (parking in cycle track)', 'Escort kids\' cycling group', 'Zero cyclist forced onto main road'],
          bonus: 'Cyclist group waves thanks'
        },
        characterDialogue: [
          { speaker: 'Inspector Khan', line: '"Cycle track — green paint, bollard, sign. Sab dikhta hai. Phir bhi car wala ghus jaata hai. Tum hatao."' },
          { speaker: 'Delivery Cyclist (Arjun)', line: '"Sir, main Zomato ke liye kaam karta hoon. Track clear hota hai toh time bachta hai!"', context: 'Livelihood angle' },
          { speaker: 'Car Owner (parked)', line: '"Arre sir, bas 5 minute ke liye tha! Challan mat karo!"', context: 'Violation' }
        ],
        consequences: {
          success: 'Track clear. Arjun: "Sir, aaj track saaf hai. Delivery fast hui!" +1800₹, Cycle Advocate progress',
          failure: 'Car not moved / cyclist forced out = "Cycle wala sadak pe aaya! Challan." -₹2000, retry',
          perfect: '4 challans + kids escorted = "Green Lane Guardian" badge + Mission Token'
        },
        mumbaiContext: 'Carter Road cycle track: 2.2km, 2m wide, 50 bollards/km. 1,200 cyclists/day. Parking violations: 180/day. Fine: ₹1000.'
      },
      { 
        levelId: 15, 
        missionType: 'EVASION', 
        title: 'Gully Escape', 
        briefing: 'Navigate the maze while avoiding aggressive local traffic.',
        storyBeat: '10:00 PM. Bandra gullies — 2m wide, dead ends, sharp turns, residents\' cars parked both sides. Local "gang" in modified autos/bikes rules the lanes. They box you in. Khan (radio): "Unit 7, gully mein phans gaye? Reverse mat karo. Niklo jahan se aaye the. Local log aggressive hain — unse ulo mat."',
        objectives: {
          primary: 'Escape 500m gully network in <4 mins. Zero collisions with locals.',
          secondary: ['Reverse only in 2 designated spots', 'Yield to 3+ oncoming locals', 'Exit via Pali Hill junction'],
          bonus: 'Zero horn use (stealth escape)'
        },
        characterDialogue: [
          { speaker: 'Inspector Khan (radio)', line: '"Driver, gully mein speed nahi, dimag chalao. Local log apna area jaante hain. Tum niklo, ulo mat."' },
          { speaker: 'Local Auto Leader (Bablu)', line: '"Ae, kahan ja raha? Yahan hamara raj chalta hai. Wapas ja!"', context: 'Intimidation' },
          { speaker: 'Resident (Auntie)', line: '"Beta, seedha jao, left pe nikal jao. Wahan police chowki hai."', context: 'Helpful local' }
        ],
        consequences: {
          success: 'Exited to Pali Hill. Chowki havaldar: "Aaya beta? Bablu waale aaj phir the." +2000₹, Gully Navigator progress',
          failure: 'Collision / cornered = "Local log pakad lenge. Challan kaat." -₹3000, mandatory retry',
          perfect: 'Sub-3 min + zero horn + zero contact = "Ghost of Gullies" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Bandra gullies: 15km network, avg 2.2m width. 3 local groups control zones. 40% non-resident vehicles enter daily. Police response: 8 min avg.'
      }
    ],
    rewards: { wallet: 25000, xp: 10000, badge: 'chase_master', unlock: 'module_4' }
  }`;

const newContent = content.substring(0, start) + newCampaign + content.substring(campaignEnd);
fs.writeFileSync('course.js', newContent);
console.log('Done! Replaced Bandra Discipline campaign.');