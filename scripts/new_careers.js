// Careers that no BLS occupation profile covers, added because students search
// for them by name and used to get nothing.
//
// Why these five and not others: the alias pass (scripts/add_search_aliases.js)
// took the guide from 28% to 89% on a sweep of 175 terms students actually type.
// The 20 that still returned nothing are the occupations BLS has no profile for
// at all, and they cluster into five working jobs.
//
// Two candidates were rejected during drafting. "Spa Therapist" and "Croupier"
// first looked uncovered, but BLS does profile Massage Therapists and Gambling
// Services Workers, both with real pay data. Adding new careers for them would
// have thrown away the sourced figures, so those terms are aliases instead -
// see add_search_aliases.js. The guard at the bottom of this file now catches
// that mistake: a new career cannot claim a term an existing career owns.
//
// Data honesty rule for this file, which the older curated careers do not
// follow: no invented pay bands and no invented growth percentages. Where no
// survey exists, salary and growth say so. Career.html reads the literal string
// 'Not published' to switch those cards into an honest empty state, so do not
// paraphrase it here - any other wording will be shown to the user as if it were
// a real figure.
//
// Sources used for the role names and qualification levels:
//   NSDC National Occupational Standards (Government of India, Sector Skill
//   Councils) - Handicrafts & Carpet, Textile, Apparel, Gem & Jewellery,
//   Agriculture, Beauty & Wellness, Logistics.
//   NSQF (National Skills Qualification Framework) levels 3-7.
// Occupational levels are quoted as ranges because pay and entry routes vary
// enormously by state, city and whether the worker is on a platform or a payroll.
//
// Usage: node scripts/new_careers.js [--apply]

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const dataPath = path.join(ROOT, 'careers-data.js');

// These two strings are a contract with Career.html, not just text. The page
// compares against them to decide whether to show a figure or an honest gap.
const NOT_PUBLISHED = 'Not published';
const NO_OUTLOOK = 'No published outlook';

const NEW_CAREERS = [
  {
    id: 'x-tailoring-textiles',
    title: 'Tailoring, Embroidery & Handloom Weaving',
    cat: 'trades',
    catName: 'Skilled Trades & Craft',
    icon: '🧵',
    tagline: 'Clothes made to a person, not to a size chart.',
    desc: 'Cutting, stitching and finishing garments by hand or on machines, from a single alteration on a Tuesday morning to a full handloom bolt of cloth. Includes tailoring, dressmaking, embroidery, weaving, block printing and upholstery.',
    stream: 'Any Stream (Artistic & Manual Aptitude)',
    salary: NOT_PUBLISHED,
    growth: NO_OUTLOOK,
    demand: 'Steady',
    aiImpact: 'Machines got faster, craftspeople did not — Pattern-cutting CAD and machine embroidery now do the repetitive work. What cannot be automated is a drape that sits right on one specific body, or reading whether a customer actually wants the change they asked for.',
    aiTag: 'protected',
    overview: 'This is the trade behind Indian textiles, and it runs on skill rather than a degree. A tailor might do nothing but alterations on one street for twenty years; a Chikankari worker in Lucknow might do nothing but a single white-on-white shadow stitch on mul. Both are specialised, both are hard to get into, and neither is well served by a four-year degree. NSDC lists tailoring, embroidery and weaving as separate National Occupational Standards under the Handicrafts & Carpet, Textile and Apparel councils, most at NSQF level 3 or 4. Getting paid properly usually means one of three things: owning the machine, knowing a stitch nobody else nearby does, or supplying a designer or export house that has the orders. Working for someone else on a piece rate means the shop owner captures most of the margin, and that is the single most important thing to understand before starting.',
    education: {
      highSchoolPrereqs: 'Mathematics for measurement and proportion, Art or Craft subject, and a working hand. Nothing here is gated on a certificate.',
      entranceExams: 'No entrance exam. NSQF Level 3-4 certification through an NSDC or Sector Skill Council affiliated centre, or an ITI trade test in Cutting & Tailoring / Embroidery / Weaving.',
      undergradDegrees: [
        'B.Voc in Apparel Manufacturing',
        'B.Des in Fashion Design or Textile Design',
        'Diploma in Cutting & Tailoring (NSDC / ITI)',
        'B.A. in Indian Textile Craft Studies',
      ],
      postgradDegrees: [
        'M.Des in Costume Design or Textiles',
        'M.A. in Indian Art and Craft History',
        'Diploma in Heritage Textile Conservation',
      ],
      certifications: [
        'NSQF Level 4 Tailor Certification (NSDC)',
        'Zer stitch / Moka / Aari Chikankari certification from a State Handicrafts Council',
        'Upholstery and Furniture Finishing certificate',
        'Textile Testing and Quality Assurance (wool / cotton grading)',
      ],
      topInstitutes: [
        'National Institute of Fashion Technology (NIFT) - craft and handloom departments',
        'National Handicrafts Development Corporation (NHDC) training centres',
        'State Handicrafts Councils (Uttar Pradesh, Madhya Pradesh, Tamil Nadu, Rajasthan)',
        'Textile and Apparel Sector Skill Councils',
      ],
    },
    roadmap: {
      phase1: 'Years 0-2 (Learner): Apprentice to an established tailor or weaver. Learn to read a pattern, take measurements without errors, and finish a garment to a standard that survives being worn a hundred times. Take an NSQF or ITI certification so the skill is portable if you move.',
      phase2: 'Years 2-5 (Working Artisan): Take work directly from customers or supply a small studio. Specialise in one thing that is hard to find locally - a specific stitch, a specific weave, or alterations for a body shape no one else caters to. Build the reputation that lets you charge more than the shop downstairs.',
      phase3: 'Years 5-10+ (Owner / Master Craftsperson / Designer Collaborator): Own a workshop and hire apprentices, move into custom work for designers, theatre and bridal clients, or go into heritage conservation and restoration. Many of the strongest earners never leave the craft and simply stop working for someone else.',
    },
    skills: {
      hardSkills: [
        'Pattern drafting and taking accurate measurements',
        'Hand and machine stitching (running, backstitch, overlock)',
        'Zari, zardozi, aari and chikankari embroidery techniques',
        'Handloom and powerloom weaving, warp and weft setup',
        'Block printing, resist dyeing and fabric finishing',
        'Upholstery, cutting and furniture covering',
        'Fabric selection, GSM and drape behaviour',
      ],
      softSkills: [
        'Reading what a customer actually wants, not just what they said',
        'Patience with repeat, precise manual work',
        'Managing a home workshop and small order books',
        'Negotiating piece rates and deadlines with suppliers',
        'Colour sense and a feel for proportion',
      ],
    },
    roles: [
      'Tailor / Master Tailor',
      'Dressmaker &amp; Couture Assistant',
      'Embroidery Worker (Aari, Zari, Chikankari)',
      'Handloom Weaver &amp; Master Weaver',
      'Block Printer &amp; Craft Dyer',
      'Upholsterer &amp; Furniture Coverer',
      'Pattern Cutter',
      'Heritage Textile Conservator',
    ],
    decisionFit: {
      traits: [
        'Genuinely prefers making things with their hands',
        'Patient with work that takes hours and cannot be rushed',
        'Has an eye for proportion, drape and colour',
        'Comfortable earning a variable income rather than a fixed salary',
      ],
      workStyle: 'Workshop, home studio or shared industrial floor. Long hours seated, hands busy, phone beside the machine. Piece-rate or per-order pay, so income tracks how much you can produce and how good the result looks.',
      pros: [
        'Almost no barrier to entry - a machine, a needle and the willingness to practise',
        'A skill that cannot be shipped abroad and cannot be done by a machine',
        'Demand survives automation, cheap imports and fast fashion because fit is personal',
        'Can start earning within months instead of years',
      ],
      cons: [
        'On a piece rate for someone else, most of the value is captured by the shop owner',
        'Income swings with seasons, festivals and the order book',
        'Back and shoulder strain from long hours at a machine or frame',
        'No formal seniority ladder - you either own the work or you do not',
      ],
    },
    reflectionQuestions: [
      'Would you rather make one thing properly for four hours than do four things quickly?',
      'Can you accept an income that changes every month, or do you need a fixed salary?',
      'Is your interest in the craft itself, or in eventually running your own label?',
    ],
    resources: [
      'NSDC National Occupational Standards - Tailor, Embroidery Worker, Weaver (nsdcindia.org)',
      'National Handicrafts Development Corporation training and market support (nhdc.org)',
      'Dastkar and India Craft House - handloom and craft market access',
      'NSDC-affiliated skill centres in your state',
    ],
    aka: [
      'Tailor', 'Seamstress', 'Dressmaker', 'Embroidery Worker', 'Handloom Weaver', 'Weaver',
      'Khadi Maker', 'Khadi', 'Block Printer', 'Chikankari Worker', 'Upholsterer',
      'Cobbler', 'Cutting Master', 'Zari Worker', 'Banarasi Weaver', 'Chanderi Weaver',
      'Pashmina Weaver', 'Powerloom Weaver', 'Textile Artisan', 'Shoe Maker',
      'Pattern Cutter', 'Alteration Specialist', 'Stitcher', 'Quilting', 'Quilting Artist',
      'Kantha Craft Worker', 'Phulkari Craft Worker', 'Kalamkari Artist', 'Batik Artist',
      'Carpet Weaver', 'Durry Maker', 'Pattachitra Artist', 'Sujani Craft Worker',
    ],
    edu: 'diploma',
    degrees: ['vocational', 'design', 'arts', 'any'],
    interests: ['design', 'build', 'machines', 'art'],
    compact: false,
  },

  {
    id: 'x-traditional-medicine',
    title: 'Ayurvedic, Unani & Homeopathic Practice',
    cat: 'health',
    catName: 'Healthcare & Medicine',
    icon: '🌿',
    tagline: 'Medicine from a tradition, licensed to practise it.',
    desc: 'Diagnosing, treating and dispensing herbal or constitutional remedies under AYUSH regulation. Requires a recognised degree from a Ministry of AYUSH institution plus registration with the relevant state council to practise legally.',
    stream: 'Science (PCB / Biology)',
    salary: NOT_PUBLISHED,
    growth: NO_OUTLOOK,
    demand: 'Steady',
    aiImpact: 'Pattern-matching on symptoms is exactly what a trained practitioner is for, and exactly what a diagnostic model does quickly. The parts being taken over are triage and second opinions. The part that holds is the relationship, the years of reading the same texts, and the legal licence to prescribe.',
    aiTag: 'people',
    overview: 'These are fully regulated clinical professions in India, not alternative guesses. To open a pharmacy or treat patients you need a recognised degree - BAMS, BUMS or BHMS - from an institution approved by the Ministry of AYUSH, followed by registration with your State AYUSH Council. That licence is the whole career: without it the work is not clinical. What the degree does not give you is patients, and that is the real work of the first five years. Most practitioners build a practice slowly through neighbourhood reputation, and the graduates who struggle are usually the ones who treated the degree as the finish line. Demand is real and mostly comes from chronic conditions people have stopped expecting a tablet to fix, plus a large diaspora market. Being honest with patients about what the evidence does and does not support is both the ethical position and, practically, the one that keeps a practice alive.',
    education: {
      highSchoolPrereqs: 'Science with Biology at 10+2. Chemistry matters for BAMS and BHMS pharmacy subjects. Admission is through NEET or state-level AYUSH tests.',
      entranceExams: 'NEET (AYUSH quota) for BAMS / BUMS / BHMS, or state AYUSH entrance exams, or direct university entry for some private colleges.',
      undergradDegrees: [
        'BAMS - Bachelor of Ayurvedic Medicine and Surgery (5.5 years)',
        'BHMS - Bachelor of Homeopathic Medicine and Surgery (5.5 years)',
        'BUMS - Bachelor of Unani Medicine and Surgery (5.5 years)',
        'B.Sc. in Indian Systems of Medicine (some states)',
      ],
      postgradDegrees: [
        'MD - Ayurveda / Homeopathy / Unani (3 years)',
        'MS - Surgery (Shastra) or Panchakarma',
        'PhD in Indian Systems of Medicine for teaching and research',
        'MD in Public Health or Pharmacology alongside clinical practice',
      ],
      certifications: [
        'State AYUSH Council registration (mandatory to practise)',
        'Pharmacy licence under the Drugs and Cosmetics Act',
        'Basic or Advanced Life Support',
        'Clinical Panchakarma certification for therapy roles',
      ],
      topInstitutes: [
        'National Institute of Ayurveda (NIA), Dehradun and Jaipur',
        'Institute of Post Graduate Teaching & Research in Ayurveda (IPGTRA), Jamnagar',
        'National Institute of Homeopathy (NIH), Kolkata',
        'National Institute of Unani Medicine (NIUM), Hyderabad',
        'Regional AYUSH colleges under state universities',
      ],
    },
    roadmap: {
      phase1: 'Years 0-5.5 (Degree): BAMS, BHMS or BUMS. Expect to study classical texts alongside modern anatomy, physiology, pathology and pharmacology, and to treat real patients under supervision from your second year.',
      phase2: 'Years 5.5-9 (Registration &amp; First Patients): Register with the State Council. Work as an assistant in an established clinic or as a junior in a hospital OPD to build real diagnostic confidence, then take independent patients.',
      phase3: 'Years 9+ (Established Practitioner / Specialist): Take an MD, specialise in a branch, teach, run a pharmacy under your own licence, or consult in a multi-disciplinary hospital alongside modern medicine.',
    },
    skills: {
      hardSkills: [
        'Classical diagnostic method in darshan / prakriti / miasms',
        'Ayurvedic pharmacology and formulation of herbo-mineral preparations',
        'Regulatory practice under the Drugs and Cosmetics Act and AYUSH',
        'Modern clinical diagnosis and differential reasoning',
        'Diet, dinacharya and lifestyle counselling',
        'Panchakarma and detoxification therapy procedures',
        'Medical record keeping and pharmacovigilance reporting',
      ],
      softSkills: [
        'Bedside manner and long-term patient trust',
        'Explaining a treatment plan in language a patient will actually follow',
        'Knowing when to refer to a modern specialist',
        'Working in a heavily regulated environment without shortcuts',
        'Building a practice from referrals over years rather than months',
      ],
    },
    roles: [
      'Ayurvedic Physician (BAMS)',
      'Homeopathic Practitioner (BHMS)',
      'Unani Physician (BUMS)',
      'Panchakarma Therapist',
      'Clinical Pharmacologist (Ayurveda)',
      'AYUSH Pharmacy Owner',
      'Medical Officer (AYUSH)',
      'Yoga &amp; Naturopathy Practitioner',
    ],
    decisionFit: {
      traits: [
        'Wants long clinical relationships rather than quick transactions',
        'Comfortable studying a classical curriculum alongside modern science',
        'Careful and methodical about dosage and record-keeping',
        'Open about the limits of the tradition they practise in',
      ],
      workStyle: 'Clinic, hospital OPD, or your own dispensary. Long consultation lists, heavy on trust and explanation. On-call in hospitals; appointment-driven and family-facing in private practice.',
      pros: [
        'A genuinely protected licence - the registration is legally required and hard to obtain',
        'Deep, constantly relevant demand for chronic-condition care',
        'Combine private practice with teaching, research or a hospital post',
        'Large diaspora and international wellness market',
      ],
      cons: [
        '5.5 years of study before you earn anything, then a slow start to practice',
        'Wide public disagreement about the evidence base makes every consultation a conversation',
        'Regulation and licensing compliance are ongoing, not a one-time cost',
        'A clinic needs capital, premises and patient flow, not just a degree',
      ],
    },
    reflectionQuestions: [
      'Are you comfortable spending 5.5 years in training before you earn anything?',
      'Could you tell a patient honestly where the evidence is thin?',
      'Do you want to treat patients every day, or would you rather study and teach?',
    ],
    resources: [
      'Ministry of AYUSH - national education and regulation (ayush.gov.in)',
      'National Commission for Allied and Healthcare Professions registration (natc.org.in)',
      'Central Council for Research in Ayurvedic Sciences (ccras.nic.in)',
      'State AYUSH Councils - registration, licensing and practitioner directories',
    ],
    aka: [
      'Ayurvedic Doctor', 'Ayurveda Practitioner', 'Ayurvedic Physician', 'Vaidya',
      'Homeopathy Doctor', 'Homeopathic Physician', 'Homeopath', 'Homeo Doctor',
      'Unani Practitioner', 'Unani Doctor', 'Hakim', 'Naturopath', 'Naturopathic Doctor',
      'Panchakarma Therapist', 'Herbal Medicine Practitioner', 'AYUSH Doctor',
      'Yoga Therapist', 'Marma Therapist', 'Siddha Practitioner', 'Kriya Practitioner',
    ],
    edu: 'master',
    degrees: ['health', 'science'],
    interests: ['health', 'science', 'people'],
    compact: false,
  },

  {
    id: 'x-gig-delivery-rider',
    title: 'Food Delivery & Gig Platform Rider',
    cat: 'trades',
    catName: 'Skilled Trades & Craft',
    icon: '🛵',
    tagline: 'The largest entry point into independent work in Indian cities.',
    desc: 'On-demand delivery and ride-hailing work for food, groceries, pharmacy and parcels. The dominant first job for people entering urban employment without a degree or a contact, and a genuine small business when run as one.',
    stream: 'Any Stream',
    salary: NOT_PUBLISHED,
    growth: NO_OUTLOOK,
    demand: 'Steady',
    aiImpact: 'Route optimisation, dispatch and surge pricing are already run by software, and autonomous delivery robots are being tested for exactly these last-mile routes. Delivery is one of the most heavily automated occupations going. The residual work is problem-solving a building with no lift, a customer who will not answer, and a payment that did not land.',
    aiTag: 'automation',
    overview: 'Be clear about what this is: the overwhelming majority of delivery work is platform work, not employment. That means no fixed salary, no paid leave, no provable income for a loan, and deductions per order that platforms change. It is a real and respected job, and for a lot of people it is the only work available right now. It is also the fastest route to understanding small-business economics in an Indian city - fuel, maintenance, depreciation, insurance, idle time and take rate - which is why many riders use it for a year or two and then move into logistics supervision, fleet ownership, or a delivery operation of their own. Treat the first six months as paid education in demand patterns and geography. The riders who do well learn which streets pay, which buildings eat twenty minutes, and when to log off. The ones who burn out treat every hour as hourly work instead of running a small fleet of one.',
    education: {
      highSchoolPrereqs: 'A valid driving licence, a smartphone, and a two-wheeler or bicycle in working condition. Nothing else is required.',
      entranceExams: 'None. Registration is through the platform, which requires documents and a vehicle.',
      undergradDegrees: [
        'Not required for any platform role',
        'B.Voc in Logistics and Supply Chain Management (for progression beyond riding)',
        'Diploma in Automotive Mechanics (reduces your own repair bill)',
        'Any degree, if you intend to move into operations or fleet management',
      ],
      postgradDegrees: [
        'MBA or PGDM in Logistics and Supply Chain Management',
        'BBA or B.Com with a logistics focus for fleet and operations roles',
      ],
      certifications: [
        'Valid two-wheeler driving licence (mandatory)',
        'Basic road safety and traffic rules awareness',
        'Safe driving and defensive riding course',
        'First Aid and CPR',
        'Motor vehicle insurance and fitness certification for your vehicle',
      ],
      topInstitutes: [
        'Local ITI in Motor Vehicle Mechanic (reduces your own repair bill)',
        'Logistics and Supply Chain Management departments at nearby colleges',
        'NSDC Logistics Sector Skill Council certification',
        'State road safety programmes run by the state transport department',
      ],
    },
    roadmap: {
      phase1: 'Months 0-3: Learn the city for money - which zones are busy at which hours, which buildings cost you time, and what your real hourly rate is after fuel, maintenance and deductions. Keep a spreadsheet. This stage is job training, and the riders who skip it are the ones who quit.',
      phase2: 'Months 3-18: Specialise. Peak hours, long-distance, pharmacy and grocery, or a smaller platform with better rates. Simultaneously build the two things that matter later - savings, and knowledge of how a delivery network is actually run.',
      phase3: 'Years 1.5+ (Fleet Owner / Operations / Supervisor): Own two to ten vehicles with drivers, move into a hub or dark store as a picker, packer or shift supervisor, or take a full-time role in last-mile operations, fleet management or city logistics planning. Savings from stage two are what make this possible.',
    },
    skills: {
      hardSkills: [
        'Defensive riding in heavy city traffic',
        'Route planning and building navigation',
        'Basic vehicle maintenance and tyre care',
        'Order handling, food safety and packaging basics',
        'Digital payment flows and cash handling',
        'Customer handling when an order goes wrong',
        'Reading app-based earnings, deductions and settlement',
      ],
      softSkills: [
        'Self-discipline without a supervisor',
        'Steadiness on a long shift',
        'Cash and digital-payment discipline',
        'Reading a neighbourhood quickly',
        'Handling a difficult customer without escalating',
      ],
    },
    roles: [
      'Food Delivery Rider',
      'Delivery Executive',
      'Warehouse Picker',
      'Packer',
      'Dark Store Executive',
      'Last Mile Dispatcher',
      'Fleet Owner (multi-vehicle)',
      'Dark Store Supervisor',
    ],
    decisionFit: {
      traits: [
        'Self-directed - nobody is setting your hours or checking your work',
        'Willing to start immediately with no credential in hand',
        'Steady and comfortable spending long hours on two wheels',
        'Interested in the business side, not just the hours',
      ],
      workStyle: 'Entirely self-employed and self-scheduled. Peak income in the evening and at weekends, weather-dependent, physically demanding, and out in the city rather than indoors.',
      pros: [
        'Start earning within days, with no degree, test or waiting list',
        'The schedule is genuinely yours - you can fit study, a second job or family around it',
        'A rare zero-experience entry point into urban commercial work',
        'Teaches small-business economics faster than any course',
      ],
      cons: [
        'No fixed salary, no leave, and income falls to near zero when you cannot ride',
        'Per-order deductions and platform commission can take a large share of the fare',
        'Accident, vehicle and health risk sits entirely with you',
        'Income drops with the weather, the season and any change in platform policy',
      ],
    },
    reflectionQuestions: [
      'Do you have savings to absorb a month with no riding at all?',
      'Could you work ten hours alone with nobody checking whether you did?',
      'Is this a first step toward something, or a career you want to stay in?',
    ],
    resources: [
      'NSDC Logistics Sector Skill Council - last-mile and courier qualifications (nsdcindia.org)',
      'Your platform partner in-app earnings and settlement screens (read the deductions line)',
      'State Transport Department road safety and licence resources',
      'Vehicle insurance and fitness documentation - verify yours are current',
    ],
    aka: [
      'Delivery Rider', 'Food Delivery Rider', 'Delivery Boy', 'Delivery Partner',
      'Swiggy Delivery', 'Zomato Delivery', 'Zomato Rider', 'Swiggy Rider',
      'Amazon Flex', 'Rapido Rider', 'Dunzo Rider', 'Porter', 'Last Mile Rider',
      'Bike Delivery Boy', 'Quick Commerce Rider', 'Packer', 'Warehouse Picker',
    ],
    edu: 'nodegree',
    degrees: ['any', 'vocational'],
    interests: ['transport', 'outdoors', 'numbers'],
    compact: false,
  },

  {
    id: 'x-freelance-independent',
    title: 'Freelance & Independent Professional',
    cat: 'creative',
    catName: 'Creative Arts & Design',
    icon: '🧑‍💻',
    tagline: 'Your skill is the business. Nothing is guaranteed, and nothing is imposed.',
    desc: 'Independent contracting across writing, design, development, video, marketing, translation and consulting. Fee-based project work without a single employer, built one client at a time.',
    stream: 'Any Stream',
    salary: NOT_PUBLISHED,
    growth: NO_OUTLOOK,
    demand: 'Steady',
    aiImpact: 'This is the single most disrupted occupation in the guide. Routine drafting, layout, first-draft code, basic editing and stock-level illustration can all be generated in minutes now. What clients still pay for is judgement about which of three plausible options is the right one, accountability if it goes wrong, and someone who already understands their specific business.',
    aiTag: 'creative',
    overview: 'This is a business model, not an occupation, and that distinction matters. Freelancers exist across every field listed in this guide - there is no single path in - and the ones who last are not the ones with the most talent, they are the ones who turned a skill into a repeatable commercial system. The pattern that works: pick one narrow thing you can do well, get paid for it repeatedly, raise your rate faster than your scope, and never let one client exceed a third of your income. The pattern that fails: a portfolio built while never quoting, a rate set by what a friend said they charge, and a dry spell treated as a personal failure when it is just a sales problem. Most of the first six months should be spent selling, not working. If you cannot describe your offer in one sentence that a stranger would repeat accurately, fix that before anything else.',
    education: {
      highSchoolPrereqs: 'None required. What matters is a demonstrable skill and the ability to sell it.',
      entranceExams: 'None. The market is the entrance exam.',
      undergradDegrees: [
        'Any degree helps with credibility, but a strong portfolio beats a degree in almost every field',
        'B.Des or BFA for design and illustration routes',
        'B.Tech / BCA / B.Sc. for development and data routes',
        'B.A. English or Media Studies for writing, editing and content routes',
        'B.Com / BBA for consulting and commercial routes',
      ],
      postgradDegrees: [
        'MBA (helps with pricing, positioning and client management more than with skill)',
        'MFA for fine art and illustration',
        'Specialised diplomas in a single discipline (film, sound, motion)',
        'No postgraduate qualification substitutes for a client base',
      ],
      certifications: [
        'Platform or vendor certifications in your toolchain (Adobe, AWS, Google, Meta, HubSpot)',
        'Upwork or Toptal profile (a real signal for international contracting)',
        'Copyright and contract literacy, especially ownership and usage rights',
        'Basic bookkeeping and Indian tax compliance for sole proprietors',
      ],
      topInstitutes: [
        'Any discipline where a good portfolio is buildable without a degree (self-taught or community-taught)',
        'Design and media short programmes (NID, Srishti, or equivalent)',
        'Skill development programmes run by NSDC or state skill councils',
        'Your actual clients - the first ten are more valuable than any course',
      ],
    },
    roadmap: {
      phase1: 'Months 0-6: Pick one narrow service and one industry. Build three portfolio pieces from real or spec work. Set your rate from research, not from guessing. Send a number of targeted pitches and expect most to be ignored - the volume of rejection is the price of entry.',
      phase2: 'Months 6-18: Turn repeat clients into retainers. Raise your rate, because a rising rate is the only reliable signal that you are getting better. Build a written scope template, a contract and an invoice process. Never work again without all three.',
      phase3: 'Years 1.5+ (Specialist / Agency / Productised Service): Specialise and charge a premium, subcontract and manage other freelancers, or turn the skill into a product - templates, a course, or a productised service at a fixed price. The aim is income that does not stop when you stop working.',
    },
    skills: {
      hardSkills: [
        'One deep, sellable specialisation (not a list of ten shallow ones)',
        'Client scoping, writing clear briefs and handling scope creep',
        'Contracts, usage rights, invoicing and basic tax compliance',
        'Portfolio presentation and a sharp written pitch',
        'Client relationship management and retention',
        'Pricing your work and putting the number in the first email',
      ],
      softSkills: [
        'Selling to strangers, repeatedly, without flinching',
        'Reliability and hitting a deadline someone else depends on',
        'Tolerating income unpredictability without panic',
        'Agreeing scope in writing before starting',
        'Saying no to work that is a bad fit',
      ],
    },
    roles: [
      'Freelance Writer / Content Writer',
      'Freelance Graphic Designer',
      'Freelance Web Developer',
      'Freelance Video Editor',
      'Independent Consultant',
      'Freelance Marketer',
      'Freelance Translator',
      'Independent Studio Owner',
    ],
    decisionFit: {
      traits: [
        'Comfortable selling, which most skilled people are not',
        'Structurally self-directed and good at self-accountability',
        'Tolerant of an income that arrives in lumps, not a salary',
        'Wants the autonomy more than the security',
      ],
      workStyle: 'Entirely self-determined. Location-independent, deadline-driven, project by project. Most of the work is finding it, not doing it.',
      pros: [
        'No employer and no ceiling on what your skill can be worth',
        'You choose the work, the client and the hours',
        'Can be run from anywhere, and alongside study or a day job',
        'Turns one deep skill into a genuinely valuable asset you own',
      ],
      cons: [
        'Income arrives in unpredictable lumps, and a dry spell is always one bad month away',
        'You are your own sales team, accounts department and HR department',
        'No employer-provided health cover, pension or paid leave in most arrangements',
        'Requires an existing skill and a portfolio before the first paying client',
      ],
    },
    reflectionQuestions: [
      'What exactly do you do, in one sentence a stranger could repeat accurately?',
      'How many months of expenses can you cover with no income at all?',
      'Have you actually been paid for your work yet, or only been paid in exposure?',
    ],
    resources: [
      'Upwork and Toptal talent directories (proving international demand exists)',
      'NSDC and state skill councils - self-employment and financial literacy modules',
      'Indian freelance and client communities for your specific discipline',
      'A book on service pricing and positioning for independent professionals',
    ],
    aka: [
      'Freelancer', 'Freelance Developer', 'Freelance Designer',
      'Independent Contractor', 'Gig Worker', 'Consulting Freelancer',
      'Freelance Video Editor', 'Freelance Marketer', 'Freelance Content Writer',
      'Independent Professional', 'Self Employed', 'Contract Writer', 'Contract Developer',
      'Remote Contractor', 'Portfolio Professional', 'Digital Marketing Specialist',
    ],
    edu: 'nodegree',
    degrees: ['any', 'design', 'arts', 'computing'],
    interests: ['design', 'words', 'tech', 'business'],
    compact: false,
  },

  {
    id: 'x-homestay-host',
    title: 'Homestay & Short-Let Host',
    cat: 'biz',
    catName: 'Business & Finance',
    icon: '🏡',
    tagline: 'Rent out the rooms you are not using. Then learn how to do it properly.',
    desc: 'Short-stay accommodation for visitors - a spare room, an entire flat, a serviced apartment, a homestay property, or a portfolio of them. Includes listing management, guest communication, cleaning operations and regulatory compliance.',
    stream: 'Any Stream',
    salary: NOT_PUBLISHED,
    growth: NO_OUTLOOK,
    demand: 'Steady',
    aiImpact: 'Listing copy, photo edits, pricing suggestions and guest message drafts are all handled by software now. What a host actually sells is a location, a clean handover, and someone who solves a problem at eleven at night. Nobody automates a locked door with a family asleep in the next room.',
    aiTag: 'people',
    overview: 'For anyone who owns property, or lives somewhere visitors actually want to stay, this is one of the shortest routes from a spare asset to real income. It is also a hospitality small business, and the people who do well treat it that way: professional cleaning, a reliable handover, fast replies, a clear cancellation policy, and honest photos. The most common failure is not bad luck - it is a host who accepts bookings they cannot comfortably house, or who responds slowly and loses the review that every future booking depends on. Regulation is worth checking before you list: short-term rental rules, municipal permission, fire safety, and how local tax and fire rules apply. Rules differ by city and by building, and a building society or resident association can be a harder gate than any law. The business scales from a single room to a serviced portfolio, but only after the operations are written down and someone else could run them.',
    education: {
      highSchoolPrereqs: 'None. You need a property, or a lease that allows it, and enough capital for furnishing and cleaning.',
      entranceExams: 'None. Owner or leaseholder only, with local approvals needed in many cities.',
      undergradDegrees: [
        'Not required',
        'BBA or B.Com with a hospitality or revenue focus (helps with pricing and accounting)',
        'BHM - Bachelor in Hotel Management (useful for moving into larger operations)',
        'Any degree, if you intend to build a portfolio rather than host one room',
      ],
      postgradDegrees: [
        'MBA in Hospitality or Revenue Management',
        'PG Diploma in Hospitality Administration',
        'M.Com for portfolio-level tax and accounting',
      ],
      certifications: [
        'Fire safety and building compliance for rental property',
        'First Aid and CPR',
        'Hospitality revenue management short courses',
        'Local short-term rental licensing, where it applies',
      ],
      topInstitutes: [
        'City-specific municipal short-term rental guidance and registration portals',
        'State tourism department standards for classified accommodation',
        'Hotel management schools (IHM and equivalents) for hospitality operations',
        'Your own local housing society or resident association rules - read these first',
      ],
    },
    roadmap: {
      phase1: 'Months 0-3: One listing, done properly. Furnish for the guest rather than for you, photograph it in daylight, write an accurate description, and set a cancellation policy you can honour. Check the local rules and your lease before accepting the first booking, not after.',
      phase2: 'Months 3-18: Systemise it. Written cleaning and handover checklists, guest communication templates, response-time habits that produce reviews, and accounting that shows the true margin after cleaning, linens, commission, repairs and idle weeks. Review the true hourly rate, not the nightly one.',
      phase3: 'Years 1.5+ (Portfolio / Operator / Property Business): Two to twenty units, possibly with staff. Or convert the same skills into a serviced apartment operator, a co-living space, or property management for owners who do not want to host. The skills are hospitality; the asset is property.',
    },
    skills: {
      hardSkills: [
        'Listing photography and honest, accurate copy',
        'Dynamic pricing and reading booking demand',
        'Handover, cleaning and linen operations written as checklists',
        'Guest communication under time pressure',
        'Basic accounting, margin tracking and tax compliance for a small business',
        'Property maintenance and vendor management',
        'Knowing and complying with local short-term rental and fire safety rules',
      ],
      softSkills: [
        'Fast, warm, reliable response to strangers',
        'Calm problem-solving when something breaks at night',
        'Attention to detail that a guest notices on arrival',
        'Consistency - the standard has to hold on the fiftieth booking',
        'Judgement about which bookings to decline',
      ],
    },
    roles: [
      'Homestay Host',
      'Short-Let Host',
      'Vacation Rental Owner-Operator',
      'Guesthouse Owner',
      'Serviced Apartment Operator',
      'Villa / Bungalow Rental Owner',
      'Co-Living Space Operator',
      'Property Experience Manager',
    ],
    decisionFit: {
      traits: [
        'Comfortable opening your home to strangers and staying professional with them',
        'Responsive, because reviews and refunds both move on how fast you answer',
        'Genuinely enjoys hosting rather than tolerating it for the rent',
        'Organised enough to write checklists and follow them',
      ],
      workStyle: 'Self-employed, largely asynchronous, with a hard deadline at every handover. In-property or remote, with cleaning and maintenance handled by you or by vendors you manage. Seasonal demand, with peaks around holidays and local events.',
      pros: [
        'Uses an asset you already own rather than buying another one',
        'Can start with one room and grow into a portfolio',
        'Genuinely flexible - you decide the calendar and the minimum stay',
        'Teaches hospitality, pricing and small-business management in one go',
      ],
      cons: [
        'Income is not rent - it varies with season and booking volume and can be zero',
        'Real ongoing costs of cleaning, linens, maintenance and commission eat the margin',
        'Local regulation, fire safety and building rules can block it outright',
        'Involves hosting strangers in your home, with all that implies',
      ],
    },
    reflectionQuestions: [
      'Do you live in a building whose rules allow this, and have you actually read them?',
      'What is your true hourly rate after cleaning, commission and repairs - not the nightly rate?',
      'Would you still want to answer a message at eleven at night during your holiday?',
    ],
    resources: [
      'Your city municipal short-term rental registration and licensing guidance',
      'Your building society or resident association rules (check before you list, not after)',
      'Your state tourism department classification standards for accommodation',
      'Hospitality revenue management and pricing short courses',
    ],
    aka: [
      'Airbnb Host', 'Homestay Host', 'Short Let Host', 'Vacation Rental Host',
      'Guesthouse Owner', 'Villa Owner', 'Home Stay Owner', 'B&B Owner',
      'Serviced Apartment Owner', 'Holiday Let Owner', 'Room Rentals Owner',
      'Co-Living Operator', 'Paying Guest Host', 'Farm Stay Host',
    ],
    edu: 'nodegree',
    degrees: ['any', 'commerce', 'management'],
    interests: ['business', 'people', 'outdoors'],
    compact: false,
  },
];

// --- validation -------------------------------------------------------------
const EXISTING = (() => {
  delete require.cache[require.resolve(dataPath)];
  return require(dataPath).CAREERS_ALL;
})();

const vocab = key => {
  const set = new Set();
  for (const c of EXISTING) {
    const v = c[key];
    for (const x of Array.isArray(v) ? v : [v]) if (x) set.add(x);
  }
  return set;
};
const KNOWN = {
  catName: vocab('catName'),
  edu: vocab('edu'),
  aiTag: vocab('aiTag'),
  degrees: vocab('degrees'),
  interests: vocab('interests'),
};

// Which career currently answers to each term. Used to reject a new career that
// duplicates an existing one - "Spa Therapist" looked uncovered but Massage
// Therapists already owned it, with real BLS pay attached.
const termOwners = new Map();
for (const c of EXISTING) {
  for (const t of [c.title, c.id, ...(c.aka || [])]) {
    const k = String(t).toLowerCase().trim();
    if (k && !termOwners.has(k)) termOwners.set(k, c);
  }
}

const problems = [];
const overlaps = [];
for (const c of NEW_CAREERS) {
  if (EXISTING.some(x => x.id === c.id)) problems.push('duplicate id: ' + c.id);
  if (EXISTING.some(x => x.title === c.title)) problems.push('duplicate title: ' + c.title);
  for (const k of ['tagline', 'desc', 'overview', 'aiImpact', 'salary', 'growth', 'stream']) {
    if (!c[k] || typeof c[k] !== 'string' || c[k].length < 3) problems.push(c.id + ': missing ' + k);
  }
  for (const k of ['catName', 'edu', 'aiTag']) {
    if (!KNOWN[k].has(c[k])) problems.push(c.id + ': ' + k + ' "' + c[k] + '" is not used anywhere else in the dataset');
  }
  for (const k of ['degrees', 'interests']) {
    for (const v of c[k]) if (!KNOWN[k].has(v)) problems.push(c.id + ': ' + k + ' "' + v + '" is not in the dataset vocabulary');
  }
  for (const k of ['highSchoolPrereqs', 'entranceExams', 'undergradDegrees', 'postgradDegrees', 'certifications', 'topInstitutes']) {
    if (!c.education[k]) problems.push(c.id + ': education.' + k + ' is empty');
  }
  for (const k of ['phase1', 'phase2', 'phase3']) if (!c.roadmap[k]) problems.push(c.id + ': roadmap.' + k + ' is empty');
  if (c.skills.hardSkills.length < 5) problems.push(c.id + ': too few hardSkills');
  if (c.skills.softSkills.length < 5) problems.push(c.id + ': too few softSkills');
  if (c.roles.length < 5) problems.push(c.id + ': too few roles');
  if (c.decisionFit.traits.length < 4) problems.push(c.id + ': too few decisionFit.traits');
  if (c.decisionFit.pros.length < 3) problems.push(c.id + ': too few decisionFit.pros');
  if (c.decisionFit.cons.length < 3) problems.push(c.id + ': too few decisionFit.cons');
  if (c.reflectionQuestions.length < 3) problems.push(c.id + ': too few reflectionQuestions');
  if (c.resources.length < 3) problems.push(c.id + ': too few resources');
  if (c.aka.length < 8) problems.push(c.id + ': too few aliases to be findable');

  // Duplicate alias inside this career, and collisions with existing careers.
  const self = new Set();
  for (const a of c.aka) {
    const k = a.toLowerCase().trim();
    if (self.has(k)) problems.push(c.id + ': alias "' + a + '" is listed twice');
    self.add(k);
    const other = termOwners.get(k);
    if (other) overlaps.push({ term: a, on: other.title, mine: c.title });
  }
  if (c.salary !== NOT_PUBLISHED && !c.bls) {
    problems.push(c.id + ': salary "' + c.salary + '" is a figure with no survey behind it. Use "' + NOT_PUBLISHED + '" or add real BLS data.');
  }
  if (c.growth !== NO_OUTLOOK && /\d/.test(c.growth)) {
    problems.push(c.id + ': growth "' + c.growth + '" contains a number but has no source.');
  }
}

if (overlaps.length) {
  console.error('ABORT - ' + overlaps.length + ' new aliases are already owned by an existing career.');
  console.error('These look like coverage gaps but are not. Either drop the new career, or');
  console.error('add the term to scripts/add_search_aliases.js so the career that already has');
  console.error('the data (and the BLS pay figures) keeps it.');
  overlaps.forEach(o => console.error('  "' + o.term + '" -> already on: ' + o.on + '  |  new career: ' + o.mine));
  process.exit(1);
}

if (problems.length) {
  console.error('ABORT - ' + problems.length + ' problems:');
  problems.forEach(p => console.error('  ' + p));
  process.exit(1);
}

const apply = process.argv.includes('--apply');
if (apply) {
  const merged = [...EXISTING, ...NEW_CAREERS];
  const header = "if (typeof window === 'undefined') { var window = global; }\n" + 'window.CAREERS_ALL = ';
  const footer = '\n' + "if (typeof module !== 'undefined' && module.exports) { module.exports = { CAREERS_ALL: window.CAREERS_ALL }; }\n";
  fs.writeFileSync(dataPath, header + JSON.stringify(merged, null, 2) + footer, 'utf8');
}

console.log('existing careers : ' + EXISTING.length);
console.log('new careers      : ' + NEW_CAREERS.length);
console.log('total            : ' + (EXISTING.length + NEW_CAREERS.length));
console.log('new aliases      : ' + NEW_CAREERS.reduce((a, c) => a + c.aka.length, 0));
if (apply) console.log('\nwrote careers-data.js');
else console.log('\nRe-run with --apply to write.');
