const fs = require('fs');

const NEW_CAREERS = [
  {
    id: "drone-uav",
    cat: "space",
    catName: "Aviation & Aerospace",
    icon: "🚁",
    title: "Drone Pilot, UAV Operations & Aerial Robotics",
    tagline: "Command autonomous unmanned aerial systems across surveying, defense, agriculture, and cinema",
    desc: "Plan and pilot commercial UAV operations, configure autonomous flight paths, capture multispectral LiDAR imagery, and maintain aerial robotics fleets complying with civil aviation regulations.",
    stream: "Science (PCM / Technical Vocational)",
    salary: "Entry: $62K / ₹6-10 LPA · Mid: $105K / ₹18-30 LPA · Lead: $165K+ / ₹50 LPA+",
    growth: "24% (Much faster than average)",
    demand: "Very High",
    aiImpact: "AI-Augmented — Autonomous computer vision and obstacle avoidance algorithms augment flight navigation, but licensed human command is legally mandatory.",
    overview: "Commercial drone pilots and UAV operations specialists pilot sophisticated multi-rotor and fixed-wing unmanned aircraft systems. They conduct high-precision aerial topography, infrastructure inspections (bridges, wind turbines, power grids), cinematic filming, precision agriculture spraying, and search-and-rescue reconnaissance. The role blends piloting dexterity with sensor payload mastery (thermal, multispectral, LiDAR) and geospatial data processing.",
    education: {
      highSchoolPrereqs: "Physics, Mathematics, and Computer Science.",
      entranceExams: "FAA Part 107 Commercial Drone Pilot License (USA) / DGCA Remote Pilot Certificate (India) / EASA Open/Specific Category (Europe).",
      undergradDegrees: [
        "B.S. / B.Tech in Unmanned Aircraft Systems",
        "B.Tech in Aerospace / Robotics Engineering",
        "B.Sc in Geoinformatics / Remote Sensing"
      ],
      certifications: [
        "FAA Part 107 Remote Pilot",
        "DGCA Remote Pilot License (Micro/Small Category)",
        "FLIR Infrared Thermography Level 1",
        "Pix4D Certified Professional",
        "Commercial Flight Radio Operator (RT)"
      ],
      topInstitutes: [
        "Embry-Riddle Aeronautical University (USA)",
        "University of North Dakota (USA)",
        "Indian Institute of Drones / DroneAcharya (India)",
        "Cranfield University (UK)",
        "Delft University of Technology (TU Delft, Netherlands)"
      ]
    },
    roadmap: {
      phase1: "Years 0–2 (Field Pilot & Data Capture): Secure commercial remote pilot certification (FAA Part 107 / DGCA). Log 100+ flight hours across real-estate mapping, roof inspections, and orthomosaic photogrammetry. Master Pix4D and DroneDeploy.",
      phase2: "Years 2–5 (Senior Sensor Specialist & Operations Lead): Operate high-voltage utility LiDAR, thermal flare inspections, and complex BVLOS (Beyond Visual Line of Sight) missions. Manage flight permits, airspace waivers, and ground crew logistics.",
      phase3: "Years 5–10+ (Chief Remote Pilot / Fleet Director): Oversee enterprise drone programs for mining giants, defense contractors, or infrastructure ministries. Direct autonomous drone-in-a-box dock stations and regulatory compliance."
    },
    skills: {
      hardSkills: [
        "Manual & Autonomous Drone Piloting",
        "LiDAR & Photogrammetry Processing (Pix4D, DroneDeploy)",
        "Aviation Weather Analysis & Airspace Law",
        "Payload Calibration (Thermal, Multispectral, Zoom)",
        "GIS & Orthomosaic Export (ArcGIS, QGIS)",
        "Battery Care & Avionics Soldering / Maintenance"
      ],
      softSkills: [
        "Situational Awareness & Risk Management",
        "Calm Decision-Making Under Gust/Emergency",
        "Client Communication & Site Logistics",
        "Checklist Discipline",
        "Spatial Orientation"
      ]
    },
    roles: [
      "Commercial Drone Pilot",
      "UAV Operations Specialist",
      "Aerial Photogrammetry & LiDAR Analyst",
      "BVLOS Flight Commander",
      "Drone Fleet Maintenance Engineer",
      "Chief Remote Pilot",
      "Aerial Cinematographer"
    ],
    decisionFit: {
      traits: [
        "Sharp hand-eye coordination",
        "Love for outdoor technology fieldwork",
        "Extreme procedural safety mindset",
        "Spatial visual acuity"
      ],
      workStyle: "Outdoor field deployments at job sites (wind farms, construction, mines) combined with indoor photogrammetry processing. High travel and active physical mobility.",
      pros: [
        "Exciting blend of aviation, robotics, and outdoor adventure",
        "Rapidly expanding commercial market across agriculture and energy",
        "High daily contractor day rates for certified sensor operators"
      ],
      cons: [
        "Subject to weather delays (high winds, rain, extreme cold)",
        "Heavy regulatory bureaucracy and airspace authorization delays",
        "Physical gear transport to remote locations"
      ]
    },
    dayInLife: [
      { time: "07:30 AM", activity: "Pre-Flight Weather & Airspace Check: Review METAR wind forecasts, NOTAMs, and submit LAANC airspace authorizations." },
      { time: "09:30 AM", activity: "Site Reconnaissance & Hardware Setup: Inspect propeller integrity, calibrate magnetometer, set RTK ground control base station." },
      { time: "11:00 AM", activity: "Autonomous Flight Execution: Monitor multi-rotor drone flying programmed grid at 120m AGL for LiDAR topographical scan." },
      { time: "02:30 PM", activity: "Data Quality Inspection & Point Cloud Processing: Verify geotagged imagery in Pix4D, check for blind spots or motion blur." },
      { time: "04:30 PM", activity: "Battery Storage & Fleet Maintenance: Balance-charge LiPo batteries to storage voltage, log flight telemetry in pilot logbook." }
    ],
    workMetrics: {
      remote: "30% Remote (Processing) / 70% Field Deployments",
      balance: "3.9 / 5.0",
      stress: "Moderate (Zero crash tolerance)",
      travel: "Frequent Regional Travel (30-50%)"
    },
    whoAvoids: [
      "People who want 100% sedentary desk work",
      "Those who dislike being outdoors in cold or hot weather",
      "Anyone who panics under unexpected equipment telemetry warnings"
    ],
    globalPay: {
      us: "Entry $62K · Mid $105K · Lead $165K+",
      in: "Entry ₹6-10 LPA · Mid ₹18-30 LPA · Lead ₹50 LPA+",
      uk: "Entry £35K · Mid £62K · Lead £95K+",
      uae: "Entry AED 14K/mo · Mid AED 28K/mo · Lead AED 45K/mo+"
    },
    topEmployers: [
      "DJI Enterprise & Skydio",
      "Surveying & Engineering Giants (AECOM, Jacobs)",
      "Defense Contractors (Lockheed Martin, IdeaForge, Garuda Aerospace)",
      "Renewable Energy Operators (NextEra, Adani Green)",
      "Cinematography Production Studios"
    ],
    tools: [
      "DJI Matrice 350 RTK / Skydio X2",
      "Pix4Dmapper & DroneDeploy",
      "ArcGIS Pro / QGIS",
      "FLIR Thermal Studio",
      "Mission Planner / QGroundControl",
      "Trimble RTK GPS Receivers"
    ],
    portfolioProjects: [
      "Create a centimeter-accurate 3D point cloud of a multi-acre historical building using RTK photogrammetry",
      "Conduct a simulated thermal solar panel fault inspection report detecting defective bypass diodes",
      "Draft a complete standard operating procedure (SOP) safety manual for enterprise BVLOS flight operations"
    ],
    exitOpportunities: [
      "Aviation Regulatory Inspector (FAA / DGCA)",
      "Autonomous Robotics Fleet Product Manager",
      "Commercial Drone Services Agency Founder"
    ],
    reflectionQuestions: [
      "Do I genuinely enjoy traveling to rugged industrial job sites rather than sitting in an office all day?",
      "Can I remain calm and execute immediate emergency return-to-home procedures if an engine fails at 400 feet?",
      "Am I excited about keeping up with rapid changes in airspace regulations and sensor technology?"
    ],
    resources: [
      "FAA DroneZone & Remote Pilot Study Guide",
      "DGCA DigitalSky Portal (India)",
      "DroneDeploy Academy — Photogrammetry Fundamentals",
      "\"Drone Professional 1 & 2\" by Louise Jupp",
      "Commercial UAV News & AUVSI Resources"
    ],
    aka: [
      "Drone Pilot",
      "UAV Operator",
      "Remote Pilot in Command (RPIC)",
      "Unmanned Aircraft Systems Pilot",
      "Drone Photogrammetry Specialist",
      "Drone Fleet Manager"
    ],
    edu: "bachelor",
    interests: ["tech", "machines", "space", "build"],
    degrees: ["engineering", "vocational", "computing"],
    aiTag: "automation"
  },
  {
    id: "spatial-computing-arvr",
    cat: "tech",
    catName: "Technology & AI",
    icon: "🥽",
    title: "AR/VR, Spatial Computing & Metaverse Architect",
    tagline: "Engineer 3D immersive volumetric interfaces and mixed-reality spatial computing environments",
    desc: "Build next-generation augmented reality, virtual reality, and spatial computing applications across visionOS, Meta Quest, and WebXR for training simulations, gaming, and 3D enterprise workspaces.",
    stream: "Science (PCM / Computing)",
    salary: "Entry: $90K / ₹10-16 LPA · Mid: $155K / ₹28-48 LPA · Lead: $260K+ / ₹75 LPA+",
    growth: "30% (Much faster than average)",
    demand: "Very High",
    aiImpact: "AI-Powered — Generative 3D meshes, NeRFs, and Gaussian splatting accelerate asset pipelines while human interaction designers craft spatial UX.",
    overview: "Spatial Computing and AR/VR Engineers build interactive, real-time 3D experiences that merge digital information with physical reality. Working across platforms like Apple Vision Pro (visionOS), Meta Quest, and spatial web (WebXR), they write high-performance C#, C++, and Swift code to render 90+ FPS stereoscopic displays, calibrate hand-tracking gestures, and design volumetric spatial interfaces for surgical training, aerospace digital twins, and immersive education.",
    education: {
      highSchoolPrereqs: "Physics, Mathematics, Computer Science.",
      entranceExams: "JEE Main / SAT / BITSAT / GRE for Master's programs in Computer Graphics.",
      undergradDegrees: [
        "B.S. / B.Tech in Computer Science & Engineering",
        "B.S. in Game Development & Interactive Media",
        "B.Des in Digital Product & Interaction Design"
      ],
      certifications: [
        "Unity Certified Professional: Programmer",
        "Unreal Engine Certified Developer",
        "Apple VisionOS Developer Accreditation",
        "AWS Certified Solutions Architect"
      ],
      topInstitutes: [
        "Carnegie Mellon University (Entertainment Technology Center, USA)",
        "MIT Media Lab (USA)",
        "USC School of Cinematic Arts (Interactive Media, USA)",
        "IIT Bombay (Industrial Design Centre, India)",
        "University of Tokyo (Virtual Reality Educational Center, Japan)"
      ]
    },
    roadmap: {
      phase1: "Years 0–2 (3D Engine & Shader Fundamentals): Master Unity/Unreal Engine, C#, 3D math (vectors, quaternions, matrix transformations), and linear algebra. Build interactive VR demo prototypes and publish a side project on SideQuest or Steam.",
      phase2: "Years 2–5 (Senior Spatial Engineer): Architect hand-tracking gestures, eye-tracking gaze interactions, spatial audio, and WebXR networking. Optimize draw calls and GPU memory to ensure zero-latency 90 FPS rendering.",
      phase3: "Years 5–10+ (Principal Spatial Architect / VP of Immersive): Lead enterprise spatial design teams building digital twin simulations for aerospace, defense, or global surgical training platforms."
    },
    skills: {
      hardSkills: [
        "Unity (C#) & Unreal Engine 5 (C++ / Blueprints)",
        "Linear Algebra, Quaternions & Vector Mathematics",
        "visionOS (SwiftUI, RealityKit, ARKit)",
        "Shader Programming (HLSL / GLSL)",
        "3D Asset Optimization & LOD Management",
        "Spatial Audio & Inverse Kinematics (IK)"
      ],
      softSkills: [
        "3D Spatial Visualization & Ergonomics",
        "Empathy for User Motion Sickness & Comfort",
        "Creative Artistic Collaboration",
        "Performance Obsession"
      ]
    },
    roles: [
      "Spatial Computing Engineer",
      "AR/VR Developer",
      "visionOS Application Engineer",
      "Unreal Engine Simulation Developer",
      "Virtual Reality Interaction Designer",
      "Principal Immersive Architect",
      "Technical Artist (Shaders & Lighting)"
    ],
    decisionFit: {
      traits: [
        "Obsession with 3D games and simulated worlds",
        "Strong mathematical foundation in geometry and vectors",
        "Curiosity about human perception and ergonomic optics"
      ],
      workStyle: "High-focus software engineering using headsets and multiple monitors. High remote and hybrid work availability.",
      pros: [
        "Pioneering the frontier of post-smartphone human-computer interaction",
        "Exceptional compensation from Big Tech and enterprise simulation giants",
        "Creative freedom blending game design with hardcore computer science"
      ],
      cons: [
        "Constant headset testing can cause eye fatigue and simulator sickness",
        "Evolving hardware standards requiring frequent retooling",
        "High performance pressure: drops below 90 FPS ruin user experience"
      ]
    },
    dayInLife: [
      { time: "09:30 AM", activity: "Engine Standup & Spatial Review: Test hand-gesture pinch latencies on latest Apple Vision Pro / Quest 3 development build." },
      { time: "11:00 AM", activity: "Custom Shader Coding: Write HLSL shader to render volumetric glass refraction and spatial depth occlusions." },
      { time: "02:00 PM", activity: "Ergonomics & Comfort Playtesting: Measure frame pacing in RenderDoc to ensure zero dropped frames during fast head turns." },
      { time: "03:30 PM", activity: "Spatial UI Integration: Hook up SwiftUI RealityKit components with multiplayer WebSockets for collaborative 3D rooms." },
      { time: "05:00 PM", activity: "Profiling & Code Review: Review memory footprint of 3D glTF models with technical art team." }
    ],
    workMetrics: {
      remote: "85% Remote / Hybrid",
      balance: "4.1 / 5.0",
      stress: "Moderate",
      travel: "Minimal (<10%)"
    },
    whoAvoids: [
      "Developers who hate 3D geometry and vector math",
      "People sensitive to motion sickness when wearing VR headsets",
      "Engineers who only want simple 2D web CRUD applications"
    ],
    globalPay: {
      us: "Entry $90K · Mid $155K · Lead $260K+",
      in: "Entry ₹10-16 LPA · Mid ₹28-48 LPA · Lead ₹75 LPA+",
      uk: "Entry £50K · Mid £90K · Lead £150K+",
      uae: "Entry AED 20K/mo · Mid AED 40K/mo · Lead AED 65K/mo+"
    },
    topEmployers: [
      "Apple (visionOS Team)",
      "Meta (Reality Labs)",
      "Epic Games & Unity Technologies",
      "Microsoft (Mixed Reality & HoloLens)",
      "Medical Simulation Providers (Osso VR, Touch Surgery)"
    ],
    tools: [
      "Unity & Unreal Engine 5",
      "Xcode & Reality Composer Pro",
      "RenderDoc & GPU Profilers",
      "Blender & Maya (Pipeline)",
      "Git & Perforce",
      "OpenXR & WebXR"
    ],
    portfolioProjects: [
      "Build a functional mixed-reality visionOS or Quest hand-tracking laboratory simulation where users assemble a jet turbine in 3D",
      "Create a multi-user WebXR spatial meeting room using Three.js and WebSockets running smoothly on mobile browsers",
      "Write a custom volumetric water shader in HLSL optimized for standalone VR headsets targeting 90 FPS"
    ],
    exitOpportunities: [
      "VP of Immersive Technology",
      "Autonomous Robotics Simulation Lead",
      "Interactive Game Studio Founder"
    ],
    reflectionQuestions: [
      "Am I captivated by how human brains perceive 3D space, depth, and virtual objects?",
      "Can I debug complex mathematical transformation matrices and quaternion rotations without getting frustrated?",
      "Do I want to build the platforms that might replace mobile phones over the next decade?"
    ],
    resources: [
      "Apple Developer — visionOS Documentation & WWDC Sessions",
      "Unity Learn — Virtual Reality & Spatial Computing Pathway",
      "\"Real-Time Rendering\" by Tomas Akenine-Möller",
      "OpenXR Specification Guide",
      "Road to VR & UploadVR Industry Publications"
    ],
    aka: [
      "AR Developer",
      "VR Developer",
      "Spatial Computing Engineer",
      "visionOS Engineer",
      "Mixed Reality Developer",
      "3D Graphics Programmer"
    ],
    edu: "bachelor",
    interests: ["tech", "design", "art", "machines"],
    degrees: ["computing", "engineering", "design"],
    aiTag: "creative"
  },
  {
    id: "game-designer",
    cat: "creative",
    catName: "Creative & Design",
    icon: "🎮",
    title: "Video Game Designer & Gameplay Mechanics Lead",
    tagline: "Architect interactive worlds, player motivation systems, and emergent game mechanics",
    desc: "Create game design documents (GDD), balance numerical progression economies, script interactive level puzzles, and orchestrate player psychology for indie hits and AAA franchises.",
    stream: "Any Stream (Arts / Science / Design)",
    salary: "Entry: $68K / ₹7-12 LPA · Mid: $125K / ₹22-40 LPA · Lead: $195K+ / ₹65 LPA+",
    growth: "18% (Faster than average)",
    demand: "High",
    aiImpact: "AI-Augmented — Procedural world generation and AI dialogue accelerate drafting, but core artistic gameplay balance requires human craft.",
    overview: "Video Game Designers are the architects of interactive play. Unlike programmers who write engine code or artists who paint textures, game designers conceive the rules, pacing, reward loops, combat systems, and emotional arcs that make a game fun and meaningful. They prototype mechanics in engines, balance mathematical economy spreadsheets, script quests, and conduct rigorous playtesting.",
    education: {
      highSchoolPrereqs: "Any stream with strong analytical thinking, storytelling, or computing.",
      entranceExams: "Portfolio Review / NID / UCEED / University Game Design Admissions.",
      undergradDegrees: [
        "B.S. / B.A. in Game Design & Development",
        "B.Des in Interaction / Entertainment Design",
        "B.S. in Computer Science with Game Specialization"
      ],
      certifications: [
        "Unreal Engine Blueprints Specialist",
        "Unity Certified Associate: Game Design",
        "Game Economy & Monetization Design Certification"
      ],
      topInstitutes: [
        "USC Interactive Media & Games Division (USA)",
        "New York University (NYU Game Center, USA)",
        "DigiPen Institute of Technology (USA)",
        "National Institute of Design (NID, India)",
        "Abertay University (UK)"
      ]
    },
    roadmap: {
      phase1: "Years 0–2 (Junior Systems / Level Designer): Build and release complete playable indie games in game jams (itch.io, Ludum Dare). Start as a Junior Level Designer or Combat Scripter documenting GDDs.",
      phase2: "Years 2–5 (Senior Systems Designer): Design core gameplay progression, weapon balance curves, and boss mechanics. Analyze telemetry data from alpha playtests to fix difficulty spikes.",
      phase3: "Years 5–10+ (Lead Game Designer / Creative Director): Helm entire AAA or indie studio creative visions. Oversee narrative, art, audio, and gameplay teams to deliver commercially breakout titles."
    },
    skills: {
      hardSkills: [
        "Game Mechanics & Systems Architecture",
        "Visual Scripting (Unreal Blueprints / Unity C#)",
        "Mathematical Economy Balancing (Spreadsheets/Machinations)",
        "Level Design & Spatial Player Flow",
        "Interactive Narrative & Dialogue Branching",
        "Playtest Analytics & Telemetry Tuning"
      ],
      softSkills: [
        "Psychological Empathy for Player Motivation",
        "Receptivity to Critical Feedback",
        "Iterative Problem Solving",
        "Cross-Discipline Leadership"
      ]
    },
    roles: [
      "Game Designer",
      "Level Designer",
      "Combat Systems Designer",
      "Economy & Monetization Designer",
      "Narrative Designer",
      "Lead Game Designer",
      "Creative Director"
    ],
    decisionFit: {
      traits: [
        "Analytical mind that dissects why games succeed or fail",
        "Obsessive focus on player feel and reward psychology",
        "Patience to iterate, scrap, and rebuild mechanics dozens of times"
      ],
      workStyle: "Collaborative, creative studio environment. High remote flexibility with frequent playtest sessions.",
      pros: [
        "Dream career for passionate gamers: seeing millions play your systems",
        "Highly collaborative culture surrounded by artists, musicians, and coders",
        "Infinite creative canvas: from cozy farm sims to competitive tactical shooters"
      ],
      cons: [
        "Subject to industry crunch during pre-launch release milestones",
        "Player feedback online can be brutally critical",
        "High barrier to entry: requires a demonstrable playable portfolio"
      ]
    },
    dayInLife: [
      { time: "09:30 AM", activity: "Daily Playtest Session: Play through the latest combat encounter build with the QA and animation leads." },
      { time: "11:00 AM", activity: "Economy Balancing in Spreadsheets: Tune player XP progression and weapon damage degradation curves." },
      { time: "02:00 PM", activity: "Unreal Engine Level Whiteboxing: Block out geometry for a stealth infiltration mission to test sightlines and cover." },
      { time: "03:30 PM", activity: "Narrative & Audio Sync: Review quest voiceover scripts and ambient musical triggers with sound designers." },
      { time: "05:00 PM", activity: "GDD Documentation: Update the living Game Design Document with revised enemy AI patrol patterns." }
    ],
    workMetrics: {
      remote: "75% Remote / Hybrid",
      balance: "3.8 / 5.0",
      stress: "Moderate (Spikes during milestone shipping)",
      travel: "Low (<10% to gaming conventions like GDC/Gamescom)"
    },
    whoAvoids: [
      "People who only like playing games but hate debugging spreadsheets and mechanics",
      "Those who take creative criticism personally",
      "Individuals seeking predictable corporate routines with zero ambiguity"
    ],
    globalPay: {
      us: "Entry $68K · Mid $125K · Lead $195K+",
      in: "Entry ₹7-12 LPA · Mid ₹22-40 LPA · Lead ₹65 LPA+",
      uk: "Entry £35K · Mid £70K · Lead £120K+",
      uae: "Entry AED 16K/mo · Mid AED 32K/mo · Lead AED 55K/mo+"
    },
    topEmployers: [
      "Sony PlayStation & Xbox Game Studios",
      "Riot Games & Valve Corporation",
      "Nintendo & Ubisoft",
      "Krafton, Rockstar Games & EA",
      "Award-Winning Indie Studios (Supergiant Games, Larian Studios)"
    ],
    tools: [
      "Unreal Engine 5 & Unity",
      "Machinations.io (Game Economy Tool)",
      "Miro / Figma (Flowcharts & Mechanics)",
      "Twine & Articy:draft (Branching Narrative)",
      "Confluence & Jira",
      "Excel / Google Sheets (Math Curves)"
    ],
    portfolioProjects: [
      "Design, build, and publish a complete 15-minute playable vertical slice on itch.io featuring unique combat or puzzle mechanics",
      "Create a comprehensive 20-page Game Design Document (GDD) with full mathematical balance tables for a rogue-lite RPG economy",
      "Whitebox an Unreal Engine 5 multiplayer level demonstrating clear sightline geometry and pacing for competitive shooters"
    ],
    exitOpportunities: [
      "Executive Game Producer",
      "Gamification & Product Experience Director in EdTech/FinTech",
      "Indie Studio Founder"
    ],
    reflectionQuestions: [
      "When I play a game, do I intuitively analyze the underlying rules and reward psychology?",
      "Can I ruthlessly kill a feature that took me weeks to design if playtesters find it boring?",
      "Am I willing to build small, complete playable prototypes on my own to prove my design concepts?"
    ],
    resources: [
      "Game Maker's Toolkit (GMTK by Mark Brown) — YouTube Series",
      "\"The Art of Game Design: A Book of Lenses\" by Jesse Schell",
      "GDC (Game Developers Conference) Vault Talks",
      "\"Rules of Play: Game Design Fundamentals\" by Katie Salen & Eric Zimmerman",
      "Ludum Dare & Global Game Jam"
    ],
    aka: [
      "Video Game Designer",
      "Level Designer",
      "Gameplay Systems Designer",
      "Combat Designer",
      "Narrative Designer",
      "Creative Director Games"
    ],
    edu: "bachelor",
    interests: ["design", "art", "tech", "social"],
    degrees: ["design", "arts", "computing"],
    aiTag: "creative"
  },
  {
    id: "venture-capital",
    cat: "biz",
    catName: "Business & Finance",
    icon: "💼",
    title: "Venture Capital & Private Equity Investor",
    tagline: "Deploy institutional capital into breakout startups, execute due diligence, and guide board governance",
    desc: "Source high-growth investment deals, evaluate unit economics and founder talent, construct cap tables, and guide portfolio companies toward multi-billion dollar exits or IPOs.",
    stream: "Commerce / Economics / STEM with Business",
    salary: "Entry: $110K + Bonus / ₹15-25 LPA · Mid: $240K + Carry / ₹50-90 LPA · Lead: $500K+ + Carry / ₹1.5 Cr+",
    growth: "14% (Faster than average)",
    demand: "Competitive & Prestigious",
    aiImpact: "Human-Centric — AI sifts pitch decks and scrapes growth telemetry, but relationship trust, founder conviction, and board negotiations remain human.",
    overview: "Venture Capital (VC) and Private Equity (PE) investors deploy billions of dollars of institutional capital (endowments, sovereign wealth funds, pension funds) into private technology companies and operating businesses. In early-stage VC, investors identify visionary founders building transformative products, conducting commercial due diligence, negotiating term sheets, and taking board observer seats. In PE, investors execute leveraged buyouts (LBOs), optimize operational EBITDA, and orchestrate mergers.",
    education: {
      highSchoolPrereqs: "Mathematics, Commerce, Economics, or STEM.",
      entranceExams: "CAT / GMAT / CFA / Top B-School Admissions (IIM, Harvard, Stanford).",
      undergradDegrees: [
        "B.Com / BBA / B.S. in Economics or Finance",
        "B.Tech / B.S. in Computer Science (Technical VC Track)",
        "Integrated Dual Degree in Engineering + Management"
      ],
      certifications: [
        "Chartered Financial Analyst (CFA)",
        "Financial Modeling & Valuation Analyst (FMVA)",
        "CA (Chartered Accountant - India)"
      ],
      topInstitutes: [
        "Stanford Graduate School of Business (USA)",
        "Harvard Business School (USA)",
        "Wharton School of the University of Pennsylvania (USA)",
        "IIM Ahmedabad / IIM Bangalore (India)",
        "London Business School (UK)"
      ]
    },
    roadmap: {
      phase1: "Years 0–2 (Investment Analyst): Source deal flow from accelerators, screen 500+ pitch decks annually, conduct competitor market sizing, and build financial models under associates.",
      phase2: "Years 2–5 (Associate / Vice President): Lead deep commercial and customer due diligence, negotiate term sheets, model convertible notes/SAFE notes, and hold board observer seats.",
      phase3: "Years 5–10+ (Partner / General Partner): Raise fund capital from Limited Partners (LPs), sponsor winning investment theses, lead Series A/B syndicates, and generate outsized fund returns (Alpha/Carried Interest)."
    },
    skills: {
      hardSkills: [
        "Unit Economics & Cohort Retention Analysis",
        "Cap Table Modeling (SAFE, Preferred Stock, Liquidation Preferences)",
        "Financial Valuation (DCF, Public Comps, LBO)",
        "Term Sheet Drafting & Commercial Law",
        "Technology Market Sizing & Competitive Landscaping",
        "Fund Accounting & LP Reporting"
      ],
      softSkills: [
        "Founder Pattern Recognition & Empathy",
        "High-Stakes Negotiation & Persuasion",
        "Networking & Deal Sourcing Magnetism",
        "Intellectual Courage to Back Contrarian Bets"
      ]
    },
    roles: [
      "Venture Capital Analyst",
      "Private Equity Associate",
      "Investment Manager",
      "Principal / VP of Investments",
      "Operating Partner (Portfolio Support)",
      "General Partner / Managing Director",
      "Angel Syndicate Lead"
    ],
    decisionFit: {
      traits: [
        "Endless intellectual curiosity about emerging technology and business models",
        "Comfort with high failure rates (power-law distribution where 1 in 10 deals pays for the fund)",
        "High emotional intelligence and networking charisma"
      ],
      workStyle: "High-paced blend of board meetings, pitch dinners, analytical modeling, and industry conference networking.",
      pros: [
        "Vastly lucrative upside via carried interest (20% share of multi-million dollar fund profits)",
        "Work alongside the world's most brilliant entrepreneurs shaping the future",
        "Unparalleled prestige and executive industry access"
      ],
      cons: [
        "Extreme pressure from LPs if fund underperforms the S&P 500 benchmark",
        "Highly competitive: very few open partner seats globally",
        "Power-law reality: most investments fail or return zero"
      ]
    },
    dayInLife: [
      { time: "08:30 AM", activity: "Deal Flow Sourcing & News Scan: Review overnight Y Combinator launches, TechCrunch fundings, and outbound founder emails." },
      { time: "10:00 AM", activity: "Founder Pitch Meeting: Hear a 30-minute pitch from an enterprise AI startup founder; interrogate customer retention metrics." },
      { time: "01:00 PM", activity: "Customer Due Diligence Calls: Interview 3 Fortune 500 CISOs to verify if they would buy the portfolio company's security software." },
      { time: "03:00 PM", activity: "Cap Table & Returns Modeling: Model dilution across Series A, B, and C rounds to project return on invested capital (MOIC)." },
      { time: "05:30 PM", activity: "Partner Investment Committee: Present the investment memo to senior partners and debate valuation terms." }
    ],
    workMetrics: {
      remote: "40% Remote / 60% In-Person Meetings & Pitch Dinners",
      balance: "3.7 / 5.0",
      stress: "High (High stakes capital allocation)",
      travel: "Moderate to Frequent (20-40% to tech hubs)"
    },
    whoAvoids: [
      "People who want operational execution rather than advising from the sidelines",
      "Those who hate networking, social dinners, and relationship management",
      "Individuals who cannot tolerate risk and losing money on speculative bets"
    ],
    globalPay: {
      us: "Entry $110K+Bonus · Mid $240K+Carry · Lead $500K+Carry",
      in: "Entry ₹15-25 LPA · Mid ₹50-90 LPA · Lead ₹1.5 Cr+",
      uk: "Entry £70K+Bonus · Mid £160K+Carry · Lead £350K+Carry",
      uae: "Entry AED 25K/mo · Mid AED 55K/mo · Lead AED 90K/mo+"
    },
    topEmployers: [
      "Sequoia Capital, Andreessen Horowitz (a16z) & Accel",
      "Tiger Global & SoftBank Vision Fund",
      "Blackstone, KKR & Carlyle Group (Private Equity)",
      "Lightspeed Venture Partners & Bessemer",
      "Peak XV Partners (India / SEA)"
    ],
    tools: [
      "PitchBook & Crunchbase",
      "Excel / Google Sheets (LBO & Cap Tables)",
      "Affinity / Salesforce (CRM Deal Flow)",
      "Notion & Carta",
      "Harmonic & Dealroom",
      "Bloomberg Terminal"
    ],
    portfolioProjects: [
      "Write a publishable 15-page deep-dive investment thesis evaluating opportunities in vertical generative AI for healthcare",
      "Build a dynamic cap table and waterfall distribution model in Excel forecasting LP returns under various exit valuations",
      "Conduct a comprehensive due diligence teardown memo on a recently funded Series A startup evaluating moats and unit economics"
    ],
    exitOpportunities: [
      "Founder / CEO of a Venture-Backed Startup",
      "Chief Financial Officer (CFO) of a Tech Unicorn",
      "Corporate Development (M&A) Head at Big Tech"
    ],
    reflectionQuestions: [
      "Do I thrive on evaluating dozens of disparate business models every single week?",
      "Can I look past the consensus hype and develop original conviction on contrarian founders?",
      "Am I comfortable saying 'no' to 99% of smart, passionate founders who pitch me?"
    ],
    resources: [
      "\"Venture Deals: Be Smarter Than Your Lawyer and Venture Capitalist\" by Brad Feld & Jason Mendelson",
      "\"The Power Law: Venture Capital and the Making of the New Future\" by Sebastian Mallaby",
      "\"Secrets of Sand Hill Road\" by Scott Kupor (a16z)",
      "First Round Review & Andreessen Horowitz Content Hub",
      "Invest Like the Best Podcast by Patrick O'Shaughnessy"
    ],
    aka: [
      "Venture Capitalist",
      "Private Equity Investor",
      "Investment Analyst VC",
      "VC Associate",
      "General Partner",
      "Fund Manager"
    ],
    edu: "master",
    interests: ["business", "numbers", "tech", "social"],
    degrees: ["commerce", "management", "engineering"],
    aiTag: "people"
  }
];

// Helper to append safely
const targetFile = 'c:/Users/neelg/OneDrive/Desktop/Vercel/careers-data.js';
let content = fs.readFileSync(targetFile, 'utf8');

// Find where window.CAREERS_ALL array ends
const lastBracketIdx = content.lastIndexOf('];');
if (lastBracketIdx === -1) {
  console.error("Could not find end of CAREERS_ALL array");
  process.exit(1);
}

// Check how many of these IDs are already present
let addedCount = 0;
let newItemsCode = '';

for (const c of NEW_CAREERS) {
  if (content.includes(`"id": "${c.id}"`) || content.includes(`"id": '${c.id}'`)) {
    console.log(`Career ${c.id} already exists, skipping.`);
    continue;
  }
  newItemsCode += ',\n' + JSON.stringify(c, null, 2);
  addedCount++;
}

if (addedCount > 0) {
  const updatedContent = content.slice(0, lastBracketIdx) + newItemsCode + '\n' + content.slice(lastBracketIdx);
  fs.writeFileSync(targetFile, updatedContent, 'utf8');
  console.log(`Successfully appended ${addedCount} new careers to careers-data.js!`);
} else {
  console.log("No new careers needed to be appended.");
}
