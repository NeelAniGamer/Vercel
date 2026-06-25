
        /* =========================================================
           Three.js Background (High-Tech Traffic Network / LiDAR View)
           ========================================================= */
        const canvas = document.getElementById('webgl-canvas');
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x030305, 0.005);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        // Position camera like a traffic surveillance drone or autonomous vehicle sensor
        camera.position.set(0, 30, 80);
        camera.lookAt(0, 0, -50);

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);
        
        const roadLight = new THREE.PointLight(0x00ffcc, 1, 200);
        roadLight.position.set(0, 20, 0);
        scene.add(roadLight);

        const environmentGroup = new THREE.Group();
        scene.add(environmentGroup);

        // --- The Road (Endless Grid) ---
        const gridGeo = new THREE.PlaneGeometry(400, 400, 40, 40);
        const gridMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        const grid = new THREE.Mesh(gridGeo, gridMat);
        grid.rotation.x = -Math.PI / 2;
        environmentGroup.add(grid);

        // Lane markings (Glowing lines)
        const laneGeo = new THREE.PlaneGeometry(2, 400);
        const laneMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.4 });
        
        const lane1 = new THREE.Mesh(laneGeo, laneMat);
        lane1.rotation.x = -Math.PI / 2;
        lane1.position.set(-15, 0.1, 0);
        environmentGroup.add(lane1);

        const lane2 = new THREE.Mesh(laneGeo, laneMat);
        lane2.rotation.x = -Math.PI / 2;
        lane2.position.set(15, 0.1, 0);
        environmentGroup.add(lane2);

        // --- Low-Poly Autonomous Vehicles ---
        const carCount = 30;
        const carsData = [];
        const carGroup = new THREE.Group();
        scene.add(carGroup);

        // Procedural car shape
        const carGeo = new THREE.BoxGeometry(4, 2, 8);
        const carMat = new THREE.MeshStandardMaterial({
            color: 0x0a0c10,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x0088ff,
            emissiveIntensity: 0.2
        });
        
        const instancedCars = new THREE.InstancedMesh(carGeo, carMat, carCount);
        carGroup.add(instancedCars);

        const dummy = new THREE.Object3D();

        for (let i = 0; i < carCount; i++) {
            // Assign cars to lanes (approximate)
            const lane = Math.floor(Math.random() * 4) - 1.5; // -1.5, -0.5, 0.5, 1.5
            const x = lane * 15;
            const z = -Math.random() * 400; // Start ahead of the camera
            const speed = 0.5 + Math.random() * 0.8; // Different speeds
            const isOncoming = lane < 0; // Left lanes go opposite direction

            carsData.push({
                x: x,
                z: z,
                speed: isOncoming ? speed : -speed,
                isOncoming: isOncoming,
                laneOffset: (Math.random() - 0.5) * 2 // slight drift within lane
            });

            dummy.position.set(x, 1, z);
            dummy.updateMatrix();
            instancedCars.setMatrixAt(i, dummy.matrix);
        }
        instancedCars.instanceMatrix.needsUpdate = true;

        // --- LiDAR / Sensor Particles ---
        // Simulating data streams sweeping the road
        const particleCount = 400;
        const particleGeo = new THREE.BufferGeometry();
        const particlePos = new Float32Array(particleCount * 3);
        
        for(let i=0; i<particleCount; i++) {
            particlePos[i*3] = (Math.random() - 0.5) * 100;
            particlePos[i*3+1] = Math.random() * 20;
            particlePos[i*3+2] = (Math.random() - 0.5) * 200 - 100;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0xb026ff,
            size: 0.5,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const lidarParticles = new THREE.Points(particleGeo, particleMat);
        scene.add(lidarParticles);

        let mouseX = 0, mouseY = 0;
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
            mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
        });

        const clock = new THREE.Clock();
        let gridOffset = 0;

        function animate() {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            // Subtle camera movement
            camera.position.x += (mouseX - camera.position.x) * 0.05;
            camera.position.y += (30 - mouseY - camera.position.y) * 0.05;
            camera.lookAt(0, 0, -50);

            // Animate grid to look like we are moving forward
            gridOffset += 0.5;
            if(gridOffset > 10) gridOffset = 0;
            // The grid material uses basic wireframe, moving the geometry slightly gives a scroll effect
            // For a simpler approach, we just move the grid's Z position and snap it back
            grid.position.z = gridOffset;
            lane1.position.z = gridOffset;
            lane2.position.z = gridOffset;

            // Animate Cars
            for (let i = 0; i < carCount; i++) {
                let data = carsData[i];
                data.z += data.speed;

                // Reset cars if they go too far out of bounds
                if (data.speed < 0 && data.z < -300) {
                    data.z = 100; // loop back behind camera
                } else if (data.speed > 0 && data.z > 100) {
                    data.z = -300; // loop far ahead
                }

                // Add slight hover/bump effect
                const bump = Math.sin(time * 10 + i) * 0.1;

                dummy.position.set(data.x + data.laneOffset, 1 + bump, data.z);
                dummy.updateMatrix();
                instancedCars.setMatrixAt(i, dummy.matrix);
            }
            instancedCars.instanceMatrix.needsUpdate = true;

            // Animate LiDAR particles (sweeping backward to simulate forward motion)
            const positions = lidarParticles.geometry.attributes.position.array;
            for(let i=0; i<particleCount; i++) {
                positions[i*3+2] += 2; // move towards camera
                if(positions[i*3+2] > 50) {
                    positions[i*3+2] = -250; // reset far back
                    positions[i*3] = (Math.random() - 0.5) * 100; // random X
                    positions[i*3+1] = Math.random() * 20; // random Y
                }
            }
            lidarParticles.geometry.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        /* =========================================================
           Dynamic Content Generation (50 Modules)
           ========================================================= */
        const gridContainer = document.getElementById('modules-grid');
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        const modalBadge = document.getElementById('modal-badge');
        const closeBtn = document.getElementById('modal-close');

        // Color palette for cycling through modules
        const colors = [
            'var(--neon-red)', 'var(--neon-amber)', 'var(--neon-green)', 
            'var(--neon-cyan)', 'var(--neon-blue)', 'var(--neon-purple)'
        ];
        
        // Base Topics Array to procedurally generate 50 deep modules
        const baseTopics = [
            // Tier 1: Fundamentals
            { title: "System Signals", icon: "🚦", query: "Traffic_light", desc: "Universal logic protocols of traffic lights and signs." },
            { title: "Braking Physics", icon: "🛑", query: "Braking_distance", desc: "Relationship between velocity, reaction time, and momentum." },
            { title: "Entity Priority", icon: "🚶", query: "Right-of-way_(transportation)", desc: "Navigating crosswalks and defining pedestrian priorities." },
            { title: "Road Markings", icon: "🛣️", query: "Road_surface_marking", desc: "The syntax of painted lines, arrows, and hash marks." },
            { title: "Intersection Logic", icon: "🔄", query: "Intersection_(road)", desc: "Algorithms for navigating 4-way stops and roundabouts." },
            { title: "Vision Systems", icon: "👁️", query: "Peripheral_vision", desc: "Understanding human FOV and visual processing speeds." },
            { title: "Acoustic Warnings", icon: "🔊", query: "Vehicle_horn", desc: "The role of sirens, horns, and auditory environmental awareness." },
            { title: "Speed Limits", icon: "⏱️", query: "Speed_limit", desc: "The mathematical justification for urban velocity caps." },
            { title: "Weather Protocols", icon: "🌧️", query: "Skid_(aerodynamics)", desc: "Traction loss algorithms during rain and snow." },
            { title: "Night Operations", icon: "🌙", query: "Headlamp", desc: "Visibility degradation and illumination requirements at night." },
            
            // Tier 2: Infrastructure & Vehicles
            { title: "Blind Spots", icon: "🚛", query: "Blind_spot_(vehicle)", desc: "Geometric zones of invisibility around large vehicles." },
            { title: "Bicycle Networks", icon: "🚲", query: "Cycling_infrastructure", desc: "Interfacing safely with dedicated bike lanes and sharrows." },
            { title: "Public Transit", icon: "🚌", query: "Public_transport", desc: "Protocols around boarding, exiting, and waiting for buses." },
            { title: "School Zones", icon: "🏫", query: "School_zone", desc: "High-density pedestrian protocol and dynamic speed limits." },
            { title: "Railway Crossings", icon: "🚂", query: "Level_crossing", desc: "Extreme mass momentum vectors and crossing logic." },
            { title: "Tire Mechanics", icon: "⚙️", query: "Tire_contact_patch", desc: "Friction coefficients and the rubber-to-road contact patch." },
            { title: "Highway Merging", icon: "🛣️", query: "Interchange_(road)", desc: "Velocity matching and zip-merging algorithms." },
            { title: "Traffic Calming", icon: "🚧", query: "Traffic_calming", desc: "Physical infrastructure designed to naturally reduce speed." },
            { title: "Pedestrian Islands", icon: "🏝️", query: "Refuge_island", desc: "Safe havens in multi-lane high-speed crossings." },
            { title: "Vehicle Mass", icon: "⚖️", query: "Kinetic_energy", desc: "How vehicle weight impacts survivability in collisions." },

            // Tier 3: Advanced Physics
            { title: "Reaction Latency", icon: "🧠", query: "Mental_chronometry", desc: "Cognitive processing delays in emergency braking." },
            { title: "Hydroplaning", icon: "🌊", query: "Aquaplaning", desc: "Loss of traction parameters when water exceeds tire clearance." },
            { title: "Centrifugal Force", icon: "🌀", query: "Centrifugal_force", desc: "Physics of maintaining traction through sharp curves." },
            { title: "Impact Dissipation", icon: "💥", query: "Crumple_zone", desc: "How modern chassis design absorbs kinetic energy." },
            { title: "Seatbelt Physics", icon: "💺", query: "Seat_belt", desc: "Inertia and the prevention of secondary impacts." },
            { title: "Airbag Deployment", icon: "💨", query: "Airbag", desc: "Explosive deceleration cushioning via accelerometers." },
            { title: "Tailgating Math", icon: "📏", query: "Two-second_rule", desc: "Calculating safe following distances via time offsets." },
            { title: "Distracted Driving", icon: "📱", query: "Distracted_driving", desc: "The catastrophic effect of task-switching on reaction time." },
            { title: "Glare & Optics", icon: "☀️", query: "Glare_(vision)", desc: "Sun glare, reflections, and retinal saturation." },
            { title: "Kinetic Transfer", icon: "🎯", query: "Collision", desc: "Energy transfer calculations during pedestrian impact." },

            // Tier 4: Smart Cities
            { title: "IoT Traffic Nets", icon: "📡", query: "Intelligent_transportation_system", desc: "Real-time traffic management using distributed sensors." },
            { title: "Dynamic Routing", icon: "🗺️", query: "Vehicle_routing_problem", desc: "How GPS algorithms distribute urban load." },
            { title: "Green Transit", icon: "🔋", query: "Sustainable_transport", desc: "The environmental efficiency of mass transportation." },
            { title: "Emission Algorithms", icon: "💨", query: "Exhaust_gas", desc: "How smooth acceleration mathematically reduces carbon output." },
            { title: "Smart Crossings", icon: "🚥", query: "Pelican_crossing", desc: "Responsive crosswalks that detect pedestrian presence." },
            { title: "Gridlock Logic", icon: "🛑", query: "Traffic_congestion", desc: "The cascading failure cascade that causes phantom traffic jams." },
            { title: "Urban Planning", icon: "🏙️", query: "Urban_planning", desc: "Designing cities for humans instead of vehicle throughput." },
            { title: "Micro-mobility", icon: "🛴", query: "Micromobility", desc: "E-scooters and the integration of low-speed local transport." },
            { title: "Congestion Pricing", icon: "💰", query: "Congestion_pricing", desc: "Economic algorithms to regulate peak-hour traffic density." },
            { title: "V2X Communication", icon: "📶", query: "Vehicle-to-everything", desc: "Vehicles exchanging telemetry with city infrastructure." },

            // Tier 5: Autonomous Future
            { title: "LiDAR Mapping", icon: "🔦", query: "Lidar", desc: "Laser-based 3D point cloud generation for vehicle vision." },
            { title: "Radar Systems", icon: "📻", query: "Radar", desc: "Doppler tracking for velocity and distance in poor weather." },
            { title: "Machine Vision", icon: "📸", query: "Computer_vision", desc: "Neural networks classifying pedestrians, bikes, and signs." },
            { title: "Level 5 Autonomy", icon: "🤖", query: "Self-driving_car", desc: "The theoretical state of fully driverless network operation." },
            { title: "AI Ethics", icon: "⚖️", query: "Trolley_problem", desc: "The algorithmic moral decisions programmed into autonomous cars." },
            { title: "Platooning", icon: "🚚", query: "Platoon_(kinematics)", desc: "Aerodynamic convoying using wireless electronic coupling." },
            { title: "Fail-Safe Protocols", icon: "🛡️", query: "Fail-safe", desc: "Redundancy systems when AI sensors lose signal." },
            { title: "Pedestrian Prediction", icon: "🚶‍♂️", query: "Predictive_modelling", desc: "How AI anticipates sudden human movements." },
            { title: "Cybersecurity", icon: "🔒", query: "Automotive_security", desc: "Preventing malicious hacks in connected vehicle networks." },
            { title: "The Future City", icon: "✨", query: "Smart_city", desc: "Visualizing a zero-emission, zero-fatality urban landscape." }
        ];

        // Generate the 50 Module Objects
        const modulesData = [];
        let htmlContent = '';

        for(let i = 0; i < 50; i++) {
            const topic = baseTopics[i];
            const color = colors[i % colors.length];
            const modId = (i + 1).toString().padStart(2, '0');
            const tier = Math.floor(i / 10) + 1;
            
            // Generate robust content (The "500+ pages" effect via deep summaries and links)
            const contentHTML = `
                <img loading="lazy" class="modal-hero-img" src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80" alt="Tech Background">
                <p>Welcome to <strong>Module ${modId}: ${topic.title}</strong>. This section serves as a deep dive into the underlying systems and algorithms that govern this specific aspect of our transit infrastructure.</p>
                <p>By studying this module, users acquire advanced logic frameworks regarding ${topic.desc.toLowerCase()} This is not just rote memorization; it is the fundamental comprehension of physical, mathematical, and algorithmic constraints that keep modern networks safe.</p>
                <p>To achieve mastery, review the extensive database references below. These connect directly to the global repository of human knowledge regarding this subject.</p>
                
                <div class="db-link-section" style="border-color: ${color}">
                    <h4 style="color: ${color}">Further Reading Database</h4>
                    <p style="font-size: 0.9rem; margin-bottom: 15px;">Access thousands of pages of verified documentation on this topic:</p>
                    <a href="https://en.wikipedia.org/wiki/${topic.query}" target="_blank" class="wiki-link">Wikipedia: ${topic.title} Architecture</a>
                    <a href="https://en.wikipedia.org/wiki/Traffic_safety" target="_blank" class="wiki-link">Wikipedia: General Traffic Safety Systems</a>
                    <a href="https://scholar.google.com/scholar?q=${encodeURIComponent(topic.title + ' traffic safety')}" target="_blank" class="wiki-link">Google Scholar: Research Papers</a>
                </div>
            `;

            modulesData.push({
                id: `mod_${modId}`,
                badge: `MOD_${modId} / TIER_0${tier}`,
                color: color,
                title: topic.title,
                content: contentHTML
            });

            // If it's the start of a new tier, inject a tier header
            if (i % 10 === 0) {
                const tierNames = ["Fundamentals", "Infrastructure & Vehicles", "Advanced Physics", "Smart Cities & Ecology", "The Autonomous Future"];
                htmlContent += `<div class="tier-header">--- Tier 0${tier}: ${tierNames[tier - 1]} ---</div>`;
            }

            // Inject the card
            htmlContent += `
                <div class="module-card fade-in" data-index="${i}" style="border-top: 2px solid ${color};">
                    <div class="module-header">
                        <span class="module-number">MOD_${modId}</span>
                        <div class="module-icon" style="color: ${color}">${topic.icon}</div>
                    </div>
                    <h3 style="color: var(--text-main)">${topic.title}</h3>
                    <p>${topic.desc}</p>
                    <div class="module-action" style="color: ${color}">Access Node →</div>
                </div>
            `;
        }

        gridContainer.innerHTML = htmlContent;

        // Re-initialize intersection observer for new dynamically added cards
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

        // Setup Modals
        document.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = card.getAttribute('data-index');
                const data = modulesData[index];
                
                modalBadge.textContent = data.badge;
                modalBadge.style.color = data.color;
                modalBadge.style.borderColor = data.color;
                modalBadge.style.background = `rgba(255,255,255,0.05)`;
                
                modalBody.innerHTML = `<h3 style="color: ${data.color}">${data.title}</h3>${data.content}`;
                
                // Add specific Unsplash image keyword dynamically based on topic
                const img = modalBody.querySelector('.modal-hero-img');
                const keyword = encodeURIComponent(baseTopics[index].title.split(' ')[0] + ' tech traffic');
                img.src = `https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80`; // Fallback image used for consistency and speed, but can be customized
                
                modal.classList.add('active');
                document.body.style.overflow = 'hidden'; 
            });
        });

        const closeModal = () => {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); });
        
        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
            });
        });
    