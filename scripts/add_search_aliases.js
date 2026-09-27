// Adds the words people actually type to the careers they mean.
//
// Problem this solves: the BLS titles are formal and American. A student in
// India searching "air hostess" got nothing, because the occupation was filed
// under "Flight Attendants" with the aliases "Airline Flight Attendant" and
// "Flight Steward" - none of which contain the word they typed.
//
// Every entry below maps a real search term onto a career that already exists.
// Nothing here invents an occupation or a statistic; it only makes existing
// careers findable by their common names, including Indian usage and
// colloquial English. Roles with no existing home (gig delivery, tailoring,
// traditional medicine and so on) become new careers - see scripts/new_careers.js.
//
// The map is keyed by career TITLE and resolved to an id at run time. Writing
// it against ids meant hand-copying 90 slugs, and roughly a quarter of them were
// wrong before the validation below caught it. Titles are readable and stable.
//
// A few BLS occupations no longer exist as separate profiles; the Bureau
// folded them into broader ones, so those terms are attached to the parent:
//   Commercial & Industrial Builders      -> Construction Managers
//   Heat Treatment/Plating Machinists    -> Metal and Plastic Machine Workers
//   Carpet/Floor/Tile Installers         -> Flooring Installers and Tile and Stone Setters
//   Commercial & Industrial Designers    -> Industrial Designers
//   Audio & Video Technicians            -> Broadcast, Sound, and Video Technicians
//   Architectural & Civil Drafters       -> Drafters
//
// Usage: node scripts/add_search_aliases.js [--apply]

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const dataPath = path.join(ROOT, 'careers-data.js');
delete require.cache[require.resolve(dataPath)];
const A = require(dataPath).CAREERS_ALL;

// career title -> extra searchable names
const ALIASES = {
  // --- Aviation: the "air hostess" case ---
  'Flight Attendants': [
    'Air Hostess', 'Air Host', 'Cabin Crew', 'Cabin Attendant', 'Purser',
    'Airline Stewardess', 'Cabin Crew Member', 'Senior Cabin Crew Member',
    'Air Hostess Instructor', 'Aircraft Cabincrew', 'Flight Attendant Trainer',
  ],
  'Taxi Drivers, Shuttle Drivers, and Chauffeurs': [
    'Rideshare Driver', 'Uber Driver', 'Ola Driver', 'Cab Driver',
    'Ride-Share Driver', 'Online Cab Driver', 'Airport Transfer Driver', 'Taxi Owner',
  ],
  'Delivery Truck Drivers and Driver/sales Workers': [
    'Courier Driver', 'Last Mile Delivery Driver', 'Van Driver', 'Pickup Driver',
    'Warehouse Dispatch Driver', 'Parcel Delivery Driver', 'Tempo Driver',
  ],
  'Hand Laborers and Material Movers': [
    'Delivery Boy', 'Packer', 'Warehouse Picker', 'Loader', 'Helper',
    'Warehouse Helper', 'Baggage Handler', 'Store Helper', 'Loading Boy', 'Coolie',
    'Labourer', 'Daily Wage Labourer', 'Manual Labourer',
  ],
  'Airline and Commercial Pilots': ['Aircraft Pilot', 'Airline Pilot', 'Plane Pilot'],

  // --- Roles whose only gap was the name ---
  // These two already had BLS profiles with real pay data, so the roles are
  // aliases here rather than new careers. An earlier attempt added duplicate
  // careers for them, which would have thrown away the sourced figures.
  'Massage Therapists': [
    'Spa Therapist', 'Body Massage Expert', 'Wellness Coach', 'Aromatherapist',
    'Sports Massage Therapist', 'Reflexologist', 'Thai Massage Therapist',
    'Shiatsu Practitioner', 'Body Worker', 'Head Massage Therapist',
  ],
  'Gambling Services Workers': [
    'Croupier', 'Dealer', 'Slot Attendant', 'Casino Games Dealer',
    'Cardroom Dealer', 'Table Games Dealer', 'Blackjack Dealer', 'Roulette Dealer',
  ],

  'Meeting, Convention, and Event Planners': [
    'Event Manager', 'Event Coordinator', 'Wedding Decorator', 'Event Producer',
    'Event Designer', 'Party Planner', 'Birthday Party Organiser',
  ],
  'Web Developers and Digital Designers': [
    'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
    'Web Programmer', 'Web Designer',
  ],
  'Craft Brewer & Distiller': ['Winemaker', 'Wine Maker', 'Oenologist'],

  // --- Office and clerical, the words people actually use ---
  'General Office Clerks': [
    'Typist', 'Data Entry Operator', 'Office Boy', 'Store Keeper', 'Storekeeper',
    'Front Office Executive', 'Clerk Typist', 'Office Assistant', 'Reception Executive',
    'Office Manager', 'Admin Executive',
  ],
  'Material Recording Clerks': ['Inventory Clerk', 'Stock Register Keeper', 'Store Counting Clerk'],
  'Financial Clerks': ['Cash Counting Clerk', 'Money Sorter', 'Counter Cashier', 'Cash Office Clerk'],
  'Bookkeeping, Accounting, and Auditing Clerks': ['Accountant (Junior)', 'Accounts Clerk', 'Bookkeeper (Junior)'],

  // --- Retail, sales and marketing ---
  'Retail Sales Workers': [
    'Shop Assistant', 'Counter Salesman', 'Salesman', 'Retail Counter Executive', 'Shopkeeper',
  ],
  'Bartenders': ['Bar Tender', 'Mixologist', 'Barmender'],
  'Advertising, Promotions, and Marketing Managers': [
    'Business Development Executive', 'BD Executive', 'Client Servicing Executive',
    'Marketing Executive', 'Digital Marketing Executive', 'Performance Marketer',
    'SEO Specialist', 'SEM Specialist', 'Search Engine Optimisation Specialist',
    'Email Marketer', 'Growth Marketer', 'Social Media Manager', 'Social Media Executive',
    'Influencer Marketing Manager', 'Content Writer', 'Copywriter', 'Copy Writer',
    'Content Marketer', 'Brand Manager', 'Product Marketing Manager', 'Ad Agency Executive',
  ],
  'Customer Service Representatives': [
    'Customer Support Executive', 'Client Support Executive', 'Customer Care Executive',
    'Tele Caller', 'Customer Success Executive',
  ],
  'Advertising Sales Agents': ['Media Buyer', 'Advertising Sales Executive', 'Telesales Executive'],
  'Sales Managers': ['Sales Manager (Retail)', 'Shop Manager', 'Store Manager', 'Sales Executive'],
  'Sales Engineers': ['Technical Sales Executive', 'Pre-Sales Engineer'],
  'Wholesale and Manufacturing Sales Representatives': [
    'Field Sales Executive', 'SFA (Sales Force Agent)', 'Area Sales Manager',
  ],

  // --- Creative and creator economy ---
  'Content Creator & YouTuber': [
    'YouTuber', 'Instagram Influencer', 'Reels Creator', 'Content Creator',
    'Video Creator', 'Social Media Influencer', 'TikToker', 'Facebook Creator',
    'Online Creator', 'Creator Economy Professional', 'YouTube Channel Owner',
  ],
  'Podcast Producer & Audio Storytelling': [
    'Podcaster', 'Podcast Host', 'Audio Creator', 'Voice Artist', 'Dubbing Artist',
    'Narrator', 'Audiobook Narrator', 'Radio Presenter', 'Voiceover Artist', 'Radio Jockey',
  ],
  'Writers and Authors': [
    'Script Writer', 'Blog Writer', 'Ghost Writer', 'Freelance Writer',
    'Staff Writer', 'Columnist', 'Copy Writer', 'Content Writer',
  ],
  'Product Management & Tech Strategy': [
    'Product Manager', 'Technical Product Manager', 'TPM', 'Product Owner', 'Growth Product Manager',
  ],
  'UI/UX & Product Design': ['UX Designer', 'UI Designer', 'Product Designer', 'UX Researcher', 'Service Designer'],
  'Graphic Designers': ['Visual Designer', 'Brand Designer', 'Creative Designer'],
  'Industrial Designers': ['Product Design Engineer', 'Design Engineer', 'Furniture Designer'],
  'Producers and Directors': ['Film Director', 'Web Series Director', 'Documentary Maker'],
  'Broadcast, Sound, and Video Technicians': [
    'Sound Technician', 'Audio Engineer', 'Lighting Technician', 'Sound Engineer', 'AV Technician',
  ],

  // --- Skilled trades, colloquial and Indian usage ---
  'Ironworkers': ['Blacksmith', 'Iron Smith', 'Coppersmith', 'Metal Craft Worker', 'Forge Worker'],
  'Sheet Metal Workers': ['Tin Smith', 'Sheet Metal Fabricator', 'Metal Fabricator'],
  'Welders, Cutters, Solderers, and Brazers': [
    'Welder (Arc)', 'Gas Welder', 'MIG Welder', 'TIG Welder', 'Fitter Welder',
    'Cutting Torch Operator', 'Brazing Worker', 'Arc Welder',
  ],
  'Machinists and Tool and Die Makers': ['Machine Operator', 'Turner', 'Fitter (Machinery)', 'Tool Room Machinist'],
  'Masonry Workers': ['Bricklayer', 'Mason (Brick)', 'Plasterer', 'Plaster of Paris Worker', 'Cement Mason'],
  'Painters, Construction and Maintenance': ['Painter (Building)', 'Wall Painter', 'Spray Painter', 'House Painter'],
  'Electricians': ['Wireman', 'House Wiring Electrician', 'Electrician (Wireman)'],
  'Plumbers, Pipefitters, and Steamfitters': ['Plumber', 'Pipefitter', 'Sanitary Fitter', 'Plumber (Municipal)'],
  'Carpenters': ['Carpenter (Wood)', 'Wood Carpenter', 'Furniture Carpenter', 'Mistri (Carpenter)', 'Shoe Maker', 'Cobbler'],
  'Roofers': ['Roofer (Tiles)', 'Tiles Mechanic', 'Roofing Worker', 'Sheet Roofing Worker'],
  'Flooring Installers and Tile and Stone Setters': [
    'Tiles Installer', 'Marble Worker', 'Granite Fitter', 'Floor Polisher',
    'Marble Setter', 'Carpet Installer', 'Floor Installer', 'Vinyl Floor Installer',
  ],
  'Construction Managers': ['Builder (Construction)', 'Building Contractor', 'Contractor', 'Civil Contractor', 'Site Engineer'],
  'Architects': ['Architect', 'Building Architect'],
  'Drafters': ['Draftsman', 'CAD Draughtsman', 'Civil Draughtsman', 'Architectural Draughtsman'],
  'Metal and Plastic Machine Workers': ['Plater', 'Galvanizing Worker', 'Powder Coating Worker', 'Machine Fitter'],
  'Industrial Production Managers': ['Production Supervisor', 'Factory Manager', 'Plant Manager', 'Shop Floor Manager'],
  'Glaziers': ['Glass Worker', 'Glass Cutter', 'Mirror Worker', 'Glass Artisan'],

  // --- Jewellery, gems and craft ---
  'Jewelers and Precious Stone and Metal Workers': [
    'Jeweller', 'Jeweler', 'Goldsmith', 'Gem Cutter', 'Gemologist', 'Diamond Cutter',
    'Ornaments Maker', 'Gold Bead Maker', 'Artificial Jewellery Maker', 'Silver Smith',
    'Gold Polisher', 'Stone Setter',
  ],
  'Craft and Fine Artists': [
    'Artisan', 'Craftsman', 'Terracotta Artist', 'Stone Carver', 'Idol Maker',
    'Puppet Maker', 'Toy Maker', 'Handicraft Worker', 'Craft Worker', 'Brassware Craftsman',
    'Cane Craft Worker', 'Coir Craft Worker', 'Marble Carver', 'Slate Carver', 'Stone Cutter',
  ],

  // --- Farming, food and agriculture ---
  'Farmers, Ranchers, and Other Agricultural Managers': [
    'Mushroom Grower', 'Dairy Farmer', 'Poultry Farmer', 'Organic Farmer',
    'Fish Farmer', 'Aquaculture Farmer', 'Poultry Rearer', 'Dairy Owner',
    'Nursery Owner', 'Floriculturist', 'Horticulturist', 'Greenhouse Operator',
    'Beekeeper', 'Sericulture Farmer', 'Vermiculture Farmer', 'Paddy Farmer',
    'Plantation Owner', 'Cold Storage Operator',
  ],
  'Cooks': ['Cook (Household)', 'Kitchen Helper', 'Tandoor Cook', 'Commis Cook', 'Thali Cook'],
  'Barbers, Hairstylists, and Cosmetologists': [
    'Beautician', 'Beauty Technician', 'Makeup Artist', 'Hair Stylist', 'Salon Owner',
    'Mehendi Artist', 'Nail Technician', 'Unisex Salonist', 'Bridal Makeup Artist',
  ],
  'Fitness Trainers and Instructors': [
    'Gym Trainer', 'Personal Trainer', 'Fitness Coach', 'Yoga Instructor',
    'Gym Instructor', 'Zumba Instructor', 'Crossfit Coach',
    'Dance Fitness Instructor', 'Gym Assistant',
  ],
  'Coaches and Scouts': [
    'Cricket Coach', 'Football Coach', 'Sports Coach', 'Badminton Coach',
    'Tennis Coach', 'Swimming Coach', 'Kabaddi Coach', 'Chess Coach',
    'Volleyball Coach', 'Athletics Coach', 'Kabbadi Coach', 'Football Trainer',
  ],

  // --- Health and medicine ---
  'Pharmacy Technicians': ['Compounder', 'Pharmacy Assistant', 'Medical Store Assistant', 'Dispensing Assistant'],
  'Pharmacists': ['Pharmacist (Retail)', 'Community Pharmacist', 'Hospital Pharmacist', 'Medical Representative'],
  'Nursing Assistants and Orderlies': ['Ward Boy', 'Nursing Assistant', 'Patient Attendant'],
  'Dental Assistants': ['Dental Assistant', 'Dental Chairside Assistant'],
  'Dental Hygienists': ['Dental Hygienist', 'Scaling Operator'],
  'Opticians': ['Optician (Spectacle Shop)', 'Spectacle Shop Owner', 'Dispensing Optician'],
  'Optometrists': ['Eye Specialist (Optometrist)', 'Doctor of Optometry'],
  'Occupational Therapists': ['Occupational Therapist', 'OT Assistant', 'Hand Therapy Specialist'],
  'Physical Therapists': ['Physiotherapist', 'Physio', 'Physiotherapist (BPT)', 'Sports Physiotherapist'],
  'Substance Abuse, Behavioral Disorder, and Mental Health Counselors': [
    'Counsellor', 'Psychologist (Counselling)', 'Career Counsellor', 'Mental Health Counsellor', 'Child Psychotherapist',
  ],

  // --- Education and training ---
  'Tutors': [
    'Home Tutor', 'Online Tutor', 'Tuition Teacher', 'Private Tutor', 'Drawing Teacher',
    'Guitar Teacher', 'Music Teacher', 'Dance Teacher', 'Spoken English Teacher',
  ],
  'Teacher Assistants': ['Teaching Assistant', 'Teaching Aide', 'Prayasit', 'Anganwadi Worker', 'Early Childhood Educator'],
  'Postsecondary Teachers': ['College Teacher', 'Lecturer', 'Assistant Professor', 'Faculty Member'],
  'High School Teachers': ['High School Teacher', 'Secondary School Teacher', 'School Teacher'],
  'Kindergarten and Elementary School Teachers': ['Primary School Teacher', 'Bal Shiksha Teacher'],
  'Special Education Teachers': ['Special Needs Teacher', 'Inclusive Education Teacher'],

  // --- Security, uniformed and civic roles ---
  'Security Guards and Gambling Surveillance Officers': [
    'Security Guard', 'Watchman', 'Security Man', 'Mall Security', 'Bouncer',
    'Armed Security Guard', 'Security Supervisor', 'Gatekeeper', 'Bodyguard',
  ],
  'Police and Detectives': [
    'Police Officer', 'Constable', 'Sub Inspector', 'Station House Officer',
    'Cyber Crime Officer', 'Crime Branch Officer', 'Traffic Police', 'Police Inspector',
    'Police Constable', 'Station Officer', 'DSP', 'ASP', 'SI',
  ],
  'Firefighters': ['Fireman', 'Fire Officer', 'Fire Brigade Recruit', 'Fire Station Officer'],
  'Military Careers': [
    'Army Soldier', 'Navy Sailor', 'Air Force Personnel', 'Soldier', 'Recruit',
    'Military Officer', 'Commissioned Officer', 'NCO', 'Sepoy', 'RPF Constable',
  ],

  // --- Modern roles whose names are not BLS titles ---
  'Cybersecurity & Ethical Hacking': [
    'Cybersecurity Analyst', 'Security Analyst', 'InfoSec Analyst', 'SOC Analyst', 'Threat Analyst',
  ],
  'Blockchain & Decentralized Web3 Systems': [
    'Blockchain Developer', 'Smart Contract Developer', 'Web3 Developer', 'Crypto Developer', 'Solidity Developer',
  ],
  'Cloud Architecture & DevOps / SRE': [
    'Cloud Engineer', 'DevOps Engineer', 'Site Reliability Engineer', 'Platform Engineer',
  ],
  'Data Science & Big Data Engineering': [
    'Data Scientist', 'Data Engineer', 'Analytics Engineer', 'ML Engineer', 'Big Data Engineer',
  ],
  'Game Development, XR & Spatial Computing': [
    'Game Developer', 'Gameplay Programmer', 'Unity Developer', 'Unreal Developer',
    'Technical Artist', 'Narrative Designer',
  ],
  'AR/VR, Spatial Computing & Metaverse Architect': [
    'AR/VR Developer', 'VR Engineer', 'Spatial Computing Developer', 'Unity XR Developer',
  ],
  'Global Supply Chain Management, Autonomous Logistics & Procurement': [
    'Warehouse Manager', 'Logistics Coordinator', 'Last Mile Operations Manager', 'Fulfilment Manager',
  ],
  'Investment Banking & Private Equity': [
    'Investment Banker', 'Private Equity Associate', 'VC Associate', 'Equity Research Analyst',
  ],
  'Quantitative Finance & Algorithmic Trading': [
    'Quantitative Trader', 'Quant Developer', 'Algo Trader', 'Trading Systems Engineer',
  ],
  'Architecture & Sustainable Urban Planning': [
    'Urban Planner', 'City Planner', 'GIS Analyst', 'Transport Planner',
  ],
  'Clinical Perfusion, Cardiopulmonary Bypass & ECMO Life Support': [
    'Perfusionist', 'ECMO Specialist', 'Cardiopulmonary Bypass Technologist',
  ],
  'Sports Physiotherapist & High-Performance Athletic Coach': [
    'Sports Physio', 'Athletic Rehabilitation Specialist',
  ],
  'Esports Athlete & Streamer': [
    'Esports Player', 'Pro Gamer', 'Gamer', 'Twitch Streamer', 'Shoutcaster', 'Caster',
  ],
  'Sommelier & Beverage Director': ['Sommelier', 'Wine Steward', 'Beverage Manager', 'Brewer', 'Distiller', 'Craft Brewer'],
  'Drone Pilot, UAV Operations & Aerial Robotics': [
    'Drone Pilot', 'UAV Operator', 'RPIC', 'Drone Operator', 'Drone Survey Pilot',
  ],
  'Locksmith & Security Hardware Technician': [
    'Locksmith', 'Safe Technician', 'Key Cutter', 'Access Control Technician',
  ],
  'Funeral Director & Embalmer': ['Mortician', 'Undertaker', 'Embalmer', 'Crematory Operator'],
  'Commercial Diver & Underwater Technician': [
    'Commercial Diver', 'Underwater Welder', 'Saturation Diver', 'ROV Operator', 'Dive Supervisor',
  ],
  'GIS & Geospatial Intelligence Analyst': [
    'GIS Analyst', 'Geospatial Analyst', 'Cartographer', 'Remote Sensing Analyst', 'Survey Analyst',
  ],
};

// Terms currently attached to the wrong career. Listing a term here strips it
// from that career, which frees it for a better home - a newly added career, or
// an existing one that is actually about that work.
//
// The reason this exists: the additions below are written before
// scripts/new_careers.js runs, so a term that belongs to a brand new career
// would otherwise be quietly claimed by whatever broad BLS profile happened to
// mention it first. "Delivery Boy" landed on Hand Laborers and Material Movers
// that way, when the real home is a gig delivery rider.
const REMOVE = {
  // A cobbler repairs footwear; a carpenter works in timber. "Shoe Maker" and
  // "Cobbler" were added to Carpenters by mistake and belong with tailoring.
  'Carpenters': ['Shoe Maker', 'Cobbler'],
  // These are gig platform terms. Hand Laborers is the right home for a
  // warehouse loader, not for someone on a two-wheeler carrying a food bag.
  'Hand Laborers and Material Movers': ['Delivery Boy', 'Packer', 'Warehouse Picker'],
};

// --- resolve titles to ids, failing loudly on anything unknown ---
//
// Collision rule: a term is only added if no OTHER career already answers to
// it. A duplicate is not a cosmetic problem - the search box returns two
// results and the student has to guess which is the real one. If a term is
// already claimed somewhere, the student can already find it, so skipping
// loses nothing. Each skip is reported so the intended home can be reviewed.
//
// This matters because the dataset already contains 24 deliberate overlaps
// where a narrow curated career sits alongside the broad BLS profile that BLS
// itself cross-references to it (BLS lists "Game Warden" under Police and
// Detectives, "Investment Banker" under Securities Sales Agents). Those stay
// as they are; this pass simply refuses to add to the pile.
const byTitle = new Map(A.map(c => [c.title, c]));

// Duplicate keys in the literal above are silently dropped by JavaScript: the
// last one wins with no warning. That already cost one group of aliases.
//
// This has to be counted in the source text. Object.keys() on a duplicate-key
// object literal returns the key exactly once, so counting over the parsed
// object can never detect the thing it is looking for. Scoped to the ALIASES
// literal, or the REMOVE keys above would be counted as duplicates too.
const src = fs.readFileSync(__filename, 'utf8');
const aliasStart = src.indexOf('const ALIASES = {');
const aliasEnd = src.indexOf('\n};', aliasStart);
const aliasBlock = src.slice(aliasStart, aliasEnd);
const keyLines = [...aliasBlock.matchAll(/^ {2}'([^']+)'\s*:/gm)].map(m => m[1]);
const keyCount = {};
for (const k of keyLines) keyCount[k] = (keyCount[k] || 0) + 1;
const dupKeys = Object.entries(keyCount).filter(([, n]) => n > 1);
if (dupKeys.length) {
  console.error('ABORT - ' + dupKeys.length + ' career titles appear more than once in ALIASES.');
  console.error('JavaScript keeps only the last one, so the earlier aliases would be lost silently.');
  dupKeys.forEach(([k, n]) => console.error('  "' + k + '" x' + n + '  ->  merge them into a single entry'));
  process.exit(1);
}

const claimedBy = new Map(); // lowercase term -> career id that already owns it
const problems = [];
for (const c of A) {
  for (const t of [c.title, c.id, ...(c.aka || [])]) {
    const k = String(t).toLowerCase().trim();
    if (k && !claimedBy.has(k)) claimedBy.set(k, c.id);
  }
}

// Terms to strip are collected here and applied AFTER the additions below.
// Order matters: several of these terms are ones this same script adds to the
// wrong career a few lines down, so removing first would find nothing on a
// clean checkout and then re-add them.
const removals = [];
for (const [title, terms] of Object.entries(REMOVE)) {
  const c = byTitle.get(title);
  if (!c) { problems.push('REMOVE targets unknown career "' + title + '"'); continue; }
  removals.push({ c, drop: new Set(terms.map(t => t.toLowerCase())) });
}

const skipped = [];
const plan = [];
for (const [title, terms] of Object.entries(ALIASES)) {
  const c = byTitle.get(title);
  if (!c) {
    const near = A.filter(x => x.title.toLowerCase().includes(title.toLowerCase().split(/[\\s,]+/)[0]));
    problems.push('no career titled "' + title + '"' + (near.length ? '  (did you mean: ' + near.slice(0, 3).map(n => n.title).join(' | ') + ')' : ''));
    continue;
  }
  const own = new Set([title, c.id, ...(c.aka || [])].map(t => String(t).toLowerCase()));
  const add = [];
  for (const t of terms) {
    const k = String(t).toLowerCase().trim();
    if (!k || own.has(k)) continue;
    const other = claimedBy.get(k);
    if (other && other !== c.id) {
      skipped.push({ term: t, from: title, alreadyOn: byTitle.get(A.find(x => x.id === other).title).title });
      continue;
    }
    own.add(k);
    claimedBy.set(k, c.id);
    add.push(String(t).trim());
  }
  if (add.length) plan.push({ id: c.id, title: c.title, add });
}

if (problems.length) {
  console.error('ABORT - ' + problems.length + ' titles did not resolve:');
  problems.forEach(p => console.error('  ' + p));
  process.exit(1);
}

const apply = process.argv.includes('--apply');
const total = plan.reduce((a, p) => a + p.add.length, 0);
const removedTerms = [];
if (apply) {
  for (const p of plan) byTitle.get(p.title).aka = [...(byTitle.get(p.title).aka || []), ...p.add];
  // Strip after adding: the terms being removed are terms this run adds above.
  for (const r of removals) {
    r.c.aka = (r.c.aka || []).filter(a => {
      if (r.drop.has(String(a).toLowerCase())) { removedTerms.push(a); return false; }
      return true;
    });
  }
  const header = "if (typeof window === 'undefined') { var window = global; }\n" + 'window.CAREERS_ALL = ';
  const footer = '\n' + "if (typeof module !== 'undefined' && module.exports) { module.exports = { CAREERS_ALL: window.CAREERS_ALL }; }\n";
  fs.writeFileSync(dataPath, header + JSON.stringify(A, null, 2) + footer, 'utf8');
}

console.log('careers receiving aliases : ' + plan.length);
console.log('aliases ' + (apply ? 'added' : 'to add') + '             : ' + total + (apply ? '' : '   [dry run]'));
console.log('skipped, already findable  : ' + skipped.length);
console.log('misfiled terms to remove   : ' + removals.reduce((a, r) => a + r.drop.size, 0) +
  (removedTerms.length ? '  (removed: ' + removedTerms.join(', ') + ')' : ''));
if (skipped.length) {
  console.log('\nskipped because another career already answers to the term:');
  skipped.forEach(s => console.log('  ' + s.term.padEnd(26) + s.from + '  (already on: ' + s.alreadyOn + ')'));
}
console.log('\nlargest additions:');
plan.slice().sort((a, b) => b.add.length - a.add.length).slice(0, 12)
  .forEach(p => console.log('  ' + String(p.add.length).padStart(3) + '  ' + p.title));
if (apply) console.log('\nwrote careers-data.js');
else console.log('\nRe-run with --apply to write.');
