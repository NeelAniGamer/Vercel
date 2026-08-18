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

const oldCampaign = content.substring(start, campaignEnd);
console.log('--- Old campaign length ---', oldCampaign.length);

// New detailed campaign
const newCampaign = `{
    id: 'andheri_initiation',
    moduleId: 1,
    name: 'Andheri Initiation',
    description: 'Master the basics of Mumbai intersection navigation',
    icon: '🚦',
    color: '--ion',
    storyIntro: 'Welcome to Andheri Junction — Mumbai\\'s beating heart where every second counts. As a newly licensed driver, you\\'ll learn the rhythm of this city\\'s most chaotic intersection. Your instructor, Constable Patil, has seen it all. Listen to his voice in your head: "Beta, Mumbai mein signal sirf light nahi, zindagi ka sawaal hai."',
    missions: [
      { 
        levelId: 1, 
        missionType: 'CHECKPOINT', 
        title: 'Signal Basics', 
        briefing: 'Learn the rhythm of Mumbai signals. Green means go, but always check cross-traffic.',
        storyBeat: '06:47 AM. Andheri Station Road. The junction wakes up. Your first lesson: patience at the red light. A family of four crosses — father, mother, two kids with backpacks. Behind you, three autorickshaws honk in chorus. Constable Patil\\'s voice: "Solid white line ke peechhe ruk jao. Pedestrians pehle, tum baad mein."',
        objectives: {
          primary: 'Wait at red light behind stop line. Let all pedestrians cross fully.',
          secondary: ['Ignore honking pressure (0 violations)', 'Move only on solid green (not flashing)', 'Complete within 90 seconds'],
          bonus: 'Zero honking from NPCs behind you'
        },
        characterDialogue: [
          { speaker: 'Constable Patil', line: '"Beta, Mumbai mein signal sirf light nahi — zindagi ka sawaal hai. Red light kaatna matlab kisi ki maa ka intezaar karna."' },
          { speaker: 'NPC Auto Driver', line: '"Arre bhai, chalo na! Green hai na?"', context: 'Horn pressure' },
          { speaker: 'Mother crossing', line: '"Bachchon ka haath pakad ke chalo, gaadi rukne de."', context: 'Pedestrian voice' }
        ],
        consequences: {
          success: 'Patil nods. "Theek hai. Pehle subah, pehle signal — seekh liya." +500₹, Signal Master progress',
          failure: 'Challan issued. Patil sighs. "Dubara mat karna. Agla baar license jaayegi." -₹1000, retry required',
          perfect: 'Zero violations + no honking = "Perfect Run" bonus + Mission Token'
        },
        mumbaiContext: 'Andheri Station sees 600,000+ daily commuters. Peak hour: 8-10 AM, 6-8 PM. 12 signal phases. Average wait: 47 seconds.'
      },
      { 
        levelId: 2, 
        missionType: 'ESCORT', 
        title: 'Protected Left Turn', 
        briefing: 'Escort a senior officer through the protected left turn. Keep distance, match speed.',
        storyBeat: '07:15 AM. VIP movement. A white Ambassador with red beacon needs escort through the protected left turn lane. Your job: stay 15m behind, match speed exactly, clear intersections ahead. The officer\\'s aide briefs you: "Sir ka meeting hai Bandra Court mein. 8 baje pohochna hai. Koi bhi signal miss nahi hona chahiye."',
        objectives: {
          primary: 'Escort VIP vehicle through 3 protected left turns without gap >25m or <10m',
          secondary: ['Maintain 20-30 km/h steady', 'Clear each intersection 5 seconds before VIP arrives', 'Zero red-light violations'],
          bonus: 'VIP arrives exactly on time (7:58 AM arrival)'
        },
        characterDialogue: [
          { speaker: 'Officer\\'s Aide', line: '"Driver sahab, Sir ko time pe pohochana hai. Signal kaatna toh door, horn bhi mat bajana. Silent escort."' },
          { speaker: 'Constable Patil (radio)', line: '"Unit 1, intersection clear. Unit 2, hold traffic at SV Road. VIP a raha hai."' },
          { speaker: 'VIP (muffled)', line: '"Acche driver ho. Mumbai police ko aise hi log chahiye."', context: 'On successful completion' }
        ],
        consequences: {
          success: 'VIP arrives 2 minutes early. Aide hands you a card: "Mumbai Traffic Police - Honorary Escort." +2000₹, Escort Expert progress',
          failure: 'Gap too large/small = VIP delayed. "Driver sahab, agla baar koi aur le lenge." -₹500, retry',
          perfect: 'Zero gap violations + on-time = "Protocol Driver" title + Mission Token'
        },
        mumbaiContext: 'Protected left turns at Andheri: SV Road → Western Express Highway, Link Road → Mindspace. VIP movements: 200+/year. Average escort: 8 vehicles.'
      },
      { 
        levelId: 3, 
        missionType: 'CROSSING_GUARD', 
        title: 'Pedestrian Phase', 
        briefing: 'Guide school children across the zebra. Your stop sign is their safety.',
        storyBeat: '07:45 AM. School dismissal. St. Xavier\\'s High School gates open. 200+ children in navy uniforms flood the zebra. You\\'re the crossing guard today — fluorescent vest, handheld stop sign. Constable Patil: "Aaj tum guard ho. Ek bhi bachcha galat side se nikla toh zimmedari tumhari."',
        objectives: {
          primary: 'Guide 5 groups of children (8-12 each) across safely',
          secondary: ['Stop traffic with sign before each group enters', 'Zero children crossing outside zebra', 'Assist elderly crossing guard (Dada) with heavy bags'],
          bonus: 'Zero honking at your stop sign'
        },
        characterDialogue: [
          { speaker: 'Crossing Guard Dada', line: '"Beta, 20 saal se khada hoon yahan. Signal toh light hai, par bachchon ki zindagi hai. Tum sign uthao, main traffic sambhalta hoon."' },
          { speaker: 'Class 3 Student', line: '"Didi, hum line mein hain na? Teacher ne bola line tootni nahi chahiye."', context: 'Child holding rope' },
          { speaker: 'Impatient Biker', line: '"Arre uncle, kitna time lagega? Late ho raha hoon!"', context: 'Horn pressure at stop sign' }
        ],
        consequences: {
          success: 'All 5 groups cross safely. Dada pats your shoulder. "Achha kaam kiya beta. Kal bhi aana." +1500₹, Crossing Guard progress',
          failure: 'Child strays outside zebra = instant fail. "Bachcha galat jagah se nikla! Challan." -₹2000',
          perfect: 'Zero outside-zebra + assisted Dada = "Guardian of the Zebra" badge + Mission Token'
        },
        mumbaiContext: 'Andheri has 47 schools within 2km. Peak crossing: 7:30-8:00 AM, 1:30-2:00 PM. 3,400+ children daily. 23 crossing guards deployed.'
      },
      { 
        levelId: 4, 
        missionType: 'ESCORT', 
        title: 'Ambulance Run', 
        briefing: 'Clear the path for an emergency ambulance. Every second counts.',
        storyBeat: '08:30 AM. Code Red. 108 Ambulance — cardiac arrest, 54-year-old male, Andheri East. Golden hour: 8 minutes to Cooper Hospital. You\\'re the lead escort. Radio crackles: "Unit 1, clear SV Road junction. Unit 2, hold Link Road traffic. Ambulance ETA 3 minutes." Rain starts. Visibility drops.',
        objectives: {
          primary: 'Clear 4 intersections ahead of ambulance. Ambulance must not stop.',
          secondary: ['Zero pedestrians in ambulance path', 'Push double-parked autos off lane', 'Maintain 30 km/h minimum through green corridor'],
          bonus: 'Ambulance reaches hospital in <6 minutes'
        },
        characterDialogue: [
          { speaker: 'Ambulance Driver (radio)', line: '"108 Control, patient critical. BP dropping. Need green corridor NOW."' },
          { speaker: 'Constable Patil (radio)', line: '"Sab units — ambulance priority. Jo bhi raaste mein hai, hatao. Life pehle, traffic baad mein."' },
          { speaker: 'Bystander', line: '"Bhaiya, mera auto yahan khada tha... main hatata hoon!"', context: 'Cooperative civilian' }
        ],
        consequences: {
          success: 'Patient stabilized at Cooper. Doctor: "5 minute bach gaye." Ambulance driver salutes. "Driver sahab, aapne jaan bachayi." +3000₹, Emergency Hero progress',
          failure: 'Ambulance stops >10 sec = critical delay. "Patient lost pulse." -₹5000, mandatory retry with counseling',
          perfect: 'Sub-6 min + zero obstacles = "Golden Hour Guardian" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Mumbai 108 handles 1,200+ calls/day. Average response: 18 min. Green corridors reduce to 8 min. 194E violation: ₹10,000 + license suspension.'
      },
      { 
        levelId: 5, 
        missionType: 'CHASE', 
        title: 'Rush Hour Gauntlet', 
        briefing: 'A violator flees into dense traffic. Apprehend without causing pile-ups.',
        storyBeat: '09:15 AM. Peak rush. A black SUV jumps the red at Andheri junction, nearly hits a cyclist. You pursue. Radio: "Suspect vehicle MH-02-XY-4488. Reckless driving, hit-and-run cyclist. Apprehend. Do NOT ram — civilian traffic heavy." The SUV weaves through autos, bikes, buses. You must anticipate, not chase blindly.',
        objectives: {
          primary: 'Close to <8m distance and perform PIT maneuver at safe speed (<25 km/h)',
          secondary: ['Zero civilian collisions', 'Zero property damage', 'Maintain visual contact throughout'],
          bonus: 'Apprehend within 90 seconds'
        },
        characterDialogue: [
          { speaker: 'Constable Patil (radio)', line: '"Driver, usko pakadna hai — lekin kisi ko chot na lage. PIT maneuver sirf jab speed 25 ke neeche ho. Samjha?"' },
          { speaker: 'Suspect (muffled)', line: '"Nahi pakdega mujhe! Mumbai police... hah!"', context: 'Taunting over radio' },
          { speaker: 'Cyclist Victim', line: '"Thank you, officer. Woh mujhe udaake nikal gaya. Haath toot ta bach gaya."', context: 'At apprehension' }
        ],
        consequences: {
          success: 'SUV stopped. Driver arrested — 3 prior challans, no license. Cyclist gives thumbs up. "Officer, aaj aapne bacha liya." +4000₹, Chase Master progress',
          failure: 'Civilian collision / suspect escapes = "Suspect at large. Review pursuit policy." -₹2000, mandatory debrief',
          perfect: 'Sub-90s + zero damage + PIT at <20 km/h = "Precision Pursuit" title + 2 Mission Tokens'
        },
        mumbaiContext: 'Andheri peak: 9,000 vehicles/hour. Chase success rate: 34%. PIT maneuver authorized only for trained officers. 184 MV Act: ₹5,000 for reckless driving.'
      }
    ],
    rewards: { wallet: 15000, xp: 5000, badge: 'signal_master', unlock: 'module_2' }
  },`;

const newContent = content.substring(0, start) + newCampaign + content.substring(campaignEnd);
fs.writeFileSync('course.js', newContent);
console.log('Done! Replaced campaign.');