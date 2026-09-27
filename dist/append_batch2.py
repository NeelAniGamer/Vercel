import json
import os
import re

batch2 = [
  {
    "id": "patent-attorney",
    "cat": "law",
    "catName": "Law & Public Safety",
    "icon": "⚖️",
    "title": "Patent Attorney & Intellectual Property Litigator",
    "tagline": "Secure global patent rights for deep-tech inventions and defend proprietary technologies in court",
    "desc": "Draft complex patent specifications and claims, conduct prior-art invalidity analyses, and litigate multi-million dollar technology patent infringements before patent offices and federal courts.",
    "stream": "STEM Degree + Law (LLB / JD)",
    "salary": "Entry: $145K / ₹16-28 LPA · Mid: $240K / ₹45-80 LPA · Lead: $420K+ / ₹1.4 Cr+",
    "growth": "12% (As fast as average)",
    "demand": "High (Dual STEM + Law Moat)",
    "aiImpact": "AI-Augmented — Prior art search engines expedite preliminary invalidity scans; nuanced legal claim drafting requires licensed patent bar attorneys.",
    "overview": "Patent Attorneys occupy an elite legal niche requiring both an accredited science/engineering degree and a law degree (JD or LLB). They translate breakthrough inventions in biotechnology, semiconductors, artificial intelligence, and aerospace into legally bulletproof patent claims. They defend tech pioneers against patent trolls and litigate high-stakes trade secret infringement cases in court.",
    "education": {
      "highSchoolPrereqs": "Science (PCM or PCB) with Mathematics.",
      "entranceExams": "LSAT / CLAT (Law) + USPTO Patent Bar Exam (USA) / Indian Patent Agent Exam.",
      "undergradDegrees": [
        "B.Tech / B.S. in Electrical, BioTech, Mechanical or Computer Science",
        "LL.B. (3-Year Post-Grad) or J.D. (Juris Doctor)"
      ],
      "certifications": [
        "Admitted to USPTO Patent Bar (Registration Examination)",
        "State Bar Association License",
        "Registered Patent Agent (India)"
      ],
      "topInstitutes": [
        "Harvard Law School / Stanford Law (USA)",
        "UC Berkeley School of Law (USA)",
        "National Law School of India University (NLSIU Bangalore)",
        "Cambridge Faculty of Law (UK)",
        "IIT Kharagpur (Rajiv Gandhi School of IP Law, India)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Patent Agent / Junior Associate): Conduct prior art searches, interview inventors, draft patent specifications and claim sets, and respond to preliminary USPTO/Patent Office rejection office actions.",
      "phase2": "Years 2–5 (Senior IP Associate): Lead patent prosecution portfolios for tech giants, draft freedom-to-operate (FTO) opinions, and participate in Markman claim construction hearings in federal litigation.",
      "phase3": "Years 5–10+ (IP Partner / General Counsel): Direct high-stakes international patent litigation trials, negotiate multi-million dollar cross-licensing deals, or serve as Chief IP Counsel for a tech multinational."
    },
    "skills": {
      "hardSkills": [
        "Patent Claim Drafting & Independent/Dependent Claims Structure",
        "Prior Art & Patent Landscape Search (PatBase, Orbit)",
        "Patent Office Action Rebuttal & Prosecution",
        "Freedom to Operate (FTO) & Invalidity Opinion Writing",
        "Markman Hearing Preparation & Federal Court IP Litigation",
        "Technology Licensing & Royalty Agreements"
      ],
      "softSkills": [
        "Bilingual Translation: Explaining Deep Tech to Lay Judges",
        "Rigorously Precise Legal Writing",
        "Adversarial Analytical Thinking",
        "Inventor Empathy"
      ]
    },
    "roles": [
      "Registered Patent Attorney",
      "Patent Agent",
      "Intellectual Property Litigator",
      "Patent Portfolio Strategist",
      "Chief Intellectual Property Counsel",
      "IP Partner"
    ],
    "decisionFit": {
      "traits": [
        "Dual passion for cutting-edge science and rigorous legal argument",
        "Extreme verbal precision where a single misplaced comma changes claim scope",
        "Enjoyment of intellectual debate and courtroom advocacy"
      ],
      "workStyle": "Corporate law firm or tech company legal department. High mental intensity with rigorous drafting deadlines.",
      "pros": [
        "Exceptional compensation: among the highest-paid legal disciplines worldwide",
        "Rare dual qualification moat (STEM + Law degree) makes you virtually irreplaceable",
        "First-look access to the world's most confidential new inventions years before release"
      ],
      "cons": [
        "Long and demanding dual education path (undergrad STEM + law school + patent bar)",
        "High billable-hour pressure in BigLaw firms (1,900+ billable hours/year)",
        "Dense, exhausting technical and legal reading"
      ]
    },
    "dayInLife": [
      {"time": "09:00 AM", "activity": "Inventor Disclosure Interview: Interview two quantum computing scientists on their novel superconducting qubit architecture."},
      {"time": "11:00 AM", "activity": "Patent Claim Drafting: Draft 20 independent and dependent claims defining the technical boundaries of the qubit invention."},
      {"time": "02:00 PM", "activity": "USPTO Office Action Response: Write a legal rebuttal demonstrating why an examiner's obviousness rejection fails under 35 U.S.C. 103."},
      {"time": "04:00 PM", "activity": "Litigation Team Strategy Call: Review expert witness depositions in an active smartphone patent infringement trial."},
      {"time": "06:00 PM", "activity": "FTO Analysis: Finalize a Freedom to Operate memo clearing a client's autonomous vehicle sensor for commercial launch."}
    ],
    "workMetrics": {
      "remote": "50% Remote / 50% Office & Courtrooms",
      "balance": "3.5 / 5.0",
      "stress": "High (Strict court deadlines and billable hours)",
      "travel": "Moderate (15-25% to federal courts and client labs)"
    },
    "whoAvoids": [
      "People who hate reading hundreds of pages of dense technical documents and patents",
      "Those without an accredited science, engineering, or computing degree",
      "Individuals who dislike rigorous adversarial debate and legal disputes"
    ],
    "globalPay": {
      "us": "Entry $145K · Mid $240K · Lead $420K+",
      "in": "Entry ₹16-28 LPA · Mid ₹45-80 LPA · Lead ₹1.4 Cr+",
      "uk": "Entry £65K · Mid £130K · Lead £250K+",
      "uae": "Entry AED 28K/mo · Mid AED 55K/mo · Lead AED 85K/mo+"
    },
    "topEmployers": [
      "Top IP Law Firms (Fish & Richardson, Finnegan, Knobbe Martens)",
      "BigLaw IP Groups (Kirkland & Ellis, Latham & Watkins, Quinn Emanuel)",
      "Tech Multinationals (Apple, Google, Qualcomm, Samsung In-House IP)",
      "Indian IP Giants (Anand and Anand, Remfry & Sagar)",
      "Biopharma Giants (Pfizer, Novartis, Genentech)"
    ],
    "tools": [
      "PatBase / Derwent World Patents Index",
      "LexisNexis & Westlaw (Case Law)",
      "USPTO PAIR / Patent Center & WIPO Patentscope",
      "Microsoft Word (Legal Redlining)",
      "ClaimMaster (Patent Proofreading Software)"
    ],
    "portfolioProjects": [
      "Draft a complete 15-page hypothetical patent application (claims, specification, and abstract) for a novel open-source robotics mechanism",
      "Conduct a comprehensive prior-art invalidity chart comparing an issued US patent against 3 historical engineering papers",
      "Write a legal Freedom-to-Operate (FTO) opinion clearing a hypothetical biotech vaccine delivery nanoparticle"
    ],
    "exitOpportunities": [
      "Chief Intellectual Property Counsel (Fortune 500)",
      "Equity Partner in a Top Tier Global Law Firm",
      "Technology Transfer & Commercialization Director at a Major University"
    ],
    "reflectionQuestions": [
      "Do I love reading about new scientific breakthroughs as much as I love crafting precise, persuasive arguments?",
      "Can I maintain laser focus while drafting complex claim sentences where every single word has legal ramifications?",
      "Am I willing to invest the years required to earn both an engineering degree and a law license?"
    ],
    "resources": [
      "USPTO Manual of Patent Examining Procedure (MPEP)",
      "\"Patent It Yourself\" by David Pressman",
      "Patently-O (Leading Patent Law Blog by Dennis Crouch)",
      "\"Landis on Mechanics of Patent Claim Drafting\"",
      "Federal Circuit Bar Association Publications"
    ],
    "aka": [
      "Patent Attorney",
      "Intellectual Property Lawyer",
      "Patent Agent",
      "IP Litigator",
      "Patent Prosecution Counsel"
    ],
    "edu": "master",
    "interests": ["law", "tech", "science", "business"],
    "degrees": ["law", "engineering", "science"],
    "aiTag": "people"
  },
  {
    "id": "dermatologist",
    "cat": "health",
    "catName": "Healthcare & Medicine",
    "icon": "🔬",
    "title": "Dermatologist & Cutaneous Surgeon",
    "tagline": "Diagnose complex skin malignancies, perform Mohs micrographic surgery, and deliver clinical dermatopathology",
    "desc": "Treat dermatologic diseases, perform Mohs micrographic excisions for skin cancer, interpret skin biopsies, and provide medical laser therapies for patients.",
    "stream": "Science (PCB / Pre-Med)",
    "salary": "Entry: $280K / ₹25-40 LPA · Mid: $420K / ₹55-90 LPA · Lead: $600K+ / ₹1.5 Cr+",
    "growth": "15% (Faster than average)",
    "demand": "Extremely High",
    "aiImpact": "Human-Centric — Computer vision aids preliminary melanoma classification, but clinical biopsy examination and surgical excision remain surgical human doctor work.",
    "overview": "Dermatologists are specialized medical doctors who diagnose and treat over 3,000 diseases of the skin, hair, and nails. Beyond aesthetic treatments, clinical dermatologists perform surgical excisions of melanomas, basal cell carcinomas, and squamous cell cancers using precise Mohs micrographic surgery. They manage severe systemic inflammatory disorders (psoriasis, eczema, lupus) and analyze microscopic tissue biopsies as dermatopathologists.",
    "education": {
      "highSchoolPrereqs": "Physics, Chemistry, Biology.",
      "entranceExams": "NEET-UG & NEET-PG (India) / MCAT & USMLE Step 1, 2, 3 (USA).",
      "undergradDegrees": [
        "MBBS (Bachelor of Medicine, Bachelor of Surgery)",
        "B.S. in Biology / Pre-Med (USA)",
        "MD / DNB in Dermatology, Venereology & Leprosy"
      ],
      "certifications": [
        "Board Certified by the American Board of Dermatology (ABD)",
        "Fellow of the American Academy of Dermatology (FAAD)",
        "Fellow of the American College of Mohs Surgery (FACMS)"
      ],
      "topInstitutes": [
        "Harvard Medical School (Massachusetts General Hospital, USA)",
        "Johns Hopkins University School of Medicine (USA)",
        "AIIMS New Delhi (Department of Dermatology, India)",
        "University of California, San Francisco (UCSF, USA)",
        "St John's Institute of Dermatology (King's College London, UK)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–5 (Pre-Med & Medical School): Graduate top 5% of class in MBBS or MD program; earn exceptional USMLE/NEET scores; publish dermatology clinical case reports.",
      "phase2": "Years 5–9 (Residency & Fellowship): Complete an internal medicine preliminary year followed by 3 years of Dermatology Residency. Pursue Mohs Micrographic Surgery or Pediatric Dermatology fellowship.",
      "phase3": "Years 9–15+ (Attending Dermatologist / Clinical Practice Director): Build a high-volume outpatient surgical practice, mentor dermatology residents, and pioneer advanced clinical laser therapies."
    },
    "skills": {
      "hardSkills": [
        "Dermoscopy & Melanoma Early Detection",
        "Mohs Micrographic Surgery & Flap Reconstruction",
        "Dermatopathology & Tissue Frozen Section Analysis",
        "Biologic Immunotherapy for Psoriasis & Atopic Dermatitis",
        "Aesthetic Laser & Cryosurgery Therapeutics",
        "Sterile Surgical Suturing & Biopsy Excision"
      ],
      "softSkills": [
        "Bedside Compassion for Distressing Skin Conditions",
        "Micro-Surgical Manual Dexterity",
        "Fast Clinical Diagnostic Intuition",
        "Patient Education & Sun Safety Advocacy"
      ]
    },
    "roles": [
      "Attending Dermatologist",
      "Mohs Micrographic Surgeon",
      "Pediatric Dermatologist",
      "Dermatopathologist",
      "Cosmetic Dermatologist",
      "Clinical Professor of Dermatology"
    ],
    "decisionFit": {
      "traits": [
        "Sharp visual pattern recognition (spotting subtle color/border pigment irregularities)",
        "Delicate surgical hand-eye precision",
        "Desire for excellent work-life balance within medicine"
      ],
      "workStyle": "Clean outpatient clinical setting. Mostly predictable daytime hours with very rare nighttime emergency calls.",
      "pros": [
        "One of the best lifestyle specialties in medicine: predictable 8-to-5 clinic hours",
        "Exceptionally high earning potential in both private practice and academia",
        "Immense patient gratitude: curing visible, debilitating conditions transforms lives"
      ],
      "cons": [
        "Hyper-competitive medical specialty: requires top 1% medical school grades",
        "Extremely long training path: 12-14 years of rigorous study and residency",
        "Heavy patient volume: seeing 30-45 patients per day in busy clinics"
      ]
    },
    "dayInLife": [
      {"time": "08:00 AM", "activity": "Mohs Surgery Case 1: Excise a recurrent basal cell carcinoma on a patient's nasal ala under local anesthesia."},
      {"time": "09:30 AM", "activity": "Frozen Section Lab Analysis: Examine horizontal cryostat tissue sections under microscope to confirm 100% clear surgical margins."},
      {"time": "10:30 AM", "activity": "Surgical Flap Reconstruction: Perform a bilobed transposition flap to close the surgical nasal defect with minimal scarring."},
      {"time": "01:30 PM", "activity": "General Dermatology Outpatient Clinic: Perform full-body skin checks using a dermatoscope; diagnose early dysplastic nevi."},
      {"time": "04:30 PM", "activity": "Biologics Consults: Prescribe IL-17 inhibitor injections for severe plaque psoriasis and review blood lab work."}
    ],
    "workMetrics": {
      "remote": "5% Remote (Tele-dermatology) / 95% Clinic",
      "balance": "4.6 / 5.0 (Top tier in medicine)",
      "stress": "Moderate",
      "travel": "Low (<10% to medical conferences)"
    },
    "whoAvoids": [
      "People squeamish about open surgical excisions, cysts, and blood",
      "Students unwilling to commit to over a decade of hyper-competitive medical training",
      "Those who dislike rapid-fire outpatient clinical patient consultations"
    ],
    "globalPay": {
      "us": "Entry $280K · Mid $420K · Lead $600K+",
      "in": "Entry ₹25-40 LPA · Mid ₹55-90 LPA · Lead ₹1.5 Cr+",
      "uk": "Entry £85K · Mid £140K · Lead £240K+",
      "uae": "Entry AED 45K/mo · Mid AED 80K/mo · Lead AED 130K/mo+"
    },
    "topEmployers": [
      "Premier Hospital Systems (Mayo Clinic, Cleveland Clinic, Mass General)",
      "Private Dermatology Groups & Specialized Cancer Centers",
      "Academic Medical Centers & AIIMS Hospitals",
      "Dermatology Group Practices & Cosmetic Laser Centers",
      "Veterans Affairs & Military Medical Centers"
    ],
    "tools": [
      "Dermatoscope (Polarized & Non-Polarized)",
      "Cryostat Microtome & Microscope (Mohs Lab)",
      "Surgical Scalpels & Electrocautery Units",
      "Pulsed-Dye & Fractional CO2 Lasers",
      "Electronic Health Record (Epic / Modernizing Medicine EMA)"
    ],
    "portfolioProjects": [
      "Publish a peer-reviewed clinical case report analyzing an atypical presentation of amelanotic melanoma",
      "Present a retrospective clinical study at the American Academy of Dermatology evaluating biologics efficacy in atopic dermatitis",
      "Complete a dermatopathology atlas distinguishing benign seborrheic keratosis from malignant squamous cell carcinoma"
    ],
    "exitOpportunities": [
      "Private Dermatology Practice Owner & Founder",
      "Chief Medical Officer at a Dermatology Pharmaceutical / Biotech Firm",
      "Chairman of Dermatology at a Major Medical School"
    ],
    "reflectionQuestions": [
      "Can I look at skin lesions and tissue slides all day with unrelenting visual curiosity and diagnostic rigor?",
      "Do I possess the patience and academic drive to maintain top-1% rank through 12 years of pre-med, med school, and residency?",
      "Do I value having predictable daytime hours and weekends with family while practicing high-level medicine?"
    ],
    "resources": [
      "\"Fitzpatrick's Dermatology in General Medicine\" (Gold Standard Textbook)",
      "Journal of the American Academy of Dermatology (JAAD)",
      "DermNet NZ — Free Global Clinical Dermatology Resource",
      "American College of Mohs Surgery Clinical Guidelines",
      "VisualDx Clinical Decision Support Platform"
    ],
    "aka": [
      "Dermatologist",
      "Skin Doctor",
      "Mohs Surgeon",
      "Dermatopathologist",
      "Cutaneous Surgeon"
    ],
    "edu": "phd",
    "interests": ["health", "science", "social"],
    "degrees": ["health"],
    "aiTag": "people"
  },
  {
    "id": "epidemiologist",
    "cat": "health",
    "catName": "Healthcare & Medicine",
    "icon": "📊",
    "title": "Epidemiologist & Disease Surveillance Scientist",
    "tagline": "Track infectious disease transmission vectors, model contagion outbreaks, and shape global health policy",
    "desc": "Investigate outbreak clusters, calculate reproduction numbers (R0), design public health contact tracing, and model biostatistical contagion simulations for international health organizations.",
    "stream": "Science (Biology / Biostatistics / Medicine)",
    "salary": "Entry: $68K / ₹7-12 LPA · Mid: $112K / ₹20-36 LPA · Lead: $170K+ / ₹55 LPA+",
    "growth": "27% (Much faster than average)",
    "demand": "High Public Sector & Pharma Need",
    "aiImpact": "AI-Augmented — Predictive epidemiological neural networks ingest genomic variant signals; field contact tracing and health communication are human.",
    "overview": "Epidemiologists are medical disease detectives who study the patterns, causes, and effects of health and disease conditions in defined populations. Working at agencies like the CDC, WHO, and state health ministries, they track outbreak vectors (influenza, vector-borne pathogens, novel zoonotic viruses), design clinical trials for vaccines, and run complex mathematical models (SEIR simulations) to advise governments on quarantines, border screenings, and immunization programs.",
    "education": {
      "highSchoolPrereqs": "Biology, Mathematics, Chemistry.",
      "entranceExams": "GRE / University Master's in Public Health (MPH) Admissions.",
      "undergradDegrees": [
        "B.S. in Public Health / Microbiology / Biology",
        "B.S. / B.Sc in Statistics or Mathematics",
        "MBBS / MD (Medical Epidemiologist Track)"
      ],
      "certifications": [
        "Certified in Public Health (CPH)",
        "Epidemic Intelligence Service (EIS) Fellow - CDC",
        "SAS Certified Statistical Business Analyst"
      ],
      "topInstitutes": [
        "Johns Hopkins Bloomberg School of Public Health (USA)",
        "Harvard T.H. Chan School of Public Health (USA)",
        "London School of Hygiene & Tropical Medicine (UK)",
        "National Institute of Epidemiology (ICMR NIE, India)",
        "Karolinska Institute (Sweden)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Outbreak Investigation Analyst): Clean disease surveillance surveillance data in R/Python, calculate attack rates, and trace field contact clusters during regional foodborne or viral outbreaks.",
      "phase2": "Years 2–5 (Senior Epidemiologist): Build compartmental mathematical contagion models, design case-control and cohort studies, and publish peer-reviewed vaccine efficacy evaluations.",
      "phase3": "Years 5–10+ (State Epidemiologist / WHO Director): Direct national disease prevention ministries, coordinate pandemic response task forces with heads of state, and guide international biosafety protocols."
    },
    "skills": {
      "hardSkills": [
        "Biostatistics & Survival Analysis (R, Python, SAS, STATA)",
        "Compartmental Infectious Disease Modeling (SIR / SEIR Models)",
        "Genomic Epidemiology & Pathogen Phylogenetics (Nextstrain)",
        "Spatial Disease Mapping (ArcGIS / QGIS)",
        "Study Design (Cohort, Case-Control, Randomized Controlled Trials)",
        "Survey Sampling & National Health Registry Audits"
      ],
      "softSkills": [
        "Public Health Crisis Communication",
        "Scientific Objectivity Under Political Pressure",
        "Field Investigation Tenacity",
        "Interdisciplinary Collaboration"
      ]
    },
    "roles": [
      "Infectious Disease Epidemiologist",
      "Biostatistician",
      "Field Surveillance Officer",
      "Chronic Disease Epidemiologist",
      "EIS Officer (CDC)",
      "Director of Public Health Surveillance"
    ],
    "decisionFit": {
      "traits": [
        "Love for statistics applied to solving human health crises",
        "Thrill from investigating mysteries and tracking hidden causes",
        "Deep sense of mission to protect entire populations"
      ],
      "workStyle": "Mix of statistical modeling on computers and field deployments to investigate active outbreak locations.",
      "pros": [
        "Incredible societal impact: preventing a pandemic saves millions of lives",
        "Fascinating blend of medical science, mathematical modeling, and detective work",
        "High job security in government ministries, WHO, CDC, and pharmaceutical vaccine firms"
      ],
      "cons": [
        "Political pressure and public polarization during outbreak management",
        "Emergency surge hours and sleep deprivation during active epidemics",
        "Salaries in government public health are lower than private software/finance"
      ]
    },
    "dayInLife": [
      {"time": "08:30 AM", "activity": "Surveillance Dashboard Sweep: Monitor daily municipal hospital admission feeds for unusual spikes in respiratory distress clusters."},
      {"time": "10:30 AM", "activity": "R Statistical Modeling: Run Bayesian SEIR models estimating R-effective transmission numbers across 12 urban districts."},
      {"time": "01:30 PM", "activity": "Field Team Debrief: Review contact-tracing interview questionnaires with field investigators tracking a vector-borne dengue outbreak."},
      {"time": "03:30 PM", "activity": "Genomic Sequencing Alignment: Compare viral spike protein mutations on Nextstrain to evaluate potential vaccine evasion."},
      {"time": "05:00 PM", "activity": "Ministry of Health Briefing: Prepare a concise 2-page policy memo advising public health officials on school ventilation measures."}
    ],
    "workMetrics": {
      "remote": "60% Remote / 40% Field Outbreak Deployments",
      "balance": "4.1 / 5.0 (High during peacetime; intense during outbreaks)",
      "stress": "High during epidemics",
      "travel": "Moderate (10-30% to field sites)"
    },
    "whoAvoids": [
      "People who dislike statistics, math, and data analysis software",
      "Those who want high corporate finance salaries",
      "Individuals who cannot handle public health politics and bureaucratic committees"
    ],
    "globalPay": {
      "us": "Entry $68K · Mid $112K · Lead $170K+",
      "in": "Entry ₹7-12 LPA · Mid ₹20-36 LPA · Lead ₹55 LPA+",
      "uk": "Entry £38K · Mid £65K · Lead £105K+",
      "uae": "Entry AED 16K/mo · Mid AED 32K/mo · Lead AED 55K/mo+"
    },
    "topEmployers": [
      "Centers for Disease Control and Prevention (CDC) & WHO",
      "State and National Departments of Health (ICMR, UKHSA)",
      "Pharmaceutical Vaccine Manufacturers (Moderna, Pfizer, Serum Institute of India)",
      "Global NGOs (Bill & Melinda Gates Foundation, Doctors Without Borders)",
      "Academic Public Health Research Institutes"
    ],
    "tools": [
      "R & RStudio (EpiEstim, ggplot2)",
      "Python (Pandas, SciPy, NumPy)",
      "SAS & STATA",
      "ArcGIS / QGIS (Spatial Mapping)",
      "Nextstrain / BLAST (Genomic Phylogenetics)"
    ],
    "portfolioProjects": [
      "Build a reproducible R package simulating a seasonal epidemic outbreak using an SEIR compartmental model with intervention testing",
      "Conduct a full spatial cluster analysis in QGIS mapping contaminated water sources to municipal cholera outbreak cases",
      "Publish an analysis of open-access CDC epidemiological data evaluating the effectiveness of mask mandates on viral transmission"
    ],
    "exitOpportunities": [
      "Chief Medical Officer at a Vaccine Biotech Firm",
      "Director of Global Health Security at the WHO",
      "Professor of Epidemiology & Biostatistics"
    ],
    "reflectionQuestions": [
      "Does the idea of using statistics to hunt down the source of a deadly outbreak excite my investigative curiosity?",
      "Can I remain calm, objective, and data-driven when politicians and media are panicking during a public health emergency?",
      "Do I want to protect the health of millions of people at the population scale rather than treating one patient at a time?"
    ],
    "resources": [
      "CDC Epidemic Intelligence Service (EIS) Field Case Studies",
      "\"Modern Epidemiology\" by Kenneth J. Rothman",
      "Nextstrain.org — Real-Time Tracking of Pathogen Evolution",
      "American Journal of Epidemiology & The Lancet Infectious Diseases",
      "Johns Hopkins Coronavirus Resource Center Archives"
    ],
    "aka": [
      "Epidemiologist",
      "Disease Detective",
      "Surveillance Epidemiologist",
      "Biostatistician",
      "Public Health Scientist"
    ],
    "edu": "master",
    "interests": ["health", "science", "numbers", "social"],
    "degrees": ["health", "science"],
    "aiTag": "people"
  },
  {
    "id": "chief-ai-officer",
    "cat": "tech",
    "catName": "Technology & AI",
    "icon": "🧠",
    "title": "Chief AI Officer, AI Safety & Governance Lead",
    "tagline": "Govern enterprise-wide generative AI architectures, algorithmic risk, and ethical compliance frameworks",
    "desc": "Define enterprise AI roadmaps, establish LLM safety and red-teaming guardrails, ensure EU AI Act compliance, and architect multi-agent autonomous infrastructure for global corporations.",
    "stream": "Science (Computing / Data Science / Cognitive Science)",
    "salary": "Entry: $150K / ₹25-45 LPA · Mid: $280K / ₹60-1.1 Cr · Lead: $480K+ / ₹2.0 Cr+",
    "growth": "42% (Explosive New C-Suite Role)",
    "demand": "Top Strategic Priority",
    "aiImpact": "Human Governance — Sets guardrails, red-teaming protocols, and fiduciary alignment standards to monitor autonomous AI systems.",
    "overview": "The Chief AI Officer (CAIO) and Enterprise AI Governance Lead is a premier executive responsible for orchestrating a company's artificial intelligence strategy, deployment, and risk management. As generative AI and autonomous agentic workflows enter corporate operations, the CAIO ensures models comply with the EU AI Act, prevents catastrophic data leakage, implements rigorous red-teaming benchmarks, and maximizes enterprise productivity ROI.",
    "education": {
      "highSchoolPrereqs": "Mathematics, Physics, Computer Science.",
      "entranceExams": "GRE / CAT / Top Tier PhD or MBA Programs.",
      "undergradDegrees": [
        "B.S. / B.Tech in Computer Science / Artificial Intelligence",
        "B.S. in Data Science / Mathematics / Cognitive Science",
        "M.S. / Ph.D. in Machine Learning or Artificial Intelligence"
      ],
      "certifications": [
        "IAPP Certified Artificial Intelligence Governance Professional (AIGP)",
        "Stanford Executive Program in AI Governance",
        "AWS / Google Cloud Certified Machine Learning Specialist"
      ],
      "topInstitutes": [
        "Stanford Institute for Human-Centered AI (HAI, USA)",
        "MIT Schwarzman College of Computing (USA)",
        "Carnegie Mellon University (School of Computer Science, USA)",
        "Oxford Future of Humanity Institute / AI Ethics (UK)",
        "IIT Madras / IIT Bombay (Centre for AI, India)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–3 (Lead AI Architect / ML Research Engineer): Train large language models, build RAG pipelines, fine-tune open-weights models, and write custom safety filters for hallucination suppression.",
      "phase2": "Years 3–7 (VP of AI Engineering / Head of AI Trust): Design enterprise AI governance policies, run automated adversarial red-teaming evaluations, and oversee corporate data residency and copyright protection.",
      "phase3": "Years 7–12+ (Chief AI Officer - CAIO): Report to the CEO and Board of Directors. Steer capital investments into AI compute clusters, lead enterprise-wide agentic adoption, and ensure ethical alignment."
    },
    "skills": {
      "hardSkills": [
        "Enterprise LLM Architecture (RAG, Fine-Tuning, Quantization)",
        "AI Safety & Red-Teaming (Jailbreak Detection, Prompt Injection Guardrails)",
        "Regulatory Compliance (EU AI Act, NIST AI RMF, ISO 42001)",
        "AI Agentic Orchestration Frameworks (LangGraph, AutoGen, CrewAI)",
        "Data Privacy & IP Protection (Differential Privacy, Zero-Retention APIs)",
        "Compute Infrastructure Optimization (GPUs, Inference Latency, ROI)"
      ],
      "softSkills": [
        "Boardroom Fiduciary Communication",
        "Balancing Innovation Speed with Catastrophic Risk Prevention",
        "Ethical Moral Courage",
        "Cross-Departmental Organizational Transformation"
      ]
    },
    "roles": [
      "Chief AI Officer (CAIO)",
      "Head of AI Governance & Trust",
      "Enterprise AI Strategist",
      "VP of Artificial Intelligence",
      "AI Ethics & Safety Director",
      "Principal AI Solutions Architect"
    ],
    "decisionFit": {
      "traits": [
        "Strategic macro-vision on how artificial intelligence transforms human work",
        "Deep technical literacy in machine learning combined with executive leadership",
        "High ethical responsibility regarding algorithmic bias and societal harm"
      ],
      "workStyle": "Executive leadership blending high-level board meetings, technical architecture audits, and regulatory discussions.",
      "pros": [
        "One of the fastest-growing and highest-compensated C-suite roles in history",
        "Direct influence shaping the future of enterprise operations and human-AI collaboration",
        "Massive organizational authority across technology, legal, and business units"
      ],
      "cons": [
        "High accountability: catastrophic hallucination or compliance breach falls on you",
        "Rapidly moving target: foundational AI models evolve every month",
        "Managing hype: filtering snake-oil AI vendor pitches from real technology"
      ]
    },
    "dayInLife": [
      {"time": "08:30 AM", "activity": "AI News & Model Benchmark Scan: Review latest frontier model releases, latency benchmarks, and safety evaluations."},
      {"time": "10:00 AM", "activity": "Board Audit Committee: Present a risk-exposure audit showing enterprise compliance with the EU AI Act high-risk classification."},
      {"time": "01:00 PM", "activity": "Red-Teaming Lab Review: Examine automated adversarial prompt-injection attacks executed against the customer-facing AI agent."},
      {"time": "03:00 PM", "activity": "Compute Budget & Cloud Negotiations: Review GPU cluster inference spending with cloud engineering to reduce annual token burn by 30%."},
      {"time": "05:00 PM", "activity": "Product Leadership Alignment: Evaluate a proposal to deploy autonomous agents in internal finance workflows."}
    ],
    "workMetrics": {
      "remote": "50% Remote / 50% Corporate Headquarters",
      "balance": "3.8 / 5.0",
      "stress": "High (Top executive accountability)",
      "travel": "Moderate (20-30% to global offices and AI summits)"
    },
    "whoAvoids": [
      "Engineers who only want to code algorithms and hate corporate board politics",
      "People overwhelmed by hyper-fast technological change",
      "Those who lack the confidence to tell CEOs and boards 'no' on risky AI deployments"
    ],
    "globalPay": {
      "us": "Entry $150K · Mid $280K · Lead $480K+",
      "in": "Entry ₹25-45 LPA · Mid ₹60-1.1 Cr · Lead ₹2.0 Cr+",
      "uk": "Entry £85K · Mid £170K · Lead £320K+",
      "uae": "Entry AED 35K/mo · Mid AED 70K/mo · Lead AED 120K/mo+"
    },
    "topEmployers": [
      "Global Financial Institutions (JPMorgan, Goldman Sachs, HSBC)",
      "Enterprise Tech Giants (Microsoft, Salesforce, Google, IBM)",
      "Healthcare & Pharma Conglomerates (Pfizer, Johnson & Johnson)",
      "Management Consulting Firms (McKinsey, BCG, Bain)",
      "Government Defense & Intelligence Agencies"
    ],
    "tools": [
      "LangSmith / Arize Phoenix (LLM Observability)",
      "Garak & PyRIT (Adversarial Red-Teaming)",
      "Weights & Biases (Experiment Tracking)",
      "OneTrust / Credo AI (Governance Platforms)",
      "NIST AI Risk Management Framework Toolkits"
    ],
    "portfolioProjects": [
      "Architect a complete Enterprise AI Governance framework document detailing tier-based risk classification and human-in-the-loop gates",
      "Build an automated LLM safety red-teaming pipeline that tests system prompts against 500+ known prompt injection vectors",
      "Conduct a comprehensive ROI business case comparing fine-tuning open-weights models vs proprietary API inference for a 10,000-person enterprise"
    ],
    "exitOpportunities": [
      "Chief Executive Officer (CEO) of a Tech Enterprise",
      "AI Safety Venture Capital Partner",
      "Government National AI Safety Institute Director"
    ],
    "reflectionQuestions": [
      "Do I possess the rare combination of deep technical AI understanding and executive boardroom gravitas?",
      "Can I separate genuine technological capability from marketing hype to protect an organization's capital?",
      "Am I prepared to lead humanity's responsible adoption of cognitive technology in the enterprise?"
    ],
    "resources": [
      "NIST AI Risk Management Framework (AI RMF 1.0)",
      "European Union AI Act Official Legislative Text & Guidelines",
      "IAPP AI Governance Professional Resources",
      "Stanford HAI State of AI Annual Index Report",
      "Anthropic & OpenAI Technical Safety Research Publications"
    ],
    "aka": [
      "Chief AI Officer",
      "CAIO",
      "Head of AI",
      "VP of Artificial Intelligence",
      "AI Governance Director",
      "Chief AI Safety Officer"
    ],
    "edu": "master",
    "interests": ["tech", "business", "social", "law"],
    "degrees": ["computing", "management", "engineering"],
    "aiTag": "automation"
  }
]

# Merge into new_careers_batch.json
output_file = r"c:\Users\neelg\OneDrive\Desktop\Vercel\new_careers_batch.json"
existing = []
if os.path.exists(output_file):
    with open(output_file, "r", encoding="utf-8") as f:
        existing = json.load(f)

existing_ids = {c["id"] for c in existing}
for c in batch2:
    if c["id"] not in existing_ids:
        existing.append(c)

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(existing, f, indent=2)

print(f"Total careers in batch so far: {len(existing)}")
