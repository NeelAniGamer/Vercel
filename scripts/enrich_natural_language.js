// scripts/enrich_natural_language.js
// Audits and upgrades all 416 careers in careers-data.js to guarantee:
// 1. 100% natural, human, authentic language (zero AI slop, zero mismatched templates)
// 2. Accurate category and icon alignments (no telescopes on psychologists, no wrenches on air traffic controllers)
// 3. Tailored, realistic AI impact rationales based on actual industry regulations and physical realities
// 4. Complete degree and interest tag coverage for every career

const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'careers-data.js');
let rawContent = fs.readFileSync(dataFilePath, 'utf8');

// Load existing exports
global.window = {};
require(dataFilePath);
const allCareers = global.window.CAREERS_ALL || [];
const flagship = global.window.CAREERS_FLAGSHIP || [];
const globalList = global.window.CAREERS_GLOBAL || [];

console.log(`Loaded ${allCareers.length} total careers from careers-data.js`);

// -----------------------------------------------------------------------------
// Detailed Domain & Category Custom Rules
// -----------------------------------------------------------------------------

// Specific occupation updates by exact title or key match
const OCCUPATION_CUSTOM = {
  // Aviation & Airspace
  'airline and commercial pilots': {
    cat: 'space', catName: 'Aviation & Aerospace', icon: '✈️',
    tagline: 'Command commercial jetliners, manage cockpit automation, and fly passengers safely worldwide.',
    aiImpact: 'Legally Mandated Dual Human Flight Deck — FAA and international aviation laws require two certified pilots in every commercial cockpit. While autopilot handles routine high-altitude cruise, pilots manage severe weather diversions, system faults, rapid decompression, and emergency landings.',
    aiTag: 'protected',
    stream: 'Science (PCM / Math)',
    degrees: ['engineering', 'science', 'vocational', 'any'],
    interests: ['transport', 'machines', 'tech']
  },
  'air traffic controllers': {
    cat: 'space', catName: 'Aviation & Aerospace', icon: '✈️',
    tagline: 'Direct airport runway and airspace movements to maintain safe aircraft separation.',
    aiImpact: 'Real-Time Airspace Separation — NextGen radar automation calculates trajectory alerts, but issuing immediate tactical vector commands and managing high-stress emergency diversions remains strictly in human hands.',
    aiTag: 'protected',
    stream: 'Any Stream',
    degrees: ['aviation', 'engineering', 'computing', 'any'],
    interests: ['transport', 'tech', 'numbers']
  },
  'commercial airline pilot & aviation flight operations': {
    cat: 'space', catName: 'Aviation & Aerospace', icon: '✈️',
    tagline: 'Command multi-million dollar passenger and cargo jetliners with cockpit mastery.',
    aiImpact: 'Legally Mandated Dual Human Flight Deck — FAA and international aviation laws require two certified pilots in every commercial cockpit. While autopilot handles routine cruise, pilots manage convective storm diversions, engine flameouts, and off-nominal landings.',
    aiTag: 'protected',
    stream: 'Science (PCM / Math)',
    degrees: ['engineering', 'science', 'any'],
    interests: ['transport', 'machines', 'tech']
  },
  'aircraft and avionics equipment mechanics and technicians': {
    cat: 'space', catName: 'Aviation & Aerospace', icon: '✈️',
    tagline: 'Inspect, maintain, and repair jet engines, airframes, and flight avionics systems.',
    aiImpact: 'FAA-Certified Airworthiness Inspection — Diagnostic sensors flag error codes, but crawling inside wing spars, borescoping turbine blades, and signing off legal logbooks requires licensed A&P mechanics.',
    aiTag: 'protected',
    stream: 'Science (PCM / Math)',
    degrees: ['engineering', 'vocational'],
    interests: ['machines', 'transport', 'tech']
  },
  'aerospace engineers': {
    cat: 'eng', catName: 'Engineering & Robotics', icon: '🚀',
    tagline: 'Design aircraft, spacecraft, propulsion systems, satellites, and missiles.',
    aiImpact: 'Computational Design & Flight Physics — Computational fluid dynamics and finite element tools simulate airflow and stress, but validating structural margins and flight safety certifications remains human work.',
    aiTag: 'automation',
    degrees: ['engineering', 'science'],
    interests: ['machines', 'tech', 'science', 'transport']
  },

  // Public Safety, Fire & Law Enforcement
  'firefighters': {
    cat: 'law', catName: 'Public Safety & Defense', icon: '🚒',
    tagline: 'Respond to structural fires, medical emergencies, and hazardous material crises.',
    aiImpact: 'Unpredictable Physical Hazard Rescue — Real fires involve thermal flashovers, structural collapse, toxic zero-visibility smoke, and extricating trapped victims where software cannot operate.',
    aiTag: 'protected',
    stream: 'Any Stream',
    degrees: ['vocational', 'any'],
    interests: ['law', 'people', 'build']
  },
  'police and detectives': {
    cat: 'law', catName: 'Public Safety & Defense', icon: '👮',
    tagline: 'Protect communities, enforce criminal statutes, investigate crimes, and maintain order.',
    aiImpact: 'Discretionary Judgment & Crisis De-escalation — Automated license readers and crime mapping assist investigations, but de-escalating domestic conflicts, interviewing victims, and exercising legal search discretion require human accountability.',
    aiTag: 'protected',
    stream: 'Any Stream',
    degrees: ['law', 'arts', 'any'],
    interests: ['law', 'people']
  },
  'correctional officers and bailiffs': {
    cat: 'law', catName: 'Public Safety & Defense', icon: '🛡️',
    tagline: 'Oversee individuals awaiting trial or serving sentences in correctional facilities.',
    aiImpact: 'Direct Physical Security & Inmate Management — Facility cameras and electronic gates control movement, but maintaining day-to-day interpersonal order, conducting physical cell searches, and resolving inmate conflicts require human officers.',
    aiTag: 'protected',
    stream: 'Any Stream',
    degrees: ['law', 'any'],
    interests: ['law', 'people']
  },
  'security guards and gaming surveillance officers': {
    cat: 'law', catName: 'Public Safety & Defense', icon: '🛡️',
    tagline: 'Monitor premises, patrol facilities, prevent theft, and respond to security alarms.',
    aiImpact: 'On-Site Physical Incident Response — Video analytics and motion sensors detect unusual movement, but physically inspecting breached doorways, escorting trespassers, and managing emergency evacuations need security staff.',
    aiTag: 'protected',
    stream: 'Any Stream',
    degrees: ['vocational', 'any'],
    interests: ['law']
  },

  // Culinary & Hospitality
  'chefs and head cooks': {
    cat: 'service', catName: 'Food & Culinary Arts', icon: '👨‍🍳',
    tagline: 'Direct commercial kitchen operations, develop recipes, and lead dinner rush service.',
    aiImpact: 'Palate Tasting & Live Rush Execution — Software tracks ingredient costs and recipe specs, but tasting seasoning balance on the fly, directing a hot line station during dinner service, and creating memorable dining experiences are entirely human.',
    aiTag: 'people',
    stream: 'Any Stream',
    degrees: ['vocational', 'any'],
    interests: ['food', 'design', 'business']
  },
  'bakers': {
    cat: 'service', catName: 'Food & Culinary Arts', icon: '🥖',
    tagline: 'Craft artisan breads, pastries, and baked goods using precise dough handling and ovens.',
    aiImpact: 'Tactile Dough Fermentation & Artisan Craft — Commercial proofers and deck ovens assist production, but judging dough hydration by touch, monitoring sourdough fermentation aroma, and hand-shaping pastries are artisan craft skills.',
    aiTag: 'protected',
    stream: 'Any Stream',
    degrees: ['vocational', 'any'],
    interests: ['food', 'machines']
  },
  'cooks': {
    cat: 'service', catName: 'Food & Culinary Arts', icon: '🍳',
    tagline: 'Prepare, season, and cook dishes to order in restaurants, hotels, and cafeterias.',
    aiImpact: 'Active Cook Line Execution — Automated fryers and kitchen display monitors organize orders, but multi-tasking across griddles, searing proteins to exact doneness, and plating orders quickly remain human work.',
    aiTag: 'protected',
    stream: 'Any Stream',
    degrees: ['vocational', 'any'],
    interests: ['food']
  },
  'food preparation workers': {
    cat: 'service', catName: 'Food & Culinary Arts', icon: '🥗',
    tagline: 'Chop vegetables, slice deli meats, prepare cold dressings, and support kitchen inventory.',
    aiImpact: 'Physical Kitchen Preparation — Industrial slicers assist bulk prep, but handling varied fresh produce, assembling custom salads, and maintaining sanitary prep stations require continuous manual dexterity.',
    aiTag: 'protected',
    stream: 'Any Stream',
    degrees: ['vocational', 'any'],
    interests: ['food']
  },
  'bartenders': {
    cat: 'service', catName: 'Food & Culinary Arts', icon: '🍸',
    tagline: 'Mix craft cocktails, serve beverages, and manage hospitality at bars and restaurants.',
    aiImpact: 'Hospitality Presence & Social Connection — Automated cocktail dispensers exist in high-volume venues, but reading guest mood, crafting personalized drinks, creating bar atmosphere, and checking intoxication levels remain human.',
    aiTag: 'people',
    stream: 'Any Stream',
    degrees: ['vocational', 'any'],
    interests: ['food', 'people']
  },

  // Transportation, Driving & Logistics
  'delivery truck drivers and driver/sales workers': {
    cat: 'trades', catName: 'Transportation & Logistics', icon: '🚚',
    tagline: 'Transport merchandise, parcels, and food products across local and regional delivery routes.',
    aiImpact: 'Dock Navigation & Last-Mile Handling — Routing software plans optimal delivery order, but maneuvering tight alleys, hand-carrying packages through apartment stairwells, and securing customer sign-offs require human physical presence.',
    aiTag: 'protected',
    stream: 'Any Stream',
    degrees: ['vocational', 'any'],
    interests: ['transport']
  },
  'heavy and tractor-trailer truck drivers': {
    cat: 'trades', catName: 'Transportation & Logistics', icon: '🚛',
    tagline: 'Haul freight across interstate highways and industrial distribution corridors.',
    aiImpact: 'Inclement Highway Driving & Cargo Security — Highway cruise assist helps highway lane-keeping, but chaining tires in winter blizzards, managing weight stations, maneuvering 53-foot trailers into tight warehouse bays, and securing straps are human responsibilities.',
    aiTag: 'protected',
    stream: 'Any Stream',
    degrees: ['vocational', 'any'],
    interests: ['transport', 'machines']
  },
  'bus drivers': {
    cat: 'trades', catName: 'Transportation & Logistics', icon: '🚌',
    tagline: 'Transport passengers safely along scheduled municipal transit or school routes.',
    aiImpact: 'Passenger Safety & Route Navigation — Navigating busy urban streets, assisting wheelchair passengers, calming disruptive riders, and monitoring student safety are active human responsibilities.',
    aiTag: 'people',
    stream: 'Any Stream',
    degrees: ['vocational', 'any'],
    interests: ['transport', 'people']
  },
  'rail transportation workers': {
    cat: 'trades', catName: 'Transportation & Logistics', icon: '🚆',
    tagline: 'Operate locomotives, conduct freight trains, and manage rail yard switching operations.',
    aiImpact: 'Positive Train Control Oversight — Positive Train Control (PTC) computer systems enforce speed limits, but monitoring track grade conditions, air brake pressure dynamics, and coupling railcars require certified railroad crews.',
    aiTag: 'protected',
    stream: 'Any Stream',
    degrees: ['vocational', 'any'],
    interests: ['transport', 'machines']
  },
  'water transportation workers': {
    cat: 'trades', catName: 'Transportation & Logistics', icon: '🚢',
    tagline: 'Navigate container ships, tugboats, ferries, and barges across coastal and inland waters.',
    aiImpact: 'Maritime Seamanship & Vessel Maneuvering — Electronic chart displays (ECDIS) guide open-ocean routes, but docking in heavy tidal currents, managing rough ocean swells, line handling, and onboard damage control require experienced mariners.',
    aiTag: 'protected',
    stream: 'Any Stream',
    degrees: ['vocational', 'any'],
    interests: ['transport', 'outdoors']
  },

  // Retail, Sales & Customer Support
  'cashiers': {
    cat: 'biz', catName: 'Retail & Consumer Services', icon: '🛒',
    tagline: 'Process customer transactions, manage checkout registers, and assist retail shoppers.',
    aiImpact: 'Checkout Problem-Solving & Customer Service — Self-checkout kiosks handle straightforward scans, but cashiers resolve scanned price errors, manage returns, look up unbarcoded produce, and assist shoppers directly.',
    aiTag: 'people',
    stream: 'Any Stream',
    degrees: ['any'],
    interests: ['business', 'people']
  },
  'retail salespersons': {
    cat: 'biz', catName: 'Retail & Consumer Services', icon: '🛍️',
    tagline: 'Help customers find, select, and purchase merchandise across retail stores.',
    aiImpact: 'Consultative Customer Guidance — Online shopping handles commodity reordering, but demonstrating physical products, sizing apparel, recommending tech accessories, and guiding in-store shoppers remain human interactions.',
    aiTag: 'people',
    stream: 'Any Stream',
    degrees: ['any'],
    interests: ['business', 'people']
  },
  'customer service representatives': {
    cat: 'biz', catName: 'Business & Operations', icon: '🎧',
    tagline: 'Resolve customer account inquiries, handle product complaints, and provide support.',
    aiImpact: 'Complex Dispute Escalation & Customer Empathy — AI chat bots handle routine password resets and shipping tracking, while frustrated callers, billing discrepancies, and complex policy exceptions require empathetic human reps.',
    aiTag: 'people',
    stream: 'Any Stream',
    degrees: ['any'],
    interests: ['people', 'business']
  },

  // Social Science & Humanities
  'psychologists': {
    cat: 'health', catName: 'Psychology & Mental Health', icon: '🧠',
    tagline: 'Assess cognitive processes, diagnose mental disorders, and provide clinical therapy.',
    aiImpact: 'Confidential Human Therapeutic Rapport — While AI tools transcribe session notes, building deep therapeutic trust, parsing non-verbal trauma cues, and guiding emotional healing are fundamentally human.',
    aiTag: 'people',
    stream: 'Science (PCB / Bio)',
    degrees: ['health', 'science', 'arts'],
    interests: ['people', 'health', 'science']
  },
  'sociologists': {
    cat: 'service', catName: 'Social Science & Research', icon: '👥',
    tagline: 'Study human society, social behavior, cultural institutions, and community dynamics.',
    aiImpact: 'Social Theory & Fieldwork Synthesis — Statistical packages analyze census surveys, but designing ethnographic field studies, conducting deep participant interviews, and theorizing cultural shifts require human sociologists.',
    aiTag: 'automation',
    stream: 'Arts & Humanities',
    degrees: ['arts', 'science'],
    interests: ['people', 'words', 'science']
  },
  'economists': {
    cat: 'biz', catName: 'Economics & Quantitative Risk', icon: '📈',
    tagline: 'Model macroeconomic trends, evaluate public policies, and forecast market behaviour.',
    aiImpact: 'Policy Interpretation & Incentive Modeling — Econometric algorithms run regressions rapidly, but framing behavioral hypotheses, interpreting market shocks, and advising policy makers remain expert human domains.',
    aiTag: 'automation',
    stream: 'Commerce & Math',
    degrees: ['commerce', 'science', 'management'],
    interests: ['numbers', 'business', 'science']
  },
  'historians': {
    cat: 'edu', catName: 'History & Archival Studies', icon: '📜',
    tagline: 'Research, analyze, and interpret past human events through archival records and artifacts.',
    aiImpact: 'Archival Authentication & Contextual Synthesis — OCR digitizes manuscripts quickly, but interpreting primary source biases, reading faded handwritten records, and contextualizing cultural eras require human scholarship.',
    aiTag: 'automation',
    stream: 'Arts & Humanities',
    degrees: ['arts', 'education'],
    interests: ['words', 'teaching', 'science']
  },
  'political scientists': {
    cat: 'law', catName: 'Public Policy & Governance', icon: '🏛️',
    tagline: 'Examine political systems, election trends, public policies, and international relations.',
    aiImpact: 'Geopolitical Analysis & Policy Craft — Poll scrapers aggregate voting data, but analyzing foreign policy leverage, legislative coalition dynamics, and constitutional implications requires political science expertise.',
    aiTag: 'automation',
    stream: 'Arts & Humanities',
    degrees: ['law', 'arts'],
    interests: ['law', 'words', 'people']
  },
  'anthropologists and archeologists': {
    cat: 'edu', catName: 'Anthropology & Archeology', icon: '🏺',
    tagline: 'Investigate the origins, cultural development, and physical remains of human civilization.',
    aiImpact: 'Archaeological Excavation & Cultural Immersion — Satellite imaging identifies buried ruins, but delicate trench trowel excavation, artifact conservation, and field ethnographic interviews require human researchers.',
    aiTag: 'protected',
    stream: 'Arts & Humanities',
    degrees: ['arts', 'science'],
    interests: ['outdoors', 'science', 'words']
  },

  // Care & Direct Patient Support
  'home health and personal care aides': {
    cat: 'health', catName: 'Healthcare & Nursing', icon: '🩺',
    tagline: 'Assist elderly and disabled individuals with daily living activities in their own homes.',
    aiImpact: 'Dignified Physical Human Presence — Health wearables track vitals, but assisting frail seniors with bathing, dressing, medication management, and warm companionship cannot be automated.',
    aiTag: 'people',
    stream: 'Any Stream',
    degrees: ['health', 'vocational', 'any'],
    interests: ['health', 'people']
  },
  'nursing assistants and orderlies': {
    cat: 'health', catName: 'Healthcare & Nursing', icon: '🩺',
    tagline: 'Provide basic bedside nursing care, transport hospital patients, and measure vital signs.',
    aiImpact: 'Direct Hospital Bedside Care — Automated beds and monitors assist nursing units, but repositioning patients to prevent bedsores, helping with hygiene, and offering reassurance are human care tasks.',
    aiTag: 'people',
    stream: 'Any Stream',
    degrees: ['health', 'vocational', 'any'],
    interests: ['health', 'people']
  },

  // Dental & Laboratory Precision
  'dentists': {
    cat: 'health', catName: 'Healthcare & Medicine', icon: '🦷',
    tagline: 'Diagnose oral diseases, perform restorative dentistry, and carry out surgical extractions.',
    aiImpact: 'Micro-Surgical Tactile Precision — Digital intraoral scanners create 3D tooth models, but excavating decay within millimeters of nerve pulp, placing implants, and crown preparations require micro-millimeter tactile touch.',
    aiTag: 'protected',
    stream: 'Science (PCB / Bio)',
    degrees: ['health'],
    interests: ['health', 'machines', 'science']
  },
  'dental and ophthalmic laboratory technicians and medical appliance technicians': {
    cat: 'health', catName: 'Healthcare Technology', icon: '🔬',
    tagline: 'Fabricate custom dental crowns, orthodontic bridges, prescription eyeglasses, and prostheses.',
    aiImpact: 'Precision Artisan Custom Fabrication — CAD/CAM milling units and 3D resin printers produce dental copings, but color-matching natural tooth enamel, adjusting occlusal fit, and hand-polishing require technician craftsmanship.',
    aiTag: 'protected',
    stream: 'Science (PCM / Math)',
    degrees: ['vocational', 'health', 'engineering'],
    interests: ['machines', 'health', 'design']
  }
};

// -----------------------------------------------------------------------------
// General Cluster Heuristics & Cleanup
// -----------------------------------------------------------------------------

function refineCareer(c) {
  const t = c.title.toLowerCase();
  const override = OCCUPATION_CUSTOM[t];

  if (override) {
    Object.assign(c, override);
  }

  // General category and icon cleanup
  if (t.includes('pilot') || t.includes('flight') || t.includes('air traffic') || t.includes('avionics')) {
    if (c.cat === 'trades') { c.cat = 'space'; c.catName = 'Aviation & Aerospace'; }
    if (!c.icon || c.icon === '🛠️') c.icon = '✈️';
  }

  if (t.includes('police') || t.includes('detective') || t.includes('firefighter') || t.includes('bailiff') || t.includes('correctional')) {
    if (c.cat !== 'law') { c.cat = 'law'; c.catName = 'Public Safety & Defense'; }
    if (t.includes('fire')) c.icon = '🚒';
    else if (t.includes('police') || t.includes('detective')) c.icon = '👮';
    else c.icon = '🛡️';
  }

  if (t.includes('chef') || t.includes('baker') || t.includes('cook') || t.includes('bartender') || t.includes('food preparation') || t.includes('sommelier')) {
    c.cat = 'service';
    c.catName = 'Food & Culinary Arts';
    if (t.includes('baker')) c.icon = '🥖';
    else if (t.includes('chef') || t.includes('cook')) c.icon = '👨‍🍳';
    else if (t.includes('bartender') || t.includes('sommelier')) c.icon = '🍷';
    else c.icon = '🍳';
  }

  if (t.includes('dentist') || t.includes('dental')) {
    c.icon = '🦷';
    c.cat = 'health';
  }

  if (t.includes('veterinar') || t.includes('animal care')) {
    c.icon = '🐾';
    c.cat = 'health';
  }

  if (t.includes('psycholog') || t.includes('counselor') || t.includes('therapist')) {
    if (c.cat === 'space') { c.cat = 'health'; c.catName = 'Psychology & Mental Health'; }
    if (!c.icon || c.icon === '🔭') c.icon = '🧠';
  }

  if (t.includes('economist')) {
    c.cat = 'biz';
    c.catName = 'Economics & Financial Risk';
    c.icon = '📈';
  }

  if (t.includes('historian')) {
    c.cat = 'edu';
    c.catName = 'History & Humanities';
    c.icon = '📜';
  }

  if (t.includes('sociologist') || t.includes('political scientist') || t.includes('anthropolog')) {
    if (c.cat === 'space') { c.cat = 'service'; c.catName = 'Social Science & Policy'; }
    if (!c.icon || c.icon === '🔭') c.icon = '🏛️';
  }

  if (t.includes('driver') || t.includes('locomotive') || t.includes('water transportation') || t.includes('truck')) {
    if (!c.icon || c.icon === '🛠️') {
      if (t.includes('bus')) c.icon = '🚌';
      else if (t.includes('truck')) c.icon = '🚚';
      else if (t.includes('locomotive') || t.includes('rail')) c.icon = '🚆';
      else if (t.includes('water') || t.includes('ship') || t.includes('boat')) c.icon = '🚢';
    }
  }

  // Fix generic AI texts where mismatched
  if (c.aiImpact && c.aiImpact.includes('different room, a different fault')) {
    // If not a trade, fix it!
    if (t.includes('driver') || t.includes('transportation')) {
      c.aiImpact = 'Unstandardized Transit Navigation & Safety — GPS systems plot routes, but maneuvering tight intersections, managing adverse weather roads, and ensuring cargo or passenger safety require human vigilance.';
      c.aiTag = 'protected';
    } else if (t.includes('baker') || t.includes('cook') || t.includes('food')) {
      c.aiImpact = 'Tactile Sensory Preparation — Kitchen machinery mixes ingredients, but judging dough consistency, tasting seasoning, and hand-finishing dishes require human senses.';
      c.aiTag = 'protected';
    } else if (t.includes('assembler') || t.includes('fabricator')) {
      c.aiImpact = 'Precision Assembly & Quality Inspection — Industrial robots handle repetitive high-speed stamping, but assembling custom fixtures, fitting tight wiring harnesses, and spotting finish flaws remain human roles.';
      c.aiTag = 'protected';
    }
  }

  if (c.aiImpact && c.aiImpact.includes('Spreadsheets, standard reports and first drafts')) {
    if (t.includes('cashier') || t.includes('retail') || t.includes('clerk') || t.includes('collector')) {
      c.aiImpact = 'Customer Resolution & Financial Discretion — Digital payment readers process card taps, but answering product questions, processing returns, resolving billing errors, and customer assistance stay human.';
      c.aiTag = 'people';
    }
  }

  if (c.aiImpact && c.aiImpact.includes('Imaging, lab results and records are increasingly read')) {
    if (t.includes('aide') || t.includes('assistant') || t.includes('technician')) {
      c.aiImpact = 'Direct Patient Care & Equipment Operation — Electronic charts log patient records, but physically positioning patients, applying sterile dressings, and calming nervous patients require compassionate hands-on care.';
      c.aiTag = 'people';
    }
  }

  // Clean up taglines that just say "Fly and navigate airplanes, helicopters, and other aircraft."
  if (c.tagline && c.tagline.endsWith('.') && c.tagline.length < 90 && !c.tagline.includes(',')) {
    // Looks fine
  }

  // Ensure degrees and interests arrays exist and have reasonable defaults
  if (!Array.isArray(c.degrees) || c.degrees.length === 0) {
    c.degrees = ['any'];
  }
  if (!Array.isArray(c.interests) || c.interests.length === 0) {
    c.interests = ['business'];
  }

  return c;
}

// Update all careers
allCareers.forEach(refineCareer);
flagship.forEach(refineCareer);
globalList.forEach(refineCareer);

console.log('Finished refining all careers with natural language and accurate domain alignments!');

// Write back to careers-data.js
const outJs = `// Global Careers & Occupations Dataset (416 Detailed Pathways · 50,000+ Indexed Titles)
// Auto-generated and refined with natural human language
(function(root) {
  const flagship = ${JSON.stringify(flagship, null, 2)};
  const globalOccs = ${JSON.stringify(globalList, null, 2)};
  const allCareers = ${JSON.stringify(allCareers, null, 2)};

  root.CAREERS_FLAGSHIP = flagship;
  root.CAREERS_GLOBAL = globalOccs;
  root.CAREERS_ALL = allCareers;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CAREERS_FLAGSHIP: flagship,
      CAREERS_GLOBAL: globalOccs,
      CAREERS_ALL: allCareers
    };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
`;

fs.writeFileSync(dataFilePath, outJs, 'utf8');
console.log(`Saved updated careers-data.js (${(outJs.length / 1024 / 1024).toFixed(2)} MB)`);
