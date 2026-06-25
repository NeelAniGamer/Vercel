
    // ============================== DATA ==============================
    const careers = [
        {
            id:'ai',cat:'tech',icon:'🤖',title:'Artificial Intelligence',
            tagline:'Build minds that think',
            desc:'Design intelligent systems — from LLMs to autonomous agents — that redefine how humanity interacts with information.',
            salary:'$95K–$250K+',growth:'36%',demand:'Extreme',
            advice:'You are at the epicenter of the greatest technological revolution since the internet. AI engineers and researchers are not just building tools — they are creating entities that learn, reason, and create. Master deep learning frameworks, study cognitive science for inspiration, and always anchor your work in ethical AI principles. The world needs builders who ask "should we?" as often as "can we?"',
            skills:['Python','TensorFlow / PyTorch','NLP','Computer Vision','MLOps','Linear Algebra','Reinforcement Learning','Ethics in AI'],
            roles:['ML Engineer','AI Research Scientist','Prompt Engineer','AI Ethics Officer','Computer Vision Engineer','NLP Specialist'],
            questions:['How can I ensure the AI I build remains ethical and unbiased?','Am I drawn to research breakthroughs or production-grade systems?','What human problem do I want AI to solve first?'],
            resources:['Fast.ai — Free deep learning courses','Papers With Code — Stay current on SOTA','AI Alignment Forum — Ethics & safety research']
        },
        {
            id:'cyber',cat:'tech',icon:'🛡️',title:'Cybersecurity',
            tagline:'Defend the digital frontier',
            desc:'Protect organizations and individuals from evolving cyber threats through offense and defense strategies.',
            salary:'$85K–$200K+',growth:'32%',demand:'Very High',
            advice:'In a world where data is the new currency, you are the vault keeper. Cybersecurity professionals are the unsung heroes of the digital age. Start with networking fundamentals, then explore penetration testing, incident response, or governance. The field rewards curiosity — every vulnerability you find is a puzzle solved. Stay relentlessly curious and never stop learning, because the attackers never stop evolving.',
            skills:['Network Security','Penetration Testing','SIEM Tools','Cloud Security','Cryptography','Threat Modeling','Incident Response','Zero Trust Architecture'],
            roles:['Penetration Tester','SOC Analyst','Security Architect','CISO','Threat Hunter','Cloud Security Engineer'],
            questions:['Am I more excited by offense (red team) or defense (blue team)?','How do I stay ahead of constantly evolving attack vectors?','Do I want to protect corporations, governments, or individuals?'],
            resources:['TryHackMe — Hands-on cybersecurity training','OWASP — Web application security standards','SANS Institute — Professional certifications']
        },
        {
            id:'cloud',cat:'tech',icon:'☁️',title:'Cloud & DevOps',
            tagline:'Architect infinite scale',
            desc:'Build and manage the cloud infrastructure that powers every modern application and service at global scale.',
            salary:'$90K–$190K+',growth:'25%',demand:'High',
            advice:'You are the backbone engineer — the one who ensures the digital world stays running at 99.99% uptime. Cloud and DevOps is about automation, reliability, and elegant infrastructure design. Master at least one major cloud platform deeply, understand containerization inside-out, and embrace Infrastructure as Code. The best in this field think in systems, not servers.',
            skills:['AWS / Azure / GCP','Kubernetes','Docker','Terraform','CI/CD Pipelines','Linux','Monitoring & Observability','Site Reliability Engineering'],
            roles:['Cloud Architect','DevOps Engineer','SRE','Platform Engineer','Infrastructure Lead','Cloud Consultant'],
            questions:['Do I enjoy building systems that need to handle extreme scale?','Am I more interested in automation or architecture?','How do I balance speed of deployment with system reliability?'],
            resources:['AWS Well-Architected Framework','Kubernetes Documentation','Google SRE Book — Free online']
        },
        {
            id:'data',cat:'tech',icon:'📊',title:'Data Science & Analytics',
            tagline:'Decode the signal from noise',
            desc:'Extract actionable insights from massive datasets to drive strategic decisions across every industry.',
            salary:'$80K–$180K+',growth:'28%',demand:'High',
            advice:'Data is the language of the universe, and you are learning to speak it fluently. As a data scientist, you sit at the intersection of statistics, programming, and domain expertise. The most impactful data professionals are not just technically skilled — they are brilliant storytellers who translate numbers into narratives that move organizations. Focus on statistical rigor, learn to communicate clearly, and always question your assumptions.',
            skills:['Python / R','SQL','Statistical Modeling','Data Visualization','Machine Learning','A/B Testing','Big Data (Spark)','Business Intelligence'],
            roles:['Data Scientist','Data Analyst','Analytics Engineer','BI Developer','Quantitative Analyst','Data Strategist'],
            questions:['Am I energized by discovering patterns or by building predictive systems?','What industries would benefit most from my analytical lens?','How do I ensure my data narratives drive real action?'],
            resources:['Kaggle — Competitions & datasets','Mode Analytics SQL Tutorial','Towards Data Science — Community articles']
        },
        {
            id:'web3',cat:'tech',icon:'⛓️',title:'Blockchain & Web3',
            tagline:'Decentralize everything',
            desc:'Build decentralized applications, smart contracts, and protocols that redistribute power and trust.',
            salary:'$90K–$220K+',growth:'20%',demand:'Growing',
            advice:'Web3 is the frontier of digital sovereignty. Beyond the hype, blockchain technology represents a fundamental rethinking of how humans coordinate, transact, and trust. Learn smart contract development, understand consensus mechanisms deeply, and study tokenomics. The builders who will succeed are those who focus on real utility — solving genuine coordination problems — not speculation.',
            skills:['Solidity','Smart Contracts','DeFi Protocols','Cryptography','Rust','Zero-Knowledge Proofs','DAOs','Tokenomics'],
            roles:['Smart Contract Developer','Protocol Engineer','DeFi Architect','Blockchain Auditor','DAO Strategist','Web3 Product Manager'],
            questions:['What real-world problem can decentralization uniquely solve?','How do I navigate the volatility and hype in this space?','Am I building for institutional adoption or individual empowerment?'],
            resources:['Ethereum.org — Developer documentation','CryptoZombies — Learn Solidity','a16z Crypto Canon — Essential reading']
        },
        {
            id:'quantum',cat:'tech',icon:'⚛️',title:'Quantum Computing',
            tagline:'Compute the impossible',
            desc:'Harness quantum mechanics to solve problems classical computers cannot — from drug discovery to cryptography.',
            salary:'$100K–$250K+',growth:'30%',demand:'Emerging',
            advice:'Quantum computing is where physics meets computation at the most fundamental level. This is a field for the deeply curious — those who are comfortable with uncertainty (literally). Start with a strong foundation in linear algebra and quantum mechanics, then explore quantum algorithms and quantum error correction. The field is still nascent, which means early entrants will define its trajectory.',
            skills:['Quantum Mechanics','Linear Algebra','Qiskit / Cirq','Quantum Algorithms','Error Correction','Python','Quantum Machine Learning','Complex Analysis'],
            roles:['Quantum Software Engineer','Quantum Researcher','Quantum Algorithm Designer','Quantum Hardware Engineer','Quantum Application Scientist'],
            questions:['Am I comfortable working on technology that may take decades to mature?','Do I enjoy theoretical research or applied engineering more?','What classical computing limits frustrate me the most?'],
            resources:['IBM Quantum Learning — Free courses','Qiskit Textbook — Interactive quantum computing','Quantum Country — Spaced-repetition learning']
        },
        {
            id:'robotics',cat:'tech',icon:'🦾',title:'Robotics & Automation',
            tagline:'Bring machines to life',
            desc:'Design autonomous robots and intelligent automation systems that operate in the physical world.',
            salary:'$85K–$200K+',growth:'22%',demand:'High',
            advice:'Robotics is where software meets the physical world in spectacular fashion. You will combine mechanical engineering, electronics, control systems, and AI to create machines that see, think, and act. The most rewarding part? Your work has tangible, visible impact — from surgical robots to autonomous vehicles to warehouse automation. Focus on sensor fusion, ROS, and embedded systems.',
            skills:['ROS','Control Systems','Computer Vision','C++','Sensor Fusion','Embedded Systems','Simulation (Gazebo)','Mechanical Design'],
            roles:['Robotics Engineer','Automation Architect','Controls Engineer','Robotics Software Developer','Perception Engineer','Hardware Prototyper'],
            questions:['Am I drawn to humanoid robots, industrial automation, or autonomous vehicles?','How do I balance precision engineering with rapid prototyping?','What safety standards do I need to master for my target domain?'],
            resources:['ROS Wiki — Robot Operating System','MIT OpenCourseWare — Robotics','Boston Dynamics — Inspiration & research']
        },
        {
            id:'climate',cat:'eco',icon:'🌍',title:'Climate Technology',
            tagline:'Engineer planetary survival',
            desc:'Develop technological solutions to climate change — from carbon capture to renewable energy systems.',
            salary:'$75K–$180K+',growth:'27%',demand:'Critical',
            advice:'Climate tech is not just a career — it is a calling. The planet is running out of time, and the engineers, scientists, and entrepreneurs working on climate solutions are the most important workforce of this century. Whether you focus on solar optimization, carbon capture, or grid modernization, your work will literally determine the future of life on Earth. Combine deep technical skills with systems thinking.',
            skills:['Renewable Energy Systems','Carbon Accounting','Energy Storage','Climate Modeling','Sustainability Metrics','Material Science','Grid Technology','Environmental Policy'],
            roles:['Climate Tech Engineer','Sustainability Analyst','Carbon Market Specialist','Clean Energy Developer','Environmental Consultant','Green Building Architect'],
            questions:['Where can my skills create the most immediate climate impact?','How do I balance economic viability with ecological urgency?','Am I drawn to energy, agriculture, transportation, or built environment?'],
            resources:['Project Drawdown — Top climate solutions','Climate Tech VC — Industry newsletter','IPCC Reports — Scientific foundation']
        },
        {
            id:'agritech',cat:'eco',icon:'🌱',title:'Agricultural Technology',
            tagline:'Feed the future sustainably',
            desc:'Revolutionize food production with precision agriculture, vertical farming, and bioengineered crops.',
            salary:'$70K–$160K+',growth:'18%',demand:'Growing',
            advice:'By 2050, we need to feed 10 billion people on a warming planet with degrading soil. AgriTech is where biology, data science, and engineering converge to solve this existential challenge. Explore precision agriculture using IoT and drones, investigate cellular agriculture, or build vertical farming systems. The most successful AgriTech professionals combine deep agricultural knowledge with cutting-edge technology.',
            skills:['Precision Agriculture','IoT & Sensors','Drone Technology','Plant Biology','Data Analytics','Supply Chain','Soil Science','Vertical Farming'],
            roles:['AgriTech Engineer','Precision Farming Specialist','Food Systems Analyst','Vertical Farm Manager','Agricultural Data Scientist','Sustainable Supply Chain Lead'],
            questions:['Am I passionate about food systems, environmental conservation, or technology?','How do I bridge the gap between traditional farming and innovation?','What region or community could benefit most from my contributions?'],
            resources:['FAO — Food and Agriculture Organization','AgFunder — AgriTech investment news','MIT Food & Agriculture Innovation']
        },
        {
            id:'ocean',cat:'eco',icon:'🌊',title:'Ocean & Marine Science',
            tagline:'Explore Earth\'s last frontier',
            desc:'Study and protect marine ecosystems while developing sustainable ocean industries and blue technologies.',
            salary:'$65K–$140K+',growth:'15%',demand:'Growing',
            advice:'The ocean covers 71% of Earth\'s surface yet remains largely unexplored. Marine science is rapidly evolving with underwater robotics, satellite monitoring, and marine biotech creating entirely new career possibilities. Whether you are drawn to marine biology, oceanographic engineering, or sustainable fisheries, the blue economy is emerging as a major growth sector. Combine your love of the ocean with technical skills for maximum impact.',
            skills:['Marine Biology','Oceanography','Remote Sensing','Underwater Robotics','Marine Conservation','GIS Mapping','Aquaculture','Environmental Law'],
            roles:['Marine Biologist','Oceanographic Engineer','Coral Reef Ecologist','Fisheries Manager','Marine Policy Advisor','Blue Economy Consultant'],
            questions:['Am I drawn to field research, lab work, or policy advocacy?','How can technology amplify ocean conservation efforts?','What marine ecosystem is most critically in need of protection?'],
            resources:['NOAA — Ocean science & careers','Ocean Conservancy — Advocacy & research','Schmidt Ocean Institute — Exploration missions']
        },
        {
            id:'biotech',cat:'human',icon:'🧬',title:'Biotechnology',
            tagline:'Rewrite the code of life',
            desc:'Engineer biological systems for medicine, agriculture, and industry using CRISPR, synthetic biology, and genomics.',
            salary:'$80K–$200K+',growth:'24%',demand:'High',
            advice:'Biotechnology is the most profound toolkit humanity has ever wielded. With CRISPR gene editing, synthetic biology, and advanced genomics, you will work at the intersection of engineering and biology to solve problems from genetic disease to sustainable materials. This field demands both deep scientific rigor and creative thinking. Build a strong foundation in molecular biology, then specialize in your area of passion.',
            skills:['Molecular Biology','CRISPR/Gene Editing','Bioinformatics','Protein Engineering','Cell Culture','Regulatory Affairs','Genomics','Lab Automation'],
            roles:['Biotech Research Scientist','Genetic Engineer','Bioinformatics Analyst','Clinical Research Lead','Bioprocess Engineer','Regulatory Scientist'],
            questions:['Am I more excited by therapeutic applications or industrial biotech?','How do I navigate the ethical complexities of genetic engineering?','Do I thrive in research environments or commercial development?'],
            resources:['Nature Biotechnology — Leading journal','Addgene — CRISPR resources','BioSpace — Industry careers & news']
        },
        {
            id:'neuro',cat:'human',icon:'🧠',title:'Neuroscience & BCI',
            tagline:'Map the mind\'s architecture',
            desc:'Decode brain function and build brain-computer interfaces that merge human cognition with technology.',
            salary:'$85K–$210K+',growth:'20%',demand:'High',
            advice:'The human brain is the most complex object in the known universe, and you want to understand it. Neuroscience is branching into revolutionary applications: brain-computer interfaces that restore movement, neurofeedback for mental health, and computational models of consciousness. Whether you pursue academic research or join companies like Neuralink, your work will redefine what it means to be human. Master neurobiology, signal processing, and machine learning.',
            skills:['Neuroanatomy','EEG/fMRI Analysis','Signal Processing','Computational Neuroscience','Python/MATLAB','Neural Engineering','Cognitive Science','Brain-Computer Interfaces'],
            roles:['Neuroscientist','BCI Engineer','Neurotech Product Developer','Computational Neuroscience Researcher','Clinical Neuroscientist','Neural Data Analyst'],
            questions:['Am I fascinated by how the brain works, or by what we can build with that knowledge?','How do I feel about the ethical implications of brain augmentation?','Do I want to work in clinical settings, research labs, or startups?'],
            resources:['NeuroAI — Intersection of neuroscience & AI','BrainFacts.org — Neuroscience education','IEEE Brain — BCI research community']
        },
        {
            id:'health',cat:'human',icon:'💊',title:'Digital Health & MedTech',
            tagline:'Heal with innovation',
            desc:'Transform healthcare delivery through telemedicine, wearable diagnostics, and AI-powered clinical tools.',
            salary:'$80K–$190K+',growth:'26%',demand:'Very High',
            advice:'Healthcare is undergoing its most dramatic transformation in a century. Digital health combines clinical knowledge with technology to make healthcare more accessible, predictive, and personalized. From wearable devices that detect disease early to AI systems that analyze medical images with superhuman accuracy, this field is saving lives at scale. You need empathy as much as engineering skill — always remember there is a patient at the other end of your code.',
            skills:['Health Informatics','FDA Regulations','HIPAA Compliance','Wearable Tech','Medical Imaging','EHR Systems','Clinical Trials','UX for Healthcare'],
            roles:['Health Tech Product Manager','Clinical Data Scientist','Medical Device Engineer','Telemedicine Architect','Health AI Specialist','Digital Therapeutics Designer'],
            questions:['What aspect of healthcare frustrates me most as a potential user?','How do I navigate the complex regulatory landscape of medical devices?','Am I building for patients, clinicians, or health systems?'],
            resources:['Rock Health — Digital health funding data','WHO Digital Health — Global perspective','HIMSS — Health information & technology']
        },
        {
            id:'psych',cat:'human',icon:'🫂',title:'Psychology & Well-being',
            tagline:'Elevate the human spirit',
            desc:'Apply psychological science to improve mental health, organizational culture, and human performance.',
            salary:'$60K–$150K+',growth:'16%',demand:'High',
            advice:'In an age of unprecedented connectivity yet rising loneliness, psychological expertise is invaluable. You can pursue clinical therapy, organizational psychology, UX research, or positive psychology coaching. The key is to combine empirical research with genuine compassion. Whether you help individuals heal from trauma or design workplace cultures that promote flourishing, your work addresses the most fundamental human need — to be understood.',
            skills:['Clinical Assessment','CBT / DBT','Research Methods','Psychometrics','Organizational Behavior','Positive Psychology','Trauma-Informed Care','Mindfulness-Based Interventions'],
            roles:['Clinical Psychologist','I/O Psychologist','UX Researcher','Behavioral Scientist','Well-being Coach','Neuropsychologist'],
            questions:['Am I drawn to clinical work with individuals or systemic organizational change?','How do I maintain my own mental health while supporting others?','What population or community do I feel called to serve?'],
            resources:['APA — American Psychological Association','Psychology Today — Practice & research','Greater Good Science Center — Well-being research']
        },
        {
            id:'fintech',cat:'biz',icon:'💳',title:'FinTech & DeFi',
            tagline:'Reinvent money itself',
            desc:'Build financial technology that democratizes access to banking, investing, and economic participation.',
            salary:'$85K–$220K+',growth:'23%',demand:'Very High',
            advice:'Money is being reimagined from the ground up. FinTech is about removing barriers — making financial services accessible to the 1.7 billion unbanked people worldwide, creating instant cross-border payments, and building algorithmic trading systems. Whether you are drawn to neobanking, embedded finance, or decentralized protocols, your work can fundamentally reshape economic equity. Combine financial literacy with strong engineering skills.',
            skills:['Payment Systems','Banking APIs','Risk Modeling','Compliance & RegTech','Algorithmic Trading','Financial Modeling','Blockchain','Product Management'],
            roles:['FinTech Engineer','Quantitative Developer','Product Manager (Payments)','Risk Analyst','RegTech Specialist','Embedded Finance Architect'],
            questions:['Do I want to disrupt traditional banking or build within it?','How do I balance innovation speed with regulatory compliance?','What financial inequality frustrates me the most?'],
            resources:['Fintech Blueprint — Industry analysis','Stripe Press — Future of payments','CFA Institute — Financial foundations']
        },
        {
            id:'impact',cat:'biz',icon:'🌟',title:'Impact & Social Enterprise',
            tagline:'Profit with purpose',
            desc:'Build ventures that generate measurable social and environmental impact alongside financial returns.',
            salary:'$65K–$160K+',growth:'18%',demand:'Growing',
            advice:'The next generation of business leaders will be measured not by shareholder returns alone, but by their total impact on people and planet. Social enterprise sits at the intersection of capitalism and compassion. Learn to build sustainable business models, measure impact rigorously, and tell stories that inspire stakeholders. The most successful impact entrepreneurs are ruthlessly practical about execution while being deeply idealistic about their mission.',
            skills:['Impact Measurement','Social Business Models','Grant Writing','Stakeholder Management','ESG Frameworks','Community Engagement','Fundraising','Systems Thinking'],
            roles:['Social Entrepreneur','Impact Investment Analyst','ESG Consultant','Program Director (Nonprofit)','Chief Impact Officer','Community Development Lead'],
            questions:['What systemic issue keeps me up at night?','How do I measure success beyond financial metrics?','Am I building a product, a movement, or an institution?'],
            resources:['Skoll Foundation — Social entrepreneurship','GIIN — Impact investing network','Stanford Social Innovation Review']
        },
        {
            id:'strategy',cat:'biz',icon:'♟️',title:'Strategy & Consulting',
            tagline:'Solve impossible puzzles',
            desc:'Advise organizations on critical decisions — from market entry to digital transformation to M&A.',
            salary:'$80K–$250K+',growth:'14%',demand:'Steady',
            advice:'Strategy consulting is the ultimate training ground for business minds. You will work across industries, tackle ambiguous problems with incomplete data, and learn to communicate complex ideas with crystalline clarity. The best consultants are not just smart — they are intensely curious, deeply empathetic with clients, and relentlessly structured in their thinking. Build your analytical toolkit, practice frameworks, and develop the soft skills that separate good analysts from trusted advisors.',
            skills:['Problem Structuring','Financial Analysis','Market Sizing','Data Storytelling','Change Management','Stakeholder Communication','Competitive Analysis','Presentation Design'],
            roles:['Management Consultant','Strategy Analyst','Transformation Lead','Principal Consultant','Corporate Strategist','Due Diligence Analyst'],
            questions:['Do I thrive under ambiguity and tight deadlines?','Am I energized by variety across industries or depth in one sector?','How do I handle the trade-off between analytical rigor and client relationships?'],
            resources:['McKinsey Insights — Strategic thinking','Case Interview Prep — Frameworks & practice','Harvard Business Review — Business strategy']
        },
        {
            id:'product',cat:'biz',icon:'🎯',title:'Product Management',
            tagline:'Ship what the world needs',
            desc:'Define product vision, prioritize ruthlessly, and lead cross-functional teams to build products people love.',
            salary:'$90K–$220K+',growth:'22%',demand:'Very High',
            advice:'Product Management is the art and science of building the right thing. You are the voice of the user, the translator between business and engineering, and the strategist who decides what NOT to build. Great PMs combine analytical thinking with deep empathy, technical fluency with business acumen. Start by mastering user research, learn to write crisp product specs, and develop your ability to influence without authority. Every great product started as someone\'s conviction about an unmet need.',
            skills:['User Research','Roadmap Planning','A/B Testing','Agile/Scrum','SQL & Analytics','Wireframing','Go-To-Market Strategy','Cross-Functional Leadership'],
            roles:['Product Manager','Senior PM','Group PM','VP of Product','Technical PM','Growth Product Manager'],
            questions:['Am I more passionate about discovery (finding problems) or delivery (shipping solutions)?','How do I balance user needs with business objectives?','What product do I use daily that I wish I had built?'],
            resources:['Inspired by Marty Cagan','Lenny\'s Newsletter — PM insights','ProductBoard — Product management tools']
        },
        {
            id:'space',cat:'eco',icon:'🚀',title:'Space Technology',
            tagline:'Expand humanity\'s horizon',
            desc:'Design spacecraft, satellite systems, and space habitats that extend civilization beyond Earth.',
            salary:'$90K–$220K+',growth:'17%',demand:'Growing',
            advice:'Space is no longer the exclusive domain of government agencies — it is a booming commercial frontier. From SpaceX\'s reusable rockets to satellite constellations providing global internet, the space industry is creating opportunities at an unprecedented pace. Whether you want to design propulsion systems, build satellite payloads, or plan Mars habitats, you will need strong foundations in aerospace engineering, orbital mechanics, and systems thinking. Dream big — literally.',
            skills:['Aerospace Engineering','Orbital Mechanics','Propulsion Systems','Satellite Design','Mission Planning','Systems Engineering','Radiation Hardening','Launch Operations'],
            roles:['Aerospace Engineer','Mission Architect','Satellite Systems Engineer','Space Policy Analyst','Astrobiology Researcher','Spacecraft Software Engineer'],
            questions:['Am I drawn to Earth observation, deep space exploration, or commercial space?','How do I feel about working on technology with very long development timelines?','What inspires me more — building the rocket or deciding where it goes?'],
            resources:['NASA Careers — Opportunities & pathways','Space.com — Industry news','The Planetary Society — Exploration advocacy']
        },
        {
            id:'design',cat:'creative',icon:'🎨',title:'UX & Product Design',
            tagline:'Design experiences that matter',
            desc:'Create intuitive, beautiful, and accessible digital experiences that put humans at the center of technology.',
            salary:'$75K–$180K+',growth:'21%',demand:'High',
            advice:'Design is not how it looks — it is how it works. As a UX designer, you are the advocate for every user who will never be in the room when decisions are made. The best designers combine aesthetic sensibility with rigorous research methodology, creating interfaces that feel inevitable in their simplicity. Learn user research, master prototyping tools, understand accessibility standards, and develop the courage to challenge assumptions — including your own.',
            skills:['User Research','Figma','Prototyping','Information Architecture','Accessibility (WCAG)','Design Systems','Usability Testing','Interaction Design'],
            roles:['UX Designer','Product Designer','Design Lead','UX Researcher','Interaction Designer','Design Systems Architect'],
            questions:['Am I more energized by research (understanding users) or craft (creating interfaces)?','How do I advocate for users when business pressures push for shortcuts?','What digital product has the worst UX that I could reimagine?'],
            resources:['Nielsen Norman Group — UX research','Laws of UX — Design principles','Figma Community — Design resources']
        },
        {
            id:'content',cat:'creative',icon:'✍️',title:'Content & Storytelling',
            tagline:'Words that move worlds',
            desc:'Craft compelling narratives across media — from brand strategy and journalism to screenwriting and content design.',
            salary:'$55K–$150K+',growth:'15%',demand:'Steady',
            advice:'In the attention economy, storytelling is the most valuable skill in existence. Whether you write for brands, newsrooms, film studios, or tech products, your ability to distill complex ideas into compelling narratives will make you indispensable. The best content professionals understand both art and analytics — they craft stories that move hearts while tracking metrics that prove business value. Read voraciously, write daily, and develop your unique voice.',
            skills:['Copywriting','Content Strategy','SEO','Brand Voice Development','Video Scripting','Editorial Planning','Analytics','Content Design (UX Writing)'],
            roles:['Content Strategist','Brand Writer','UX Writer','Journalist','Content Marketing Lead','Screenwriter'],
            questions:['Am I a natural storyteller or a strategic communicator — or both?','What medium (text, video, audio, interactive) excites me most?','How do I maintain creative integrity while serving business objectives?'],
            resources:['Ann Handley\'s Everybody Writes','Content Strategy Alliance','The Content Design Book by Sarah Winters']
        },
        {
            id:'gamedev',cat:'creative',icon:'🎮',title:'Game Development',
            tagline:'Build worlds people live in',
            desc:'Create immersive interactive experiences — from indie masterpieces to AAA titles to XR simulations.',
            salary:'$65K–$175K+',growth:'16%',demand:'Growing',
            advice:'Games are the most complex creative medium ever invented — combining narrative, art, music, engineering, and psychology into a single interactive experience. Whether you are drawn to programming game engines, designing levels, creating 3D art, or composing adaptive soundtracks, the games industry offers extraordinary creative fulfillment. Start making small games immediately — every shipped project teaches you more than months of tutorials.',
            skills:['Unity / Unreal Engine','C# / C++','3D Modeling','Game Design','Shader Programming','Animation','Level Design','Multiplayer Networking'],
            roles:['Game Developer','Game Designer','Technical Artist','Level Designer','Narrative Designer','Engine Programmer'],
            questions:['Do I want to create art, write code, design systems, or all three?','Am I drawn to indie games with creative freedom or AAA with big teams?','What game changed my life, and what made it special?'],
            resources:['GDC Vault — Game Developers Conference talks','Brackeys — Game development tutorials','Gamasutra — Industry analysis & postmortems']
        },
        {
            id:'xr',cat:'creative',icon:'🥽',title:'XR & Spatial Computing',
            tagline:'Merge realities',
            desc:'Build augmented, virtual, and mixed reality experiences that transform how we work, learn, and connect.',
            salary:'$85K–$200K+',growth:'25%',demand:'High',
            advice:'Spatial computing is the next major computing platform. AR glasses, VR headsets, and mixed reality devices are creating entirely new interaction paradigms. You will need a blend of 3D development, UX design thinking adapted for spatial interfaces, and understanding of human perception. The field is still young enough that you can help define its conventions. Think about how spatial computing can solve real problems — industrial training, remote collaboration, therapeutic applications — not just entertainment.',
            skills:['Unity/Unreal for XR','3D Interaction Design','Spatial Audio','ARKit / ARCore','Hand Tracking','WebXR','Volumetric Capture','Human Factors'],
            roles:['XR Developer','Spatial Designer','AR/VR Engineer','Immersive Experience Director','3D Interaction Developer','XR Research Scientist'],
            questions:['Am I building for entertainment, enterprise, education, or healthcare?','How do I design for comfort and reduce motion sickness?','What real-world task would be dramatically improved by spatial computing?'],
            resources:['Unity XR Documentation','Meta Quest Developer Hub','WebXR Samples — Browser-based XR']
        },
        {
            id:'edtech',cat:'human',icon:'📚',title:'Education Technology',
            tagline:'Democratize knowledge',
            desc:'Build platforms and tools that make quality education accessible, personalized, and engaging for everyone.',
            salary:'$70K–$160K+',growth:'19%',demand:'Growing',
            advice:'Education is the single most powerful force for social mobility, yet it remains inequitable worldwide. EdTech is about using technology to break down barriers — geographic, economic, and cognitive. Whether you build adaptive learning platforms, create gamified curricula, or design assessment tools that measure true understanding, your work can impact millions of learners. The best EdTech products are built by people who deeply understand how humans actually learn, not just how to build software.',
            skills:['Learning Science','Instructional Design','LMS Development','Gamification','Adaptive Learning','Assessment Design','Accessibility','Data-Driven Personalization'],
            roles:['EdTech Product Manager','Learning Experience Designer','Curriculum Developer','Assessment Specialist','EdTech Engineer','Chief Learning Officer'],
            questions:['What educational experience transformed my own life, and why?','How do I measure genuine learning versus superficial engagement?','Am I building for K-12, higher education, corporate training, or lifelong learning?'],
            resources:['EdSurge — EdTech news & research','Learning Scientists — Evidence-based strategies','Khan Academy — Model for accessible education']
        }
    ];

    // ============================== RENDER GRID ==============================
    const grid = document.getElementById('career-grid');
    const noResults = document.getElementById('no-results');
    const gridTitle = document.getElementById('grid-title');

    function renderCards(filteredCareers) {
        grid.innerHTML = '';
        if (filteredCareers.length === 0) {
            noResults.classList.add('show');
            gridTitle.textContent = 'No results found';
            return;
        }
        noResults.classList.remove('show');
        gridTitle.textContent = `Showing ${filteredCareers.length} career path${filteredCareers.length !== 1 ? 's' : ''}`;

        filteredCareers.forEach((c, i) => {
            const card = document.createElement('div');
            card.className = `career-card cat-${c.cat}`;
            card.style.animationDelay = `${i * 0.04}s`;
            card.style.animation = 'fadeSlideUp 0.5s ease-out both';
            card.setAttribute('data-id', c.id);
            card.innerHTML = `
                <div class="card-icon-row">
                    <div class="card-icon">${c.icon}</div>
                    <span class="card-tag">${c.cat === 'tech' ? 'Technology' : c.cat === 'eco' ? 'Sustainability' : c.cat === 'human' ? 'Human Sciences' : c.cat === 'biz' ? 'Business' : 'Creative'}</span>
                </div>
                <h3 class="card-title">${c.title}</h3>
                <p class="card-desc">${c.desc}</p>
                <div class="card-meta">
                    <div class="card-meta-item">💰 ${c.salary}</div>
                    <div class="card-meta-item">📈 ${c.growth} growth</div>
                </div>
            `;
            card.addEventListener('click', () => openDetail(c));
            card.addEventListener('mouseenter', () => cursorOrb.classList.add('active'));
            card.addEventListener('mouseleave', () => cursorOrb.classList.remove('active'));
            grid.appendChild(card);
        });
    }

    renderCards(careers);

    // ============================== FILTERS ==============================
    const filterBtns = document.querySelectorAll('.filter-btn');
    let activeFilter = 'all';

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            applyFilters();
        });
        btn.addEventListener('mouseenter', () => cursorOrb.classList.add('active'));
        btn.addEventListener('mouseleave', () => cursorOrb.classList.remove('active'));
    });

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', applyFilters);

    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        let filtered = careers;
        if (activeFilter !== 'all') {
            filtered = filtered.filter(c => c.cat === activeFilter);
        }
        if (query) {
            filtered = filtered.filter(c =>
                c.title.toLowerCase().includes(query) ||
                c.desc.toLowerCase().includes(query) ||
                c.tagline.toLowerCase().includes(query) ||
                c.skills.some(s => s.toLowerCase().includes(query)) ||
                c.roles.some(r => r.toLowerCase().includes(query))
            );
        }
        renderCards(filtered);
    }

    // ============================== DETAIL PANEL ==============================
    const overlay = document.getElementById('detail-overlay');
    const panel = document.getElementById('detail-panel');

    function openDetail(c) {
        const catColors = {
            tech: 'var(--primary)', eco: 'var(--accent-green)',
            human: 'var(--accent-warm)', biz: 'var(--accent-amber)', creative: 'var(--accent)'
        };
        const color = catColors[c.cat];

        panel.innerHTML = `
            <div class="detail-hero">
                <div class="detail-hero-top">
                    <div class="detail-icon cat-${c.cat}" style="font-size:36px;width:72px;height:72px;display:flex;align-items:center;justify-content:center;border-radius:18px">${c.icon}</div>
                    <button class="detail-close" id="detail-close" title="Close">✕</button>
                </div>
                <h2 class="detail-title">${c.title}</h2>
                <p class="detail-subtitle">${c.tagline} — ${c.desc}</p>
            </div>
            <div class="detail-stats">
                <div class="detail-stat">
                    <div class="detail-stat-value green">${c.salary}</div>
                    <div class="detail-stat-label">Salary Range</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-value blue">${c.growth}</div>
                    <div class="detail-stat-label">Projected Growth</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-value pink">${c.demand}</div>
                    <div class="detail-stat-label">Market Demand</div>
                </div>
            </div>
            <div class="detail-body">
                <div class="detail-section">
                    <div class="detail-section-title"><span class="dot" style="background:${color}"></span> Career Guidance</div>
                    <div class="detail-advice">${c.advice}</div>
                </div>
                <div class="detail-section">
                    <div class="detail-section-title"><span class="dot" style="background:${color}"></span> Core Skills to Master</div>
                    <div class="skills-grid">${c.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
                </div>
                <div class="detail-section">
                    <div class="detail-section-title"><span class="dot" style="background:${color}"></span> Trending Roles</div>
                    <div class="roles-list">${c.roles.map(r => `<div class="role-item"><span class="role-dot"></span>${r}</div>`).join('')}</div>
                </div>
                <div class="detail-section">
                    <div class="detail-section-title"><span class="dot" style="background:${color}"></span> Crucial Questions for Your Journey</div>
                    <div class="questions-list">${c.questions.map(q => `<div class="q-item">${q}</div>`).join('')}</div>
                </div>
                <div class="detail-section">
                    <div class="detail-section-title"><span class="dot" style="background:${color}"></span> Recommended Resources</div>
                    <div class="resources-list">${c.resources.map(r => `<div class="resource-link">📌 ${r}</div>`).join('')}</div>
                </div>
            </div>
        `;

        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Close handlers
        document.getElementById('detail-close').addEventListener('click', closeDetail);
        document.getElementById('detail-close').addEventListener('mouseenter', () => cursorOrb.classList.add('active'));
        document.getElementById('detail-close').addEventListener('mouseleave', () => cursorOrb.classList.remove('active'));
    }

    function closeDetail() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDetail();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDetail();
    });

    // ============================== CURSOR ==============================
    const cursorOrb = document.getElementById('cursor-orb');
    const cursorTrail = document.getElementById('cursor-trail');
    let mx = 0, my = 0, tx = 0, ty = 0;

    document.addEventListener('mousemove', (e) => {
        mx = e.clientX; my = e.clientY;
        cursorOrb.style.left = mx + 'px';
        cursorOrb.style.top = my + 'px';
    });

    // Smooth trail
    function animateTrail() {
        tx += (mx - tx) * 0.15;
        ty += (my - ty) * 0.15;
        cursorTrail.style.left = tx + 'px';
        cursorTrail.style.top = ty + 'px';
        requestAnimationFrame(animateTrail);
    }
    animateTrail();

    // Hover effects for interactive elements
    document.querySelectorAll('a, button, input, .nav-cta').forEach(el => {
        el.addEventListener('mouseenter', () => cursorOrb.classList.add('active'));
        el.addEventListener('mouseleave', () => cursorOrb.classList.remove('active'));
    });

    // ============================== NAVBAR SCROLL ==============================
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    function scrollToTop(e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    function scrollToExplore(e) { e.preventDefault(); document.getElementById('explore').scrollIntoView({ behavior: 'smooth' }); }

    // ============================== THREE.JS COSMOS ==============================
    const canvas = document.getElementById('cosmos');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPos = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 200;
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 200;
        starPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
        starSizes[i] = Math.random() * 2 + 0.5;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMat = new THREE.PointsMaterial({
        color: 0x8888ff, size: 0.8, transparent: true, opacity: 0.6,
        sizeAttenuation: true, blending: THREE.AdditiveBlending
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Geometric wireframes
    const geoGroup = new THREE.Group();
    scene.add(geoGroup);

    const wireMat = new THREE.MeshBasicMaterial({
        color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.08
    });
    const wireMat2 = new THREE.MeshBasicMaterial({
        color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.06
    });

    const geometries = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1, 0),
        new THREE.DodecahedronGeometry(1, 0)
    ];

    for (let i = 0; i < 30; i++) {
        const geo = geometries[Math.floor(Math.random() * geometries.length)];
        const mesh = new THREE.Mesh(
            geo.clone(),
            (Math.random() > 0.5 ? wireMat : wireMat2).clone()
        );
        const scale = Math.random() * 3 + 0.8;
        mesh.scale.set(scale, scale, scale);
        mesh.position.set(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 60 - 20
        );
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.userData = {
            rotX: (Math.random() - 0.5) * 0.004,
            rotY: (Math.random() - 0.5) * 0.005,
            floatSpeed: Math.random() * 0.5 + 0.2,
            floatOffset: Math.random() * Math.PI * 2
        };
        geoGroup.add(mesh);
    }

    // Connecting lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.04 });
    for (let i = 0; i < 15; i++) {
        const lineGeo = new THREE.BufferGeometry();
        const points = [];
        const start = new THREE.Vector3(
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 40 - 20
        );
        const end = new THREE.Vector3(
            start.x + (Math.random() - 0.5) * 40,
            start.y + (Math.random() - 0.5) * 40,
            start.z + (Math.random() - 0.5) * 20
        );
        points.push(start, end);
        lineGeo.setFromPoints(points);
        const line = new THREE.Line(lineGeo, lineMat);
        geoGroup.add(line);
    }

    let mouseXScene = 0, mouseYScene = 0;
    document.addEventListener('mousemove', (e) => {
        mouseXScene = (e.clientX - window.innerWidth / 2) * 0.001;
        mouseYScene = (e.clientY - window.innerHeight / 2) * 0.001;
    });

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Parallax
        geoGroup.rotation.y += (mouseXScene - geoGroup.rotation.y) * 0.02;
        geoGroup.rotation.x += (mouseYScene - geoGroup.rotation.x) * 0.02;

        // Animate individual shapes
        geoGroup.children.forEach(child => {
            if (child.userData.rotX !== undefined) {
                child.rotation.x += child.userData.rotX;
                child.rotation.y += child.userData.rotY;
                child.position.y += Math.sin(t * child.userData.floatSpeed + child.userData.floatOffset) * 0.005;
            }
        });

        // Rotate starfield slowly
        stars.rotation.y += 0.0001;
        stars.rotation.x += 0.00005;

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ============================== LOADING SCREEN ==============================
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.getElementById('loader').classList.add('hidden');
        }, 800);
    });
    