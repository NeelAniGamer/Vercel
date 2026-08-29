import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import countryData from './countryData.js';

// --- Global Variables ---
let scene, camera, renderer, controls;
let globeMesh, atmosphereMesh;
let stars;
let raycaster, mouse;
const countryMeshes = new Map();
let hoveredCountry = null;
let selectedCountry = null;
const R = 1.0; // Globe radius
let highlightCanvas, highlightCtx, highlightTexture, highlightMesh;
let cameraTarget = null;
let isAnimatingCamera = false;
let animationStartTime = 0;
let animationStartPos = new THREE.Vector3();
let animationEndPos = new THREE.Vector3();
let animationStartTarget = new THREE.Vector3();
let animationEndTarget = new THREE.Vector3();
const ANIMATION_DURATION = 1500; // ms

let isPlaying = false;
let globeGroup;
let menuLight;
let moonMesh = null;
let isHoveredMoon = false;
let isViewingMoon = false;
let nasaMoonTexture = null;

function updateMoonQuality(mode) {
    if (!moonMesh) return;

    // 1. Scale 3D Mesh Geometry Subdivisions smoothly
    const segs = mode === '4k' ? 128 : (mode === '1440p' ? 64 : (mode === '720p' ? 48 : 32));
    moonMesh.geometry.dispose();
    moonMesh.geometry = new THREE.SphereGeometry(0.22, segs, segs);

    // 2. Trilinear Mipmap Filtering (Smooth & crisp at all resolutions, NO grainy dots)
    if (nasaMoonTexture) {
        nasaMoonTexture.generateMipmaps = true;
        nasaMoonTexture.minFilter = THREE.LinearMipmapLinearFilter;
        nasaMoonTexture.magFilter = THREE.LinearFilter;
        
        if (mode === '4k') {
            nasaMoonTexture.anisotropy = (renderer && renderer.capabilities) ? renderer.capabilities.getMaxAnisotropy() : 16;
        } else if (mode === '1440p') {
            nasaMoonTexture.anisotropy = 8;
        } else if (mode === '720p') {
            nasaMoonTexture.anisotropy = 4;
        } else {
            nasaMoonTexture.anisotropy = 1;
        }
        nasaMoonTexture.needsUpdate = true;
    }

    // 3. Smooth, photorealistic material settings without noisy bump artifacts
    moonMesh.material.bumpMap = null;
    moonMesh.material.roughness = 0.9;
    moonMesh.material.metalness = 0.05;
    moonMesh.material.needsUpdate = true;
}

// --- TopoJSON Decoder ---
// Minimal TopoJSON decoder to convert TopoJSON to GeoJSON
function decodeTopoJSON(topology) {
    const geojson = { type: 'FeatureCollection', features: [] };
    const rawArcs = topology.arcs;
    const scale = topology.transform ? topology.transform.scale : [1, 1];
    const translate = topology.transform ? topology.transform.translate : [0, 0];

    // Decode delta-encoded arcs into absolute coordinate arrays
    const arcs = rawArcs.map(arc => {
        let x = 0, y = 0;
        return arc.map(point => {
            x += point[0];
            y += point[1];
            return [
                x * scale[0] + translate[0],
                y * scale[1] + translate[1]
            ];
        });
    });

    // Assemble a ring from an array of arc indices
    function assembleRing(arcIndices) {
        const coords = [];
        arcIndices.forEach(index => {
            const reverse = index < 0;
            const arcIdx = reverse ? ~index : index;
            let arc = arcs[arcIdx];
            if (!arc) return;
            if (reverse) arc = [...arc].reverse();
            // Skip first point of subsequent arcs to avoid duplicates
            const start = coords.length > 0 ? 1 : 0;
            for (let i = start; i < arc.length; i++) {
                coords.push(arc[i]);
            }
        });
        return coords;
    }

    // Process geometries
    const objects = topology.objects;
    for (const key in objects) {
        const obj = objects[key];
        if (!obj.geometries) continue;

        obj.geometries.forEach(geom => {
            const feature = {
                type: 'Feature',
                id: geom.id,
                properties: geom.properties || {},
                geometry: { type: geom.type, coordinates: [] }
            };

            if (geom.type === 'Polygon') {
                // arcs is an array of rings, each ring is an array of arc indices
                feature.geometry.coordinates = geom.arcs.map(ring => assembleRing(ring));
            } else if (geom.type === 'MultiPolygon') {
                // arcs is array of polygons, each polygon is array of rings
                feature.geometry.coordinates = geom.arcs.map(polygon =>
                    polygon.map(ring => assembleRing(ring))
                );
            }
            geojson.features.push(feature);
        });
    }
    return geojson;
}

// Spherical to Cartesian coordinate conversion
function latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));

    return new THREE.Vector3(x, y, z);
}

// Create a mesh for a country polygon
function createCountryMesh(feature) {
    // The interactive mesh is completely transparent by default, but used for raycasting
    const material = new THREE.MeshBasicMaterial({
        color: 0x00b8ff,
        transparent: true,
        opacity: 0.0,
        side: THREE.FrontSide,
        depthWrite: false
    });

    const rootGroup = new THREE.Group();
    rootGroup.userData = { name: feature.properties.name, properties: feature.properties };

    function processPolygon(polygonCoords) {
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        let points = [];
        const ring = polygonCoords[0];
        if (!ring || ring.length === 0) return;

        ring.forEach(coord => {
            const lng = coord[0];
            const lat = coord[1];
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            points.push({lat, lng});
        });
        
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const cosLat = Math.max(0.01, Math.cos(centerLat * Math.PI / 180));

        // Create Shape in local 2D tangent plane, wrapping longitude
        const shape = new THREE.Shape();
        const scale = 1.0;
        points.forEach((p, i) => {
            let diffLng = p.lng - centerLng;
            if (diffLng > 180) diffLng -= 360;
            if (diffLng < -180) diffLng += 360;
            const dx = diffLng * cosLat * scale;
            const dy = (p.lat - centerLat) * scale;
            if (i === 0) shape.moveTo(dx, dy);
            else shape.lineTo(dx, dy);
        });

        const geometry = new THREE.ShapeGeometry(shape);
        // Map vertices back to sphere, wrapping longitude
        const posAttribute = geometry.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            const dx = posAttribute.getX(i) / scale;
            const dy = posAttribute.getY(i) / scale;
            let plng = centerLng + dx / cosLat;
            if (plng > 180) plng -= 360;
            if (plng < -180) plng += 360;
            const plat = centerLat + dy;
            
            const v3 = latLngToVector3(plat, plng, R + 0.012);
            posAttribute.setXYZ(i, v3.x, v3.y, v3.z);
        }
        
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, material.clone());
        mesh.userData = rootGroup.userData;
        rootGroup.add(mesh);
        
        // Add border lines (black)
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.85
        });

        const boldBordersToggle = document.getElementById('bold-borders-toggle');
        const isBoldDefault = boldBordersToggle ? boldBordersToggle.checked : true;

        function buildLine(offsetLat, offsetLng, type) {
            let currentSegment = [];
            for (let i = 0; i < ring.length; i++) {
                const coord = ring[i];
                if (i > 0) {
                    const prevCoord = ring[i - 1];
                    if (Math.abs(coord[0] - prevCoord[0]) > 180) {
                        if (currentSegment.length > 1) {
                            const lineGeo = new THREE.BufferGeometry().setFromPoints(currentSegment);
                            const line = new THREE.Line(lineGeo, lineMat.clone());
                            line.userData = { type: type };
                            if (type === 'border-bold') {
                                line.material.opacity = 0.55;
                                line.visible = isBoldDefault;
                            } else {
                                line.material.opacity = isBoldDefault ? 0.85 : 0.45;
                            }
                            rootGroup.add(line);
                        }
                        currentSegment = [];
                    }
                }
                currentSegment.push(latLngToVector3(coord[1] + offsetLat, coord[0] + offsetLng, R + 0.013));
            }
            if (currentSegment.length > 1) {
                const lineGeo = new THREE.BufferGeometry().setFromPoints(currentSegment);
                const line = new THREE.Line(lineGeo, lineMat.clone());
                line.userData = { type: type };
                if (type === 'border-bold') {
                    line.material.opacity = 0.55;
                    line.visible = isBoldDefault;
                } else {
                    line.material.opacity = isBoldDefault ? 0.85 : 0.45;
                }
                rootGroup.add(line);
            }
        }

        // Center line
        buildLine(0, 0, 'border-normal');
        
        // Twin offset lines for the bold thickness effect
        const delta = 0.022;
        buildLine(delta, delta / cosLat, 'border-bold');
        buildLine(-delta, -delta / cosLat, 'border-bold');
    }

    if (feature.geometry.type === 'Polygon') {
        processPolygon(feature.geometry.coordinates);
    } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(poly => processPolygon(poly));
    }
    
    // Store centroid for camera focus
    const centroid = getCentroid(feature.geometry);
    rootGroup.userData.centroid = centroid;
    
    return rootGroup;
}

function getCentroid(geometry) {
    let xSum = 0, ySum = 0, zSum = 0, count = 0;
    const coords = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    coords.forEach(poly => {
        const ring = poly[0];
        if (ring) {
            ring.forEach(p => {
                const v = latLngToVector3(p[1], p[0], 1.0);
                xSum += v.x;
                ySum += v.y;
                zSum += v.z;
                count++;
            });
        }
    });
    if (count === 0) return { lat: 0, lng: 0 };
    const avg = new THREE.Vector3(xSum / count, ySum / count, zSum / count).normalize();
    const phi = Math.acos(Math.max(-1, Math.min(1, avg.y)));
    const lat = 90 - phi * (180 / Math.PI);
    let theta = Math.atan2(avg.z, -avg.x);
    let lng = theta * (180 / Math.PI) - 180;
    while (lng > 180) lng -= 360;
    while (lng < -180) lng += 360;
    return { lat, lng };
}

function getColorForRegion(countryName) {
    const cd = countryData[countryName];
    const region = cd ? cd.region : 'Other';
    
    if (region.includes('Europe')) return 0x4a9e5c;
    if (region.includes('Americas') || region.includes('America')) return 0x5cb85c;
    if (region.includes('Africa')) return 0xc4a44a;
    if (region.includes('Asia')) return 0x6aad6a;
    if (region.includes('Oceania')) return 0x8baf4f;
    
    return 0x7a9a5a;
}

// --- Initialization ---
function init() {
    const container = document.getElementById('globe-container');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050811); // Very dark space color

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 2.8);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    updatePixelRatio(document.querySelector('input[name="resolution"]:checked')?.value || '1440p');
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.8;
    controls.minDistance = 1.5;
    controls.maxDistance = 6.0;
    controls.enablePan = false;
    controls.rotateSpeed = 1.0;

    // Mouse buttons: Right-click hold to rotate world, Left-click for selecting countries
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.NONE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
    };

    // Prevent browser context menu on right-click dragging
    container.addEventListener('contextmenu', (e) => e.preventDefault(), false);

    // Texture Loader (CORS enabled)
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    const earthTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    const bumpTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');
    const specularTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-water.png');

    // Load authentic NASA Lunar Reconnaissance Orbiter (LRO) photographic surface texture
    nasaMoonTexture = textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/moon_1024.jpg');
    nasaMoonTexture.colorSpace = THREE.SRGBColorSpace;

    // Lighting — optimized for 3D mountain relief shadows while keeping all sides visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const sunLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight1.position.set(5, 3, 5);
    scene.add(sunLight1);

    const sunLight2 = new THREE.DirectionalLight(0xbfe3ff, 0.85);
    sunLight2.position.set(-5, -3, -3);
    scene.add(sunLight2);

    // Menu Dynamic Sweep Light
    menuLight = new THREE.DirectionalLight(0x00e5ff, 1.8);
    menuLight.position.set(-5, 2, 2);
    scene.add(menuLight);

    // Initialize Globe Group
    globeGroup = new THREE.Group();
    globeGroup.position.x = 0.5; // Shift to the right for main menu
    scene.add(globeGroup);

    // Globe Base (Ocean & Land Terrain)
    const globeGeometry = new THREE.SphereGeometry(R, 128, 128); // Increased resolution for smoother bump mapping
    const globeMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.022, // 3D mountain depth
        specularMap: specularTexture,
        specular: new THREE.Color(0x222222),
        shininess: 15
    });
    globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    globeGroup.add(globeMesh);

    // Dynamic Country Highlight Canvas & Sphere Overlay — curves perfectly around terrain
    highlightCanvas = document.createElement('canvas');
    highlightCanvas.width = 2048;
    highlightCanvas.height = 1024;
    highlightCtx = highlightCanvas.getContext('2d');

    highlightTexture = new THREE.CanvasTexture(highlightCanvas);
    highlightTexture.colorSpace = THREE.SRGBColorSpace;

    const highlightGeometry = new THREE.SphereGeometry(R + 0.003, 64, 64);
    const highlightMaterial = new THREE.MeshBasicMaterial({
        map: highlightTexture,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
    globeGroup.add(highlightMesh);

    // Atmosphere Glow
    const atmosphereGeometry = new THREE.SphereGeometry(R * 1.015, 64, 64);
    const atmosphereShader = {
        uniforms: {
            "c": { type: "f", value: 0.5 },
            "p": { type: "f", value: 3.5 },
            glowColor: { type: "c", value: new THREE.Color(0x00c8ff) },
            viewVector: { type: "v3", value: camera.position }
        },
        vertexShader: `
            uniform vec3 viewVector;
            uniform float c;
            uniform float p;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize( normalMatrix * normal );
                vec3 vNormel = normalize( normalMatrix * viewVector );
                intensity = pow( c - dot(vNormal, vNormel), p );
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4( glow, intensity );
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    };
    const atmosphereMaterial = new THREE.ShaderMaterial(atmosphereShader);
    atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // Starfield
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        const r = 50 + Math.random() * 50;
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        
        starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = r * Math.cos(phi);
        
        starSizes[i] = 0.05 + Math.random() * 0.1;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const initialRes = document.querySelector('input[name="resolution"]:checked')?.value || '1440p';

    // Create 3D Floating Moon Easter Egg using real NASA LRO photographic surface
    const moonSegs = initialRes === '4k' ? 128 : (initialRes === '1440p' ? 64 : (initialRes === '720p' ? 48 : 24));
    const moonGeo = new THREE.SphereGeometry(0.22, moonSegs, moonSegs);
    const moonMat = new THREE.MeshStandardMaterial({
        map: nasaMoonTexture,
        bumpMap: (initialRes === '4k' || initialRes === '1440p') ? nasaMoonTexture : null,
        bumpScale: initialRes === '4k' ? 0.035 : 0.018,
        roughness: 0.85,
        metalness: 0.05
    });
    moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(4.2, 1.8, -3.0);
    moonMesh.userData = { name: 'The Moon', isMoon: true };
    scene.add(moonMesh);

    updateMoonQuality(initialRes);

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('click', onClick, false);

    setupUI();
    
    // Load Data
    loadData();
}

function updatePixelRatio(mode) {
    if (mode === '4k') {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio * 3.0, 5.0));
    } else if (mode === '720p') {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio * 0.85, 1.25));
    } else if (mode === '480p') {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio * 0.5, 0.75));
    } else {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio * 1.75, 3.5));
    }
    updateMoonQuality(mode);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Data Loading ---
async function loadData() {
    try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        const topology = await response.json();
        const geojson = decodeTopoJSON(topology);
        
        const total = geojson.features.length;
        let loaded = 0;
        const loadingBar = document.getElementById('loading-bar-fill');

        // Create meshes
        geojson.features.forEach(feature => {
            const name = feature.properties.name;
            if (name && name !== 'Antarctica' && name !== 'Fr. S. Antarctic Lands') {
                const meshGroup = createCountryMesh(feature);
                meshGroup.userData.feature = feature;
                globeGroup.add(meshGroup);
                countryMeshes.set(name, meshGroup);
            }
            loaded++;
            if (loadingBar) loadingBar.style.width = `${(loaded / total) * 100}%`;
        });

        setTimeout(() => {
            document.getElementById('loading-screen')?.classList.add('hidden');
        }, 500);
        
    } catch (e) {
        console.error("Error loading TopoJSON:", e);
    }
}

// --- Interaction ---
function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const interactableMeshes = [];
    if (moonMesh) interactableMeshes.push(moonMesh);
    for (const group of countryMeshes.values()) {
        group.children.forEach(child => {
            if (child.isMesh) interactableMeshes.push(child);
        });
    }

    const intersects = raycaster.intersectObjects(interactableMeshes);

    // Check if mouse is hovering over the Moon Easter Egg
    const moonHit = intersects.find(hit => hit.object === moonMesh);
    if (moonHit) {
        document.body.style.cursor = 'pointer';
        if (!isHoveredMoon) {
            isHoveredMoon = true;
            if (hoveredCountry && hoveredCountry !== selectedCountry) {
                resetCountryStyle(hoveredCountry);
                hoveredCountry = null;
            }
            const tooltip = document.getElementById('country-tooltip');
            if (tooltip) {
                document.getElementById('tooltip-name').textContent = '🌕 The Moon';
                document.getElementById('tooltip-region').textContent = 'Earth\'s Natural Satellite (Easter Egg)';
                tooltip.classList.add('visible');
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY + 15) + 'px';
            }
        } else {
            const tooltip = document.getElementById('country-tooltip');
            if (tooltip && tooltip.classList.contains('visible')) {
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY + 15) + 'px';
            }
        }
        return;
    } else {
        if (isHoveredMoon) {
            isHoveredMoon = false;
            const tooltip = document.getElementById('country-tooltip');
            if (tooltip) tooltip.classList.remove('visible');
        }
    }

    // Filter out back-facing intersections on the far side of the planet
    const validIntersects = intersects.filter(hit => {
        const hitVec = hit.point.clone().sub(globeGroup.position);
        const camVec = camera.position.clone().sub(globeGroup.position);
        return hitVec.dot(camVec) > 0.05;
    });

    if (validIntersects.length > 0) {
        document.body.style.cursor = 'pointer';
        const object = validIntersects[0].object;
        const group = object.parent;
        
        if (hoveredCountry !== group && group !== selectedCountry) {
            const previousHovered = hoveredCountry;
            hoveredCountry = group; // Update state FIRST so resetCountryStyle clears old highlight
            
            if (previousHovered && previousHovered !== selectedCountry) {
                resetCountryStyle(previousHovered);
            }
            highlightCountry(hoveredCountry, false);
            
            const tooltip = document.getElementById('country-tooltip');
            if (tooltip) {
                const name = hoveredCountry.userData.name;
                const normName = normalizeCountryName(name);
                const data = countryData[normName] || countryData[name];
                document.getElementById('tooltip-name').textContent = name;
                document.getElementById('tooltip-region').textContent = data ? data.region : '';
                tooltip.classList.add('visible');
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY + 15) + 'px';
            }
        } else if (hoveredCountry) {
            const tooltip = document.getElementById('country-tooltip');
            if (tooltip && tooltip.classList.contains('visible')) {
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY + 15) + 'px';
            }
        }
    } else {
        document.body.style.cursor = 'default';
        if (hoveredCountry && hoveredCountry !== selectedCountry) {
            const previousHovered = hoveredCountry;
            hoveredCountry = null; // Update state FIRST to null
            resetCountryStyle(previousHovered);
        }
        const tooltip = document.getElementById('country-tooltip');
        if (tooltip) tooltip.classList.remove('visible');
    }
}

function onClick(event) {
    if (isHoveredMoon) {
        selectMoon();
    } else if (hoveredCountry) {
        selectCountry(hoveredCountry.userData.name);
    }
}

function selectMoon() {
    const tooltip = document.getElementById('country-tooltip');
    if (tooltip) tooltip.classList.remove('visible');

    if (selectedCountry) {
        const prevSelected = selectedCountry;
        selectedCountry = null;
        resetCountryStyle(prevSelected);
    }

    if (moonMesh) {
        isViewingMoon = true;
        
        // Position camera directly facing the Moon and set OrbitControls target to Moon
        const moonPos = moonMesh.position.clone();
        
        animationStartTarget.copy(controls.target);
        animationEndTarget.copy(moonPos);

        const camOffset = new THREE.Vector3(0.3, 0.2, 0.85).normalize().multiplyScalar(0.75);
        const targetCamPos = moonPos.clone().add(camOffset);

        isAnimatingCamera = true;
        animationStartTime = performance.now();
        animationStartPos.copy(camera.position);
        animationEndPos.copy(targetCamPos);
        controls.autoRotate = false;
    }

    populateDrawer('The Moon');
}

function highlightCountry(group, isSelect = false) {
    if (!group) return;
    group.children.forEach(child => {
        if (child.isLine) {
            if (child.userData.type === 'border-normal') {
                child.material.opacity = isSelect ? 1.0 : 0.85;
                child.material.color.setHex(isSelect ? 0x00ffff : 0xffffff);
            } else if (child.userData.type === 'border-bold') {
                child.visible = false;
            }
        }
    });
    updateHighlightCanvas();
}

function resetCountryStyle(group) {
    if (!group) return;
    const isBold = document.getElementById('bold-borders-toggle')?.checked ?? true;
    group.children.forEach(child => {
        if (child.isLine) {
            if (child.userData.type === 'border-normal') {
                child.material.opacity = isBold ? 0.85 : 0.45;
                child.material.color.setHex(0x000000);
            } else if (child.userData.type === 'border-bold') {
                child.visible = isBold;
                child.material.color.setHex(0x000000);
                child.material.opacity = 0.55;
            }
        }
    });
    updateHighlightCanvas();
}

// Draw country highlights onto the 2D canvas texture
function updateHighlightCanvas() {
    highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);

    // 1. Draw selected country first
    if (selectedCountry && selectedCountry.userData.feature) {
        drawCountryOnCanvas(selectedCountry.userData.feature, 'rgba(0, 229, 255, 0.42)');
    }

    // 2. Draw hovered country (if different)
    if (hoveredCountry && hoveredCountry !== selectedCountry && hoveredCountry.userData.feature) {
        drawCountryOnCanvas(hoveredCountry.userData.feature, 'rgba(0, 184, 255, 0.28)');
    }

    highlightTexture.needsUpdate = true;
}

function drawCountryOnCanvas(feature, colorString) {
    highlightCtx.fillStyle = colorString;
    
    function drawRing(ring) {
        if (!ring || ring.length === 0) return;

        // Build continuous longitude coordinates to avoid antimeridian jumps
        const adjustedCoords = [];
        let prevLng = ring[0][0];
        let currentLngOffset = 0;

        ring.forEach((coord, i) => {
            const lng = coord[0];
            const lat = coord[1];

            const diff = lng - prevLng;
            if (diff > 180) {
                currentLngOffset -= 360;
            } else if (diff < -180) {
                currentLngOffset += 360;
            }
            
            const adjustedLng = lng + currentLngOffset;
            adjustedCoords.push([adjustedLng, lat]);
            prevLng = lng;
        });

        // Render the continuous path across three wrapping offsets to cover boundary crossings
        const offsets = [-360, 0, 360];
        offsets.forEach(offset => {
            highlightCtx.beginPath();
            adjustedCoords.forEach((coord, i) => {
                const x = (((coord[0] + offset) + 180) / 360) * highlightCanvas.width;
                const y = ((90 - coord[1]) / 180) * highlightCanvas.height;
                if (i === 0) highlightCtx.moveTo(x, y);
                else highlightCtx.lineTo(x, y);
            });
            highlightCtx.closePath();
            highlightCtx.fill();
        });
    }

    if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates.forEach(ring => drawRing(ring));
    } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(poly => {
            poly.forEach(ring => drawRing(ring));
        });
    }
}

function selectCountry(name) {
    const group = countryMeshes.get(name);
    if (!group) return;

    if (isViewingMoon) {
        isViewingMoon = false; // Resume Moon movement when selecting a country
    }

    if (selectedCountry && selectedCountry !== group) {
        const previousSelected = selectedCountry;
        selectedCountry = group; // Update state FIRST
        resetCountryStyle(previousSelected);
    } else {
        selectedCountry = group;
    }
    highlightCountry(selectedCountry, true);
    
    const tooltip = document.getElementById('country-tooltip');
    if (tooltip) tooltip.classList.remove('visible');

    // Camera animation — check countryData coordinates first, fallback to 3D centroid
    const normName = normalizeCountryName(name);
    const cd = countryData[normName] || countryData[name];
    const centroid = (cd && cd.coordinates) ? cd.coordinates : selectedCountry.userData.centroid;

    if (centroid) {
        const targetPos = latLngToVector3(centroid.lat, centroid.lng, 2.0);
        
        isAnimatingCamera = true;
        animationStartTime = performance.now();
        animationStartPos.copy(camera.position);
        animationEndPos.copy(targetPos);
        
        animationStartTarget.copy(controls.target);
        animationEndTarget.set(0, 0, 0);
        
        controls.autoRotate = false;
    }

    populateDrawer(name);
}

// --- UI & Drawer ---
function setupUI() {
    // Tabs
    const tabs = document.querySelectorAll('#drawer-tabs .drawer-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            document.getElementById('tab-' + target)?.classList.add('active');
        });
    });
    // Activate first tab by default
    if (tabs.length > 0) {
        tabs[0].classList.add('active');
        document.getElementById('tab-history')?.classList.add('active');
    }

    // Close Drawer
    document.getElementById('drawer-close')?.addEventListener('click', () => {
        document.getElementById('info-drawer').classList.remove('open');
        if (selectedCountry) {
            const previousSelected = selectedCountry;
            selectedCountry = null; // Update state FIRST
            resetCountryStyle(previousSelected);
        }
        if (isViewingMoon) {
            isViewingMoon = false; // Resume Moon movement when closing drawer
            isAnimatingCamera = true;
            animationStartTime = performance.now();
            animationStartPos.copy(camera.position);
            animationEndPos.set(0, 0, 2.8);
            animationStartTarget.copy(controls.target);
            animationEndTarget.set(0, 0, 0);
        }
        const autoRotateToggle = document.getElementById('auto-rotate-toggle');
        if (autoRotateToggle && autoRotateToggle.checked) {
            controls.autoRotate = true;
        }
    });

    // Search
    const searchInput = document.getElementById('country-search');
    const searchResults = document.getElementById('search-results');
    
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            searchResults.innerHTML = '';
            
            if (query.trim() === '') {
                searchResults.classList.remove('active');
                return;
            }
            
            const results = [];
            for (const name of countryMeshes.keys()) {
                if (name.toLowerCase().includes(query)) results.push(name);
            }
            
            if (results.length > 0) {
                searchResults.classList.add('active');
                results.slice(0, 10).forEach(name => {
                    const normName = normalizeCountryName(name);
                    const cd = countryData[normName] || countryData[name];
                    const div = document.createElement('div');
                    div.className = 'search-result-item';
                    div.innerHTML = `<span class="result-name">${name}</span> <span class="result-region">${cd ? cd.region : ''}</span>`;
                    div.addEventListener('click', () => {
                        searchInput.value = '';
                        searchResults.classList.remove('active');
                        selectCountry(name);
                    });
                    searchResults.appendChild(div);
                });
            } else {
                searchResults.classList.remove('active');
            }
        });
        
        searchInput.addEventListener('blur', () => {
            setTimeout(() => searchResults.classList.remove('active'), 200);
        });
    }

    // Settings
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsClose = document.getElementById('settings-close');
    
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => settingsModal.classList.add('open'));
        settingsClose?.addEventListener('click', () => settingsModal.classList.remove('open'));
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.remove('open');
        });

        const settingsTabBtns = document.querySelectorAll('.settings-tab-btn');
        const settingsTabPanels = document.querySelectorAll('.settings-tab-panel');
        settingsTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-settings-tab');
                settingsTabBtns.forEach(b => b.classList.remove('active'));
                settingsTabPanels.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const activePanel = document.getElementById(`settings-tab-${targetTab}`);
                if (activePanel) activePanel.classList.add('active');
            });
        });

        // Main Menu Button Handlers
        const playBtn = document.getElementById('play-btn');
        const menuSettingsBtn = document.getElementById('menu-settings-btn');
        const mainMenu = document.getElementById('main-menu');
        
        if (playBtn && mainMenu) {
            playBtn.addEventListener('click', () => {
                isPlaying = true;
                mainMenu.classList.add('fade-out');
                document.body.classList.add('game-active');
                
                // Set normal rotation speed and state based on preferences toggle
                controls.autoRotateSpeed = 0.5;
                const autoRotateToggle = document.getElementById('auto-rotate-toggle');
                if (autoRotateToggle) {
                    controls.autoRotate = autoRotateToggle.checked;
                }
                
                setTimeout(() => {
                    mainMenu.classList.remove('visible');
                    mainMenu.style.display = 'none';
                }, 800);
            });
        }
        
        if (menuSettingsBtn && settingsModal) {
            menuSettingsBtn.addEventListener('click', () => {
                settingsModal.classList.add('open');
            });
        }
        
        document.querySelectorAll('input[name="resolution"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const resBadge = document.getElementById('resolution-badge');
                if (resBadge) {
                    if (e.target.value === '4k') resBadge.textContent = '4K UHD';
                    else if (e.target.value === '720p') resBadge.textContent = '720p HD';
                    else if (e.target.value === '480p') resBadge.textContent = '480p SD';
                    else resBadge.textContent = '1440p QHD';
                }
                updatePixelRatio(e.target.value);
            });
        });
        
        document.getElementById('auto-rotate-toggle')?.addEventListener('change', (e) => {
            controls.autoRotate = e.target.checked;
        });
        
        document.getElementById('atmosphere-toggle')?.addEventListener('change', (e) => {
            atmosphereMesh.visible = e.target.checked;
        });
        
        document.getElementById('borders-toggle')?.addEventListener('change', (e) => {
            for (const group of countryMeshes.values()) {
                group.children.forEach(child => {
                    if (child.isLine) child.visible = e.target.checked;
                });
            }
        });

        document.getElementById('bold-borders-toggle')?.addEventListener('change', (e) => {
            const isBold = e.target.checked;
            for (const group of countryMeshes.values()) {
                group.children.forEach(child => {
                    if (child.isLine) {
                        if (child.userData.type === 'border-normal') {
                            child.material.opacity = isBold ? 0.85 : 0.45;
                        } else if (child.userData.type === 'border-bold') {
                            child.visible = isBold;
                        }
                    }
                });
            }
        });

        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const isLight = e.target.value === 'light';
                if (isLight) {
                    document.body.classList.add('light-mode');
                    scene.background.setHex(0xf4f7fa);
                    if (stars) stars.visible = false;
                } else {
                    document.body.classList.remove('light-mode');
                    scene.background.setHex(0x050811);
                    if (stars) stars.visible = true;
                }
            });
        });
        
        const sensitivitySlider = document.getElementById('sensitivity-slider');
        const sensitivityValue = document.getElementById('sensitivity-value');
        if (sensitivitySlider) {
            sensitivitySlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                controls.rotateSpeed = val;
                if (sensitivityValue) {
                    sensitivityValue.textContent = `${val.toFixed(1)}x`;
                }
            });
        }

        const glowSlider = document.getElementById('glow-slider');
        const glowValue = document.getElementById('glow-value');
        if (glowSlider) {
            glowSlider.addEventListener('input', (e) => {
                const valPercent = parseInt(e.target.value, 10);
                const val = valPercent / 100.0;
                if (atmosphereMesh && atmosphereMesh.material && atmosphereMesh.material.uniforms) {
                    atmosphereMesh.material.uniforms.c.value = val;
                }
                if (glowValue) {
                    glowValue.textContent = `${valPercent}%`;
                }
            });
        }
    }
}

const countryIsoMap = {
    'United States of America': 'us',
    'Canada': 'ca',
    'Brazil': 'br',
    'Argentina': 'ar',
    'Mexico': 'mx',
    'United Kingdom': 'gb',
    'France': 'fr',
    'Germany': 'de',
    'Italy': 'it',
    'Spain': 'es',
    'Russia': 'ru',
    'China': 'cn',
    'India': 'in',
    'Japan': 'jp',
    'South Korea': 'kr',
    'Australia': 'au',
    'Egypt': 'eg',
    'South Africa': 'za',
    'Nigeria': 'ng',
    'Kenya': 'ke',
    'Saudi Arabia': 'sa',
    'Turkey': 'tr',
    'Indonesia': 'id',
    'Thailand': 'th',
    'Vietnam': 'vn',
    'Poland': 'pl',
    'Ukraine': 'ua',
    'Norway': 'no',
    'Sweden': 'se',
    'Pakistan': 'pk',
    'Bangladesh': 'bd',
    'Iran': 'ir',
    'Iraq': 'iq',
    'Colombia': 'co',
    'Peru': 'pe',
    'Chile': 'cl',
    'Fiji': 'fj',
    'New Zealand': 'nz',
    'Papua New Guinea': 'pg',
    'Solomon Islands': 'sb',
    'Solomon Is.': 'sb',
    'Vanuatu': 'vu',
    'Samoa': 'ws',
    'Tonga': 'to',
    'Kiribati': 'ki',
    'Micronesia': 'fm',
    'Federated States of Micronesia': 'fm',
    'Palau': 'pw',
    'Marshall Islands': 'mh',
    'Marshall Is.': 'mh',
    'Nauru': 'nr',
    'Tuvalu': 'tv',
    'New Caledonia': 'nc',
    'N. Caledonia': 'nc',
    'French Polynesia': 'pf',
    'Guam': 'gu',
    'American Samoa': 'as',
    'Cook Islands': 'ck',
    'Morocco': 'ma',
    'Ethiopia': 'et',
    'Democratic Republic of the Congo': 'cd',
    'Dem. Rep. Congo': 'cd',
    'Algeria': 'dz',
    'Switzerland': 'ch',
    'Netherlands': 'nl',
    'Singapore': 'sg',
    'Malaysia': 'my',
    'Philippines': 'ph',
    'United Arab Emirates': 'ae',
    'Greece': 'gr',
    'Portugal': 'pt',
    'Angola': 'ao',
    'Benin': 'bj',
    'Botswana': 'bw',
    'Burkina Faso': 'bf',
    'Burundi': 'bi',
    'Cameroon': 'cm',
    'Central African Republic': 'cf',
    'Central African Rep.': 'cf',
    'Chad': 'td',
    'Congo': 'cg',
    'Republic of the Congo': 'cg',
    'Djibouti': 'dj',
    'Equatorial Guinea': 'gq',
    'Eq. Guinea': 'gq',
    'Eritrea': 'er',
    'Eswatini': 'sz',
    'Swaziland': 'sz',
    'Gabon': 'ga',
    'Gambia': 'gm',
    'Ghana': 'gh',
    'Guinea': 'gn',
    'Guinea-Bissau': 'gw',
    'Ivory Coast': 'ci',
    "Côte d'Ivoire": 'ci',
    "Cote d'Ivoire": 'ci',
    'Lesotho': 'ls',
    'Liberia': 'lr',
    'Libya': 'ly',
    'Madagascar': 'mg',
    'Malawi': 'mw',
    'Mali': 'ml',
    'Mauritania': 'mr',
    'Mozambique': 'mz',
    'Namibia': 'na',
    'Niger': 'ne',
    'Rwanda': 'rw',
    'Senegal': 'sn',
    'Sierra Leone': 'sl',
    'Somalia': 'so',
    'South Sudan': 'ss',
    'S. Sudan': 'ss',
    'Sudan': 'sd',
    'Tanzania': 'tz',
    'Togo': 'tg',
    'Tunisia': 'tn',
    'Uganda': 'ug',
    'Zambia': 'zm',
    'Zimbabwe': 'zw',
    'Afghanistan': 'af',
    'Albania': 'al',
    'Armenia': 'am',
    'Austria': 'at',
    'Azerbaijan': 'az',
    'Belarus': 'by',
    'Belgium': 'be',
    'Bosnia and Herzegovina': 'ba',
    'Bosnia and Herz.': 'ba',
    'Bulgaria': 'bg',
    'Cambodia': 'kh',
    'Croatia': 'hr',
    'Czechia': 'cz',
    'Czech Rep.': 'cz',
    'Czech Republic': 'cz',
    'Denmark': 'dk',
    'Estonia': 'ee',
    'Finland': 'fi',
    'Georgia': 'ge',
    'Hungary': 'hu',
    'Ireland': 'ie',
    'Israel': 'il',
    'Jordan': 'jo',
    'Kazakhstan': 'kz',
    'Kuwait': 'kw',
    'Kyrgyzstan': 'kg',
    'Laos': 'la',
    'Latvia': 'lv',
    'Lebanon': 'lb',
    'Lithuania': 'lt',
    'North Macedonia': 'mk',
    'Macedonia': 'mk',
    'Moldova': 'md',
    'Mongolia': 'mn',
    'Montenegro': 'me',
    'Myanmar': 'mm',
    'Nepal': 'np',
    'North Korea': 'kp',
    'Dem. Rep. Korea': 'kp',
    'Oman': 'om',
    'Qatar': 'qa',
    'Romania': 'ro',
    'Serbia': 'rs',
    'Slovakia': 'sk',
    'Slovenia': 'si',
    'Sri Lanka': 'lk',
    'Syria': 'sy',
    'Taiwan': 'tw',
    'Tajikistan': 'tj',
    'Turkmenistan': 'tm',
    'Uzbekistan': 'uz',
    'Yemen': 'ye',
    'Cyprus': 'cy',
    'Bahamas': 'bs',
    'Belize': 'bz',
    'Bolivia': 'bo',
    'Costa Rica': 'cr',
    'Cuba': 'cu',
    'Dominican Republic': 'do',
    'Dominican Rep.': 'do',
    'Ecuador': 'ec',
    'El Salvador': 'sv',
    'Guatemala': 'gt',
    'Guyana': 'gy',
    'Haiti': 'ht',
    'Honduras': 'hn',
    'Jamaica': 'jm',
    'Nicaragua': 'ni',
    'Panama': 'pa',
    'Paraguay': 'py',
    'Suriname': 'sr',
    'Trinidad and Tobago': 'tt',
    'Trinidad & Tobago': 'tt',
    'Uruguay': 'uy',
    'Venezuela': 've',
    'Greenland': 'gl'
};

function normalizeCountryName(name) {
    if (!name) return '';
    if (name === 'Dem. Rep. Congo' || name === 'Democratic Republic of the Congo') return 'Democratic Republic of the Congo';
    if (name === 'Central African Rep.' || name === 'Central African Republic') return 'Central African Republic';
    if (name === 'Eq. Guinea' || name === 'Equatorial Guinea') return 'Equatorial Guinea';
    if (name === 'S. Sudan' || name === 'South Sudan') return 'South Sudan';
    if (name === 'Swaziland' || name === 'Eswatini') return 'Eswatini';
    if (name === 'Côte d\'Ivoire' || name === 'Ivory Coast' || name === "Cote d'Ivoire") return 'Ivory Coast';
    if (name === 'Dem. Rep. Korea' || name === 'North Korea') return 'North Korea';
    if (name === 'Bosnia and Herz.' || name === 'Bosnia and Herzegovina') return 'Bosnia and Herzegovina';
    if (name === 'Czech Rep.' || name === 'Czechia' || name === 'Czech Republic') return 'Czechia';
    if (name === 'Macedonia' || name === 'North Macedonia') return 'North Macedonia';
    if (name === 'Dominican Rep.' || name === 'Dominican Republic') return 'Dominican Republic';
    if (name === 'Trinidad & Tobago' || name === 'Trinidad and Tobago') return 'Trinidad and Tobago';
    return name;
}

function populateDrawer(countryName) {
    const normName = normalizeCountryName(countryName);
    const data = countryData[normName] || countryData[countryName];
    const drawer = document.getElementById('info-drawer');
    
    if (!drawer) return;
    
    if (data) {
        // Find flag ISO based on either the display name or normalized name
        const iso = countryIsoMap[normName] || countryIsoMap[countryName];
        if (iso) {
            document.getElementById('drawer-country-flag').innerHTML = `<img src="https://flagcdn.com/w80/${iso}.png" alt="${countryName} Flag" class="country-flag-img">`;
        } else {
            document.getElementById('drawer-country-flag').innerHTML = `<span style="font-size: 32px;">${data.flag || '🏳️'}</span>`;
        }
        document.getElementById('drawer-country-name').textContent = countryName;
        document.getElementById('drawer-country-subtitle').textContent = data.region || 'Unknown Region';
        
        // History Tab
        let historyHTML = '';
        if (data.history && data.history.timeline) {
            historyHTML += '<div class="timeline">';
            data.history.timeline.forEach(item => {
                historyHTML += `
                    <div class="timeline-item">
                        <div class="timeline-year">${item.year}</div>
                        <div class="timeline-content">${item.event}</div>
                    </div>
                `;
            });
            historyHTML += '</div>';
        }
        document.getElementById('tab-history').innerHTML = `
            ${data.history?.content || ''}
            ${historyHTML}
        `;
        
        // Demographics
        const dStats = data.demographics?.stats || {};
        document.getElementById('tab-demographics').innerHTML = `
            <div class="stat-grid">
                <div class="stat-card"><div class="stat-value">${dStats.population || 'N/A'}</div><div class="stat-label">Population</div></div>
                <div class="stat-card"><div class="stat-value">${dStats.gdp || 'N/A'}</div><div class="stat-label">GDP</div></div>
                <div class="stat-card"><div class="stat-value">${dStats.capital || 'N/A'}</div><div class="stat-label">Capital</div></div>
                <div class="stat-card"><div class="stat-value">${dStats.government || 'N/A'}</div><div class="stat-label">Government</div></div>
            </div>
            ${data.demographics?.content || ''}
        `;
        
        // Geography
        const gStats = data.geography?.stats || {};
        document.getElementById('tab-geography').innerHTML = `
            <div class="stat-grid">
                <div class="stat-card"><div class="stat-value">${gStats.area || 'N/A'}</div><div class="stat-label">Area</div></div>
                <div class="stat-card"><div class="stat-value">${gStats.continent || 'N/A'}</div><div class="stat-label">Continent</div></div>
                <div class="stat-card"><div class="stat-value">${gStats.climate || 'N/A'}</div><div class="stat-label">Climate</div></div>
                <div class="stat-card"><div class="stat-value">${gStats.borders || 'N/A'}</div><div class="stat-label">Borders</div></div>
            </div>
            ${data.geography?.content || ''}
        `;
        
        // Culture
        const langs = data.culture?.languages || [];
        const highlights = data.culture?.highlights || [];
        document.getElementById('tab-culture').innerHTML = `
            <div><strong>Languages:</strong> <div class="tag-list">${langs.map(l => `<span class="tag">${l}</span>`).join('')}</div></div>
            <div style="margin-top: 10px;"><strong>Currency:</strong> ${data.culture?.currency || 'N/A'}</div>
            <p style="margin-top: 15px;">${data.culture?.content || ''}</p>
            <div><strong>Highlights:</strong> <div class="tag-list">${highlights.map(h => `<span class="tag">${h}</span>`).join('')}</div></div>
        `;
        
    } else {
        document.getElementById('drawer-country-flag').innerHTML = '🏳️';
        document.getElementById('drawer-country-name').textContent = countryName;
        document.getElementById('drawer-country-subtitle').textContent = 'Unknown Region';
        
        const noDataHTML = `<p style="font-style: italic; opacity: 0.75;">Detailed information coming soon for ${countryName}.</p>`;
        document.getElementById('tab-history').innerHTML = noDataHTML;
        document.getElementById('tab-demographics').innerHTML = noDataHTML;
        document.getElementById('tab-geography').innerHTML = noDataHTML;
        document.getElementById('tab-culture').innerHTML = noDataHTML;
    }
    
    drawer.classList.add('open');
}


// --- Animation Loop ---
let lastTime = performance.now();
let frames = 0;

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    frames++;
    if (time >= lastTime + 500) {
        const fps = Math.round((frames * 1000) / (time - lastTime));
        const fpsCounter = document.getElementById('fps-counter');
        if (fpsCounter) fpsCounter.textContent = `FPS: ${fps}`;
        frames = 0;
        lastTime = time;
    }

    // Globe position transition to center after play is clicked
    if (isPlaying && globeGroup && globeGroup.position.x > 0.0) {
        globeGroup.position.x = THREE.MathUtils.lerp(globeGroup.position.x, 0.0, 0.06);
        if (globeGroup.position.x < 0.001) globeGroup.position.x = 0.0;
    }

    // Sweeping cyan light in main menu, fading out in game mode
    if (!isPlaying) {
        const lightTime = time * 0.0008;
        if (menuLight) {
            menuLight.position.x = Math.sin(lightTime) * 6;
            menuLight.position.z = Math.cos(lightTime) * 6;
        }
    } else {
        if (menuLight && menuLight.intensity > 0) {
            menuLight.intensity = Math.max(0, menuLight.intensity - 0.03);
        }
    }

    // Orbit Moon slowly in space background (pauses when inspecting Moon)
    if (moonMesh) {
        if (!isViewingMoon) {
            moonMesh.rotation.y += 0.003;
            const moonOrbit = time * 0.00012;
            moonMesh.position.x = Math.cos(moonOrbit) * 4.6;
            moonMesh.position.z = Math.sin(moonOrbit) * 4.6;
            moonMesh.position.y = 1.4 + Math.sin(moonOrbit * 2) * 0.35;
        } else {
            // Gently spin on its axis for close inspection while paused in space
            moonMesh.rotation.y += 0.004;
        }
    }

    if (isAnimatingCamera) {
        const elapsed = time - animationStartTime;
        let t = Math.min(elapsed / ANIMATION_DURATION, 1.0);
        t = t * t * (3 - 2 * t); // Smooth step
        
        camera.position.lerpVectors(animationStartPos, animationEndPos, t);
        controls.target.lerpVectors(animationStartTarget, animationEndTarget, t);
        controls.update();
        
        if (t >= 1.0) {
            isAnimatingCamera = false;
            const autoRotateToggle = document.getElementById('auto-rotate-toggle');
            if (autoRotateToggle && autoRotateToggle.checked && !document.getElementById('info-drawer').classList.contains('open')) {
                controls.autoRotate = true;
            }
        }
    }

    controls.update();

    if (stars) {
        stars.rotation.y += 0.0002;
    }

    if (atmosphereMesh && atmosphereMesh.material.uniforms) {
        atmosphereMesh.material.uniforms.viewVector.value.copy(camera.position);
    }

    renderer.render(scene, camera);
}

// Start
init();
animate();
