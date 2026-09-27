import json
import os
import re

careers = [
  {
    "id": "drone-uav",
    "cat": "space",
    "catName": "Aviation & Aerospace",
    "icon": "🚁",
    "title": "Drone Pilot, UAV Operations & Aerial Robotics",
    "tagline": "Command autonomous unmanned aerial systems across surveying, defense, agriculture, and cinema",
    "desc": "Plan and pilot commercial UAV operations, configure autonomous flight paths, capture multispectral LiDAR imagery, and maintain aerial robotics fleets complying with civil aviation regulations.",
    "stream": "Science (PCM / Technical Vocational)",
    "salary": "Entry: $62K / ₹6-10 LPA · Mid: $105K / ₹18-30 LPA · Lead: $165K+ / ₹50 LPA+",
    "growth": "24% (Much faster than average)",
    "demand": "Very High",
    "aiImpact": "AI-Augmented — Autonomous computer vision and obstacle avoidance algorithms augment flight navigation, but licensed human command is legally mandatory.",
    "overview": "Commercial drone pilots and UAV operations specialists pilot sophisticated multi-rotor and fixed-wing unmanned aircraft systems. They conduct high-precision aerial topography, infrastructure inspections (bridges, wind turbines, power grids), cinematic filming, precision agriculture spraying, and search-and-rescue reconnaissance. The role blends piloting dexterity with sensor payload mastery (thermal, multispectral, LiDAR) and geospatial data processing.",
    "education": {
      "highSchoolPrereqs": "Physics, Mathematics, and Computer Science.",
      "entranceExams": "FAA Part 107 Commercial Drone Pilot License (USA) / DGCA Remote Pilot Certificate (India) / EASA Open/Specific Category (Europe).",
      "undergradDegrees": [
        "B.S. / B.Tech in Unmanned Aircraft Systems",
        "B.Tech in Aerospace / Robotics Engineering",
        "B.Sc in Geoinformatics / Remote Sensing"
      ],
      "certifications": [
        "FAA Part 107 Remote Pilot",
        "DGCA Remote Pilot License (Micro/Small Category)",
        "FLIR Infrared Thermography Level 1",
        "Pix4D Certified Professional",
        "Commercial Flight Radio Operator (RT)"
      ],
      "topInstitutes": [
        "Embry-Riddle Aeronautical University (USA)",
        "University of North Dakota (USA)",
        "Indian Institute of Drones / DroneAcharya (India)",
        "Cranfield University (UK)",
        "Delft University of Technology (TU Delft, Netherlands)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Field Pilot & Data Capture): Secure commercial remote pilot certification (FAA Part 107 / DGCA). Log 100+ flight hours across real-estate mapping, roof inspections, and orthomosaic photogrammetry. Master Pix4D and DroneDeploy.",
      "phase2": "Years 2–5 (Senior Sensor Specialist & Operations Lead): Operate high-voltage utility LiDAR, thermal flare inspections, and complex BVLOS (Beyond Visual Line of Sight) missions. Manage flight permits, airspace waivers, and ground crew logistics.",
      "phase3": "Years 5–10+ (Chief Remote Pilot / Fleet Director): Oversee enterprise drone programs for mining giants, defense contractors, or infrastructure ministries. Direct autonomous drone-in-a-box dock stations and regulatory compliance."
    },
    "skills": {
      "hardSkills": [
        "Manual & Autonomous Drone Piloting",
        "LiDAR & Photogrammetry Processing (Pix4D, DroneDeploy)",
        "Aviation Weather Analysis & Airspace Law",
        "Payload Calibration (Thermal, Multispectral, Zoom)",
        "GIS & Orthomosaic Export (ArcGIS, QGIS)",
        "Battery Care & Avionics Soldering / Maintenance"
      ],
      "softSkills": [
        "Situational Awareness & Risk Management",
        "Calm Decision-Making Under Gust/Emergency",
        "Client Communication & Site Logistics",
        "Checklist Discipline",
        "Spatial Orientation"
      ]
    },
    "roles": [
      "Commercial Drone Pilot",
      "UAV Operations Specialist",
      "Aerial Photogrammetry & LiDAR Analyst",
      "BVLOS Flight Commander",
      "Drone Fleet Maintenance Engineer",
      "Chief Remote Pilot",
      "Aerial Cinematographer"
    ],
    "decisionFit": {
      "traits": [
        "Sharp hand-eye coordination",
        "Love for outdoor technology fieldwork",
        "Extreme procedural safety mindset",
        "Spatial visual acuity"
      ],
      "workStyle": "Outdoor field deployments at job sites (wind farms, construction, mines) combined with indoor photogrammetry processing. High travel and active physical mobility.",
      "pros": [
        "Exciting blend of aviation, robotics, and outdoor adventure",
        "Rapidly expanding commercial market across agriculture and energy",
        "High daily contractor day rates for certified sensor operators"
      ],
      "cons": [
        "Subject to weather delays (high winds, rain, extreme cold)",
        "Heavy regulatory bureaucracy and airspace authorization delays",
        "Physical gear transport to remote locations"
      ]
    },
    "dayInLife": [
      {"time": "07:30 AM", "activity": "Pre-Flight Weather & Airspace Check: Review METAR wind forecasts, NOTAMs, and submit LAANC airspace authorizations."},
      {"time": "09:30 AM", "activity": "Site Reconnaissance & Hardware Setup: Inspect propeller integrity, calibrate magnetometer, set RTK ground control base station."},
      {"time": "11:00 AM", "activity": "Autonomous Flight Execution: Monitor multi-rotor drone flying programmed grid at 120m AGL for LiDAR topographical scan."},
      {"time": "02:30 PM", "activity": "Data Quality Inspection & Point Cloud Processing: Verify geotagged imagery in Pix4D, check for blind spots or motion blur."},
      {"time": "04:30 PM", "activity": "Battery Storage & Fleet Maintenance: Balance-charge LiPo batteries to storage voltage, log flight telemetry in pilot logbook."}
    ],
    "workMetrics": {
      "remote": "30% Remote (Processing) / 70% Field Deployments",
      "balance": "3.9 / 5.0",
      "stress": "Moderate (Zero crash tolerance)",
      "travel": "Frequent Regional Travel (30-50%)"
    },
    "whoAvoids": [
      "People who want 100% sedentary desk work",
      "Those who dislike being outdoors in cold or hot weather",
      "Anyone who panics under unexpected equipment telemetry warnings"
    ],
    "globalPay": {
      "us": "Entry $62K · Mid $105K · Lead $165K+",
      "in": "Entry ₹6-10 LPA · Mid ₹18-30 LPA · Lead ₹50 LPA+",
      "uk": "Entry £35K · Mid £62K · Lead £95K+",
      "uae": "Entry AED 14K/mo · Mid AED 28K/mo · Lead AED 45K/mo+"
    },
    "topEmployers": [
      "DJI Enterprise & Skydio",
      "Surveying & Engineering Giants (AECOM, Jacobs)",
      "Defense Contractors (Lockheed Martin, IdeaForge, Garuda Aerospace)",
      "Renewable Energy Operators (NextEra, Adani Green)",
      "Cinematography Production Studios"
    ],
    "tools": [
      "DJI Matrice 350 RTK / Skydio X2",
      "Pix4Dmapper & DroneDeploy",
      "ArcGIS Pro / QGIS",
      "FLIR Thermal Studio",
      "Mission Planner / QGroundControl",
      "Trimble RTK GPS Receivers"
    ],
    "portfolioProjects": [
      "Create a centimeter-accurate 3D point cloud of a multi-acre historical building using RTK photogrammetry",
      "Conduct a simulated thermal solar panel fault inspection report detecting defective bypass diodes",
      "Draft a complete standard operating procedure (SOP) safety manual for enterprise BVLOS flight operations"
    ],
    "exitOpportunities": [
      "Aviation Regulatory Inspector (FAA / DGCA)",
      "Autonomous Robotics Fleet Product Manager",
      "Commercial Drone Services Agency Founder"
    ],
    "reflectionQuestions": [
      "Do I genuinely enjoy traveling to rugged industrial job sites rather than sitting in an office all day?",
      "Can I remain calm and execute immediate emergency return-to-home procedures if an engine fails at 400 feet?",
      "Am I excited about keeping up with rapid changes in airspace regulations and sensor technology?"
    ],
    "resources": [
      "FAA DroneZone & Remote Pilot Study Guide",
      "DGCA DigitalSky Portal (India)",
      "DroneDeploy Academy — Photogrammetry Fundamentals",
      "\"Drone Professional 1 & 2\" by Louise Jupp",
      "Commercial UAV News & AUVSI Resources"
    ],
    "aka": [
      "Drone Pilot",
      "UAV Operator",
      "Remote Pilot in Command (RPIC)",
      "Unmanned Aircraft Systems Pilot",
      "Drone Photogrammetry Specialist",
      "Drone Fleet Manager"
    ],
    "edu": "bachelor",
    "interests": ["tech", "machines", "space", "build"],
    "degrees": ["engineering", "vocational", "computing"],
    "aiTag": "automation"
  },
  {
    "id": "spatial-computing-arvr",
    "cat": "tech",
    "catName": "Technology & AI",
    "icon": "🥽",
    "title": "AR/VR, Spatial Computing & Metaverse Architect",
    "tagline": "Engineer 3D immersive volumetric interfaces and mixed-reality spatial computing environments",
    "desc": "Build next-generation augmented reality, virtual reality, and spatial computing applications across visionOS, Meta Quest, and WebXR for training simulations, gaming, and 3D enterprise workspaces.",
    "stream": "Science (PCM / Computing)",
    "salary": "Entry: $90K / ₹10-16 LPA · Mid: $155K / ₹28-48 LPA · Lead: $260K+ / ₹75 LPA+",
    "growth": "30% (Much faster than average)",
    "demand": "Very High",
    "aiImpact": "AI-Powered — Generative 3D meshes, NeRFs, and Gaussian splatting accelerate asset pipelines while human interaction designers craft spatial UX.",
    "overview": "Spatial Computing and AR/VR Engineers build interactive, real-time 3D experiences that merge digital information with physical reality. Working across platforms like Apple Vision Pro (visionOS), Meta Quest, and spatial web (WebXR), they write high-performance C#, C++, and Swift code to render 90+ FPS stereoscopic displays, calibrate hand-tracking gestures, and design volumetric spatial interfaces for surgical training, aerospace digital twins, and immersive education.",
    "education": {
      "highSchoolPrereqs": "Physics, Mathematics, Computer Science.",
      "entranceExams": "JEE Main / SAT / BITSAT / GRE for Master's programs in Computer Graphics.",
      "undergradDegrees": [
        "B.S. / B.Tech in Computer Science & Engineering",
        "B.S. in Game Development & Interactive Media",
        "B.Des in Digital Product & Interaction Design"
      ],
      "certifications": [
        "Unity Certified Professional: Programmer",
        "Unreal Engine Certified Developer",
        "Apple VisionOS Developer Accreditation",
        "AWS Certified Solutions Architect"
      ],
      "topInstitutes": [
        "Carnegie Mellon University (Entertainment Technology Center, USA)",
        "MIT Media Lab (USA)",
        "USC School of Cinematic Arts (Interactive Media, USA)",
        "IIT Bombay (Industrial Design Centre, India)",
        "University of Tokyo (Virtual Reality Educational Center, Japan)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (3D Engine & Shader Fundamentals): Master Unity/Unreal Engine, C#, 3D math (vectors, quaternions, matrix transformations), and linear algebra. Build interactive VR demo prototypes and publish a side project on SideQuest or Steam.",
      "phase2": "Years 2–5 (Senior Spatial Engineer): Architect hand-tracking gestures, eye-tracking gaze interactions, spatial audio, and WebXR networking. Optimize draw calls and GPU memory to ensure zero-latency 90 FPS rendering.",
      "phase3": "Years 5–10+ (Principal Spatial Architect / VP of Immersive): Lead enterprise spatial design teams building digital twin simulations for aerospace, defense, or global surgical training platforms."
    },
    "skills": {
      "hardSkills": [
        "Unity (C#) & Unreal Engine 5 (C++ / Blueprints)",
        "Linear Algebra, Quaternions & Vector Mathematics",
        "visionOS (SwiftUI, RealityKit, ARKit)",
        "Shader Programming (HLSL / GLSL)",
        "3D Asset Optimization & LOD Management",
        "Spatial Audio & Inverse Kinematics (IK)"
      ],
      "softSkills": [
        "3D Spatial Visualization & Ergonomics",
        "Empathy for User Motion Sickness & Comfort",
        "Creative Artistic Collaboration",
        "Performance Obsession"
      ]
    },
    "roles": [
      "Spatial Computing Engineer",
      "AR/VR Developer",
      "visionOS Application Engineer",
      "Unreal Engine Simulation Developer",
      "Virtual Reality Interaction Designer",
      "Principal Immersive Architect",
      "Technical Artist (Shaders & Lighting)"
    ],
    "decisionFit": {
      "traits": [
        "Obsession with 3D games and simulated worlds",
        "Strong mathematical foundation in geometry and vectors",
        "Curiosity about human perception and ergonomic optics"
      ],
      "workStyle": "High-focus software engineering using headsets and multiple monitors. High remote and hybrid work availability.",
      "pros": [
        "Pioneering the frontier of post-smartphone human-computer interaction",
        "Exceptional compensation from Big Tech and enterprise simulation giants",
        "Creative freedom blending game design with hardcore computer science"
      ],
      "cons": [
        "Constant headset testing can cause eye fatigue and simulator sickness",
        "Evolving hardware standards requiring frequent retooling",
        "High performance pressure: drops below 90 FPS ruin user experience"
      ]
    },
    "dayInLife": [
      {"time": "09:30 AM", "activity": "Engine Standup & Spatial Review: Test hand-gesture pinch latencies on latest Apple Vision Pro / Quest 3 development build."},
      {"time": "11:00 AM", "activity": "Custom Shader Coding: Write HLSL shader to render volumetric glass refraction and spatial depth occlusions."},
      {"time": "02:00 PM", "activity": "Ergonomics & Comfort Playtesting: Measure frame pacing in RenderDoc to ensure zero dropped frames during fast head turns."},
      {"time": "03:30 PM", "activity": "Spatial UI Integration: Hook up SwiftUI RealityKit components with multiplayer WebSockets for collaborative 3D rooms."},
      {"time": "05:00 PM", "activity": "Profiling & Code Review: Review memory footprint of 3D glTF models with technical art team."}
    ],
    "workMetrics": {
      "remote": "85% Remote / Hybrid",
      "balance": "4.1 / 5.0",
      "stress": "Moderate",
      "travel": "Minimal (<10%)"
    },
    "whoAvoids": [
      "Developers who hate 3D geometry and vector math",
      "People sensitive to motion sickness when wearing VR headsets",
      "Engineers who only want simple 2D web CRUD applications"
    ],
    "globalPay": {
      "us": "Entry $90K · Mid $155K · Lead $260K+",
      "in": "Entry ₹10-16 LPA · Mid ₹28-48 LPA · Lead ₹75 LPA+",
      "uk": "Entry £50K · Mid £90K · Lead £150K+",
      "uae": "Entry AED 20K/mo · Mid AED 40K/mo · Lead AED 65K/mo+"
    },
    "topEmployers": [
      "Apple (visionOS Team)",
      "Meta (Reality Labs)",
      "Epic Games & Unity Technologies",
      "Microsoft (Mixed Reality & HoloLens)",
      "Medical Simulation Providers (Osso VR, Touch Surgery)"
    ],
    "tools": [
      "Unity & Unreal Engine 5",
      "Xcode & Reality Composer Pro",
      "RenderDoc & GPU Profilers",
      "Blender & Maya (Pipeline)",
      "Git & Perforce",
      "OpenXR & WebXR"
    ],
    "portfolioProjects": [
      "Build a functional mixed-reality visionOS or Quest hand-tracking laboratory simulation where users assemble a jet turbine in 3D",
      "Create a multi-user WebXR spatial meeting room using Three.js and WebSockets running smoothly on mobile browsers",
      "Write a custom volumetric water shader in HLSL optimized for standalone VR headsets targeting 90 FPS"
    ],
    "exitOpportunities": [
      "VP of Immersive Technology",
      "Autonomous Robotics Simulation Lead",
      "Interactive Game Studio Founder"
    ],
    "reflectionQuestions": [
      "Am I captivated by how human brains perceive 3D space, depth, and virtual objects?",
      "Can I debug complex mathematical transformation matrices and quaternion rotations without getting frustrated?",
      "Do I want to build the platforms that might replace mobile phones over the next decade?"
    ],
    "resources": [
      "Apple Developer — visionOS Documentation & WWDC Sessions",
      "Unity Learn — Virtual Reality & Spatial Computing Pathway",
      "\"Real-Time Rendering\" by Tomas Akenine-Möller",
      "OpenXR Specification Guide",
      "Road to VR & UploadVR Industry Publications"
    ],
    "aka": [
      "AR Developer",
      "VR Developer",
      "Spatial Computing Engineer",
      "visionOS Engineer",
      "Mixed Reality Developer",
      "3D Graphics Programmer"
    ],
    "edu": "bachelor",
    "interests": ["tech", "design", "art", "machines"],
    "degrees": ["computing", "engineering", "design"],
    "aiTag": "creative"
  },
  {
    "id": "game-designer",
    "cat": "creative",
    "catName": "Creative & Design",
    "icon": "🎮",
    "title": "Video Game Designer & Gameplay Mechanics Lead",
    "tagline": "Architect interactive worlds, player motivation systems, and emergent game mechanics",
    "desc": "Create game design documents (GDD), balance numerical progression economies, script interactive level puzzles, and orchestrate player psychology for indie hits and AAA franchises.",
    "stream": "Any Stream (Arts / Science / Design)",
    "salary": "Entry: $68K / ₹7-12 LPA · Mid: $125K / ₹22-40 LPA · Lead: $195K+ / ₹65 LPA+",
    "growth": "18% (Faster than average)",
    "demand": "High",
    "aiImpact": "AI-Augmented — Procedural world generation and AI dialogue accelerate drafting, but core artistic gameplay balance requires human craft.",
    "overview": "Video Game Designers are the architects of interactive play. Unlike programmers who write engine code or artists who paint textures, game designers conceive the rules, pacing, reward loops, combat systems, and emotional arcs that make a game fun and meaningful. They prototype mechanics in engines, balance mathematical economy spreadsheets, script quests, and conduct rigorous playtesting.",
    "education": {
      "highSchoolPrereqs": "Any stream with strong analytical thinking, storytelling, or computing.",
      "entranceExams": "Portfolio Review / NID / UCEED / University Game Design Admissions.",
      "undergradDegrees": [
        "B.S. / B.A. in Game Design & Development",
        "B.Des in Interaction / Entertainment Design",
        "B.S. in Computer Science with Game Specialization"
      ],
      "certifications": [
        "Unreal Engine Blueprints Specialist",
        "Unity Certified Associate: Game Design",
        "Game Economy & Monetization Design Certification"
      ],
      "topInstitutes": [
        "USC Interactive Media & Games Division (USA)",
        "New York University (NYU Game Center, USA)",
        "DigiPen Institute of Technology (USA)",
        "National Institute of Design (NID, India)",
        "Abertay University (UK)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Junior Systems / Level Designer): Build and release complete playable indie games in game jams (itch.io, Ludum Dare). Start as a Junior Level Designer or Combat Scripter documenting GDDs.",
      "phase2": "Years 2–5 (Senior Systems Designer): Design core gameplay progression, weapon balance curves, and boss mechanics. Analyze telemetry data from alpha playtests to fix difficulty spikes.",
      "phase3": "Years 5–10+ (Lead Game Designer / Creative Director): Helm entire AAA or indie studio creative visions. Oversee narrative, art, audio, and gameplay teams to deliver commercially breakout titles."
    },
    "skills": {
      "hardSkills": [
        "Game Mechanics & Systems Architecture",
        "Visual Scripting (Unreal Blueprints / Unity C#)",
        "Mathematical Economy Balancing (Spreadsheets/Machinations)",
        "Level Design & Spatial Player Flow",
        "Interactive Narrative & Dialogue Branching",
        "Playtest Analytics & Telemetry Tuning"
      ],
      "softSkills": [
        "Psychological Empathy for Player Motivation",
        "Receptivity to Critical Feedback",
        "Iterative Problem Solving",
        "Cross-Discipline Leadership"
      ]
    },
    "roles": [
      "Game Designer",
      "Level Designer",
      "Combat Systems Designer",
      "Economy & Monetization Designer",
      "Narrative Designer",
      "Lead Game Designer",
      "Creative Director"
    ],
    "decisionFit": {
      "traits": [
        "Analytical mind that dissects why games succeed or fail",
        "Obsessive focus on player feel and reward psychology",
        "Patience to iterate, scrap, and rebuild mechanics dozens of times"
      ],
      "workStyle": "Collaborative, creative studio environment. High remote flexibility with frequent playtest sessions.",
      "pros": [
        "Dream career for passionate gamers: seeing millions play your systems",
        "Highly collaborative culture surrounded by artists, musicians, and coders",
        "Infinite creative canvas: from cozy farm sims to competitive tactical shooters"
      ],
      "cons": [
        "Subject to industry crunch during pre-launch release milestones",
        "Player feedback online can be brutally critical",
        "High barrier to entry: requires a demonstrable playable portfolio"
      ]
    },
    "dayInLife": [
      {"time": "09:30 AM", "activity": "Daily Playtest Session: Play through the latest combat encounter build with the QA and animation leads."},
      {"time": "11:00 AM", "activity": "Economy Balancing in Spreadsheets: Tune player XP progression and weapon damage degradation curves."},
      {"time": "02:00 PM", "activity": "Unreal Engine Level Whiteboxing: Block out geometry for a stealth infiltration mission to test sightlines and cover."},
      {"time": "03:30 PM", "activity": "Narrative & Audio Sync: Review quest voiceover scripts and ambient musical triggers with sound designers."},
      {"time": "05:00 PM", "activity": "GDD Documentation: Update the living Game Design Document with revised enemy AI patrol patterns."}
    ],
    "workMetrics": {
      "remote": "75% Remote / Hybrid",
      "balance": "3.8 / 5.0",
      "stress": "Moderate (Spikes during milestone shipping)",
      "travel": "Low (<10% to gaming conventions like GDC/Gamescom)"
    },
    "whoAvoids": [
      "People who only like playing games but hate debugging spreadsheets and mechanics",
      "Those who take creative criticism personally",
      "Individuals seeking predictable corporate routines with zero ambiguity"
    ],
    "globalPay": {
      "us": "Entry $68K · Mid $125K · Lead $195K+",
      "in": "Entry ₹7-12 LPA · Mid ₹22-40 LPA · Lead ₹65 LPA+",
      "uk": "Entry £35K · Mid £70K · Lead £120K+",
      "uae": "Entry AED 16K/mo · Mid AED 32K/mo · Lead AED 55K/mo+"
    },
    "topEmployers": [
      "Sony PlayStation & Xbox Game Studios",
      "Riot Games & Valve Corporation",
      "Nintendo & Ubisoft",
      "Krafton, Rockstar Games & EA",
      "Award-Winning Indie Studios (Supergiant Games, Larian Studios)"
    ],
    "tools": [
      "Unreal Engine 5 & Unity",
      "Machinations.io (Game Economy Tool)",
      "Miro / Figma (Flowcharts & Mechanics)",
      "Twine & Articy:draft (Branching Narrative)",
      "Confluence & Jira",
      "Excel / Google Sheets (Math Curves)"
    ],
    "portfolioProjects": [
      "Design, build, and publish a complete 15-minute playable vertical slice on itch.io featuring unique combat or puzzle mechanics",
      "Create a comprehensive 20-page Game Design Document (GDD) with full mathematical balance tables for a rogue-lite RPG economy",
      "Whitebox an Unreal Engine 5 multiplayer level demonstrating clear sightline geometry and pacing for competitive shooters"
    ],
    "exitOpportunities": [
      "Executive Game Producer",
      "Gamification & Product Experience Director in EdTech/FinTech",
      "Indie Studio Founder"
    ],
    "reflectionQuestions": [
      "When I play a game, do I intuitively analyze the underlying rules and reward psychology?",
      "Can I ruthlessly kill a feature that took me weeks to design if playtesters find it boring?",
      "Am I willing to build small, complete playable prototypes on my own to prove my design concepts?"
    ],
    "resources": [
      "Game Maker's Toolkit (GMTK by Mark Brown) — YouTube Series",
      "\"The Art of Game Design: A Book of Lenses\" by Jesse Schell",
      "GDC (Game Developers Conference) Vault Talks",
      "\"Rules of Play: Game Design Fundamentals\" by Katie Salen & Eric Zimmerman",
      "Ludum Dare & Global Game Jam"
    ],
    "aka": [
      "Video Game Designer",
      "Level Designer",
      "Gameplay Systems Designer",
      "Combat Designer",
      "Narrative Designer",
      "Creative Director Games"
    ],
    "edu": "bachelor",
    "interests": ["design", "art", "tech", "social"],
    "degrees": ["design", "arts", "computing"],
    "aiTag": "creative"
  },
  {
    "id": "venture-capital",
    "cat": "biz",
    "catName": "Business & Finance",
    "icon": "💼",
    "title": "Venture Capital & Private Equity Investor",
    "tagline": "Deploy institutional capital into breakout startups, execute due diligence, and guide board governance",
    "desc": "Source high-growth investment deals, evaluate unit economics and founder talent, construct cap tables, and guide portfolio companies toward multi-billion dollar exits or IPOs.",
    "stream": "Commerce / Economics / STEM with Business",
    "salary": "Entry: $110K + Bonus / ₹15-25 LPA · Mid: $240K + Carry / ₹50-90 LPA · Lead: $500K+ + Carry / ₹1.5 Cr+",
    "growth": "14% (Faster than average)",
    "demand": "Competitive & Prestigious",
    "aiImpact": "Human-Centric — AI sifts pitch decks and scrapes growth telemetry, but relationship trust, founder conviction, and board negotiations remain human.",
    "overview": "Venture Capital (VC) and Private Equity (PE) investors deploy billions of dollars of institutional capital (endowments, sovereign wealth funds, pension funds) into private technology companies and operating businesses. In early-stage VC, investors identify visionary founders building transformative products, conducting commercial due diligence, negotiating term sheets, and taking board observer seats. In PE, investors execute leveraged buyouts (LBOs), optimize operational EBITDA, and orchestrate mergers.",
    "education": {
      "highSchoolPrereqs": "Mathematics, Commerce, Economics, or STEM.",
      "entranceExams": "CAT / GMAT / CFA / Top B-School Admissions (IIM, Harvard, Stanford).",
      "undergradDegrees": [
        "B.Com / BBA / B.S. in Economics or Finance",
        "B.Tech / B.S. in Computer Science (Technical VC Track)",
        "Integrated Dual Degree in Engineering + Management"
      ],
      "certifications": [
        "Chartered Financial Analyst (CFA)",
        "Financial Modeling & Valuation Analyst (FMVA)",
        "CA (Chartered Accountant - India)"
      ],
      "topInstitutes": [
        "Stanford Graduate School of Business (USA)",
        "Harvard Business School (USA)",
        "Wharton School of the University of Pennsylvania (USA)",
        "IIM Ahmedabad / IIM Bangalore (India)",
        "London Business School (UK)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Investment Analyst): Source deal flow from accelerators, screen 500+ pitch decks annually, conduct competitor market sizing, and build financial models under associates.",
      "phase2": "Years 2–5 (Associate / Vice President): Lead deep commercial and customer due diligence, negotiate term sheets, model convertible notes/SAFE notes, and hold board observer seats.",
      "phase3": "Years 5–10+ (Partner / General Partner): Raise fund capital from Limited Partners (LPs), sponsor winning investment theses, lead Series A/B syndicates, and generate outsized fund returns (Alpha/Carried Interest)."
    },
    "skills": {
      "hardSkills": [
        "Unit Economics & Cohort Retention Analysis",
        "Cap Table Modeling (SAFE, Preferred Stock, Liquidation Preferences)",
        "Financial Valuation (DCF, Public Comps, LBO)",
        "Term Sheet Drafting & Commercial Law",
        "Technology Market Sizing & Competitive Landscaping",
        "Fund Accounting & LP Reporting"
      ],
      "softSkills": [
        "Founder Pattern Recognition & Empathy",
        "High-Stakes Negotiation & Persuasion",
        "Networking & Deal Sourcing Magnetism",
        "Intellectual Courage to Back Contrarian Bets"
      ]
    },
    "roles": [
      "Venture Capital Analyst",
      "Private Equity Associate",
      "Investment Manager",
      "Principal / VP of Investments",
      "Operating Partner (Portfolio Support)",
      "General Partner / Managing Director",
      "Angel Syndicate Lead"
    ],
    "decisionFit": {
      "traits": [
        "Endless intellectual curiosity about emerging technology and business models",
        "Comfort with high failure rates (power-law distribution where 1 in 10 deals pays for the fund)",
        "High emotional intelligence and networking charisma"
      ],
      "workStyle": "High-paced blend of board meetings, pitch dinners, analytical modeling, and industry conference networking.",
      "pros": [
        "Vastly lucrative upside via carried interest (20% share of multi-million dollar fund profits)",
        "Work alongside the world's most brilliant entrepreneurs shaping the future",
        "Unparalleled prestige and executive industry access"
      ],
      "cons": [
        "Extreme pressure from LPs if fund underperforms the S&P 500 benchmark",
        "Highly competitive: very few open partner seats globally",
        "Power-law reality: most investments fail or return zero"
      ]
    },
    "dayInLife": [
      {"time": "08:30 AM", "activity": "Deal Flow Sourcing & News Scan: Review overnight Y Combinator launches, TechCrunch fundings, and outbound founder emails."},
      {"time": "10:00 AM", "activity": "Founder Pitch Meeting: Hear a 30-minute pitch from an enterprise AI startup founder; interrogate customer retention metrics."},
      {"time": "01:00 PM", "activity": "Customer Due Diligence Calls: Interview 3 Fortune 500 CISOs to verify if they would buy the portfolio company's security software."},
      {"time": "03:00 PM", "activity": "Cap Table & Returns Modeling: Model dilution across Series A, B, and C rounds to project return on invested capital (MOIC)."},
      {"time": "05:30 PM", "activity": "Partner Investment Committee: Present the investment memo to senior partners and debate valuation terms."}
    ],
    "workMetrics": {
      "remote": "40% Remote / 60% In-Person Meetings & Pitch Dinners",
      "balance": "3.7 / 5.0",
      "stress": "High (High stakes capital allocation)",
      "travel": "Moderate to Frequent (20-40% to tech hubs)"
    },
    "whoAvoids": [
      "People who want operational execution rather than advising from the sidelines",
      "Those who hate networking, social dinners, and relationship management",
      "Individuals who cannot tolerate risk and losing money on speculative bets"
    ],
    "globalPay": {
      "us": "Entry $110K+Bonus · Mid $240K+Carry · Lead $500K+Carry",
      "in": "Entry ₹15-25 LPA · Mid ₹50-90 LPA · Lead ₹1.5 Cr+",
      "uk": "Entry £70K+Bonus · Mid £160K+Carry · Lead £350K+Carry",
      "uae": "Entry AED 25K/mo · Mid AED 55K/mo · Lead AED 90K/mo+"
    },
    "topEmployers": [
      "Sequoia Capital, Andreessen Horowitz (a16z) & Accel",
      "Tiger Global & SoftBank Vision Fund",
      "Blackstone, KKR & Carlyle Group (Private Equity)",
      "Lightspeed Venture Partners & Bessemer",
      "Peak XV Partners (India / SEA)"
    ],
    "tools": [
      "PitchBook & Crunchbase",
      "Excel / Google Sheets (LBO & Cap Tables)",
      "Affinity / Salesforce (CRM Deal Flow)",
      "Notion & Carta",
      "Harmonic & Dealroom",
      "Bloomberg Terminal"
    ],
    "portfolioProjects": [
      "Write a publishable 15-page deep-dive investment thesis evaluating opportunities in vertical generative AI for healthcare",
      "Build a dynamic cap table and waterfall distribution model in Excel forecasting LP returns under various exit valuations",
      "Conduct a comprehensive due diligence teardown memo on a recently funded Series A startup evaluating moats and unit economics"
    ],
    "exitOpportunities": [
      "Founder / CEO of a Venture-Backed Startup",
      "Chief Financial Officer (CFO) of a Tech Unicorn",
      "Corporate Development (M&A) Head at Big Tech"
    ],
    "reflectionQuestions": [
      "Do I thrive on evaluating dozens of disparate business models every single week?",
      "Can I look past the consensus hype and develop original conviction on contrarian founders?",
      "Am I comfortable saying 'no' to 99% of smart, passionate founders who pitch me?"
    ],
    "resources": [
      "\"Venture Deals: Be Smarter Than Your Lawyer and Venture Capitalist\" by Brad Feld & Jason Mendelson",
      "\"The Power Law: Venture Capital and the Making of the New Future\" by Sebastian Mallaby",
      "\"Secrets of Sand Hill Road\" by Scott Kupor (a16z)",
      "First Round Review & Andreessen Horowitz Content Hub",
      "Invest Like the Best Podcast by Patrick O'Shaughnessy"
    ],
    "aka": [
      "Venture Capitalist",
      "Private Equity Investor",
      "Investment Analyst VC",
      "VC Associate",
      "General Partner",
      "Fund Manager"
    ],
    "edu": "master",
    "interests": ["business", "numbers", "tech", "social"],
    "degrees": ["commerce", "management", "engineering"],
    "aiTag": "people"
  },
  {
    "id": "ma-investment-banking",
    "cat": "biz",
    "catName": "Business & Finance",
    "icon": "🏛️",
    "title": "Mergers & Acquisitions (M&A) Investment Banker",
    "tagline": "Structure multi-billion dollar corporate buyouts, hostile takeovers, and debt capital financings",
    "desc": "Advise Fortune 500 boards and corporate executives on corporate acquisitions, divestitures, fairness opinions, and capital market financing structures.",
    "stream": "Commerce / Finance / Mathematics",
    "salary": "Entry: $130K + 70-100% Bonus / ₹20-35 LPA · Mid: $280K + Bonus / ₹60-1.2 Cr · Lead: $650K+ / ₹2.5 Cr+",
    "growth": "11% (Average)",
    "demand": "High Stakes",
    "aiImpact": "Automation-Exposed — Financial modeling and pitch deck drafting are heavily automated; human deal structuring and client trust remain essential.",
    "overview": "M&A Investment Bankers act as premier strategic financial advisors to global corporations, institutional private equity sponsors, and boards of directors. When two multinational companies merge or a conglomerate spins off a subsidiary, M&A bankers model valuation synergies, perform discounted cash flow (DCF) and accretion/dilution analyses, structure financing packages, and manage confidentiality auctions.",
    "education": {
      "highSchoolPrereqs": "Mathematics, Economics, Commerce.",
      "entranceExams": "CAT / GMAT / CFA / Top-Tier Target University Recruitment.",
      "undergradDegrees": [
        "B.Com (Honours) / B.S. in Finance or Economics",
        "B.Tech / B.S. in Engineering (Quantitative IB Track)",
        "MBA from Tier 1 Business School"
      ],
      "certifications": [
        "CFA (Chartered Financial Analyst)",
        "FINRA Series 79 & Series 63 (USA)",
        "Financial Modeling & Valuation Analyst (FMVA)"
      ],
      "topInstitutes": [
        "Wharton School of the University of Pennsylvania (USA)",
        "Columbia Business School / NYU Stern (USA)",
        "London School of Economics (LSE, UK)",
        "IIM Ahmedabad / IIM Calcutta (India)",
        "INSEAD (France/Singapore)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Investment Banking Analyst): Work 80+ hour weeks building three-statement operating models, DCF valuations, pitch books, and data room diligence folders.",
      "phase2": "Years 2–5 (Associate & Vice President): Run active transaction workstreams, directly communicate with client CFOs, negotiate merger purchase agreements, and mentor analysts.",
      "phase3": "Years 5–10+ (Managing Director): Originate major M&A mandates through longstanding corporate boardroom relationships; advise CEOs on hostile defense and mega-mergers."
    },
    "skills": {
      "hardSkills": [
        "Advanced Financial Modeling (DCF, LBO, Accretion/Dilution)",
        "Three-Statement Accounting & SEC Filing Audit (10-K, 10-Q)",
        "Fairness Opinions & Synergy Quantification",
        "Transaction Structuring & M&A Purchase Agreements",
        "Capital IQ, FactSet & Bloomberg Terminal Mastery",
        "CIM (Confidential Information Memorandum) Writing"
      ],
      "softSkills": [
        "Extreme Stamina & Work Ethic",
        "Flawless Attention to Formatting Detail",
        "Composure Under Relentless Deadlines",
        "Executive Boardroom Presence"
      ]
    },
    "roles": [
      "M&A Analyst",
      "Investment Banking Associate",
      "M&A Vice President",
      "Director of Mergers & Acquisitions",
      "Managing Director (Industry Group Lead)",
      "Head of Corporate Development"
    ],
    "decisionFit": {
      "traits": [
        "Flawless obsession with precision (zero tolerated typo in financial models)",
        "Extraordinary stamina and ambition",
        "Interest in corporate high-finance power dynamics"
      ],
      "workStyle": "High-intensity corporate bullpen environment. Demanding hours with significant evening and weekend work during active deal closings.",
      "pros": [
        "Exceptional compensation: bonuses frequently match or exceed base salary",
        "The gold standard for prestige on Wall Street and global financial centers",
        "Unbeatable training in accounting, corporate strategy, and executive finance"
      ],
      "cons": [
        "Brutal hours (70-90 hour work weeks are standard for junior bankers)",
        "High personal sacrifice and sleep deprivation",
        "Unpredictable deal deadlines that cancel personal plans"
      ]
    },
    "dayInLife": [
      {"time": "09:00 AM", "activity": "Market Open Briefing: Check Overnight Bloomberg feeds, bond yields, and commodity movements affecting active buyout targets."},
      {"time": "10:30 AM", "activity": "Merger Model Audit: Refine a dynamic accretion/dilution model incorporating 15% tax synergy and stock-cash blend."},
      {"time": "02:00 PM", "activity": "Client Board Pitch Run: Rehearse a 60-slide confidential pitch deck with the Managing Director for a $4B pharmaceutical acquisition."},
      {"time": "05:00 PM", "activity": "Virtual Data Room Diligence: Coordinate with buyer's legal team to verify antitrust compliance and environmental liabilities."},
      {"time": "09:30 PM", "activity": "Model Scenario Stress Testing: Run sensitivity tables testing how 50 bps interest rate hikes alter buyer debt-service ratios."}
    ],
    "workMetrics": {
      "remote": "10% Remote / 90% In-Office Wall Street Bullpen",
      "balance": "2.8 / 5.0",
      "stress": "Extremely High",
      "travel": "Moderate (Client pitches & deal closings)"
    },
    "whoAvoids": [
      "Anyone who prioritizes strict 9-to-5 work-life balance",
      "People who dislike heavy Excel spreadsheet modeling and late nights",
      "Those who struggle with high-criticism, fast-turnaround environments"
    ],
    "globalPay": {
      "us": "Entry $130K+Bonus · Mid $280K+Bonus · Lead $650K+",
      "in": "Entry ₹20-35 LPA · Mid ₹60-1.2 Cr · Lead ₹2.5 Cr+",
      "uk": "Entry £75K+Bonus · Mid £170K+Bonus · Lead £450K+",
      "uae": "Entry AED 30K/mo · Mid AED 65K/mo · Lead AED 120K/mo+"
    },
    "topEmployers": [
      "Goldman Sachs, Morgan Stanley & J.P. Morgan",
      "Boutique M&A Advisors (Centerview Partners, Evercore, Lazard)",
      "Bank of America & Citi",
      "Barclays & UBS",
      "Kotak Investment Banking & Avendus Capital (India)"
    ],
    "tools": [
      "Microsoft Excel (Keyboard-only Macabacus)",
      "FactSet & S&P Capital IQ",
      "Bloomberg Terminal",
      "PowerPoint (Pitch Book Assembly)",
      "Intralinks & Datasite (Virtual Data Rooms)"
    ],
    "portfolioProjects": [
      "Build a complete 3-statement integrated financial model and DCF valuation of a publicly traded company with sensitivity tables",
      "Draft a 25-page strategic M&A pitch deck recommending a hypothetical acquisition with synergy analysis and accretion breakdown",
      "Create an LBO (Leveraged Buyout) model calculating IRR and money-on-money returns under multiple debt tranches"
    ],
    "exitOpportunities": [
      "Private Equity Megafund Associate (Blackstone, KKR)",
      "Corporate Development (M&A) Director at a Fortune 100 enterprise",
      "Hedge Fund Long/Short Equity Analyst"
    ],
    "reflectionQuestions": [
      "Am I genuinely prepared to sacrifice personal time in my 20s to master financial modeling and earn top-tier Wall Street compensation?",
      "Can I maintain laser precision in a spreadsheet at 1:00 AM when millions of dollars ride on the accuracy of a formula?",
      "Do I thrive in hyper-competitive, fast-paced environments where execution speed is paramount?"
    ],
    "resources": [
      "\"Investment Banking: Valuation, LBOs, M&A, and IPOs\" by Joshua Rosenbaum & Joshua Pearl",
      "\"Mergers & Acquisitions from A to Z\" by Andrew J. Sherman",
      "Wall Street Oasis (WSO) Guides & Financial Modeling Prep",
      "Breaking Into Wall Street (BIWS) Modeling Courses",
      "Damodaran Online — NYU Stern Valuation Archive"
    ],
    "aka": [
      "Investment Banker",
      "M&A Banker",
      "Corporate Finance Analyst",
      "Bulge Bracket Analyst",
      "Managing Director M&A"
    ],
    "edu": "master",
    "interests": ["business", "numbers", "social"],
    "degrees": ["commerce", "management", "economics"],
    "aiTag": "automation"
  },
  {
    "id": "corporate-sustainability-esg",
    "cat": "eco",
    "catName": "Sustainability & Energy",
    "icon": "🌱",
    "title": "ESG & Corporate Sustainability Director",
    "tagline": "Lead enterprise decarbonization, Scope 1-3 greenhouse gas audits, and regulatory disclosure",
    "desc": "Architect corporate net-zero strategies, conduct GHG Protocol emissions inventories, ensure CSRD/SEC compliance, and transform supply chains for circularity.",
    "stream": "Environmental Science / Engineering / Management",
    "salary": "Entry: $75K / ₹8-14 LPA · Mid: $135K / ₹24-42 LPA · Lead: $220K+ / ₹70 LPA+",
    "growth": "26% (Much faster than average)",
    "demand": "Very High Demand",
    "aiImpact": "AI-Augmented — Automated sensor networks and machine learning model emissions; directors navigate boardrooms and global environmental policy.",
    "overview": "Corporate Sustainability and ESG (Environmental, Social, Governance) Directors lead the transformation of global companies toward carbon neutrality, renewable energy adoption, and sustainable supply chains. They conduct Scope 1, 2, and 3 greenhouse gas inventories under the GHG Protocol, ensure compliance with EU CSRD and US SEC climate disclosure mandates, negotiate green power purchase agreements (PPAs), and eliminate landfill waste.",
    "education": {
      "highSchoolPrereqs": "Environmental Science, Biology, Chemistry, or Economics.",
      "entranceExams": "GRE / CAT / University Master's in Sustainability Management.",
      "undergradDegrees": [
        "B.S. in Environmental Science / Sustainable Systems",
        "B.Tech in Environmental / Chemical Engineering",
        "BBA / B.Com in Sustainable Business & Economics"
      ],
      "certifications": [
        "FSA (Fundamentals of Sustainability Accounting - SASB)",
        "GRI (Global Reporting Initiative) Certified Sustainability Professional",
        "LEED Accredited Professional (LEED AP)",
        "GHG Protocol Corporate Standard Auditor"
      ],
      "topInstitutes": [
        "Yale School of the Environment (USA)",
        "Stanford Doerr School of Sustainability (USA)",
        "Oxford Smith School of Enterprise and the Environment (UK)",
        "TERI School of Advanced Studies (India)",
        "ETH Zurich (Switzerland)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Sustainability Analyst): Collect enterprise energy bills, calculate baseline Scope 1 & 2 carbon footprints using emission factors, and draft CDP disclosure responses.",
      "phase2": "Years 2–5 (ESG Program Manager): Map complex Scope 3 supply chain emissions, implement internal carbon pricing, and lead life cycle assessments (LCA) on flagship products.",
      "phase3": "Years 5–10+ (Chief Sustainability Officer / ESG Director): Advise the Board and CEO on long-term net-zero roadmaps, green bond issuances, and regulatory defense."
    },
    "skills": {
      "hardSkills": [
        "GHG Protocol Corporate Standard (Scope 1, 2, 3 Accounting)",
        "Regulatory Reporting (CSRD, SEC Climate Rules, TCFD, ISSB)",
        "Life Cycle Assessment (LCA - SimaPro / GaBi)",
        "Carbon Offset Due Diligence & PPA Procurement",
        "Circular Economy Material Auditing",
        "ESG Data Platforms (Watershed, Persefoni)"
      ],
      "softSkills": [
        "Executive Persuasion & Influence Without Authority",
        "Systems Thinking Across Complex Supply Chains",
        "Public Accountability & Crisis PR",
        "Pragmatic Commercial Alignment"
      ]
    },
    "roles": [
      "Sustainability Analyst",
      "ESG Specialist",
      "Carbon Accounting Manager",
      "Supply Chain Decarbonization Lead",
      "Director of ESG & Climate Strategy",
      "Chief Sustainability Officer (CSO)"
    ],
    "decisionFit": {
      "traits": [
        "Passionate commitment to climate action and environmental stewardship",
        "Analytical mind comfortable managing massive emissions datasets",
        "Diplomatic ability to bridge idealism with corporate profitability"
      ],
      "workStyle": "Corporate office and hybrid environment collaborating with operations, legal, supply chain, and executive leadership.",
      "pros": [
        "Deeply meaningful work combating climate change at commercial scale",
        "High corporate demand driven by strict global environmental regulations",
        "Direct access to C-suite and board-level decision makers"
      ],
      "cons": [
        "Frustration with corporate greenwashing and bureaucratic inertia",
        "Constantly changing and fragmented global disclosure standards",
        "Pushback from internal managers who see sustainability as a cost center"
      ]
    },
    "dayInLife": [
      {"time": "09:00 AM", "activity": "Emissions Telemetry Review: Check live dashboard measuring factory electrical consumption and solar rooftop generation."},
      {"time": "10:30 AM", "activity": "Scope 3 Supplier Audit: Meet with top 20 logistics freight carriers to review their transition to electric and biodiesel fleets."},
      {"time": "01:30 PM", "activity": "CSRD Compliance Drafting: Review materiality assessment disclosures with external auditors from PwC/Deloitte."},
      {"time": "03:30 PM", "activity": "Product LCA Workshop: Collaborate with packaging engineering to replace single-use plastics with compostable mycelium foam."},
      {"time": "05:00 PM", "activity": "Executive Board Presentation: Present ROI analysis for signing a 15-year 100MW virtual solar PPA."}
    ],
    "workMetrics": {
      "remote": "70% Remote / Hybrid",
      "balance": "4.2 / 5.0",
      "stress": "Moderate",
      "travel": "Low to Moderate (10-20% to facilities)"
    },
    "whoAvoids": [
      "People who are cynical about corporate climate initiatives",
      "Those who dislike data auditing and spreadsheet compliance reporting",
      "Individuals who expect companies to sacrifice all profits immediately for green goals"
    ],
    "globalPay": {
      "us": "Entry $75K · Mid $135K · Lead $220K+",
      "in": "Entry ₹8-14 LPA · Mid ₹24-42 LPA · Lead ₹70 LPA+",
      "uk": "Entry £42K · Mid £80K · Lead £140K+",
      "uae": "Entry AED 18K/mo · Mid AED 38K/mo · Lead AED 65K/mo+"
    },
    "topEmployers": [
      "Fortune 500 Enterprises (Apple, Microsoft, Unilever, Nike)",
      "Big 4 ESG Consulting (Deloitte, EY, PwC, KPMG)",
      "Climate Tech Platforms (Watershed, Persefoni)",
      "Energy & Renewable Giants (Ørsted, Iberdrola, Tata Power)",
      "Institutional Asset Managers (BlackRock, Temasek)"
    ],
    "tools": [
      "Watershed / Persefoni (Carbon Accounting)",
      "SimaPro / GaBi (LCA Software)",
      "Tableau & PowerBI (ESG Dashboards)",
      "Microsoft Excel (GHG Protocol Calculations)",
      "CDP / EcoVadis Portals"
    ],
    "portfolioProjects": [
      "Conduct a comprehensive greenhouse gas inventory (Scope 1, 2, 3) for a hypothetical 500-employee manufacturing enterprise",
      "Write a double-materiality analysis report aligned with EU CSRD requirements for a consumer packaged goods brand",
      "Design a circular product redesign case study demonstrating cradle-to-cradle material recyclability and cost savings"
    ],
    "exitOpportunities": [
      "Chief Sustainability Officer (CSO)",
      "Climate Tech Venture Capital Partner",
      "Managing Director of Sustainable Finance"
    ],
    "reflectionQuestions": [
      "Can I remain patient and persuasive when convincing conservative executives to invest in green infrastructure?",
      "Do I enjoy combining environmental science with business economics and corporate accounting?",
      "Am I excited to lead companies through the largest industrial decarbonization transition in human history?"
    ],
    "resources": [
      "GHG Protocol Standards & Guidance Manuals",
      "\"Green to Gold: How Smart Companies Use Environmental Strategy\" by Daniel C. Esty",
      "Harvard Business Review on Corporate Sustainability",
      "Ellen MacArthur Foundation — Circular Economy Guides",
      "GreenBiz & Sustainability Magazine Publications"
    ],
    "aka": [
      "ESG Director",
      "Chief Sustainability Officer (CSO)",
      "Corporate Sustainability Manager",
      "Carbon Accounting Specialist",
      "Decarbonization Lead"
    ],
    "edu": "master",
    "interests": ["eco", "business", "science", "social"],
    "degrees": ["science", "engineering", "management"],
    "aiTag": "people"
  },
  {
    "id": "solar-grid-engineer",
    "cat": "eco",
    "catName": "Sustainability & Energy",
    "icon": "☀️",
    "title": "Solar Photovoltaic & Renewable Grid Engineer",
    "tagline": "Design utility-scale solar farms, grid interconnection systems, and battery storage microgrids",
    "desc": "Engineer photovoltaic array layouts, string inverter wiring, medium-voltage transformer substations, and battery energy storage systems (BESS) for the renewable energy grid.",
    "stream": "Science (PCM / Electrical Engineering)",
    "salary": "Entry: $72K / ₹7-12 LPA · Mid: $118K / ₹20-35 LPA · Lead: $175K+ / ₹55 LPA+",
    "growth": "28% (Much faster than average)",
    "demand": "Urgent Clean Tech Need",
    "aiImpact": "AI-Augmented — Solar radiation simulations and load forecasting utilize machine learning; physical high-voltage engineering is irreplaceable.",
    "overview": "Solar Photovoltaic and Renewable Grid Engineers design the utility-scale power plants and distributed commercial microgrids that harvest the sun's energy. They perform solar irradiance simulations, calculate DC-to-AC ratios, design inverter and transformer substations, model grid stability with high-voltage utility interconnects, and engineer massive Battery Energy Storage Systems (BESS).",
    "education": {
      "highSchoolPrereqs": "Physics, Mathematics, Chemistry.",
      "entranceExams": "JEE Main / GATE / FE & PE Electrical Exam (USA).",
      "undergradDegrees": [
        "B.Tech / B.S. in Electrical Engineering",
        "B.Tech in Energy Engineering / Renewable Systems",
        "B.S. in Power Systems Engineering"
      ],
      "certifications": [
        "NABCEP PV Installation Professional (USA)",
        "Licensed Professional Engineer (PE - Power)",
        "Certified Energy Manager (CEM)",
        "ETAP / PVSyst Certified Specialist"
      ],
      "topInstitutes": [
        "Stanford University (Precourt Institute for Energy, USA)",
        "UC Berkeley (Energy & Resources Group, USA)",
        "IIT Delhi / IIT Roorkee (Energy Studies, India)",
        "UNSW Sydney (School of Photovoltaic Engineering, Australia)",
        "TU Delft (Netherlands)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Solar Design Engineer): Model solar production in PVSyst, calculate cable voltage drop, and produce CAD single-line diagrams (SLDs) for commercial rooftop solar installations.",
      "phase2": "Years 2–5 (Senior Project Engineer): Lead utility-scale 100MW+ solar farm electrical design, coordinate grid interconnection studies with utility operators, and specify 4-hour lithium-ion BESS architectures.",
      "phase3": "Years 5–10+ (Lead Power Systems Architect): Direct multi-gigawatt renewable energy portfolios, manage engineering, procurement, and construction (EPC) contractors, and pioneer microgrid islanding networks."
    },
    "skills": {
      "hardSkills": [
        "PVSyst & Helioscope Solar Modeling",
        "AutoCAD Electrical & Single-Line Diagrams (SLD)",
        "Power System Analysis (ETAP, PSS/E)",
        "High-Voltage Substation & Transformer Design",
        "Battery Energy Storage System (BESS) Integration",
        "National Electrical Code (NEC Article 690 & 705)"
      ],
      "softSkills": [
        "Rigorous Safety Mindset (Arc-Flash & High Voltage)",
        "Contractor & EPC Project Management",
        "Regulatory & Utility Interconnect Negotiation",
        "Cross-Discipline Engineering Coordination"
      ]
    },
    "roles": [
      "Solar PV Design Engineer",
      "Renewable Energy Systems Engineer",
      "Grid Interconnection Specialist",
      "BESS Storage Systems Engineer",
      "Electrical Balance of Plant (BOP) Engineer",
      "Chief Solar Engineer"
    ],
    "decisionFit": {
      "traits": [
        "Love for physical power infrastructure and electrical engineering",
        "Excitement about transitioning the world off fossil fuels",
        "Detail-oriented mindset regarding electrical safety codes"
      ],
      "workStyle": "Mix of CAD/PVSyst computer engineering and periodic site inspections at utility solar fields.",
      "pros": [
        "Rapidly growing industry with immense government subsidies worldwide",
        "Tangible real-world impact: your designs produce clean megawatts of power",
        "High job stability as global power grids decarbonize"
      ],
      "cons": [
        "High liability: design errors can cause catastrophic substation arc fires",
        "Frustrating utility interconnect queues and grid congestion delays",
        "Hot outdoor field inspections in desert solar farm environments"
      ]
    },
    "dayInLife": [
      {"time": "08:30 AM", "activity": "PVSyst Simulation Run: Run hourly irradiance simulations for a proposed 250MW Texas solar farm accounting for bifacial module gains."},
      {"time": "10:30 AM", "activity": "Single-Line Diagram Review: Check circuit breaker ratings and surge protection devices in AutoCAD Electrical."},
      {"time": "01:30 PM", "activity": "Utility Interconnect Call: Discuss transmission line capacity and anti-islanding relay settings with the regional transmission operator."},
      {"time": "03:30 PM", "activity": "BESS Thermal Safety Review: Evaluate NFPA 855 fire suppression and liquid cooling specs for 100MWh battery containers."},
      {"time": "05:00 PM", "activity": "Field Commissioning Telemetry: Review inverter startup logs from recently energized solar phase."}
    ],
    "workMetrics": {
      "remote": "60% Remote / 40% On-Site Substation Visits",
      "balance": "4.0 / 5.0",
      "stress": "Moderate",
      "travel": "Moderate (15-25% to project sites)"
    },
    "whoAvoids": [
      "People who only want pure software or abstract math",
      "Those who dislike reading dense electrical code books (NEC, IEEE)",
      "Individuals afraid of high-voltage industrial electrical environments"
    ],
    "globalPay": {
      "us": "Entry $72K · Mid $118K · Lead $175K+",
      "in": "Entry ₹7-12 LPA · Mid ₹20-35 LPA · Lead ₹55 LPA+",
      "uk": "Entry £38K · Mid £68K · Lead £110K+",
      "uae": "Entry AED 16K/mo · Mid AED 32K/mo · Lead AED 52K/mo+"
    },
    "topEmployers": [
      "NextEra Energy & Brookfield Renewable",
      "EPC Giants (Bechtel, Sterling and Wilson, Tata Power Solar)",
      "Inverter & Battery Manufacturers (Tesla Energy, Enphase, Sungrow)",
      "Utility Operators & Grid Operators (ERCOT, National Grid)",
      "Global Renewable Developers (Adani Green, First Solar)"
    ],
    "tools": [
      "PVSyst & Helioscope",
      "AutoCAD Electrical",
      "ETAP (Power System Simulation)",
      "PVcase (Civil/Solar 3D Layout)",
      "Excel (String Sizing Calculators)",
      "FLIR Thermal Infrared Cameras"
    ],
    "portfolioProjects": [
      "Design a full 50MW utility solar farm layout in PVSyst including shading losses, inverter sizing, and annual generation estimates",
      "Produce a complete AutoCAD Single-Line Diagram (SLD) for a 1MW commercial rooftop solar + 500kWh BESS microgrid complying with NEC 690",
      "Conduct a financial LCOE (Levelized Cost of Energy) sensitivity model comparing tracker vs fixed-tilt solar mounting systems"
    ],
    "exitOpportunities": [
      "VP of Renewable Engineering",
      "Independent Power Producer (IPP) Development Director",
      "Clean Energy EPC Firm Founder"
    ],
    "reflectionQuestions": [
      "Am I passionate about electrical engineering and the physics of how power grids operate?",
      "Can I master complex technical simulation tools like PVSyst to optimize clean energy harvest?",
      "Do I want a career that directly builds the physical infrastructure of the clean energy transition?"
    ],
    "resources": [
      "PVSyst Official User Manual & Forum",
      "NABCEP Study Resources & Photovoltaic Handbook",
      "\"Solar Engineering of Thermal Processes, Photovoltaics and Wind\" by John A. Duffie",
      "IEEE Power and Energy Society Publications",
      "NREL (National Renewable Energy Laboratory) Research Reports"
    ],
    "aka": [
      "Solar PV Engineer",
      "Renewable Energy Engineer",
      "Grid Interconnection Engineer",
      "Clean Energy Power Engineer",
      "Solar Systems Designer"
    ],
    "edu": "bachelor",
    "interests": ["eco", "machines", "build", "tech"],
    "degrees": ["engineering", "science"],
    "aiTag": "automation"
  },
  {
    "id": "ev-powertrain",
    "cat": "eng",
    "catName": "Engineering & Robotics",
    "icon": "⚡",
    "title": "Electric Vehicle (EV) Powertrain & Battery Engineer",
    "tagline": "Engineer high-voltage battery chemistries, thermal management units, and traction motor inverters",
    "desc": "Design high-voltage lithium battery packs, state-of-charge battery management systems (BMS), permanent magnet synchronous motors, and SiC inverters for next-generation electric vehicles.",
    "stream": "Science (PCM / Mechanical / Electrical)",
    "salary": "Entry: $85K / ₹9-15 LPA · Mid: $140K / ₹26-45 LPA · Lead: $215K+ / ₹65 LPA+",
    "growth": "25% (Much faster than average)",
    "demand": "High Global Competition",
    "aiImpact": "AI-Augmented — Digital twin vehicle simulations speed thermal stress testing; hands-on dyno tuning and hardware validation remain physical.",
    "overview": "Electric Vehicle (EV) Powertrain and Battery Engineers develop the high-voltage propulsion systems that replace internal combustion engines. They engineer 400V and 800V lithium-ion and solid-state battery packs, design liquid-cooling thermal management loops to prevent thermal runaway, develop algorithms for Battery Management Systems (BMS state of charge/state of health), and optimize high-efficiency silicon-carbide (SiC) traction inverters and electric motors.",
    "education": {
      "highSchoolPrereqs": "Physics, Mathematics, Chemistry.",
      "entranceExams": "JEE Main / GATE / GRE / Automotive Engineering University Admissions.",
      "undergradDegrees": [
        "B.Tech / B.S. in Electrical / Mechanical / Mechatronics Engineering",
        "B.S. in Automotive Engineering",
        "M.Tech / M.S. in Electric Vehicle Technology"
      ],
      "certifications": [
        "SAE International High Voltage Vehicle Safety",
        "ASIL D / ISO 26262 Automotive Functional Safety",
        "MATLAB & Simulink Certified Associate",
        "Six Sigma Green Belt"
      ],
      "topInstitutes": [
        "Stanford University / UC Berkeley (USA)",
        "RWTH Aachen University (Germany)",
        "IIT Madras (Center for Battery Engineering, India)",
        "University of Michigan (Automotive Engineering, USA)",
        "Tsinghua University (Automotive Engineering, China)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (BMS / Thermal Junior Engineer): Model battery cell electrochemical discharge curves in MATLAB/Simulink. Test cell thermal runaways in laboratory test chambers.",
      "phase2": "Years 2–5 (Senior Powertrain Calibration Engineer): Lead dyno testing of high-power traction motors, tune field-oriented control (FOC) firmware, and design high-voltage busbar routing.",
      "phase3": "Years 5–10+ (Chief Powertrain Architect): Helm complete skateboard platform architectures for electric trucks, sports cars, or hypercars. Lead battery cell supplier partnerships and gigafactory integration."
    },
    "skills": {
      "hardSkills": [
        "Battery Management System (BMS) Firmware & Algorithms (Kalman Filtering)",
        "High-Voltage Architecture (400V / 800V Systems)",
        "Thermal Management & CFD (ANSYS Fluent / Star-CCM+)",
        "Field-Oriented Control (FOC) & Motor Inverters (SiC / GaN)",
        "MATLAB / Simulink Model-Based Design",
        "Automotive Safety Standards (ISO 26262, UN 38.3)"
      ],
      "softSkills": [
        "Extreme Safety Discipline Around High Voltage (Arc Flash)",
        "Multidisciplinary Mechanical-Electrical Synthesis",
        "Automotive Reliability Mindset",
        "Fast Laboratory Troubleshooting"
      ]
    },
    "roles": [
      "EV Battery Systems Engineer",
      "BMS Firmware Engineer",
      "Traction Motor Design Engineer",
      "High-Voltage Safety Engineer",
      "Powertrain Calibration Specialist",
      "Chief EV Architect"
    ],
    "decisionFit": {
      "traits": [
        "Deep obsession with electric mobility, supercars, and battery chemistry",
        "Strong instincts combining mechanical mechanics with electrical circuitry",
        "Thrill from testing hardware on vehicle dynamometers"
      ],
      "workStyle": "Engineering lab environment with hardware-in-the-loop (HIL) simulators, battery test chambers, and vehicle proving grounds.",
      "pros": [
        "Massive global investment from legacy automakers racing to electrify",
        "Fascinating interdisciplinary intersection of software, chemicals, and mechanical speed",
        "Outstanding compensation and stock grant packages in the EV sector"
      ],
      "cons": [
        "High risk during laboratory abuse testing (fire and toxic gas hazards)",
        "Fierce competitive pressure and aggressive vehicle launch timelines",
        "Strict regulatory and crashworthiness compliance burdens"
      ]
    },
    "dayInLife": [
      {"time": "08:30 AM", "activity": "Thermal Chamber Telemetry: Review overnight 500-cycle fast-charging telemetry on new cylindrical 4680 battery cells."},
      {"time": "10:30 AM", "activity": "Simulink BMS Algorithm Tuning: Refine Extended Kalman Filter state-of-charge tracking under sub-zero winter temperatures."},
      {"time": "01:30 PM", "activity": "Dyno Cell Motor Testing: Measure inverter switching efficiency across torque-speed curves on a 250kW traction motor dyno."},
      {"time": "03:30 PM", "activity": "Crash Safety & High-Voltage Interlock Review: Audit pyrotechnic battery disconnect fuses with vehicle safety team."},
      {"time": "05:00 PM", "activity": "Supplier Technical Review: Sync with CATL/Panasonic battery cell chemists on nickel-rich cathode degradation."}
    ],
    "workMetrics": {
      "remote": "40% Remote / 60% Lab & Dyno Testing",
      "balance": "3.9 / 5.0",
      "stress": "High (Rigorous automotive launch dates)",
      "travel": "Moderate (15-25% to testing proving grounds)"
    },
    "whoAvoids": [
      "Engineers who want purely theoretical software or website coding",
      "Those fearful of high-voltage physical electricity and battery flammability",
      "People who dislike automotive manufacturing standards and testing protocols"
    ],
    "globalPay": {
      "us": "Entry $85K · Mid $140K · Lead $215K+",
      "in": "Entry ₹9-15 LPA · Mid ₹26-45 LPA · Lead ₹65 LPA+",
      "uk": "Entry £45K · Mid £82K · Lead £135K+",
      "uae": "Entry AED 18K/mo · Mid AED 36K/mo · Lead AED 58K/mo+"
    },
    "topEmployers": [
      "Tesla, Rivian & Lucid Motors",
      "Legacy Automakers (BMW, Mercedes-Benz, Porsche, Ford, GM)",
      "Indian EV Pioneers (Tata Motors EV, Mahindra Electric, Ola Electric)",
      "Tier 1 Suppliers (Bosch, BorgWarner, Magna)",
      "Battery Gigafactory Giants (CATL, LG Energy Solution, Northvolt)"
    ],
    "tools": [
      "MATLAB & Simulink",
      "ANSYS Fluent / Icepak (Thermal)",
      "CANalyzer & Vector CANoe (CAN Bus)",
      "Altium Designer (High-Voltage PCB)",
      "dSPACE / National Instruments HIL Rigs"
    ],
    "portfolioProjects": [
      "Design and simulate an active liquid-cooled battery pack enclosure in CAD and CFD with thermal runaway propagation barriers",
      "Write a complete C/C++ Battery Management System (BMS) state-of-charge estimator using an Extended Kalman Filter in Simulink",
      "Build a working hardware-in-the-loop (HIL) test harness communicating over CAN bus to monitor voltage and thermistor cells"
    ],
    "exitOpportunities": [
      "VP of Powertrain Engineering",
      "Battery Storage Utility Solutions Director",
      "EV Hardware Startup Founder"
    ],
    "reflectionQuestions": [
      "Do I love the feeling of watching a physical motor roar to life on a dynamometer after weeks of simulation?",
      "Can I master the delicate mathematical dance between battery chemistry, thermal limits, and electric power?",
      "Do I want to engineer the vehicles that will replace gas cars on every street in the world?"
    ],
    "resources": [
      "SAE International Electric Vehicle Technical Papers",
      "\"Battery Management Systems for Large Lithium-Ion Battery Packs\" by Andrea Davide",
      "\"Electric Vehicle Technology Explained\" by James Larminie & John Lowry",
      "Tesla & Rivian Open Patents and Technical Blogs",
      "Charged Electric Vehicles Magazine"
    ],
    "aka": [
      "EV Powertrain Engineer",
      "Battery Systems Engineer",
      "BMS Engineer",
      "Electric Motor Engineer",
      "Automotive Electrification Specialist"
    ],
    "edu": "bachelor",
    "interests": ["machines", "tech", "build"],
    "degrees": ["engineering"],
    "aiTag": "automation"
  }
]

# Write out the JSON for merging
output_file = r"c:\Users\neelg\OneDrive\Desktop\Vercel\new_careers_batch.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(careers, f, indent=2)

print(f"Generated {len(careers)} new careers in {output_file}")
