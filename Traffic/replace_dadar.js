const fs = require('fs');
const content = fs.readFileSync('course.js', 'utf8');

const start = content.indexOf('dadar_courtesy');
console.log('Start:', start);

const rewardsStart = content.indexOf('rewards: { wallet: 20000, xp: 7500, badge: \'crossing_guard\'', start);
console.log('Rewards start:', rewardsStart);

const campaignEnd = rewardsStart + 70;
console.log('Campaign end:', campaignEnd);

const oldCampaign = content.substring(start, campaignEnd);

const newCampaign = `{
    id: 'dadar_courtesy',
    moduleId: 2,
    name: 'Dadar Courtesy',
    description: 'Pedestrian-first driving in Mumbai\\'s busiest junction',
    icon: '🚶',
    color: '--em',
    prerequisite: 'andheri_initiation',
    storyIntro: 'Dadar Station — 7 lakh commuters daily. The junction where Mumbai\\'s veins meet. Your mentor, Traffic Havaldar Desai, has guarded these crossings for 25 years. His whistle cuts through chaos: "Dadar mein paidal chalne wala bhagwan hai. Gaadi wala uska sevak."',
    missions: [
      { 
        levelId: 6, 
        missionType: 'CHECKPOINT', 
        title: 'Zebra Yield', 
        briefing: 'Every zebra crossing is a promise. Stop, look, then proceed.',
        storyBeat: '07:30 AM. Dadar East. The station disgorges a human tide — office workers, students, vendors. You approach the main zebra at Kabutar Khana. Desai\\'s voice: "Zebra crossing promise hai — todna nahi. Ek pair bhi line ke bahar gaya toh challan." A grandmother with a walker steps onto the crossing. Behind you, a BEST bus hisses impatiently.',
        objectives: {
          primary: 'Stop fully at 3 zebra crossings. Let ALL pedestrians clear before moving.',
          secondary: ['Zero forward creep at red', 'Wait for slowest pedestrian (grandmother)', 'No honking at crossings'],
          bonus: 'Zero violations + assisted grandmother across'
        },
        characterDialogue: [
          { speaker: 'Havaldar Desai', line: '"Zebra pe pair rakhna — paap hai. Pair hatana — farz hai. Samjha?"' },
          { speaker: 'Grandmother (Dadi)', line: '"Beta, ghutne dard karte hain. Thoda time de do na."', context: 'Crossing slowly' },
          { speaker: 'BEST Bus Conductor', line: '"Driver sahab, chalo na! Schedule tight hai!"', context: 'Pressure from behind' }
        ],
        consequences: {
          success: 'Desai nods. "Theek hai. Aaj pehli baar kisi ne dadi ko intezaar karwaya." +800₹, Zebra Master progress',
          failure: 'Creep forward / honk = "Zebra tod diya! Challan kaat." -₹1500, retry',
          perfect: 'Zero creep + assisted Dadi = "Zebra Guardian" badge + Mission Token'
        },
        mumbaiContext: 'Dadar has 47 zebra crossings within 1km. 2.1 lakh pedestrians/hour peak. 34% violations are at zebras. Average wait: 23 seconds.'
      },
      { 
        levelId: 7, 
        missionType: 'CROSSING_GUARD', 
        title: 'School Children', 
        briefing: 'Morning rush at Dadar station. Hundreds of children cross here daily.',
        storyBeat: '07:45 AM. Dadar Station footbridge stairs empty onto the road. Don Bosco High School dismissal — 400+ boys in white shirts, navy shorts. They surge onto the zebra like a wave. You\\'re the crossing guard. Desai hands you the stop sign: "Aaj tum commander ho. Ek bhi bachcha galat side gaya, zimmedari tumhari."',
        objectives: {
          primary: 'Guide 6 groups (12-15 boys each) across the main zebra safely',
          secondary: ['Stop traffic BEFORE each group enters', 'Zero boys crossing outside zebra', 'Manage the "running late" group separately'],
          bonus: 'Zero honking during crossing'
        },
        characterDialogue: [
          { speaker: 'Havaldar Desai', line: '"Ye 400 bachche hain. Unke maa-baap ka bharosa tum pe hai. Ek bhi mistake maafi nahi."' },
          { speaker: 'Class 8 Boy (Rohan)', line: '"Sir, mujhe tuition ke late ho raha hai! Jaldi karo na!"', context: 'Running late group' },
          { speaker: 'Impatient Biker', line: '"Arre uncle, kitna time lagega? Office ke late ho raha!"', context: 'Horn pressure' }
        ],
        consequences: {
          success: 'All 6 groups cross. Desai: "Achha kiya beta. Kal bhi aana." +1200₹, Crossing Guard progress',
          failure: 'Boy outside zebra = "Bachcha galat jagah! Challan." -₹2500, mandatory retry',
          perfect: 'Zero outside + managed late group = "School Captain" title + Mission Token'
        },
        mumbaiContext: 'Dadar has 23 schools within 500m. 12,000+ children cross daily. 3 dedicated crossing guards. Peak: 7:15-7:45 AM, 1:30-2:00 PM.'
      },
      { 
        levelId: 8, 
        missionType: 'SIDEWALK_PATROL', 
        title: 'Senior Citizens', 
        briefing: 'Elders move slowly. Give them time. Report bikes on sidewalks.',
        storyBeat: '10:00 AM. Dadar West. Shivaji Park walkers — 70+ seniors in tracksuits, some with canes, one in wheelchair. They cross at the slow zebra near the park gate. Desai on radio: "Sidewalk patrol duty. Bike pe pair rakhne wala challan. Senior ko intezaar karwao." A biker zooms past on the footpath.',
        objectives: {
          primary: 'Assist 4 seniors across. Report 3 bikes-on-sidewalk violations.',
          secondary: ['Walk at senior\\'s pace (zero rushing)', 'Guide wheelchair user via ramp', 'Stop bikers verbally (no physical)'],
          bonus: 'Zero senior complaints'
        },
        characterDialogue: [
          { speaker: 'Havaldar Desai (radio)', line: '"Unit 4, sidewalk pe bike dekho toh challan. Senior ko haath deke cross karwao."' },
          { speaker: 'Senior (Mr. Iyer, 78)', line: '"Beta, pehle pair nahi uthte the. Ab wheelchair hai. Tum jaise log chahiye."', context: 'Gratitude' },
          { speaker: 'Biker on Footpath', line: '"Arre sir, shortcut hi toh hai! Challan mat karo!"', context: 'Violation' }
        ],
        consequences: {
          success: 'All 4 seniors cross. Mr. Iyer blesses: "Khush raho beta." +1000₹, Sidewalk Sentinel progress',
          failure: 'Rushed senior / missed bike = "Senior girta toh? Bike bhaagta toh?" -₹2000',
          perfect: 'Zero rushing + 3 bikes caught = "Footpath Rakshak" badge + Mission Token'
        },
        mumbaiContext: 'Dadar seniors: 45,000+ (12% pop). 67% walk daily. Bike-on-footpath: 1,200 challans/month. 14 senior-friendly crossings.'
      },
      { 
        levelId: 9, 
        missionType: 'EVASION', 
        title: 'Hawker Maze', 
        briefing: 'Navigate the vendor zone without hitting stalls. Patience over speed.',
        storyBeat: '06:30 PM. Dadar Phool Market — monsoon evening. Flower vendors, fruit sellers, vada pav stalls spill onto the road. The lane is 3 meters wide. You\\'re in an auto. Desai: "Yahan speed matlab maut. Dheere jao, horn mat bajao, stall mat todo." A vendor\\'s cart wheel is inches from your path.',
        objectives: {
          primary: 'Traverse 300m vendor lane in <3 mins. Zero stall contact. Zero honking.',
          secondary: ['Speed <8 km/h throughout', 'Yield to 5+ pushing carts', 'Stop for 2 elderly vendors'],
          bonus: 'Vendor offers free vada pav'
        },
        characterDialogue: [
          { speaker: 'Havaldar Desai', line: '"Phool wale, phal wale, vada pav wale — sab ka haq hai road pe. Tum mehmaan ho."' },
          { speaker: 'Flower Vendor (Phoolwali)', line: '"Saheb, genda phool le lo na! Aaj mangalwar hai, bikri achhi hogi."', context: 'Sales pitch mid-lane' },
          { speaker: 'Vada Pav Wala', line: '"Arre driver babu, ek vada pav kha lo! Thande mein maza aayega."', context: 'Free offer on perfect run' }
        ],
        consequences: {
          success: 'Exited clean. Vendor waves: "Aaj ke baad aana, discount dunga." +900₹, Hawker Whisperer progress',
          failure: 'Stall hit / honk = "Stall toot gaya! Nuksan kaun bharega?" -₹1500, retry',
          perfect: 'Zero contact + zero honk + bought vada pav = "Market Mitra" title + Mission Token'
        },
        mumbaiContext: 'Dadar Phool Market: 300+ stalls, 15,000 daily visitors. Lane width: 2.5-3.5m. Peak: 6-9 PM. Zero vehicle policy ideal.'
      },
      { 
        levelId: 10, 
        missionType: 'CARGO', 
        title: 'Monsoon Delivery', 
        briefing: 'Deliver medical supplies through flooded streets. Keep cargo dry.',
        storyBeat: '08:00 PM. July 26th anniversary. Dadar TT Circle flooded — 2 feet water. KEM Hospital needs blood bags, saline, medicines. You\\'re in a tempo. Desai: "Ambulance nahi ja paayegi. Tum jaoge. Cargo: 50 blood units, 200 saline, life-saving drugs. Paani gadi ke andar gaya toh sab kharab."',
        objectives: {
          primary: 'Deliver 100% medical cargo to KEM Hospital. Cargo integrity >95%.',
          secondary: ['Water depth <1.5 ft (avoid deeper)', 'Zero sudden braking (blood bags rupture)', 'Time <15 mins'],
          bonus: 'Doctor meets you: "Lives saved tonight."'
        },
        characterDialogue: [
          { speaker: 'Havaldar Desai', line: '"26 July yaad hai na? 2005. Dadar doob gaya tha. Aaj tum usi raaste se jaa rahe ho — lekin cargo bacha ke."' },
          { speaker: 'KEM Doctor (Dr. Patil)', line: '"Driver sahab, blood units bach gaye toh 3 surgeries ho payengi. Shukriya."', context: 'On delivery' },
          { speaker: 'Tempo Helper', line: '"Bhaiya, paani engine tak aa gaya! Dheere chala!"', context: 'Water rising' }
        ],
        consequences: {
          success: 'All cargo delivered. Dr. Patil: "Aaj 3 jaan bach gayi." +2000₹, Monsoon Hero progress',
          failure: 'Cargo <95% / stalled = "Dawai kharab ho gayi. Operation cancel." -₹5000, mandatory retry',
          perfect: '100% integrity + <12 mins = "Monsoon Lifeline" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Dadar floods: 2005 (944mm/24h), 2017, 2019. KEM handles 1.8M patients/yr. Blood demand: 500 units/day. TT Circle: chronic waterlogging.'
      }
    ],
    rewards: { wallet: 20000, xp: 7500, badge: 'crossing_guard', unlock: 'module_3' }
  }`;

const newContent = content.substring(0, start) + newCampaign + content.substring(campaignEnd);
fs.writeFileSync('course.js', newContent);
console.log('Done! Replaced Dadar Courtesy campaign.');