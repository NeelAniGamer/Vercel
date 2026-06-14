// --- 0. WEBGL FALLBACK CHECK ---
if (!isWebGLAvailable()) {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('webgl-fallback').style.display = 'flex';
    document.getElementById('smooth-wrapper').style.display = 'none';
    throw new Error('WebGL is not supported on this device/browser.');
}

// --- 1. LENIS SMOOTH SCROLL ---
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000) });
gsap.ticker.lagSmoothing(0, 0);

// --- 2. THREE.JS PARTICLE ENGINE ---
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x010409, 0.0015);

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 400;

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));

// Particle Geometry
const particleCount = 15000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const originalPositions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const color1 = new THREE.Color(0x38bdf8); // Cyan
const color2 = new THREE.Color(0xa855f7); // Purple

// Create Galaxy Shape
for (let i = 0; i < particleCount; i++) {
    // Spherical distribution with a twist
    const r = 400 * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    
    let x = r * Math.sin(phi) * Math.cos(theta);
    let y = r * Math.sin(phi) * Math.sin(theta);
    let z = r * Math.cos(phi);
    
    // Flatten into a disk / spiral
    y *= 0.3; 
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    
    originalPositions[i * 3] = x;
    originalPositions[i * 3 + 1] = y;
    originalPositions[i * 3 + 2] = z;

    // Mix colors based on distance
    const mixedColor = color1.clone().lerp(color2, Math.random());
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// Particle Material
const material = new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

// --- 3. MOUSE INTERACTION (PHYSICS) ---
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

// Mouse tracking
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - windowHalfX);
    mouseY = (e.clientY - windowHalfY);
});

// Raycaster for repelling
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const pointOfIntersection = new THREE.Vector3();

document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, pointOfIntersection);
});


// --- 4. ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Rotate Galaxy slowly
    particles.rotation.y = elapsedTime * 0.05;
    particles.rotation.z = elapsedTime * 0.02;

    // Mouse Repulsion Math
    const positions = particles.geometry.attributes.position.array;
    for(let i = 0; i < particleCount; i++) {
        const px = originalPositions[i*3];
        const py = originalPositions[i*3+1];
        const pz = originalPositions[i*3+2];
        
        // Calculate global position of this particle
        const globalPos = new THREE.Vector3(px, py, pz).applyEuler(particles.rotation);
        
        // Distance to mouse raycast intersection
        const dist = globalPos.distanceTo(pointOfIntersection);
        
        // Repel force
        if(dist < 100) {
            const force = (100 - dist) / 100;
            const dir = globalPos.clone().sub(pointOfIntersection).normalize().multiplyScalar(force * 50);
            
            // Undo rotation to store local relative offset
            dir.applyEuler(new THREE.Euler(-particles.rotation.x, -particles.rotation.y, -particles.rotation.z));
            
            positions[i*3] = px + dir.x;
            positions[i*3+1] = py + dir.y;
            positions[i*3+2] = pz + dir.z;
        } else {
            // Return to original with slight wave
            positions[i*3] += (px - positions[i*3]) * 0.05;
            positions[i*3+1] += (py - positions[i*3+1]) * 0.05;
            positions[i*3+2] += (pz - positions[i*3+2]) * 0.05;
        }
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Smooth camera drift based on mouse
    targetX = mouseX * 0.2;
    targetY = mouseY * 0.2;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}
animate();

// --- 5. GSAP SCROLL TRIGGERS ---
// Fly through the galaxy on scroll
ScrollTrigger.create({
    trigger: "#smooth-wrapper",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => {
        // Move camera deeper into the z-axis (through the particles)
        gsap.to(camera.position, {
            z: 400 - (self.progress * 600), // Start at 400, end at -200
            duration: 0.5,
            ease: "power1.out",
            overwrite: "auto"
        });
    }
});

// HTML Animations
const tl = gsap.timeline();

// Remove Loader
tl.to("#loader", { opacity: 0, duration: 0.5, onComplete: () => {
    document.getElementById('loader').style.display = 'none';
}})
.to(".reveal-text", { y: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: "power4.out", delay: 0.2 })
.to(".fade-in", { opacity: 1, duration: 1, ease: "power2.out" }, "-=0.5");

gsap.utils.toArray('.glass-card').forEach(card => {
    gsap.to(card, {
        scrollTrigger: { trigger: card, start: "top 85%", end: "top 20%", scrub: 1, toggleActions: "play none none reverse" },
        y: 0, opacity: 1, duration: 1, ease: "power3.out"
    });
});

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
