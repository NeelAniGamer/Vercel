// Append small / modern careers that the BLS handbook does not list, so niche
// searches (content creator, brewer, locksmith...) land on a real pathway too.
const fs = require('fs');
const path = require('path');

global.window = {};
require('../careers-data.js');
const flag = global.window.CAREERS_FLAGSHIP;
const glob = global.window.CAREERS_GLOBAL;

const NEWS = [
  {
    id: 'x-content-creator', cat: 'creative', catName: 'Media & Communication', icon: '\u{1F4F9}',
    title: 'Content Creator & YouTuber',
    tagline: 'Make things people choose to watch.',
    desc: 'Plan, shoot, edit and publish videos, shorts or newsletters, then read the numbers to work out what to make next. Income comes from ads, sponsorships, affiliate links and your own products rather than one employer.',
    stream: 'Any Stream',
    salary: 'Entry: $25K / \u20b92-5 LPA \u00b7 Mid: $65K / \u20b98-20 LPA \u00b7 Lead: $180K+ / \u20b950 LPA+',
    growth: '12% (Faster than average)', demand: 'Very High',
    aiImpact: 'Editing Tools Are Cheap Now \u2014 Auto-captions, thumbnails and rough cuts can be generated in minutes. What still holds up is a point of view people recognise and a reason to come back.',
    aiTag: 'people',
    overview: 'A content creator builds an audience by publishing on a schedule and paying close attention to what keeps people watching. The work runs from research and scripting to shooting, editing, community replies and deal-making with brands. Most creators start alone, on a phone, alongside study or a job, and only later bring in editors or managers.',
    education: {
      highSchoolPrereqs: 'Media, English, any subject you can explain clearly on camera.',
      entranceExams: 'None. Portfolio and published work do the talking.',
      undergradDegrees: ['B.A. in Mass Communication / Journalism', 'B.Sc in Film & Television Production', 'Any bachelor\'s degree with a published channel'],
      postgradDegrees: ['M.A. in Digital Media', 'Short-term creator programs (film schools, YouTube partner programs)'],
      certifications: ['Google Certified Professional \u2013 Creator & Content', 'Meta Blueprint (paid social advertising)', 'HubSpot Content Marketing Certification'],
      topInstitutes: ['Any college with a media lab', 'YouTube Creator Academy (free)', 'Your own channel, honestly']
    },
    roadmap: {
      phase1: 'Publish 50 pieces before you judge the idea. Learn one camera, one editor, one format you can repeat weekly without burning out.',
      phase2: 'Pick a niche you can own, build a second platform (newsletter, community) so an algorithm change cannot end you, and land your first paid partnerships.',
      phase3: 'Turn the audience into something you own \u2014 a product, a studio, a roster of creators \u2014 or move into brand-side creative direction.'
    },
    skills: {
      hardSkills: ['Scripting & Story Structure', 'Shooting & Lighting', 'Editing (Premiere / Final Cut / DaVinci)', 'Thumbnail & Title Testing', 'Analytics & Retention Curves'],
      softSkills: ['Consistency', 'Taking Feedback In Public', 'Taste', 'Directing Other People']
    },
    roles: ['YouTuber / Channel Owner', 'Short-Form Video Creator', 'Newsletter Writer', 'Creator Manager', 'Brand Content Producer'],
    decisionFit: {
      traits: ['Publishes even when nobody is watching', 'Comfortable being judged', 'Curious about a specific subject', 'Can work without a boss'],
      workStyle: 'Home studio, caf\u00e9s and hotel rooms; irregular hours around upload days; frequent travel for shoots.',
      pros: ['Work you own and can take anywhere', 'Income grows with audience, not with hours', 'Direct contact with the people who watch you'],
      cons: ['Income is irregular, especially in year one', 'Everything is public, including the failures', 'Algorithms you do not control decide half your reach']
    },
    reflectionQuestions: ['Do I keep making things even when nobody is commenting yet?', 'Can I publish on a fixed schedule for a year without being paid for it?', 'Am I okay with my work being judged in public?'],
    resources: ['YouTube Creator Academy (free)', '"Contagious" by Jonah Berger', 'Stanford Newsletter Writing Guide (free)', 'Creator Economy newsletters (The Publish Press, Latasha James)'],
    aka: ['YouTuber', 'Vlogger', 'Video Blogger', 'Content Creator', 'Channel Host', 'Short-Form Creator', 'Digital Creator', 'Online Presenter'],
    edu: 'bachelor', degrees: ['arts', 'design', 'any'], interests: ['words', 'design', 'tech'], compact: true
  },
  {
    id: 'x-podcast-producer', cat: 'creative', catName: 'Media & Communication', icon: '\u{1F3A4}',
    title: 'Podcast Producer & Audio Storytelling',
    tagline: 'Turn a conversation into something worth an hour.',
    desc: 'Book guests, run the interview, cut the tape and shape the episode so it holds attention. Small shows are one person doing all of it; big shows split research, production and sound design across a team.',
    stream: 'Any Stream',
    salary: 'Entry: $35K / \u20b93-7 LPA \u00b7 Mid: $72K / \u20b910-24 LPA \u00b7 Lead: $140K+ / \u20b940 LPA+',
    growth: '8% (As fast as average)', demand: 'High',
    aiImpact: 'Transcription And Cleanup Are Automated \u2014 show notes, cuts and ad reads can be drafted by software. Booking, interviewing and knowing what to leave out are still human work.',
    aiTag: 'automation',
    overview: 'A podcast producer takes an idea or a raw interview and shapes it into an episode people finish. That means research before the recording, careful editing after it, and a feel for pacing, music and where an ad belongs. Episodes can be made from anywhere, which is why independent producers often run several shows at once.',
    education: {
      highSchoolPrereqs: 'English, Media Studies, any language you can edit well in.',
      entranceExams: 'None.',
      undergradDegrees: ['B.A. in Journalism / Mass Communication', 'B.A. in English or Linguistics', 'B.Sc in Audio Production (some colleges)'],
      postgradDegrees: ['M.A. in Journalism', 'M.A. in Film / Media Studies'],
      certifications: ['Google Podcasts / Audio Production courses', 'Coursera: Audio Production (Michigan)', 'Pro Tools User Certification'],
      topInstitutes: ['Any journalism school', 'Reporting your way in: newsroom internships', 'Your own feed and a cheap microphone']
    },
    roadmap: {
      phase1: 'Make 20 episodes nobody asked for. Learn to record clean audio and cut a 45-minute conversation down to something with no dead air.',
      phase2: 'Specialise \u2014 a beat, a format, a language \u2014 pick up two or three paying clients or a network deal, and build a repeatable production rhythm.',
      phase3: 'Run your own slate of shows, move into commissioning and editing other producers, or build a small studio.'
    },
    skills: {
      hardSkills: ['Interviewing', 'Audio Editing (Audition / Reaper / Descript)', 'Sound Design & Music Beds', 'Research & Fact-Checking', 'Distribution & RSS Feeds'],
      softSkills: ['Making Strangers Talk', 'Judging What To Cut', 'Deadlines', 'Discretion With Guests']
    },
    roles: ['Podcast Producer', 'Audio Editor', 'Show Booker / Researcher', 'Sound Designer', 'Network Development Producer'],
    decisionFit: {
      traits: ['Listens more than talks', 'Notices pacing and dead air', 'Patient with messy first drafts', 'Reliable with deadlines'],
      workStyle: 'Home or studio booths, remote interviews across time zones, hard deadlines the day before release.',
      pros: ['Cheap to start and easy to show as proof of work', 'Remote and portable', 'Deep relationships with guests and listeners'],
      cons: ['Audio work is invisible when it is done well', 'Irregular client income', 'Long hours of listening before anything ships']
    },
    reflectionQuestions: ['Do I enjoy editing far more than performing?', 'Can I sit with a three-hour interview and find the eight minutes that matter?', 'Am I comfortable asking uncomfortable questions politely?'],
    resources: ['"Out on the Wire" by Jessica Abel', 'Transom.org (story craft)', 'Sound on Sound recording guides', 'RSVP: Reveal, Slate, This American Life process notes'],
    aka: ['Podcast Producer', 'Podcast Editor', 'Audio Producer', 'Radio Producer', 'Show Producer', 'Story Editor', 'Audio Storyteller'],
    edu: 'bachelor', degrees: ['arts', 'any'], interests: ['words', 'people'], compact: true
  },
  {
    id: 'x-esports-streamer', cat: 'creative', catName: 'Media & Communication', icon: '\u{1F3AE}',
    title: 'Esports Athlete & Streamer',
    tagline: 'Play competitively, or play in public.',
    desc: 'Two related routes: train and compete on a team for prize money, or stream gameplay live and build an audience that pays through subscriptions, donations and sponsorships. Most people do some of both.',
    stream: 'Any Stream',
    salary: 'Entry: $20K / \u20b91.5-4 LPA \u00b7 Mid: $55K / \u20b96-18 LPA \u00b7 Lead: $250K+ / \u20b980 LPA+',
    growth: '16% (Faster than average)', demand: 'High',
    aiImpact: 'Broadcast Tools Get Smarter \u2014 overlays, clips and moderation are increasingly automated. The personality, the rivalry and the live moment are the part people pay for.',
    aiTag: 'people',
    overview: 'Esports athletes practise on a fixed schedule, review footage and compete in leagues with coaches and analysts behind them. Streamers do something adjacent: they perform while they play, keeping a chat entertained for hours. Both paths reward mechanical skill, but the ones who last are the ones viewers enjoy watching.',
    education: {
      highSchoolPrereqs: 'None specifically. Sleep, eyesight and a stable connection matter more.',
      entranceExams: 'None.',
      undergradDegrees: ['Any bachelor\'s degree (esports does not require one)', 'B.Sc in Esports Management (select colleges)', 'B.Tech / B.S. if you want the business side'],
      postgradDegrees: ['MBA in Sports & Esports Management', 'M.A. in Media & Communication'],
      certifications: ['Esports coaching certifications', 'Streaming & production courses', 'Team management certifications'],
      topInstitutes: ['University esports programs (USA, EU)', 'Nodwin / Skyesports academies (India)', 'Self-taught, with a public track record']
    },
    roadmap: {
      phase1: 'Pick one game, climb the ranked ladder, and stream on a schedule even with zero viewers. Learn OBS, audio and a basic overlay.',
      phase2: 'Join a team or a league, or hit the point where regulars show up daily. Land first sponsorships and treat it like a job with hours.',
      phase3: 'Move into coaching, casting, content direction, or run your own org or channel brand.'
    },
    skills: {
      hardSkills: ['High-Level Mechanical Play', 'Live Production (OBS, overlays)', 'Community Management', 'Deal-Making & Sponsorships', 'Basic Video Editing'],
      softSkills: ['Handling Losing Publicly', 'Consistency', 'Banter Without Cruelty', 'Self-Motivation']
    },
    roles: ['Pro Player', 'Streamer / Broadcast Talent', 'Caster / Commentator', 'Team Coach', 'Community Manager'],
    decisionFit: {
      traits: ['Competitive but coachable', 'Can stream for hours without company', 'Learns from losses quickly', 'Comfortable with an irregular life'],
      workStyle: 'Long seated sessions, night-heavy schedules, travel for LAN events, constant online presence.',
      pros: ['No degree or gatekeeper required', 'Income can scale faster than the hours you put in', 'A global audience from a bedroom'],
      cons: ['Career window is short and body-hard', 'Income is volatile and platform-dependent', 'Public scrutiny follows you off screen']
    },
    reflectionQuestions: ['Am I competitive in a way that survives losing in front of people?', 'Would I still stream if nobody watched for six months?', 'Can I keep a sleep schedule doing this?'],
    resources: ['Twitch / YouTube Creator documentation', 'Esports Observer (industry news)', '"The Framework" by Jessica Sager (business side)', 'VOD review habits of pro teams'],
    aka: ['Esports Player', 'Pro Gamer', 'Streamer', 'Twitch Streamer', 'Caster', 'Shoutcaster', 'Content Streamer', 'Gaming Influencer'],
    edu: 'nodegree', degrees: ['any'], interests: ['sport', 'tech', 'business'], compact: true
  },
  {
    id: 'x-voice-actor', cat: 'creative', catName: 'Media & Communication', icon: '\u{1F5E3}',
    title: 'Voice Actor & Dubbing Artist',
    tagline: 'Be a whole cast of people with one voice.',
    desc: 'Record narration, characters, ads, audiobooks and dubbing tracks from a script. Work arrives as short sessions, so most voice actors jingle together many small clients, often from a home booth.',
    stream: 'Arts & Humanities / Any Stream',
    salary: 'Entry: $30K / \u20b92-6 LPA \u00b7 Mid: $68K / \u20b98-22 LPA \u00b7 Lead: $160K+ / \u20b945 LPA+',
    growth: '9% (As fast as average)', demand: 'Steady',
    aiImpact: 'Synthetic Voices Are Improving \u2014 standard narration is under pressure. Direction, performance and likeness rights remain with real performers.',
    aiTag: 'people',
    overview: 'A voice actor reads copy with enough control to make it sound effortless: changing pace, warmth and character without moving their face. Sessions are short and technical, so the job is as much about taking direction and delivering clean takes as it is about talent. Dubbing adds the challenge of matching lip sync in another language.',
    education: {
      highSchoolPrereqs: 'Drama, English, a second language helps for dubbing.',
      entranceExams: 'None.',
      undergradDegrees: ['B.A. in Theatre / Performing Arts', 'B.A. in English or Languages', 'Any bachelor\'s degree plus voice training'],
      postgradDegrees: ['M.A. in Theatre / Broadcast', 'Diploma in Acting & Voice'],
      certifications: ['Voice-over workshops (Boothcamp, edge Studio)', 'Audiobook narration certification (ACX/Skillshare)', 'Dubbing direction courses'],
      topInstitutes: ['National School of Drama (India)', 'Local theatre companies', 'Home studio plus a demo reel']
    },
    roadmap: {
      phase1: 'Build a quiet corner, a decent microphone and three demo reels (commercial, narration, character). Record constantly to learn your own voice.',
      phase2: 'Join casting platforms and agencies, get repeat clients, and raise rates as bookings become steady. Add a second language for dubbing work.',
      phase3: 'Direct sessions, build a roster, or move into casting and production for studios.'
    },
    skills: {
      hardSkills: ['Vocal Control & Breath', 'Script Interpretation', 'Home Recording & Editing', 'Taking Direction Remotely', 'Dubbing & ADR Timing'],
      softSkills: ['Rejection Tolerance', 'Punctuality', 'Versatility', 'Confidentiality']
    },
    roles: ['Commercial Voice Artist', 'Audiobook Narrator', 'Dubbing Artist', 'Character Voice Actor', 'Narration Specialist'],
    decisionFit: {
      traits: ['Controls voice and breath well', 'Can take the same line twelve ways', 'Happy working alone in a booth', 'Reliable with file deadlines'],
      workStyle: 'Home booth or studio sessions of 30\u201390 minutes, scattered across the day, lots of self-promotion between jobs.',
      pros: ['Work from anywhere with a decent microphone', 'Huge range of formats, from ads to games', 'No age ceiling the way screen acting has'],
      cons: ['Early years are a pile of small, unpaid or low-paid jobs', 'Income is per-session, with no salary floor', 'AI narration is compressing standard rates']
    },
    reflectionQuestions: ['Do I enjoy doing the same line twelve different ways?', 'Am I willing to market myself daily between bookings?', 'Can I handle silence after a casting you were sure you would get?'],
    resources: ['"The Voiceover Handbook" by William Williams', 'ACX / Audible narration guides', 'Edge Studio resources', 'Your own demo reel, made properly'],
    aka: ['Voiceover Artist', 'Voice Artist', 'Dubbing Artist', 'Narration Artist', 'ADR Artist', 'Character Voice', 'Audiobook Narrator', 'Announcer'],
    edu: 'bachelor', degrees: ['arts', 'any'], interests: ['words', 'sport'], compact: true
  },
  {
    id: 'x-sommelier', cat: 'service', catName: 'Hospitality & Service', icon: '\u{1F377}',
    title: 'Sommelier & Beverage Director',
    tagline: 'Know the bottle, and know the table.',
    desc: 'Choose, buy and serve the drinks list for a restaurant or hotel, train the floor staff on it, and taste far more wine than you can afford. The best part is matching a bottle to a person, not the medal on the wall.',
    stream: 'Any Stream',
    salary: 'Entry: $32K / \u20b92.5-6 LPA \u00b7 Mid: $62K / \u20b97-18 LPA \u00b7 Lead: $120K+ / \u20b932 LPA+',
    growth: '6% (As fast as average)', demand: 'High',
    aiImpact: 'Recommendation Apps Exist \u2014 but a list is built on relationships with growers and importers, and service is a human table. Automation helps with inventory, not with hospitality.',
    aiTag: 'people',
    overview: 'A sommelier builds the wine and beverage program: sourcing, pricing, storage, staff training and the moment a bottle lands on a guest\'s table. Alongside that is the craft of tasting critically enough to describe a wine without theatre. Senior sommeliers run the buying budget for whole venues.',
    education: {
      highSchoolPrereqs: 'No formal requirement. Hospitality, languages and food knowledge all help.',
      entranceExams: 'None.',
      undergradDegrees: ['Diploma in Hotel Management', 'B.Sc in Hospitality / Food & Beverage Management', 'Any bachelor\'s degree followed by floor experience'],
      postgradDegrees: ['PG Diploma in Wine & Spirits', 'MBA in Hospitality Management'],
      certifications: ['Court of Master Sommeliers (Introductory \u2192 Advanced)', 'WSET Level 2\u20134', 'ISG / Wine & Spirit Education Trust'],
      topInstitutes: ['Institute of Hotel Management (India)', 'Ferrandi / Cornell Hospitality', 'WSET schools worldwide']
    },
    roadmap: {
      phase1: 'Work the floor. Learn service, glassware and pours, taste deliberately, and pass the introductory sommelier exam.',
      phase2: 'Own a section of the list, run tastings for staff, negotiate with suppliers, and take advanced certifications.',
      phase3: 'Direct the beverage program for a group, consult on restaurant openings, or import and distribute yourself.'
    },
    skills: {
      hardSkills: ['Blind Tasting & Structured Notes', 'List Building & Costing', 'Storage & Service Standards', 'Supplier Negotiation', 'Staff Training'],
      softSkills: ['Reading a Table', 'Explaining Without Snobbery', 'Memory', 'Calm During Service']
    },
    roles: ['Sommelier', 'Beverage Director', 'Wine Buyer', 'Bar Manager', 'Wine Educator'],
    decisionFit: {
      traits: ['Genuinely curious about food and drink', 'Patient with beginners', 'Organised with budgets', 'Enjoys service, not just tasting'],
      workStyle: 'Evenings, weekends and holidays; long standing shifts; travel for vineyard visits and fairs.',
      pros: ['A craft that gets deeper every year', 'Direct path to running a real budget', 'Travel and producer relationships'],
      cons: ['Anti-social hours for years', 'Certifications cost real money', 'Alcohol exposure is part of the job']
    },
    reflectionQuestions: ['Do I like serving people, or only tasting for myself?', 'Am I okay working while everyone else is on holiday?', 'Would I study for exams after a twelve-hour shift?'],
    resources: ['WSET course guide', '"The World Atlas of Wine" by Hugh Johnson', 'GuildSomm essays', 'Guild of Sommeliers tasting grid'],
    aka: ['Sommelier', 'Wine Steward', 'Wine Buyer', 'Beverage Manager', 'Wine Director', 'Beverage Director', 'Wine Specialist'],
    edu: 'diploma', degrees: ['vocational', 'any'], interests: ['food', 'business'], compact: true
  },
  {
    id: 'x-craft-brewer', cat: 'trades', catName: 'Food & Craft Production', icon: '\u{1F37A}',
    title: 'Craft Brewer & Distiller',
    tagline: 'Biology, patience and a very clean floor.',
    desc: 'Run the mash, boil, ferment, condition and package beer or spirits to a recipe, keeping yields and cleanliness tight. Small breweries mean the brewer also does the ordering, the cleaning and often the serving.',
    stream: 'Science (PCM / PCB) / Any Stream',
    salary: 'Entry: $34K / \u20b92.5-6 LPA \u00b7 Mid: $58K / \u20b96-15 LPA \u00b7 Lead: $105K+ / \u20b926 LPA+',
    growth: '5% (High demand, steady growth)', demand: 'High',
    aiImpact: 'Recipes Can Be Modelled \u2014 but fermentation is a living, physical process judged by taste, and every batch behaves a little differently.',
    aiTag: 'protected',
    overview: 'Brewing is food science with a production schedule: milling, mashing, boiling, hopping, fermenting and conditioning, then cleaning everything so it can happen again tomorrow. Brewers taste constantly, adjust recipes against raw-material variation and keep detailed logs. Distilling follows the same idea with copper, heat and a lot more regulation.',
    education: {
      highSchoolPrereqs: 'Chemistry and Biology help; Maths for recipes and yields.',
      entranceExams: 'None.',
      undergradDegrees: ['B.Sc in Brewing & Distilling Science', 'B.Sc in Biotechnology / Microbiology', 'B.Tech in Food Technology'],
      postgradDegrees: ['M.Sc in Food Science & Technology', 'M.Tech in Fermentation Technology'],
      certifications: ['IBD (Institute of Brewing & Distilling) certificates', 'Siebel Institute brewing courses', 'Cicerone certification (for the service side)'],
      topInstitutes: ['UC Davis Brewing Program', 'Heriot-Watt (Scotland, brewing & distilling)', 'Food technology institutes in India']
    },
    roadmap: {
      phase1: 'Start as a cellar hand. Learn cleaning, transfers, packaging and the discipline of a brew log before you touch a recipe.',
      phase2: 'Take ownership of brew days, develop two or three house beers, and sit IBD or equivalent exams.',
      phase3: 'Run a brewery, become head distiller, or consult on recipes and plant setup for new ventures.'
    },
    skills: {
      hardSkills: ['Brewing & Fermentation Science', 'Recipe Design & Sensory Evaluation', 'CIP & Quality Control', 'Packaging Lines', 'Cellar & Yeast Management'],
      softSkills: ['Repetition Without Sloppiness', 'Sensory Attention', 'Physical Stamina', 'Cost Awareness']
    },
    roles: ['Cellar Hand', 'Brewer', 'Head Brewer', 'Distiller', 'Quality & Lab Technician'],
    decisionFit: {
      traits: ['Precise with measurements', 'Happy with repetitive physical work', 'Genuinely curious about flavour', 'Comfortable with early starts'],
      workStyle: 'Brewery floor: wet, warm, loud, early mornings, lifting and hoses, plus tasting sessions in between.',
      pros: ['A tangible product you can hold and sell', 'Apprenticeship routes with no degree required', 'A craft community that shares freely'],
      cons: ['Heavy physical work and strict hygiene regimes', 'Margins are thin; small breweries fail often', 'Weekend and holiday production runs']
    },
    reflectionQuestions: ['Do I enjoy following a process exactly, day after day?', 'Am I willing to clean for the first six months?', 'Would I still like beer after tasting forty samples in a morning?'],
    resources: ['"How to Brew" by John Palmer', 'IBD qualification guide', 'MBAA (Master Brewers) technical papers', 'Siebel Institute online courses'],
    aka: ['Brewer', 'Craft Brewer', 'Master Brewer', 'Distiller', 'Brewmaster', 'Cellar Worker', 'Fermentation Technician', 'Beer Maker'],
    edu: 'bachelor', degrees: ['science', 'engineering', 'vocational'], interests: ['food', 'machines', 'science'], compact: true
  },
  {
    id: 'x-beekeeper', cat: 'eco', catName: 'Agriculture & Outdoors', icon: '\u{1F41D}',
    title: 'Beekeeper & Apiary Manager',
    tagline: 'Keep forty thousand insects alive and working.',
    desc: 'Manage hives through the seasons: inspecting for disease, controlling swarms, harvesting honey and moving colonies to orchards for pollination. Many beekeepers run this beside another job until the apiary pays for itself.',
    stream: 'Science (PCB) / Any Stream',
    salary: 'Entry: $28K / \u20b92-4 LPA \u00b7 Mid: $48K / \u20b94-10 LPA \u00b7 Lead: $85K+ / \u20b918 LPA+',
    growth: '10% (Faster than average)', demand: 'High',
    aiImpact: 'Hive Sensors Monitor Temperature And Weight \u2014 so the data part is improving. Opening a hive, finding the queen and judging colony health is hands-on work in a box of stinging insects.',
    aiTag: 'protected',
    overview: 'Beekeeping follows the seasons: building colonies in spring, splitting before swarm season, placing hives near crops for pollination income, and harvesting late summer before winter stores are needed. Disease pressure, especially varroa mite, decides whether a colony survives. The work is outdoors, alone, and quietly meticulous.',
    education: {
      highSchoolPrereqs: 'Biology helps. A state beekeeping course is the usual starting point.',
      entranceExams: 'None.',
      undergradDegrees: ['B.Sc in Agriculture / Entomology', 'Diploma in Apiculture (select institutes)', 'Any bachelor\'s degree plus apprenticeship'],
      postgradDegrees: ['M.Sc in Entomology / Agricultural Science', 'M.Sc in Pollination Ecology'],
      certifications: ['State / national beekeeping certification', 'Food handling & honey processing certificates', 'Organic certification (for premium sales)'],
      topInstitutes: ['State agricultural universities (India)', 'Apiculture courses (Cornell, state extensions)', 'Local beekeepers\u2019 associations']
    },
    roadmap: {
      phase1: 'Keep two hives under a mentor for a full year. Learn to find the queen, read a frame and treat for mites on time.',
      phase2: 'Grow to 50\u2013100 colonies, sell pollination contracts and honey at farmers\u2019 markets, and register your operation.',
      phase3: 'Run 300+ hives with hired help, move into queen rearing, or supply equipment and training to other beekeepers.'
    },
    skills: {
      hardSkills: ['Hive Inspection & Queen Rearing', 'Pest & Disease Management', 'Honey Extraction & Extraction', 'Pollination Contracting', 'Record Keeping By Colony'],
      softSkills: ['Working Alone Outdoors', 'Calm Around Stings', 'Seasonal Planning', 'Patience With Slow Biology']
    },
    roles: ['Beekeeper', 'Apiary Manager', 'Queen Breeder', 'Pollination Contractor', 'Honey Processor'],
    decisionFit: {
      traits: ['Comfortable outdoors in all weather', 'Unbothered by stings', 'Detail-oriented on repetitive checks', 'Long-term thinker'],
      workStyle: 'Fields and orchards, seasonal peaks, early mornings in warm protective suits, solitary work.',
      pros: ['Low entry cost compared with most farms', 'Pollination income besides honey', 'Work that visibly helps ecosystems'],
      cons: ['Weather and disease can wipe a season', 'Physical work in heat, in a suit', 'Income grows slowly with colony count']
    },
    reflectionQuestions: ['Am I okay working alone outdoors for days at a stretch?', 'Can I handle being stung regularly without flinching?', 'Do I have another income source for the first two years?'],
    resources: ['"The Beekeeper\u2019s Bible"', 'State extension beekeeping guides', 'Dadant & Mann Lake equipment guides', 'Local beekeeping association mentors'],
    aka: ['Beekeeper', 'Apiarist', 'Apiary Manager', 'Honey Producer', 'Queen Breeder', 'Pollination Contractor'],
    edu: 'diploma', degrees: ['science', 'vocational'], interests: ['outdoors', 'science'], compact: true
  },
  {
    id: 'x-locksmith', cat: 'trades', catName: 'Skilled Trades & Craft', icon: '\u{1F511}',
    title: 'Locksmith & Security Hardware Technician',
    tagline: 'Open, install, upgrade, and answer at 2am.',
    desc: 'Fit and repair locks, safes, door closers and access control, and cut keys for homes, cars and offices. Emergency call-outs and security upgrades mean a locksmith is part craftsperson, part first responder for locked-out people.',
    stream: 'Any Stream',
    salary: 'Entry: $30K / \u20b92-5 LPA \u00b7 Mid: $55K / \u20b96-14 LPA \u00b7 Lead: $100K+ / \u20b925 LPA+',
    growth: '7% (As fast as average)', demand: 'High',
    aiImpact: 'Smart Locks Are Spreading \u2014 so the job now includes firmware, apps and wiring alongside pins and springs. Physical installation and non-standard doors stay firmly hands-on.',
    aiTag: 'protected',
    overview: 'A locksmith sells security and access: picking locks when legitimate, rekeying after a break-in, installing electronic access systems, and cutting keys to code. Vehicle work and safe servicing pay more and need specialised training. Many start with a van, a set of tools and a local reputation built on fast, honest emergency work.',
    education: {
      highSchoolPrereqs: 'Maths for measurements; DT or workshop classes help.',
      entranceExams: 'None.',
      undergradDegrees: ['ITI in Locksmithing / Security Systems', 'Diploma in Mechanical or Electronics Engineering', 'Apprenticeship with a registered locksmith'],
      postgradDegrees: ['Not usually required; advanced manufacturer training instead'],
      certifications: ['ALOA (Associated Locksmiths of America) certificates', 'Safe & vault technician certification', 'Electronic access control manufacturer training'],
      topInstitutes: ['ALOA training schools (USA)', 'ITI colleges (India)', 'Manufacturer programs (Abloy, Dormakaba, Assa Abloy)']
    },
    roadmap: {
      phase1: 'Apprentice under a working locksmith. Learn rekeying, key cutting, cylinder work and the legal side of who you may open.',
      phase2: 'Get licensed, buy a van, take emergency call-outs, and add vehicle and electronic access training.',
      phase3: 'Run your own contract business with corporate clients, or specialise in safes, forensics or access systems.'
    },
    skills: {
      hardSkills: ['Lock Picking & Rekeying', 'Key Cutting & Key Code Systems', 'Electronic Access & Smart Locks', 'Safe Servicing', 'Door Hardware Fitting'],
      softSkills: ['Discretion', 'Working Under Pressure', 'Explaining Risk Calmly', 'Punctuality For Emergencies']
    },
    roles: ['Locksmith', 'Security Technician', 'Safe Technician', 'Access Control Installer', 'Emergency Lockout Technician'],
    decisionFit: {
      traits: ['Steady hands', 'Respects confidentiality', 'Available at odd hours', 'Enjoys mechanical puzzles'],
      workStyle: 'Van-based, on call, doors and hardware at all heights, occasional late-night emergencies.',
      pros: ['No degree required and quick to start', 'Recession-resistant demand', 'Strong path to owning your own contract business'],
      cons: ['Being on call eats evenings and weekends', 'Liability when you get security wrong', 'Some call-outs are unpleasant situations']
    },
    reflectionQuestions: ['Am I comfortable being trusted with other people\u2019s security?', 'Can I be available at short notice for years?', 'Do I like mechanical puzzles more than paperwork?'],
    resources: ['ALOA certification pathway', 'MIT Locksmithing Guide (classic text)', 'Manufacturer training portals', 'Local licensing requirements (check your state/country)'],
    aka: ['Locksmith', 'Lock Smith', 'Safe Technician', 'Security Technician', 'Key Cutter', 'Access Control Technician', 'Emergency Locksmith'],
    edu: 'diploma', degrees: ['vocational', 'any'], interests: ['machines', 'build'], compact: true
  },
  {
    id: 'x-funeral-director', cat: 'service', catName: 'Human Care & Services', icon: '\u{1F6B4}',
    title: 'Funeral Director & Embalmer',
    tagline: 'Hold the worst day of someone\u2019s life together.',
    desc: 'Care for the deceased, prepare the body, arrange the service and guide families through paperwork, costs and decisions they are in no state to make. It is a regulated profession with real training behind it.',
    stream: 'Science (PCB) / Any Stream',
    salary: 'Entry: $38K / \u20b93-7 LPA \u00b7 Mid: $65K / \u20b98-18 LPA \u00b7 Lead: $115K+ / \u20b930 LPA+',
    growth: '5% (High demand, steady growth)', demand: 'High',
    aiImpact: 'Online Planning Tools Handle Bookings \u2014 but the care of a body and the presence beside a grieving family are not things people want automated.',
    aiTag: 'people',
    overview: 'Funeral directors combine practical care with quiet administration: preparing the deceased, coordinating transport, clergy and venues, and sitting with families to make decisions about the service. Embalming and restoration require specific licensure and a strong stomach. The hours include nights, weekends and holidays.',
    education: {
      highSchoolPrereqs: 'Biology, Psychology and any subject that builds composure.',
      entranceExams: 'None; professional licensing exams instead.',
      undergradDegrees: ['B.Sc in Mortuary Science / Funeral Service', 'Diploma in Funeral Direction', 'Any bachelor\u2019s degree plus apprenticeship'],
      postgradDegrees: ['M.A. in Grief Counselling (for the support side)'],
      certifications: ['Funeral Service Licensing (state board exams)', 'Embalmer licensure', 'Crematory operator certification'],
      topInstitutes: ['Funeral service colleges (USA, UK)', 'Apprenticeships with local funeral homes', 'Grief counselling institutes']
    },
    roadmap: {
      phase1: 'Apprentice in a funeral home. Learn transfers, paperwork, preparation and how to speak to families without a script.',
      phase2: 'Qualify and licence, take call-outs independently, and learn embalming and restoration to a professional standard.',
      phase3: 'Own or manage a funeral home, or move into pre-planning, bereavement care or training.'
    },
    skills: {
      hardSkills: ['Embalming & Preparation', 'Service Coordination', 'Regulatory & Paperwork Compliance', 'Restorative Techniques', 'Budgeting With Families'],
      softSkills: ['Composure', 'Discretion', 'Compassion Without Sentimentality', 'Availability']
    },
    roles: ['Funeral Director', 'Embalmer', 'Crematory Operator', 'Pre-Planning Consultant', 'Bereavement Counsellor'],
    decisionFit: {
      traits: ['Steady in difficult moments', 'Does not need constant praise', 'Organised under emotional load', 'Respects ritual and detail'],
      workStyle: 'Funeral home and hospital transfers, on-call nights and weekends, long emotionally heavy days.',
      pros: ['Work that genuinely matters to people', 'Stable demand regardless of the economy', 'Clear licensure path with good job security'],
      cons: ['Emotionally heavy and socially isolating at times', 'On-call work includes nights and holidays', 'Smaller towns can have limited openings']
    },
    reflectionQuestions: ['Can I be calm and practical while someone else is falling apart?', 'Am I comfortable with death as a daily part of work?', 'Do I mind that people may avoid telling others what I do?'],
    resources: ['NFDA (National Funeral Directors Association) guides', 'Thanatology texts on bereavement care', 'State licensing board requirements', 'Apprenticeship openings at local homes'],
    aka: ['Funeral Director', 'Mortician', 'Embalmer', 'Undertaker', 'Funeral Arranger', 'Crematory Operator', 'Bereavement Counsellor'],
    edu: 'diploma', degrees: ['health', 'vocational'], interests: ['people', 'health'], compact: true
  },
  {
    id: 'x-park-ranger', cat: 'eco', catName: 'Conservation & Outdoors', icon: '\u{1F333}',
    title: 'Park Ranger & Conservation Officer',
    tagline: 'Protect the place, and the people in it.',
    desc: 'Patrol parks and protected areas, enforce rules, run education programmes, fight fires and rescue visitors. Some roles lean toward law enforcement, others toward teaching school groups on a trail.',
    stream: 'Any Stream',
    salary: 'Entry: $38K / \u20b93-6 LPA \u00b7 Mid: $58K / \u20b96-14 LPA \u00b7 Lead: $95K+ / \u20b922 LPA+',
    growth: '6% (As fast as average)', demand: 'High',
    aiImpact: 'Drones And Sensors Assist Monitoring \u2014 but patrol, rescue and the conversation at a trailhead are human work in bad weather.',
    aiTag: 'protected',
    overview: 'Rangers split their time between enforcement, conservation work and public contact: checking permits, clearing trails, monitoring wildlife, handling incidents and leading guided walks. Fire seasons and busy summers define the calendar. Conservation officers carry law-enforcement powers and need separate training.',
    education: {
      highSchoolPrereqs: 'Biology, Geography, physical fitness.',
      entranceExams: 'Forest service / ranger entrance tests (varies by country).',
      undergradDegrees: ['B.Sc in Forestry / Environmental Science', 'B.Sc in Wildlife Biology', 'B.A. in Environmental Policy'],
      postgradDegrees: ['M.Sc in Conservation Science', 'M.Sc in Forestry'],
      certifications: ['Wilderness first responder', 'Firefighter certification', 'Law enforcement training (for conservation officers)'],
      topInstitutes: ['Forest research institutes (India)', 'SUNY College of Environmental Science (USA)', 'Wildlife Institute of India']
    },
    roadmap: {
      phase1: 'Volunteer or work seasonally. Get fit, learn first aid and fire behaviour, and understand how a protected area is actually managed.',
      phase2: 'Land a permanent posting, take enforcement or ecological monitoring responsibilities, and complete specialist certifications.',
      phase3: 'Move into district management, policy, or lead research and restoration projects.'
    },
    skills: {
      hardSkills: ['Navigation & Survival', 'Wildlife & Habitat Monitoring', 'Fire Suppression & Prevention', 'Incident & Rescue Response', 'Public Education Programmes'],
      softSkills: ['Calm In Emergencies', 'Explaining Rules Without Confrontation', 'Physical Fitness', 'Working Remotely']
    },
    roles: ['Park Ranger', 'Conservation Officer', 'Forest Guard', 'Wildlife Warden', 'Education Ranger'],
    decisionFit: {
      traits: ['Likes being outdoors in all seasons', 'Can enforce rules kindly', 'Physically fit', 'Comfortable alone on patrol'],
      workStyle: 'Parks, forests and reserves; early starts, weather-dependent, seasonal peaks in summer and fire season.',
      pros: ['Work outside, in places people pay to visit', 'Public-service pension and job stability', 'Real conservation impact'],
      cons: ['Seasonal and geographic competition for posts', 'Confrontation and danger are part of the job', 'Remote postings can be isolating']
    },
    reflectionQuestions: ['Would I rather be outside than in an office, year round?', 'Can I enforce a rule against someone who is angry with me?', 'Am I fit enough for rescue and fire work?'],
    resources: ['National park service employment pages', 'Wilderness First Responder courses', 'Forest survey & ecology field guides', 'Firefighter training (S-130/S-190)'],
    aka: ['Park Ranger', 'Forest Ranger', 'Conservation Officer', 'Wildlife Warden', 'Forest Guard', 'Naturalist', 'Game Warden'],
    edu: 'bachelor', degrees: ['science', 'any'], interests: ['outdoors', 'law', 'science'], compact: true
  },
  {
    id: 'x-commercial-diver', cat: 'trades', catName: 'Skilled Trades & Craft', icon: '\u{1F30A}',
    title: 'Commercial Diver & Underwater Technician',
    tagline: 'Work that happens where you cannot stand.',
    desc: 'Weld, inspect, repair and cut underwater on rigs, bridges, dams and ships. It is a trade with a short training pipeline, high pay for the hours, and an uncommon amount of risk.',
    stream: 'Science (PCM) / Any Stream',
    salary: 'Entry: $50K / \u20b95-10 LPA \u00b7 Mid: $90K / \u20b914-30 LPA \u00b7 Lead: $180K+ / \u20b955 LPA+',
    growth: '9% (As fast as average)', demand: 'Very High',
    aiImpact: 'ROVs Take The Most Dangerous Inspections \u2014 but someone still has to go down for non-standard repair work, and ROVs are piloted by trained divers.',
    aiTag: 'protected',
    overview: 'Commercial divers do physical work in cold, low-visibility water: inspecting hulls, welding splice repairs, clearing debris and operating hydraulic tools. Projects are short and travel-heavy, with crews moving between ports and sites. Training is intense and medical fitness is non-negotiable.',
    education: {
      highSchoolPrereqs: 'Physics, Maths, strong swimming ability.',
      entranceExams: 'Diving school admissions and medical tests.',
      undergradDegrees: ['Commercial Diving Diploma (1 year)', 'ITI in Welding / Industrial Maintenance', 'B.Tech in Ocean Engineering (for the engineering route)'],
      postgradDegrees: ['M.Tech in Ocean / Subsea Engineering'],
      certifications: ['IMCA / ADCI diver certification', 'Welding certifications (6G where possible)', 'Hyperbaric / medically fit to dive (annual)'],
      topInstitutes: ['Commercial diving schools (USA, UK, Australia)', 'IMCA-accredited training centres', 'ITI colleges (India) plus offshore certification']
    },
    roadmap: {
      phase1: 'Complete a commercial diving course, pass the medical, and take deckhand or tender work to build hours underwater.',
      phase2: 'Specialise in welding, inspection or saturation diving, and build the ticket history offshore companies require.',
      phase3: 'Move into dive supervision, project management, or run your own inspection crew.'
    },
    skills: {
      hardSkills: ['Underwater Welding & Cutting', 'Rigging & Hydraulic Tools', 'Inspection & NDT Basics', 'Decompression Procedures', 'Boat & Deck Safety'],
      softSkills: ['Discipline Under Risk', 'Physical Fitness', 'Calm In Low Visibility', 'Team Reliance']
    },
    roles: ['Commercial Diver', 'Underwater Welder', 'Rope Access & Inspection Diver', 'Dive Supervisor', 'ROV Technician'],
    decisionFit: {
      traits: ['Comfortable in confined, dark water', 'Very physically fit', 'Follows safety procedure to the letter', 'Likes travel'],
      workStyle: 'Offshore rigs, ports and dams; shifts away from home for weeks; cold water and heavy kit.',
      pros: ['Pay rises fast with hours and tickets', 'Short training pipeline for the salary', 'Unusual, genuinely interesting work'],
      cons: ['Real physical danger and long-term health effects', 'Constant travel and time away from home', 'A career bounded by medical fitness']
    },
    reflectionQuestions: ['Am I calm in dark, confined water?', 'Can I accept months away from home each year?', 'Do I follow safety rules without cutting corners when I am tired?'],
    resources: ['ADCI (Association of Diving Contractors) standards', 'IMCA competency guides', 'Underwater Welding schools & course fees', 'Diving medical examiner lists'],
    aka: ['Commercial Diver', 'Underwater Welder', 'Diver', 'Offshore Diver', 'Saturation Diver', 'Dive Supervisor', 'Inland Diver'],
    edu: 'diploma', degrees: ['vocational', 'engineering'], interests: ['machines', 'outdoors', 'build'], compact: true
  },
  {
    id: 'x-doula', cat: 'health', catName: 'Healthcare & Wellness', icon: '\u{1F476}',
    title: 'Doula & Birth Support Worker',
    tagline: 'Be the calm person in the room.',
    desc: 'Support people through pregnancy, labour and the first weeks after birth: practical help, pain-coping techniques and an advocate who is not part of the medical team. Training takes months, not years, and most start while working something else.',
    stream: 'Science (PCB) / Any Stream',
    salary: 'Entry: $25K / \u20b91.5-4 LPA \u00b7 Mid: $48K / \u20b95-12 LPA \u00b7 Lead: $85K+ / \u20b918 LPA+',
    growth: '11% (Faster than average)', demand: 'High',
    aiImpact: 'Apps Track Contractions And Due Dates \u2014 they cannot hold a hand, make a partner useful, or negotiate with a ward at 3am.',
    aiTag: 'people',
    overview: 'Doulas provide non-medical support: visiting clients through pregnancy, making birth plans, staying through labour, and helping with feeding and recovery afterwards. Evidence suggests continuous support improves birth outcomes, which is why hospitals and insurers increasingly recognise the role. Most work privately, client by client.',
    education: {
      highSchoolPrereqs: 'Biology and Psychology help. Empathy is the actual prerequisite.',
      entranceExams: 'None.',
      undergradDegrees: ['Any bachelor\u2019s degree (no specific requirement)', 'B.Sc in Nursing (if moving toward clinical roles)', 'B.A. in Psychology / Social Work'],
      postgradDegrees: ['Certification in perinatal health', 'Midwifery (for clinical progression)'],
      certifications: ['DONA International doula certification', 'Lactation consultant (IBCLC) pathway', 'Infant CPR & first aid'],
      topInstitutes: ['DONA International training', 'Local birth worker collectives', 'Hospital volunteer programmes']
    },
    roadmap: {
      phase1: 'Take a doula training course, attend a set number of births as a trainee, and read the evidence on labour and feeding.',
      phase2: 'Get certified, set a fee structure, build referral relationships with midwives and clinics, and add postpartum support.',
      phase3: 'Add lactation or antenatal education credentials, train new doulas, or move into hospital-based support roles.'
    },
    skills: {
      hardSkills: ['Labour Support & Positioning', 'Pain-Coping Techniques', 'Feeding Support', 'Birth Plan Advocacy', 'Postpartum Recovery Guidance'],
      softSkills: ['Calm Presence', 'Non-Judgemental Support', 'Boundaries & Self-Care', 'Reading A Room Quickly']
    },
    roles: ['Birth Doula', 'Postpartum Doula', 'Lactation Support Worker', 'Antenatal Educator', 'Doula Trainer'],
    decisionFit: {
      traits: ['Stays calm when plans change suddenly', 'Does not need to be in charge', 'Genuinely likes people at their most stressed', 'Can keep confidences'],
      workStyle: 'Client homes, clinics and labour wards; on-call for weeks around each due date; irregular private income.',
      pros: ['Training measured in months, not years', 'Work with obvious, immediate meaning', 'Flexible schedule around other jobs'],
      cons: ['On-call nights for weeks at a time', 'Income is client-by-client and seasonal', 'Emotional weight when outcomes are hard']
    },
    reflectionQuestions: ['Can I stay calm and useful while someone is in intense pain?', 'Am I comfortable supporting a family without being the expert?', 'Can I switch off after a difficult birth?'],
    resources: ['DONA International certification guide', '"The Birth Partner" by Penny Simkin', 'Evidence on continuous labour support (Cochrane)', 'Infant feeding & lactation basics'],
    aka: ['Doula', 'Birth Doula', 'Labour Doula', 'Postpartum Doula', 'Birth Partner', 'Birthing Companion', 'Antenatal Educator'],
    edu: 'nodegree', degrees: ['any', 'health'], interests: ['people', 'health'], compact: true
  }
];

// Sanity: make sure nothing collides with an existing id or title.
const existingIds = new Set([...flag, ...glob].map(c => c.id));
const existingTitles = new Set([...flag, ...glob].map(c => c.title.toLowerCase()));
for (const c of NEWS) {
  if (existingIds.has(c.id)) throw new Error('duplicate id ' + c.id);
  if (existingTitles.has(c.title.toLowerCase())) throw new Error('duplicate title ' + c.title);
  if (!c.icon) c.icon = '\u2753';
}

glob.push(...NEWS);
console.log('added', NEWS.length, 'careers; total now', flag.length + glob.length);

// --- rewrite the file -------------------------------------------------------
const header =
  '// Global Careers & Occupations Dataset (' + (flag.length + glob.length) +
  ' Detailed Pathways \u00b7 50,000+ Indexed Titles)\n' +
  '// Pay, growth and job descriptions for OOH entries come from the U.S. Bureau of\n' +
  '// Labor Statistics Occupational Outlook Handbook (https://www.bls.gov/ooh/).\n' +
  '// Auto-generated by scripts/build_world_careers.js\n';

const body =
  '(function() {\n' +
  '  const root = typeof window !== \'undefined\' ? window : (typeof global !== \'undefined\' ? global : this);\n' +
  '  root.CAREERS_FLAGSHIP = ' + JSON.stringify(flag) + ';\n' +
  '  root.CAREERS_GLOBAL = ' + JSON.stringify(glob) + ';\n' +
  '  root.CAREERS_ALL = root.CAREERS_FLAGSHIP.concat(root.CAREERS_GLOBAL);\n' +
  '  if (typeof module !== \'undefined\' && module.exports) {\n' +
  '    module.exports = { CAREERS_FLAGSHIP: root.CAREERS_FLAGSHIP, CAREERS_GLOBAL: root.CAREERS_GLOBAL, CAREERS_ALL: root.CAREERS_ALL };\n' +
  '  }\n' +
  '})();\n';

fs.writeFileSync(path.join(__dirname, '..', 'careers-data.js'), header + body);
console.log('wrote careers-data.js');
