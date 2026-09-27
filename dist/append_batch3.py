import json
import os

batch3 = [
  {
    "id": "bioinformatics",
    "cat": "science",
    "catName": "Science & DeepTech",
    "icon": "🧬",
    "title": "Bioinformatics & Computational Biologist",
    "tagline": "Decipher genomic sequencing data, model macromolecular protein structures, and accelerate computational drug discovery",
    "desc": "Write scalable bio-computational pipelines in Python, R, and Nextflow to analyze RNA-seq datasets, variant call files (VCF), and predict tertiary protein structures with AlphaFold for precision medicine.",
    "stream": "Science (Biology + Math/Computing)",
    "salary": "Entry: $82K / ₹8-14 LPA · Mid: $138K / ₹24-42 LPA · Lead: $210K+ / ₹65 LPA+",
    "growth": "23% (Much faster than average)",
    "demand": "High Biotech Demand",
    "aiImpact": "AI-Powered — Deep learning systems like AlphaFold transform structural biology; computational biologists validate synthetic biological targets.",
    "overview": "Bioinformatics and Computational Biologists stand at the intersection of molecular biology, high-performance computing, and machine learning. When clinical researchers sequence patient genomes or pharmaceutical companies engineer novel biologics, computational biologists write algorithms to filter billions of base pairs, discover disease-driving genetic variants, model protein-ligand docking affinities, and accelerate targeted cancer therapeutics.",
    "education": {
      "highSchoolPrereqs": "Biology, Mathematics, Physics, Chemistry.",
      "entranceExams": "GATE / GRE / University Graduate Admissions in Bioinformatics.",
      "undergradDegrees": [
        "B.S. / B.Tech in Bioinformatics / Biotechnology",
        "B.S. in Computer Science with Molecular Biology minor",
        "B.S. in Computational Biology / Data Science"
      ],
      "certifications": [
        "AWS Certified Cloud Practitioner - Life Sciences Focus",
        "BioConductor / R Professional Certificate",
        "Nextflow & Workflow Management Specialist"
      ],
      "topInstitutes": [
        "Harvard University / Broad Institute (USA)",
        "Johns Hopkins University (USA)",
        "Cambridge University / Wellcome Sanger Institute (UK)",
        "IIT Delhi (Center of Excellence in Complex Systems, India)",
        "Weizmann Institute of Science (Israel)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Bioinformatics Analyst): Clean FASTQ sequencing data, run variant calling pipelines (GATK, BWA), perform differential gene expression analysis in R (DESeq2), and visualize RNA-seq heatmaps.",
      "phase2": "Years 2–5 (Senior Computational Biologist): Architect cloud pipelines in Nextflow/Docker on AWS, run AlphaFold protein structure predictions, and lead target identification in immuno-oncology clinical trials.",
      "phase3": "Years 5–10+ (Director of Computational Biology / Head of In Silico Discovery): Lead biopharma drug discovery platforms, direct multi-omics integration (genomics, proteomics, single-cell RNA), and partner with clinical wet-lab teams."
    },
    "skills": {
      "hardSkills": [
        "Genomic Pipeline Orchestration (Nextflow, Snakemake, CWL)",
        "Python (Biopython, Pandas) & R (Bioconductor, DESeq2)",
        "High-Throughput Sequencing Analysis (WGS, WES, scRNA-seq)",
        "Structural Biology & Molecular Docking (AlphaFold, PyMOL, Rosetta)",
        "Variant Calling & Annotation (GATK, VEP, SnpEff)",
        "Cloud HPC Computing (AWS Batch, Slurm, Docker)"
      ],
      "softSkills": [
        "Translating Biology to Computer Algorithms",
        "Scientific Skepticism of Noisy Datasets",
        "Patience with Massive Cloud Computing Runs",
        "Cross-Discipline Wet-Lab Collaboration"
      ]
    },
    "roles": [
      "Bioinformatics Scientist",
      "Computational Biologist",
      "Genomics Data Scientist",
      "Structural Bioinformatician",
      "Pipeline Architect (Life Sciences)",
      "Director of Bioinformatics"
    ],
    "decisionFit": {
      "traits": [
        "Fascinated by the code of DNA and cellular molecular machines",
        "Love for coding and large-scale data manipulation in Python/R",
        "Deep scientific curiosity regarding human disease mechanisms"
      ],
      "workStyle": "Dry-lab computational work in front of high-performance Linux workstations and cloud clusters. High remote work flexibility.",
      "pros": [
        "Solve the deepest puzzles of human genetics and disease biology",
        "Avoid tedious wet-lab pipetting while working on cutting-edge life sciences",
        "Booming industry driven by personalized medicine and mRNA therapeutics"
      ],
      "cons": [
        "Massive, noisy datasets with high rates of biological false positives",
        "Debugging complex, fragile bioinformatics command-line software packages",
        "High educational barrier: most senior positions require an MS or PhD"
      ]
    },
    "dayInLife": [
      {"time": "09:00 AM", "activity": "Cluster Pipeline Telemetry: Check overnight Nextflow runs processing 120 single-cell RNA-seq patient tumor samples on AWS Batch."},
      {"time": "10:30 AM", "activity": "R Statistical Analysis: Run Seurat dimensional reduction and UMAP clustering to identify rare drug-resistant cell sub-populations."},
      {"time": "01:30 PM", "activity": "Wet-Lab Scientist Sync: Walk through top candidate target proteins with the oncology immunology team to plan CRISPR validation."},
      {"time": "03:30 PM", "activity": "AlphaFold Structure Modeling: Predict tertiary protein conformations for a mutated kinase receptor and analyze ligand binding pockets."},
      {"time": "05:00 PM", "activity": "Code Documentation & Containerization: Push updated Docker containers and Nextflow modules to institutional GitHub repository."}
    ],
    "workMetrics": {
      "remote": "80% Remote / Hybrid",
      "balance": "4.2 / 5.0",
      "stress": "Moderate",
      "travel": "Low (<10% to academic/industry symposia)"
    },
    "whoAvoids": [
      "People who dislike biology, genetics, and molecular biochemistry",
      "Engineers who hate dealing with biological ambiguity and noisy clinical data",
      "Those who only want simple consumer tech app development"
    ],
    "globalPay": {
      "us": "Entry $82K · Mid $138K · Lead $210K+",
      "in": "Entry ₹8-14 LPA · Mid ₹24-42 LPA · Lead ₹65 LPA+",
      "uk": "Entry £45K · Mid £78K · Lead £130K+",
      "uae": "Entry AED 20K/mo · Mid AED 38K/mo · Lead AED 60K/mo+"
    },
    "topEmployers": [
      "Biotech & Pharma Pioneers (Genentech, Novartis, Illumina, Moderna)",
      "Research Institutes (Broad Institute, Wellcome Sanger, EMBL-EBI)",
      "Cancer Centers (Memorial Sloan Kettering, MD Anderson, Tata Memorial)",
      "AI Drug Discovery Startups (Recursion Pharmaceuticals, Insitro, Relay Therapeutics)",
      "Agricultural Genetics Giants (Bayer Crop Science)"
    ],
    "tools": [
      "Nextflow / Snakemake",
      "R & Bioconductor (DESeq2, Seurat)",
      "Python (Biopython, Scanpy)",
      "AlphaFold & ESMFold",
      "IGV (Integrative Genomics Viewer)",
      "AWS Batch & Docker"
    ],
    "portfolioProjects": [
      "Build an end-to-end reproducible Nextflow pipeline that ingests raw FASTQ files, runs QC, and outputs annotated VCF variant tables",
      "Conduct a single-cell RNA-seq clustering analysis in R/Python identifying differential immune cell expression in COVID-19 vs healthy lung tissue",
      "Run an in silico molecular docking simulation in PyMOL predicting binding affinity of FDA-approved small molecules against a viral protease"
    ],
    "exitOpportunities": [
      "VP of Computational Biology / In Silico Discovery",
      "AI Drug Discovery Startup Co-Founder",
      "Life Sciences Venture Capital Technical Partner"
    ],
    "reflectionQuestions": [
      "Do I want to write code that directly contributes to finding cures for cancer and rare genetic disorders?",
      "Can I bridge the cultural divide between dry computational coders and bench-top biological scientists?",
      "Am I captivated by how billions of lines of genomic code govern living organisms?"
    ],
    "resources": [
      "EMBL-EBI Training Online Courses",
      "Bioinformatics Algorithms by Phillip Compeau & Pavel Pevzner",
      "Nature Biotechnology & Genome Biology Journals",
      "Biostars — Bioinformatics Question & Answer Community",
      "Rosalind.info — Computational Biology Problem Solving Platform"
    ],
    "aka": [
      "Bioinformatics Scientist",
      "Computational Biologist",
      "Genomics Analyst",
      "Biomedical Data Scientist"
    ],
    "edu": "master",
    "interests": ["science", "tech", "health", "numbers"],
    "degrees": ["science", "computing", "engineering"],
    "aiTag": "automation"
  },
  {
    "id": "forensic-accountant",
    "cat": "biz",
    "catName": "Business & Finance",
    "icon": "🔍",
    "title": "Forensic Accountant & Financial Fraud Investigator",
    "tagline": "Uncover money laundering, corporate embezzlement, and shell-company fraud for courts and regulators",
    "desc": "Reconstruct hidden financial paper trails, trace illicit cryptocurrency transfers, detect complex white-collar embezzlement schemes, and deliver expert courtroom testimony as a certified fraud examiner.",
    "stream": "Commerce (Accounting / Finance / Law)",
    "salary": "Entry: $74K / ₹8-13 LPA · Mid: $122K / ₹22-38 LPA · Lead: $190K+ / ₹60 LPA+",
    "growth": "14% (Faster than average)",
    "demand": "High Regulatory Need",
    "aiImpact": "AI-Augmented — Graph neural networks trace suspicious cryptocurrency and bank transactions; expert courtroom testimony requires certified forensic accountants.",
    "overview": "Forensic Accountants are elite financial detectives who investigate corporate crimes, embezzlement, money laundering, bankruptcy fraud, and hidden divorce assets. Combining forensic auditing with legal evidentiary standards, they reconstruct complex transaction webs, subpoena offshore shell company records, and present undeniable expert witness testimony in criminal and civil trials.",
    "education": {
      "highSchoolPrereqs": "Commerce, Mathematics, Accountancy.",
      "entranceExams": "CA (Chartered Accountant) / CPA (Certified Public Accountant) / CFE Exam.",
      "undergradDegrees": [
        "B.Com (Honours in Accounting & Finance)",
        "B.S. in Accounting with Forensic Concentration",
        "Integrated Commerce + Law (B.Com LL.B)"
      ],
      "certifications": [
        "Certified Fraud Examiner (CFE - ACFE)",
        "Certified in Financial Forensics (CFF - AICPA)",
        "Chartered Accountant (ICAI, India) / CPA (USA)",
        "Certified Anti-Money Laundering Specialist (CAMS)"
      ],
      "topInstitutes": [
        "Institute of Chartered Accountants of India (ICAI)",
        "University of Texas at Austin (McCombs School of Business, USA)",
        "University of Illinois Urbana-Champaign (USA)",
        "London School of Economics (UK)",
        "Shri Ram College of Commerce (SRCC, Delhi University, India)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Forensic Audit Associate): Scrutinize general ledgers, reconcile altered invoices, perform Benford's Law anomaly detection on accounts payable datasets, and prepare cross-examination exhibits.",
      "phase2": "Years 2–5 (Senior Fraud Investigator): Trace multi-tier offshore banking transactions, lead digital asset and cryptocurrency blockchain tracking, and conduct confrontational investigative interviews with corporate suspects.",
      "phase3": "Years 5–10+ (Partner / Forensic Practice Leader): Serve as a qualified expert witness in federal court trials, advise corporate boards on anti-bribery (FCPA) compliance, and lead multi-jurisdictional asset recovery."
    },
    "skills": {
      "hardSkills": [
        "Forensic General Ledger & Bank Statement Reconstruction",
        "Benford's Law & Fraud Statistical Anomaly Detection",
        "Cryptocurrency Blockchain Tracing (Chainalysis, Elliptic)",
        "Rules of Evidence & Litigation Support Protocol",
        "Electronic Discovery (Relativity, eDiscovery Software)",
        "Anti-Money Laundering & FCPA / UK Bribery Act Compliance"
      ],
      "softSkills": [
        "Investigative Tenacity & Skepticism",
        "Interrogation & Investigative Interviewing Tactics",
        "Unshakeable Composure Under Courtroom Cross-Examination",
        "Clear Jargon-Free Narrative Reporting"
      ]
    },
    "roles": [
      "Forensic Accountant",
      "Certified Fraud Examiner (CFE)",
      "Financial Intelligence Analyst",
      "Litigation Support Specialist",
      "Anti-Money Laundering (AML) Investigator",
      "Expert Witness / Forensic Partner"
    ],
    "decisionFit": {
      "traits": [
        "Natural detective mindset that questions every single invoice and receipt",
        "High moral integrity and resistance to intimidation",
        "Enjoyment of piecing together scattered financial puzzles"
      ],
      "workStyle": "Corporate office and law firm conference rooms with frequent visits to courthouses and government enforcement offices.",
      "pros": [
        "High drama and excitement compared to routine corporate accounting",
        "Excellent pay and recession-proof demand: fraud spikes during economic downturns",
        "Deep professional respect from attorneys, law enforcement, and federal judges"
      ],
      "cons": [
        "Adversarial and high-stress environments: corporate suspects may lie or intimidate",
        "Strict legal rules: a minor chain-of-custody error can invalidate months of work",
        "Exhausting review of thousands of mundane receipts, contracts, and banking spreadsheets"
      ]
    },
    "dayInLife": [
      {"time": "08:30 AM", "activity": "Ledger Anomaly Detection: Run Python script testing 200,000 corporate vendor disbursements against Benford's Law to flag irregular round-number payments."},
      {"time": "10:30 AM", "activity": "Blockchain Crypto Tracing: Trace $4M in embezzled funds moving through crypto tumblers and decentralized exchanges using Chainalysis."},
      {"time": "01:30 PM", "activity": "Litigation Prep with Trial Counsel: Review the trial cross-examination exhibit binders with the lead prosecution attorneys."},
      {"time": "03:30 PM", "activity": "Suspect Financial Interview: Observe and question a former corporate controller suspected of creating ghost vendors."},
      {"time": "05:00 PM", "activity": "Expert Witness Report Drafting: Finalize a 40-page sworn expert forensic accounting affidavit for an upcoming federal court hearing."}
    ],
    "workMetrics": {
      "remote": "50% Remote / 50% Courtrooms & Law Offices",
      "balance": "4.0 / 5.0",
      "stress": "High (Adversarial trials and high financial stakes)",
      "travel": "Moderate (10-25% to client headquarters and courts)"
    },
    "whoAvoids": [
      "People who want predictable, quiet routine spreadsheet tasks",
      "Those intimidated by intense courtroom cross-examination by defense lawyers",
      "Individuals who dislike digging through messy, altered financial records"
    ],
    "globalPay": {
      "us": "Entry $74K · Mid $122K · Lead $190K+",
      "in": "Entry ₹8-13 LPA · Mid ₹22-38 LPA · Lead ₹60 LPA+",
      "uk": "Entry £40K · Mid £72K · Lead £125K+",
      "uae": "Entry AED 18K/mo · Mid AED 35K/mo · Lead AED 55K/mo+"
    },
    "topEmployers": [
      "Big 4 Forensic & Dispute Practices (PwC, EY, Deloitte, KPMG)",
      "Specialized Investigation Firms (Kroll, Alvarez & Marsal, FTI Consulting)",
      "Government Agencies (FBI, IRS-CI, SEC, Enforcement Directorate India, Serious Fraud Office UK)",
      "Top Tier Corporate Litigation Law Firms",
      "Multinational Financial Institutions Internal Fraud Units"
    ],
    "tools": [
      "Chainalysis / Elliptic (Crypto Tracing)",
      "Relativity (eDiscovery Platform)",
      "Microsoft Excel & Power Query",
      "IDEA / ACL (Data Extraction & Analytics)",
      "Python / R (Fraud Anomaly Algorithms)"
    ],
    "portfolioProjects": [
      "Reconstruct a simulated 3-year multi-million dollar corporate embezzlement scheme from raw check registers and alter invoices",
      "Conduct a cryptocurrency blockchain audit tracing ransomware proceeds through mixing protocols to cash-out exchanges",
      "Draft a 20-page mock Expert Witness Forensic Accounting Report calculating economic damages in a corporate breach of contract suit"
    ],
    "exitOpportunities": [
      "Equity Partner in a Top Forensic Accounting Firm",
      "Chief Compliance Officer / Head of Financial Crimes",
      "Federal Law Enforcement Special Agent (FBI / IRS-CI)"
    ],
    "reflectionQuestions": [
      "Do I have the persistence to comb through 10,000 ledger lines to find the single receipt that proves an embezzlement conspiracy?",
      "Can I defend my findings calmly and authoritatively under hostile questioning from top corporate litigators?",
      "Do I want to put my financial and accounting skills to work bringing corrupt actors to justice?"
    ],
    "resources": [
      "Association of Certified Fraud Examiners (ACFE) — Fraud Magazine & Resources",
      "\"Financial Shenanigans: How to Detect Accounting Gimmicks & Fraud\" by Howard Schilit",
      "AICPA Forensic and Valuation Services Guides",
      "\"Forensic Accounting and Fraud Examination\" by Mary-Jo Kranacher",
      "Chainalysis Crypto Crime Reports"
    ],
    "aka": [
      "Forensic Accountant",
      "Certified Fraud Examiner",
      "Financial Investigator",
      "Forensic Auditor",
      "Litigation Support Accountant"
    ],
    "edu": "bachelor",
    "interests": ["numbers", "business", "law", "social"],
    "degrees": ["commerce", "law", "management"],
    "aiTag": "people"
  },
  {
    "id": "sports-physiotherapist",
    "cat": "health",
    "catName": "Healthcare & Medicine",
    "icon": "🏃",
    "title": "Sports Physiotherapist & High-Performance Athletic Coach",
    "tagline": "Rehabilitate acute musculoskeletal injuries, design kinetic biomechanics conditioning, and optimize elite athletes",
    "desc": "Deliver on-field acute injury triage, return-to-play rehabilitation protocols, force plate kinetic motion tracking, and joint mobility conditioning for professional sports teams and athletes.",
    "stream": "Science (PCB / Physical Therapy / Kinesiology)",
    "salary": "Entry: $60K / ₹5-9 LPA · Mid: $98K / ₹16-28 LPA · Lead: $160K+ / ₹45 LPA+",
    "growth": "19% (Much faster than average)",
    "demand": "High Athletic Demand",
    "aiImpact": "Human-Centric — Computer vision tracks motion kinematics; manual physical therapy manipulation and patient empathy are 100% human.",
    "overview": "Sports Physiotherapists are the clinical movement specialists responsible for keeping elite athletes competing at peak physical performance. They diagnose acute ligament tears (ACL, rotator cuff), design progressive eccentric load rehabilitation protocols, utilize dry needling and manual joint mobilizations, and monitor force-plate asymmetry to prevent reinjury before clearing an athlete to return to the field.",
    "education": {
      "highSchoolPrereqs": "Physics, Chemistry, Biology.",
      "entranceExams": "State Physical Therapy Admissions / NEET / GRE for DPT (Doctor of Physical Therapy - USA).",
      "undergradDegrees": [
        "BPT (Bachelor of Physiotherapy - 4.5 Years)",
        "B.S. in Kinesiology / Exercise Science",
        "MPT in Sports Physiotherapy / DPT"
      ],
      "certifications": [
        "Board-Certified Sports Clinical Specialist (SCS - USA)",
        "Certified Strength and Conditioning Specialist (CSCS - NSCA)",
        "Dry Needling Certification (DN)",
        "FIFA Diploma in Football Medicine"
      ],
      "topInstitutes": [
        "University of Pittsburgh (School of Health and Rehabilitation Sciences, USA)",
        "University of Delaware (USA)",
        "Loughborough University (UK)",
        "Kasturba Medical College (Manipal Academy of Higher Education, India)",
        "University of Queensland (Australia)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Clinical Physiotherapist): Treat outpatient sports injuries, administer therapeutic exercises, master manual therapy techniques, and assist collegiate athletic teams.",
      "phase2": "Years 2–5 (Lead Team Physiotherapist): Travel with professional sports franchises (cricket, soccer, basketball), manage acute on-field trauma, and oversee ACL return-to-sport testing.",
      "phase3": "Years 5–10+ (Director of High Performance / Chief Medical Officer): Lead sports science departments for Olympic committees, national sporting leagues, or build elite athlete rehabilitation clinics."
    },
    "skills": {
      "hardSkills": [
        "Musculoskeletal Orthopedic Assessment & Special Tests (Lachman, McMurray)",
        "Manual Joint Mobilization & Soft Tissue Therapy",
        "Force Plate Biomechanics & Asymmetry Analysis (VALD ForceDecks)",
        "Blood Flow Restriction (BFR) Rehabilitation",
        "Taping, Strapping & Acute On-Field Trauma Stabilization",
        "Strength & Conditioning Periodization (Eccentric Overload)"
      ],
      "softSkills": [
        "Athlete Empathy & Motivational Psychology",
        "Decisiveness Under Match Day Pressure",
        "Clear Communication with Coaches and Surgeons",
        "Hands-On Physical Stamina"
      ]
    },
    "roles": [
      "Sports Physiotherapist",
      "High-Performance Physical Therapist",
      "Team Physiotherapist (Franchise/National)",
      "Orthopedic Rehabilitation Specialist",
      "Director of Sports Science",
      "Private Sports Clinic Director"
    ],
    "decisionFit": {
      "traits": [
        "Passion for athletics, human anatomy, and movement mechanics",
        "High tactile empathy and enjoyment of hands-on physical therapy",
        "Thrill from helping injured athletes return to winning championships"
      ],
      "workStyle": "Dynamic sports training facilities, professional stadiums, and physical therapy gymnasiums. High active physical movement.",
      "pros": [
        "Dream career for sports lovers: travel and celebrate victories with elite sports teams",
        "Deeply rewarding: guiding an athlete from a torn ligament back to playing is transformative",
        "Growing global recognition and commercial sponsorship across franchise sports leagues"
      ],
      "cons": [
        "Demanding travel schedules (living out of hotels during competition seasons)",
        "High pressure from coaches and owners to clear star players prematurely",
        "Physically demanding work on your feet, knees, and hands all day"
      ]
    },
    "dayInLife": [
      {"time": "07:30 AM", "activity": "Pre-Training Athlete Screening: Assess joint range-of-motion, groin adductor squeeze tests, and hamstring readiness before team practice."},
      {"time": "09:30 AM", "activity": "On-Field Sideline Coverage: Monitor high-speed sprint drills with first-aid trauma kit ready for acute contact collisions."},
      {"time": "11:30 AM", "activity": "ACL Post-Op Rehabilitation: Guide an athlete through Nordic hamstring curls and blood flow restriction (BFR) quad sets."},
      {"time": "02:00 PM", "activity": "Biomechanics Force Plate Testing: Measure jump-landing ground reaction force asymmetries on VALD ForceDecks."},
      {"time": "04:30 PM", "activity": "Recovery Modality Protocols: Oversee ice bath contrast hydrotherapy, pneumatic compression boots, and dry needling sessions."}
    ],
    "workMetrics": {
      "remote": "0% Remote (100% Hands-On Physical)",
      "balance": "3.8 / 5.0 (Varies with sports season travel)",
      "stress": "Moderate to High",
      "travel": "Frequent Team Travel (25-50% during sports seasons)"
    },
    "whoAvoids": [
      "People looking for remote desk work or computer-only jobs",
      "Those who dislike sports culture or physical manual therapy work",
      "Individuals who cannot handle unpredictable weekend and evening match schedules"
    ],
    "globalPay": {
      "us": "Entry $60K · Mid $98K · Lead $160K+",
      "in": "Entry ₹5-9 LPA · Mid ₹16-28 LPA · Lead ₹45 LPA+",
      "uk": "Entry £32K · Mid £55K · Lead £95K+",
      "uae": "Entry AED 16K/mo · Mid AED 30K/mo · Lead AED 50K/mo+"
    },
    "topEmployers": [
      "Professional Sports Franchises (IPL, Premier League, NBA, NFL)",
      "National Olympic Committees & Sports Authorities (SAI, USOPC)",
      "Elite Sports Medicine Hospitals (Aspetar Qatar, HSS New York)",
      "Specialized Private Sports Medicine Clinics",
      "Collegiate Division 1 Athletic Departments"
    ],
    "tools": [
      "VALD ForceDecks & NordBord (Strength Telemetry)",
      "Delfi Blood Flow Restriction (BFR) Tourniquets",
      "Normatec Compression Recovery Systems",
      "Goniometers & Inclinometers",
      "Kinesiology Tape & Rigid Strapping"
    ],
    "portfolioProjects": [
      "Design an objective, 6-phase return-to-sport testing protocol for competitive soccer players following ACL reconstruction",
      "Conduct a biomechanical study analyzing hamstring injury risk reduction through eccentric Nordic exercises in cricket fast bowlers",
      "Produce a video case-study demonstrating proper acute lateral ankle sprain assessment and dynamic stabilization rehabilitation"
    ],
    "exitOpportunities": [
      "Head of Athletic Performance for a National Sports Federation",
      "Owner of a Multi-Location Sports Physical Therapy Clinic",
      "Biomechanics & Movement Consultant to Athletic Wear Brands"
    ],
    "reflectionQuestions": [
      "Do I love human movement, sports psychology, and working hands-on with athletes every single day?",
      "Can I stand firm against pressure from head coaches who want an injured player back on the field before it is safe?",
      "Am I prepared for the weekend travel and game schedules required in professional sports?"
    ],
    "resources": [
      "British Journal of Sports Medicine (BJSM)",
      "Journal of Orthopaedic & Sports Physical Therapy (JOSPT)",
      "FIFA Diploma in Football Medicine Modules",
      "\"Clinical Sports Medicine\" by Peter Brukner & Karim Khan",
      "VALD Performance Science Webinars & Case Studies"
    ],
    "aka": [
      "Sports Physical Therapist",
      "Sports Physiotherapist",
      "Team Physio",
      "Athletic Rehabilitation Specialist",
      "Sports Injury Specialist"
    ],
    "edu": "master",
    "interests": ["health", "sports", "machines", "social"],
    "degrees": ["health", "science"],
    "aiTag": "people"
  },
  {
    "id": "music-producer-sound",
    "cat": "creative",
    "catName": "Creative & Design",
    "icon": "🎧",
    "title": "Music Producer, Audio Engineer & Sound Designer",
    "tagline": "Sculpt sonic landscapes, track multi-instrument recordings, and engineer immersive Dolby Atmos mixes",
    "desc": "Produce commercially released musical records, engineer multi-track studio sessions, design bespoke audio effects for games/films, and mix in immersive spatial audio formats.",
    "stream": "Any Stream (Music / Acoustics / Sound Engineering)",
    "salary": "Entry: $48K / ₹4-8 LPA · Mid: $92K / ₹15-28 LPA · Lead: $175K+ / ₹55 LPA+",
    "growth": "10% (As fast as average)",
    "demand": "Highly Competitive Portfolio Field",
    "aiImpact": "AI-Augmented — Neural audio synthesis aids stem separation and mastering; acoustic emotion, song arrangement, and human studio direction remain creative.",
    "overview": "Music Producers and Sound Designers are the sonic architects behind billboard records, cinematic scores, and interactive video game worlds. They oversee the creative arrangement and instrumentation of tracks, direct recording artists in acoustically treated studios, sculpt frequencies using equalizers and compressors, and deliver polished mixes across stereo and immersive 7.1.4 Dolby Atmos spatial formats.",
    "education": {
      "highSchoolPrereqs": "Any stream with strong musical ear, acoustics, or computing.",
      "entranceExams": "Audition / Portfolio Submission / Conservatory Admissions.",
      "undergradDegrees": [
        "B.Mus / B.A. in Music Production & Sound Design",
        "B.Sc in Audio Engineering & Music Technology",
        "Diploma in Sound Engineering & Recording Arts"
      ],
      "certifications": [
        "Avid Pro Tools Certified Operator (Music / Post)",
        "Dolby Atmos Certified Mixer",
        "Ableton Certified Trainer",
        "Dante Audio Networking Certification"
      ],
      "topInstitutes": [
        "Berklee College of Music (USA)",
        "USC Thornton School of Music (USA)",
        "Full Sail University (USA)",
        "KM Music Conservatory / Whistling Woods (India)",
        "Abbey Road Institute (UK)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Assistant Studio Engineer): Coil cables, set up microphone polar patterns (Neumann U87, Shure SM7B), calibrate patchbays, and track Pro Tools vocal sessions.",
      "phase2": "Years 2–5 (Music Producer / Lead Mixer): Produce charting records for artists, mix television and gaming sound design in Dolby Atmos, and build a distinct sonic brand signature.",
      "phase3": "Years 5–10+ (Grammy-Level Producer / Head of Audio): Run your own commercial recording studio complex, executive-produce multi-platinum album releases, or direct audio for blockbuster AAA game franchises."
    },
    "skills": {
      "hardSkills": [
        "DAW Mastery (Avid Pro Tools, Ableton Live, Logic Pro, FL Studio)",
        "Microphone Techniques & Acoustic Phase Coherence",
        "Equalization, Compression & Dynamic Multiband Processing",
        "Dolby Atmos & 3D Spatial Audio Mixing",
        "Sound Synthesis (Serum, Vital, Analog Modular Synths)",
        "Audio Restoration & Vocal Tuning (Melodyne, iZotope RX)"
      ],
      "softSkills": [
        "Artist Empathy & Vocalist Psychological Coaching",
        "Critical Golden-Ear Frequency Discrimination",
        "Creative Patience Through Long Studio Sessions",
        "Tasteful Musical Curation"
      ]
    },
    "roles": [
      "Record Producer",
      "Audio Mixing & Mastering Engineer",
      "Sound Designer (Games & Film)",
      "Recording Studio Engineer",
      "Foley Artist",
      "Audio Director"
    ],
    "decisionFit": {
      "traits": [
        "Obsessive love for music, rhythm, timbre, and sound texture",
        "Critical listening ear that hears a 0.5dB frequency imbalance immediately",
        "Patience to spend 14 hours tweaking a snare drum sound until it hits perfectly"
      ],
      "workStyle": "Acoustically treated studio environment with high-end monitor speakers. Late nights and creative marathon sessions.",
      "pros": [
        "Immense artistic fulfillment hearing your tracks streamed by millions worldwide",
        "Work alongside gifted musicians, songwriters, and filmmakers",
        "Royalty backend upside on commercially successful master recordings"
      ],
      "cons": [
        "Unforgiving freelance hustle early in career before building a client roster",
        "Risk of hearing fatigue and permanent acoustic damage if not careful with monitoring levels",
        "Late-night studio lifestyles can disrupt regular personal routines"
      ]
    },
    "dayInLife": [
      {"time": "10:30 AM", "activity": "Vocal Tracking Session: Coach a recording artist through lead vocal takes using a vintage tube microphone and hardware optical compressor."},
      {"time": "01:30 PM", "activity": "Vocal Editing & Melodyne Tuning: Align vocal harmonies, eliminate sibilant plosives with iZotope RX, and tighten pocket timing."},
      {"time": "03:30 PM", "activity": "Dolby Atmos Spatial Mix: Place cinematic percussion and synth pads in 3D bed and object channels for spatial Apple Music delivery."},
      {"time": "06:00 PM", "activity": "Analog Hardware Processing: Route the master stereo mix bus through an SSL G-Master Bus Compressor and Pultec tube EQs."},
      {"time": "08:30 PM", "activity": "Sound Design for Game Client: Synthesize alien creature roar assets using granular synthesis and pitch modulation in Ableton."}
    ],
    "workMetrics": {
      "remote": "60% Remote (Home Studio Mix) / 40% Commercial Studio Tracking",
      "balance": "3.5 / 5.0",
      "stress": "Moderate (Deadline & client approval pressure)",
      "travel": "Low to Moderate (10-20% to recording hubs)"
    },
    "whoAvoids": [
      "People with hearing sensitivities or tinnitus",
      "Those who dislike late evening and nocturnal studio work hours",
      "Individuals seeking immediate corporate job security with zero freelance risk"
    ],
    "globalPay": {
      "us": "Entry $48K · Mid $92K · Lead $175K+",
      "in": "Entry ₹4-8 LPA · Mid ₹15-28 LPA · Lead ₹55 LPA+",
      "uk": "Entry £28K · Mid £52K · Lead £95K+",
      "uae": "Entry AED 14K/mo · Mid AED 28K/mo · Lead AED 50K/mo+"
    },
    "topEmployers": [
      "Major Record Labels (Universal Music Group, Sony Music, Warner)",
      "Top Commercial Recording Studios (Abbey Road, Metropolis, Yash Raj Films)",
      "Video Game Publishers (PlayStation Studios, EA, Riot Games Audio)",
      "Film Post-Production Houses (Skywalker Sound, Technicolor)",
      "Independent Streaming Producers & Beatmakers"
    ],
    "tools": [
      "Avid Pro Tools & Ableton Live",
      "Universal Audio Apollo Interfaces & UAD Plugins",
      "FabFilter Total Bundle & iZotope RX / Ozone",
      "Celemony Melodyne",
      "Genelec & Focal Studio Monitors",
      "Neumann, AKG & Shure Microphones"
    ],
    "portfolioProjects": [
      "Produce, mix, and master a complete 4-track original musical EP across streaming platforms demonstrating dynamic range and vocal clarity",
      "Re-score and sound-design a 3-minute video game cinematic trailer featuring custom synthesized sound effects and dynamic spatial audio",
      "Create a multi-track Dolby Atmos spatial audio mix for Apple Music Spatial Audio complying with delivery loudness standards (-18 LUFS)"
    ],
    "exitOpportunities": [
      "Executive Head of Audio for an Interactive Entertainment Studio",
      "Commercial Recording Studio Facility Owner",
      "Music Label A&R Director"
    ],
    "reflectionQuestions": [
      "Can I listen to the same 8-bar loop for four hours without losing critical auditory focus?",
      "Do I possess the diplomatic skills to coax a vulnerable, emotionally authentic performance out of an artist in the vocal booth?",
      "Am I excited by the science of acoustics and digital signal processing as much as musical composition?"
    ],
    "resources": [
      "Sound on Sound (SOS) Magazine — Definitive Recording & Mixing Guides",
      "\"Mixing Secrets for the Small Studio\" by Mike Senior",
      "Pensado's Place — Video Interviews with Master Mixers",
      "Avid Pro Tools Reference Guide",
      "Mix With The Masters (MWTM) Video Tutorials"
    ],
    "aka": [
      "Music Producer",
      "Sound Engineer",
      "Mixing Engineer",
      "Sound Designer",
      "Audio Post-Production Specialist"
    ],
    "edu": "bachelor",
    "interests": ["art", "creative", "tech"],
    "degrees": ["arts", "design", "vocational"],
    "aiTag": "creative"
  },
  {
    "id": "space-mission-ops",
    "cat": "space",
    "catName": "Aviation, Defense & Space",
    "icon": "🛰️",
    "title": "Space Operations & Mission Control Flight Director",
    "tagline": "Direct orbital satellite constellations, deep-space telemetry links, and crewed spacecraft trajectory operations",
    "desc": "Orchestrate real-time spacecraft telemetry, calculate orbital Hohmann transfer burns, manage ground station comms, and direct countdown launches at space agencies and commercial rocket firms.",
    "stream": "Science (PCM / Aerospace / Physics)",
    "salary": "Entry: $88K / ₹10-16 LPA · Mid: $148K / ₹28-48 LPA · Lead: $225K+ / ₹70 LPA+",
    "growth": "16% (Faster than average)",
    "demand": "Commercial Space Boom",
    "aiImpact": "AI-Augmented — Telemetry anomaly detection runs via automated neural networks; human flight directors hold absolute abort and burn decisions.",
    "overview": "Space Operations Flight Directors and Orbital Mission Controllers lead mission operations centers for satellites, deep-space probes, and crewed space vehicles. Sitting at mission control consoles, they monitor thousands of real-time telemetry sensors, execute orbital velocity burns, coordinate ground station antenna handoffs, and make instantaneous go/no-go abort decisions during rocket launches.",
    "education": {
      "highSchoolPrereqs": "Physics, Mathematics, Chemistry.",
      "entranceExams": "JEE Advanced / GATE / University Aerospace Engineering Admissions.",
      "undergradDegrees": [
        "B.Tech / B.S. in Aerospace / Astronautical Engineering",
        "B.S. in Physics / Astrophysics / Mathematics",
        "B.S. in Telecommunications & Electrical Engineering"
      ],
      "certifications": [
        "NASA Flight Controller Certification",
        "Orbital Mechanics & STK Certified Professional (AGI)",
        "Certified Space Operations Specialist (CSOS)"
      ],
      "topInstitutes": [
        "MIT (Department of Aeronautics and Astronautics, USA)",
        "Purdue University (Cradle of Astronauts, USA)",
        "Indian Institute of Space Science and Technology (IIST, India)",
        "TU Delft (Faculty of Aerospace Engineering, Netherlands)",
        "Caltech (JPL Affiliated, USA)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Telemetry Flight Controller): Monitor thermal subsystems, power generation, and telemetry downlink streams for low-Earth orbit (LEO) satellites on 12-hour mission control shifts.",
      "phase2": "Years 2–5 (Orbital Dynamics Officer - FDO): Calculate orbital maneuvers, orbital rendezvous station-keeping, and planetary flybys using Systems Tool Kit (STK) and numerical propagators.",
      "phase3": "Years 5–10+ (Flight Director): Lead the entire mission control room with sole authority for mission aborts, docking approvals, crew safety, and deep-space planetary probe injections."
    },
    "skills": {
      "hardSkills": [
        "Orbital Mechanics (Keplerian Elements, Hohmann Transfers, Delta-V Budgets)",
        "Space Mission Analysis Software (AGI Systems Tool Kit - STK, GMAT)",
        "Telemetry & Telecommand Protocol (CCSDS Standards)",
        "Radio Frequency & Ground Station Link Budgets",
        "Spacecraft Subsystems (Attitude Determination & Control - ADCS, Power, Thermal)",
        "Real-Time Anomaly Triage & Emergency Recovery"
      ],
      "softSkills": [
        "Ironclad Composure Under Extreme Crisis (Apollo-13 Mindset)",
        "Clear Concise Radio Communication (Voice Loops)",
        "Decisiveness with Incomplete Information",
        "Multi-Console Team Orchestration"
      ]
    },
    "roles": [
      "Mission Control Flight Controller",
      "Orbital Dynamics Specialist",
      "Satellite Operations Engineer",
      "Payload Operations Lead",
      "Spacecraft Guidance & Trajectory Officer",
      "Flight Director (Flight)"
    ],
    "decisionFit": {
      "traits": [
        "Lifelong obsession with space exploration, rockets, and orbital mechanics",
        "Unshakeable focus during intense, high-consequence countdowns",
        "Methodical procedural checklist discipline"
      ],
      "workStyle": "Mission operations centers with large wall displays and multi-screen consoles. Rotating 24/7 mission shifts during active spaceflights.",
      "pros": [
        "The pinnacle of human technological adventure: flying spacecraft across the solar system",
        "Booming commercial space industry with satellite mega-constellations and lunar missions",
        "Work alongside elite aerospace engineers with immense mission pride"
      ],
      "cons": [
        "Rotating shift work (including nights, weekends, and holidays for 24/7 on-orbit operations)",
        "Catastrophic consequences: a wrong command sequence can destroy a $500M spacecraft",
        "Strict national security clearances and export control (ITAR) citizenship requirements"
      ]
    },
    "dayInLife": [
      {"time": "06:30 AM", "activity": "Mission Control Shift Handover: Receive console briefing on battery state-of-charge, solar panel Sun-tracking, and scheduled thruster burns."},
      {"time": "08:30 AM", "activity": "Ground Station Pass Execution: Command satellite downlink pass via Svalbard antenna array; uplink revised ephemeris telemetry."},
      {"time": "11:00 AM", "activity": "Collision Avoidance Maneuver (CAM) Modeling: Calculate Delta-V burn in STK to maneuver around space debris tracked by US Space Force."},
      {"time": "02:00 PM", "activity": "Launch Countdown Simulation: Participate in an integrated countdown dress rehearsal with the rocket launch pad team."},
      {"time": "05:30 PM", "activity": "Anomaly Telemetry Review: Troubleshoot an unexpected 1.5° attitude gyro drift with the ADCS engineering subsystem team."}
    ],
    "workMetrics": {
      "remote": "10% Remote / 90% Mission Control Console",
      "balance": "3.7 / 5.0 (Shift work required)",
      "stress": "Extremely High during launches and docking",
      "travel": "Low (Fixed at mission operations centers)"
    },
    "whoAvoids": [
      "People who cannot handle 24/7 rotating night and weekend shifts",
      "Those who panic under immediate red-alert warnings with millions of dollars at risk",
      "Non-citizens where ITAR security regulations restrict aerospace access"
    ],
    "globalPay": {
      "us": "Entry $88K · Mid $148K · Lead $225K+",
      "in": "Entry ₹10-16 LPA · Mid ₹28-48 LPA · Lead ₹70 LPA+",
      "uk": "Entry £45K · Mid £82K · Lead £140K+",
      "uae": "Entry AED 22K/mo · Mid AED 42K/mo · Lead AED 70K/mo+"
    },
    "topEmployers": [
      "NASA & ISRO (Indian Space Research Organisation)",
      "SpaceX & Blue Origin",
      "Satellite Mega-Constellations (Starlink, OneWeb, Planet Labs)",
      "Defense & Aerospace Giants (Lockheed Martin, Northrop Grumman)",
      "European Space Agency (ESA) & JAXA"
    ],
    "tools": [
      "Systems Tool Kit (AGI STK)",
      "NASA General Mission Analysis Tool (GMAT)",
      "MATLAB & Python (Astrodynamics Libraries)",
      "COSMOS / OpenMCT (Telemetry Systems)",
      "Linux Mission Consoles"
    ],
    "portfolioProjects": [
      "Simulate a complete Earth-to-Mars interplanetary transfer trajectory with gravitational capture burns in NASA GMAT",
      "Build a real-time satellite telemetry dashboard in Python visualizing orbital ground tracks and TLE propagation (SGP4)",
      "Write a mission operations procedure checklist for an autonomous satellite payload de-orbit burn compliant with space debris mitigation guidelines"
    ],
    "exitOpportunities": [
      "Commercial Spacecraft Launch Director",
      "VP of Space Operations & Ground Infrastructure",
      "Autonomous Satellite Startup Co-Founder"
    ],
    "reflectionQuestions": [
      "Can I remain completely calm when a red alert alarm sounds on a space console and millions of dollars are on the line?",
      "Am I captivated by orbital mechanics and the physics of navigating spacecraft beyond Earth's atmosphere?",
      "Am I willing to work nocturnal console shifts to support round-the-clock space exploration?"
    ],
    "resources": [
      "NASA Mission Operations Directorate Manuals",
      "\"Fundamentals of Astrodynamics\" by Bate, Mueller & White",
      "AGI Systems Tool Kit (STK) Training Tutorials",
      "\"Space Mission Engineering: The New SMAD\" by James R. Wertz",
      "SpaceNews & NASA TV Live Mission Streams"
    ],
    "aka": [
      "Flight Director",
      "Spacecraft Operations Engineer",
      "Mission Controller",
      "Orbital Analyst",
      "Satellite Operator"
    ],
    "edu": "bachelor",
    "interests": ["space", "machines", "tech", "science"],
    "degrees": ["engineering", "science"],
    "aiTag": "automation"
  },
  {
    "id": "food-science-altprotein",
    "cat": "science",
    "catName": "Science & DeepTech",
    "icon": "🔬",
    "title": "Food Science & Novel Protein Technologist",
    "tagline": "Formulate cellular agriculture, precision fermentation, and plant-based nutrition products for sustainable global feeding",
    "desc": "Scale bioreactor cellular tissue culture, optimize microbial precision fermentation, engineer plant-protein texturization via twin-screw extrusion, and ensure food safety compliance.",
    "stream": "Science (Chemistry / Food Science / Biotech)",
    "salary": "Entry: $68K / ₹6-11 LPA · Mid: $115K / ₹18-32 LPA · Lead: $175K+ / ₹50 LPA+",
    "growth": "20% (Much faster than average)",
    "demand": "Sustainable Food Demand",
    "aiImpact": "AI-Augmented — Computational molecular flavor profiling predicts taste pairings; sensory pilot plant trials require human testing.",
    "overview": "Food Scientists and Novel Protein Technologists engineer the future of nutrition and sustainable agriculture. Working across cellular agriculture (cultivated meat), precision fermentation (microbial dairy and enzymes), and high-moisture plant protein extrusion, they solve the molecular challenges of replicating animal meat taste, texture, and mouthfeel without animal slaughter.",
    "education": {
      "highSchoolPrereqs": "Chemistry, Biology, Physics, Mathematics.",
      "entranceExams": "ICAR AIEEA (India) / GATE / University Food Science Admissions.",
      "undergradDegrees": [
        "B.Tech / B.S. in Food Science & Technology",
        "B.S. in Biotechnology / Biochemical Engineering",
        "B.S. in Agricultural & Biological Chemistry"
      ],
      "certifications": [
        "Certified Food Scientist (CFS - IFT)",
        "HACCP & PCQI Food Safety Certification",
        "Bioprocess Fermentation Specialist"
      ],
      "topInstitutes": [
        "Wageningen University & Research (Netherlands - World #1 in Food)",
        "UC Davis (Department of Food Science, USA)",
        "Cornell University (College of Agriculture and Life Sciences, USA)",
        "CFTRI Mysore (Central Food Technological Research Institute, India)",
        "University of Hohenheim (Germany)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (Food Product Formulation Associate): Test plant protein isolates (pea, faba bean) in twin-screw extruders, measure textural chewiness on texture analyzers, and conduct sensory panel taste tests.",
      "phase2": "Years 2–5 (Senior Bioprocess Engineer): Scale up 100L to 10,000L microbial fermentation bioreactors for precision whey/casein proteins, optimize nutrient media costs, and secure FDA GRAS safety approvals.",
      "phase3": "Years 5–10+ (Director of R&D / Food Innovation VP): Lead multinational novel food development portfolios, commercialize lab-grown cultivated meat lines, and build industrial-scale zero-carbon protein factories."
    },
    "skills": {
      "hardSkills": [
        "Extrusion Processing (High-Moisture Meat Analogues - HMMA)",
        "Bioreactor Cell Culture & Fermentation (Upstream & Downstream Processing)",
        "Food Rheology & Texture Profile Analysis (Texture Analyzers)",
        "Flavor Chemistry & Gas Chromatography-Mass Spectrometry (GC-MS)",
        "Food Safety Regulations (FDA GRAS, EFSA Novel Foods, FSSAI)",
        "Lipid Emulsification & Hydrocolloid Chemistry"
      ],
      "softSkills": [
        "Sensory Palate Discernment (Aromas, Mouthfeel)",
        "Translating Consumer Feedback into Molecular Formulas",
        "Cross-Discipline Bioprocess Collaboration",
        "Patentable Food Chemistry Innovation"
      ]
    },
    "roles": [
      "Novel Protein Scientist",
      "Food Product Developer",
      "Bioprocess Fermentation Engineer",
      "Sensory & Flavor Chemist",
      "Director of Food R&D",
      "Cellular Agriculture Cultivation Lead"
    ],
    "decisionFit": {
      "traits": [
        "Passion for sustainable food systems, animal welfare, and ending factory farming",
        "Fascination with biochemistry, culinary taste, and food texture",
        "Enjoyment of hands-on laboratory kitchen experimentation"
      ],
      "workStyle": "Food innovation pilot plant labs and industrial kitchens. High sensory taste-testing with zero sedentary boredom.",
      "pros": [
        "Deep societal impact: transforming the global food supply to fight climate change",
        "Fascinating blend of culinary art and hardcore biochemical engineering",
        "Booming venture capital funding in sustainable protein innovation"
      ],
      "cons": [
        "Consumer skepticism and cultural resistance to novel foods",
        "Long regulatory approval timelines with the FDA and European Commission",
        "Challenging scaling economics: bringing lab-scale costs down to grocery parity"
      ]
    },
    "dayInLife": [
      {"time": "08:30 AM", "activity": "Pilot Extruder Calibration: Configure screw speed and temperature zones on a pilot-scale twin-screw extruder processing soy-pea protein."},
      {"time": "10:30 AM", "activity": "Texture Profile Analysis: Measure tensile strength and shear force of extruded plant fibers against reference chicken breast tissue."},
      {"time": "01:30 PM", "activity": "Bioreactor Sampling: Measure cell density and glucose consumption in 500L fermenters producing precision whey proteins."},
      {"time": "03:30 PM", "activity": "Blind Sensory Panel: Lead a 12-person double-blind tasting panel rating juiciness, aroma, and lingering aftertaste."},
      {"time": "05:00 PM", "activity": "FDA Dossier Documentation: Compile nutritional bioavailability and allergen safety documentation for regulatory filing."}
    ],
    "workMetrics": {
      "remote": "20% Remote / 80% Food Lab & Pilot Plant",
      "balance": "4.1 / 5.0",
      "stress": "Moderate",
      "travel": "Low (10-15% to pilot facilities)"
    },
    "whoAvoids": [
      "People with severe dietary allergies or sensitivities to soy, gluten, and legumes",
      "Those who dislike hands-on laboratory kitchens and food processing machinery",
      "Individuals cynical about sustainability and plant-based nutrition"
    ],
    "globalPay": {
      "us": "Entry $68K · Mid $115K · Lead $175K+",
      "in": "Entry ₹6-11 LPA · Mid ₹18-32 LPA · Lead ₹50 LPA+",
      "uk": "Entry £35K · Mid £65K · Lead £110K+",
      "uae": "Entry AED 16K/mo · Mid AED 32K/mo · Lead AED 52K/mo+"
    },
    "topEmployers": [
      "Alt-Protein Pioneers (Impossible Foods, Beyond Meat, Eat Just)",
      "Cultivated Meat Pioneers (UPSIDE Foods, Believer Meats, Good Meat)",
      "Global Food Giants (Nestlé, Danone, Unilever, Tyson New Ventures)",
      "Ingredients & Flavor Conglomerates (Givaudan, Kerry Group, IFF, ADM)",
      "Fermentation Startups (Perfect Day, Nature's Fynd)"
    ],
    "tools": [
      "Twin-Screw Extruders (Coperion, Brabender)",
      "Texture Analyzers (Stable Micro Systems TA.XT)",
      "Stirred-Tank Bioreactors (Sartorius, Eppendorf)",
      "GC-MS (Gas Chromatography-Mass Spectrometry)",
      "Rheometers & Particle Size Analyzers"
    ],
    "portfolioProjects": [
      "Formulate a complete plant-based whole-cut meat prototype matching the shear force and water-holding capacity of conventional beef",
      "Design a techno-economic scaling model in Excel for a 25,000L precision fermentation facility calculating cost per kilogram of protein",
      "Draft a complete FDA GRAS (Generally Recognized as Safe) regulatory notification packet for a novel fungal protein ingredient"
    ],
    "exitOpportunities": [
      "Chief Technology Officer at a Clean Meat Startup",
      "Food Innovation Strategy Director for a Global CPG Enterprise",
      "Agrifood Tech Venture Capital Associate"
    ],
    "reflectionQuestions": [
      "Am I captivated by how chemistry and physics turn simple plant proteins into the taste and sizzle of meat?",
      "Do I want to solve one of the greatest climate challenges on Earth: feeding 10 billion humans sustainably?",
      "Can I combine scientific rigor in the lab with sensory culinary taste and consumer empathy?"
    ],
    "resources": [
      "Good Food Institute (GFI) — Alternative Protein Research & Curricula",
      "Institute of Food Technologists (IFT) — Food Technology Magazine",
      "\"Food Chemistry\" by Belitz, Grosch & Schieberle",
      "Cultivated Meat Science Seminars (GFI)",
      "Future Food Movement & AgFunder News"
    ],
    "aka": [
      "Food Scientist",
      "Alt-Protein Technologist",
      "Novel Food Developer",
      "Fermentation Scientist",
      "Sensory Scientist"
    ],
    "edu": "master",
    "interests": ["science", "eco", "health", "machines"],
    "degrees": ["science", "engineering"],
    "aiTag": "automation"
  },
  {
    "id": "rpa-automation",
    "cat": "tech",
    "catName": "Technology & AI",
    "icon": "🤖",
    "title": "Robotic Process Automation (RPA) & Intelligent Automation Architect",
    "tagline": "Deploy software bot swarms and generative workflows that eliminate repetitive enterprise back-office labor",
    "desc": "Build attended and unattended software bot swarms using UiPath, Power Automate, and Python to automate high-volume enterprise financial, HR, and logistics workflows.",
    "stream": "Science (Computing / Information Systems / Engineering)",
    "salary": "Entry: $78K / ₹7-13 LPA · Mid: $132K / ₹22-38 LPA · Lead: $195K+ / ₹60 LPA+",
    "growth": "26% (Much faster than average)",
    "demand": "Very High Corporate Adoption",
    "aiImpact": "Self-Automating — RPA integrates generative AI to parse unstructured documents; human architects design cross-system enterprise governance.",
    "overview": "RPA and Intelligent Automation Architects design the digital worker bot armies that liberate human employees from soul-crushing manual data entry. Working in platforms like UiPath and Microsoft Power Automate, they build software bots that log into legacy enterprise ERPs (SAP, Oracle), read unstructured PDF invoices via OCR and AI document models, cross-reference banking entries, and execute flawless enterprise transactions at superhuman speed.",
    "education": {
      "highSchoolPrereqs": "Computer Science, Mathematics, Physics.",
      "entranceExams": "University Engineering / IT Admissions.",
      "undergradDegrees": [
        "B.S. / B.Tech in Computer Science / Information Technology",
        "B.Tech in Information Systems / Business Analytics",
        "BCA / MCA (Master of Computer Applications)"
      ],
      "certifications": [
        "UiPath Certified Professional Automation Developer",
        "Microsoft Certified: Power Automate RPA Developer Associate",
        "Blue Prism Certified Developer",
        "Automation Anywhere Certified Advanced RPA Professional"
      ],
      "topInstitutes": [
        "Carnegie Mellon University (Information Systems, USA)",
        "Georgia Tech (College of Computing, USA)",
        "National Institute of Technology (NITs, India)",
        "University of Texas at Dallas (USA)",
        "IIT Roorkee / IIT Guwahati (India)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (RPA Developer): Build desktop automation workflows in UiPath Studio, handle UI selectors and exceptions, automate Excel macros, and scrape legacy ERP terminals.",
      "phase2": "Years 2–5 (Intelligent Automation Lead): Integrate generative AI Document Intelligence models, deploy multi-bot orchestrators, implement credential vaults, and manage enterprise security.",
      "phase3": "Years 5–10+ (Enterprise Automation Architect / Head of Automation): Direct global automation Centers of Excellence (CoE), oversee bot swarms saving 500,000+ human labor hours annually, and architect autonomous enterprise workflows."
    },
    "skills": {
      "hardSkills": [
        "UiPath Studio, Orchestrator & Action Center",
        "Microsoft Power Platform & Power Automate Desktop",
        "Python (Automation Libraries: Selenium, PyAutoGUI, Playwright)",
        "Document Understanding & Cognitive OCR (AWS Textract, Azure AI Vision)",
        "SAP GUI & Mainframe Terminal Automation",
        "REST APIs & Webhook Integration"
      ],
      "softSkills": [
        "Business Process Mapping & Waste Elimination",
        "Change Management & Empathy for Displaced Labor",
        "Extreme Exception-Handling Mindset",
        "Clear Documentation of Bot Business Logic"
      ]
    },
    "roles": [
      "RPA Developer",
      "Intelligent Automation Architect",
      "Process Automation Consultant",
      "UiPath Solutions Architect",
      "Automation Center of Excellence (CoE) Lead",
      "Director of Digital Transformation"
    ],
    "decisionFit": {
      "traits": [
        "Deep satisfaction from automating repetitive, tedious manual tasks",
        "Enjoyment of business workflows and enterprise systems (SAP, Salesforce)",
        "Obsession with fault tolerance and building bots that never crash"
      ],
      "workStyle": "Corporate IT and consulting environments. High remote work flexibility with frequent client workflow interviews.",
      "pros": [
        "Instant, measurable business impact: bots save thousands of manual hours immediately",
        "Huge corporate demand across banking, insurance, healthcare, and retail",
        "Faster time-to-market compared to building entire software platforms from scratch"
      ],
      "cons": [
        "Fragile UI selectors: sudden web interface updates can break bot automations",
        "Ethical sensitivity: your automations can eliminate traditional clerical roles",
        "Navigating corporate IT security hurdles and restrictive legacy firewalls"
      ]
    },
    "dayInLife": [
      {"time": "09:00 AM", "activity": "Orchestrator Fleet Review: Review overnight bot logs in UiPath Orchestrator; verify that 1,200 supplier invoices processed with 99.4% accuracy."},
      {"time": "10:30 AM", "activity": "Process Discovery Workshop: Shadow a accounts-payable specialist for 90 minutes to map every click and exception in invoice reconciliation."},
      {"time": "01:30 PM", "activity": "AI Document Understanding Training: Train an OCR vision model on 100 complex multilingual PDF purchase orders to extract line-item pricing."},
      {"time": "03:30 PM", "activity": "Bot Exception Handling Coding: Write resilient retry logic and human-in-the-loop fallback escalation queues in UiPath Action Center."},
      {"time": "05:00 PM", "activity": "CoE Metric Reporting: Calculate monthly ROI savings (1,450 employee hours saved) for the corporate Chief Financial Officer."}
    ],
    "workMetrics": {
      "remote": "80% Remote / Hybrid",
      "balance": "4.2 / 5.0",
      "stress": "Moderate",
      "travel": "Low to Moderate (10-20% for client workshops)"
    },
    "whoAvoids": [
      "Developers who hate enterprise software like SAP, Excel, and corporate workflows",
      "Those who only want to build consumer consumer apps or 3D games",
      "Engineers impatient with enterprise bureaucracy and security audits"
    ],
    "globalPay": {
      "us": "Entry $78K · Mid $132K · Lead $195K+",
      "in": "Entry ₹7-13 LPA · Mid ₹22-38 LPA · Lead ₹60 LPA+",
      "uk": "Entry £42K · Mid £75K · Lead £120K+",
      "uae": "Entry AED 18K/mo · Mid AED 34K/mo · Lead AED 55K/mo+"
    },
    "topEmployers": [
      "Global System Integrators (Accenture, Cognizant, Infosys, Wipro, TCS)",
      "Big 4 Automation Advisory (Deloitte, PwC, EY, KPMG)",
      "Global Banks & Insurers (Citigroup, Allianz, MetLife, HDFC Bank)",
      "Enterprise Tech Platforms (UiPath, Automation Anywhere, Microsoft)",
      "Healthcare Payers & Providers (UnitedHealth, Anthem)"
    ],
    "tools": [
      "UiPath Studio & Orchestrator",
      "Microsoft Power Automate Desktop",
      "Automation Anywhere Automation 360",
      "Python (Playwright, Pandas)",
      "Azure Document Intelligence / AWS Textract"
    ],
    "portfolioProjects": [
      "Build a complete unattended UiPath robot that automatically reads incoming invoices from Gmail, extracts line items via OCR, and records entries into an Excel database",
      "Design a Power Automate workflow integrating an LLM to automatically summarize customer service complaints and assign priority tickets in ServiceNow",
      "Produce a comprehensive Process Definition Document (PDD) with flowchart architecture for an end-to-end employee onboarding automation"
    ],
    "exitOpportunities": [
      "Head of Enterprise Automation Center of Excellence (CoE)",
      "Chief Information Officer (CIO) / Digital Transformation VP",
      "B2B SaaS Automation Founder"
    ],
    "reflectionQuestions": [
      "Do I get a thrill from seeing a software robot execute in 3 seconds what used to take a human 45 minutes of boring typing?",
      "Can I design robust exception-handling logic that gracefully recovers when an unexpected popup appears?",
      "Am I excited to lead enterprise digital transformation where AI and bots handle repetitive tasks?"
    ],
    "resources": [
      "UiPath Academy — Free Certification Learning Paths",
      "Microsoft Learn — Power Automate RPA Learning Path",
      "Automation Anywhere University",
      "\"Robotic Process Automation: Concepts and Applications\"",
      "RPA Forums & Community Hackathons"
    ],
    "aka": [
      "RPA Developer",
      "Intelligent Automation Engineer",
      "Process Automation Architect",
      "Bot Developer",
      "Automation Consultant"
    ],
    "edu": "bachelor",
    "interests": ["tech", "business", "machines"],
    "degrees": ["computing", "engineering", "management"],
    "aiTag": "automation"
  },
  {
    "id": "gis-geospatial",
    "cat": "science",
    "catName": "Science & DeepTech",
    "icon": "🗺️",
    "title": "GIS & Geospatial Intelligence Analyst",
    "tagline": "Analyze high-resolution satellite imagery, LiDAR point clouds, and spatial data for defense, climate, and smart cities",
    "desc": "Process multispectral satellite imagery, construct GIS spatial layers, build spatial predictive machine learning models, and analyze geospatial patterns for national defense and environmental conservation.",
    "stream": "Science (Geography / Geology / Computer Science / Surveying)",
    "salary": "Entry: $62K / ₹6-10 LPA · Mid: $102K / ₹16-28 LPA · Lead: $155K+ / ₹45 LPA+",
    "growth": "17% (Faster than average)",
    "demand": "High Geospatial Boom",
    "aiImpact": "AI-Augmented — Computer vision segments satellite imagery automatically; geospatial analysts verify ground truth and geopolitical context.",
    "overview": "Geographic Information Systems (GIS) and Geospatial Intelligence (GEOINT) Analysts analyze the spatial patterns of Earth and human activity. Using satellite constellations, drone LiDAR, radar imagery (SAR), and GPS sensor streams, they model climate wildfire risks, map urban transit flows, plan renewable energy infrastructure, and provide real-time battlefield intelligence for defense commands.",
    "education": {
      "highSchoolPrereqs": "Geography, Mathematics, Physics, Computer Science.",
      "entranceExams": "GATE / University Geoinformatics Admissions.",
      "undergradDegrees": [
        "B.S. in Geographic Information Science (GIS) / Cartography",
        "B.Tech in Geoinformatics / Remote Sensing",
        "B.S. in Geography / Earth Sciences / Computer Science"
      ],
      "certifications": [
        "GISP (Certified Geographic Information Systems Professional)",
        "Esri Technical Certification (ArcGIS Desktop / Enterprise)",
        "GEOINT Professional Certification (NGA Foundation)"
      ],
      "topInstitutes": [
        "UC Santa Barbara (National Center for Geographic Information, USA)",
        "Penn State University (Department of Geography, USA)",
        "Indian Institute of Remote Sensing (IIRS / ISRO, Dehradun, India)",
        "UCL (Department of Civil, Environmental & Geomatic Engineering, UK)",
        "University of Twente (ITC Faculty of Geo-Information, Netherlands)"
      ]
    },
    "roadmap": {
      "phase1": "Years 0–2 (GIS Technician / Junior Analyst): Digitize vector shapefiles, georeference satellite tiles, perform spatial buffer queries in ArcGIS Pro, and assemble print/web map layers.",
      "phase2": "Years 2–5 (Senior Geospatial Analyst): Write Python geoprocessing scripts (ArcPy, GeoPandas), analyze Synthetic Aperture Radar (SAR) for flood inundation, and publish interactive web maps in Mapbox/Deck.gl.",
      "phase3": "Years 5–10+ (Chief Geospatial Officer / GEOINT Director): Direct enterprise GIS enterprise platforms, advise national intelligence or municipal planning boards, and lead satellite imagery AI analytics."
    },
    "skills": {
      "hardSkills": [
        "ArcGIS Pro, ArcGIS Online & Enterprise",
        "Open-Source GIS (QGIS, PostGIS Spatial SQL)",
        "Python Geospatial Stack (GeoPandas, Shapely, Rasterio, GDAL)",
        "Remote Sensing & Satellite Imagery (Sentinel, Landsat, Planet)",
        "Spatial Web Mapping (Mapbox GL JS, Leaflet, Deck.gl)",
        "LiDAR Point Cloud Processing & Digital Elevation Models (DEM)"
      ],
      "softSkills": [
        "Visual Cartographic Aesthetics & Map Clarity",
        "Geopolitical & Geographic Intuition",
        "Cross-Disciplinary Environmental Synthesis",
        "Attention to Coordinate Projections & Datums"
      ]
    },
    "roles": [
      "GIS Analyst",
      "Geospatial Intelligence Analyst (GEOINT)",
      "Remote Sensing Scientist",
      "Cartographer",
      "Spatial Data Scientist",
      "Enterprise GIS Manager"
    ],
    "decisionFit": {
      "traits": [
        "Love for maps, geography, spatial patterns, and Earth observation",
        "Visual mind that thinks in spatial layers and coordinates",
        "Curiosity about climate change, urban planning, or national defense"
      ],
      "workStyle": "Computer-centric workstation environment analyzing high-resolution satellite screens and spatial databases. High remote flexibility.",
      "pros": [
        "Visually stunning work: creating beautiful, informative maps and 3D terrain models",
        "Booming commercial satellite market (Planet Labs, Maxar) providing infinite new data",
        "High job security across government, defense, energy, and urban planning"
      ],
      "cons": [
        "Frustrating coordinate system bugs (wrong datum projections ruining spatial overlays)",
        "Handling massive multi-gigabyte raster files and heavy processing wait times",
        "Security clearances required for high-paying defense and intelligence positions"
      ]
    },
    "dayInLife": [
      {"time": "08:30 AM", "activity": "Satellite Imagery Ingestion: Download overnight European Space Agency Sentinel-2 multispectral passes over a wildfire zone."},
      {"time": "10:30 AM", "activity": "Burn Severity Index Calculation: Run Normalized Burn Ratio (NBR) raster math in QGIS to delineate destroyed forest hectares."},
      {"time": "01:30 PM", "activity": "Spatial SQL PostGIS Queries: Query 2 million municipal building polygons to identify structures inside flood evacuation zones."},
      {"time": "03:30 PM", "activity": "Interactive Web Map Assembly: Build a dynamic Deck.gl / Mapbox visualization showing regional traffic congestion patterns."},
      {"time": "05:00 PM", "activity": "Defense Intelligence Briefing: Deliver a geospatial terrain suitability map identifying helicopter landing zones."}
    ],
    "workMetrics": {
      "remote": "70% Remote / Hybrid",
      "balance": "4.2 / 5.0",
      "stress": "Moderate",
      "travel": "Low (<10% to field mapping sites)"
    },
    "whoAvoids": [
      "People with zero interest in geography, maps, or spatial coordinates",
      "Those who dislike handling large geospatial datasets and spatial databases",
      "Individuals who find cartographic design and color palettes tedious"
    ],
    "globalPay": {
      "us": "Entry $62K · Mid $102K · Lead $155K+",
      "in": "Entry ₹6-10 LPA · Mid ₹16-28 LPA · Lead ₹45 LPA+",
      "uk": "Entry £32K · Mid £58K · Lead £95K+",
      "uae": "Entry AED 16K/mo · Mid AED 30K/mo · Lead AED 48K/mo+"
    },
    "topEmployers": [
      "Esri (Makers of ArcGIS)",
      "Satellite & Earth Observation Giants (Maxar, Planet Labs, BlackSky)",
      "National Intelligence Agencies (NGA, CIA, Indian Armed Forces GIS)",
      "Environmental & Climate Consultancies (WSP, ERM, Jacobs)",
      "Urban Municipalities & State Disaster Management Authorities"
    ],
    "tools": [
      "ArcGIS Pro & ArcGIS Online",
      "QGIS & PostGIS",
      "Python (GeoPandas, GDAL, Rasterio)",
      "Mapbox Studio & Deck.gl",
      "Google Earth Engine",
      "CloudCompare (LiDAR Point Clouds)"
    ],
    "portfolioProjects": [
      "Build an interactive web map dashboard in Mapbox tracking wildfire spread and air quality sensors in real time",
      "Conduct a multispectral remote sensing analysis in QGIS calculating NDVI agricultural crop health changes over a 5-year drought cycle",
      "Create a PostGIS spatial database and query optimization pipeline determining optimal site locations for 100 new electric vehicle charging hubs"
    ],
    "exitOpportunities": [
      "Chief Geospatial Officer (CGO)",
      "Earth Observation Tech Startup Founder",
      "Director of Urban Planning & Smart Cities"
    ],
    "reflectionQuestions": [
      "Do I love the feeling of uncovering hidden patterns on Earth by overlaying multiple layers of spatial data?",
      "Can I master spatial programming in Python and SQL to automate complex cartographic pipelines?",
      "Am I excited to build the digital maps and spatial models that guide disaster response and urban planning?"
    ],
    "resources": [
      "Esri MOOCs & Free Training Courses",
      "QGIS Tutorials and Open Source Geospatial Foundation (OSGeo)",
      "\"GIS Fundamentals: A First Text on Geographic Information Systems\" by Paul Bolstad",
      "Google Earth Engine User Guides",
      "GIS Stack Exchange & Geoawesomeness Community"
    ],
    "aka": [
      "GIS Analyst",
      "Geospatial Analyst",
      "GEOINT Specialist",
      "Cartographer",
      "Remote Sensing Analyst"
    ],
    "edu": "bachelor",
    "interests": ["science", "tech", "eco", "machines"],
    "degrees": ["science", "computing", "engineering"],
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
for c in batch3:
    if c["id"] not in existing_ids:
        existing.append(c)

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(existing, f, indent=2)

print(f"Total careers in batch so far: {len(existing)}")
