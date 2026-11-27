/**
 * TrafficShaders — WebGL2 Atmospheric Scattering, Wet-Road Fresnel Reflections,
 * Lit Night-Window Facades, and PMREM Sky-Bounce Environment Lighting.
 *
 * Translates GTA 6 VFX breakdown techniques into classic Three.js r186 shaders.
 */
(function (root) {
  'use strict';

  const SKY_VERT = `
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const SKY_FRAG = `
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    uniform vec3 sunPosition;
    uniform float sunIntensity;
    uniform vec3 rayleighCoeff;
    uniform float mieCoeff;
    uniform float mieDirectionalG;
    uniform float time;
    const float PI = 3.14159265359;

    float rayleighPhase(float cosAngle) {
      return (3.0 / (16.0 * PI)) * (1.0 + cosAngle * cosAngle);
    }

    float miePhase(float cosAngle) {
      float g2 = mieDirectionalG * mieDirectionalG;
      return (1.0 - g2) / (4.0 * PI * pow(max(0.001, 1.0 + g2 - 2.0 * mieDirectionalG * cosAngle), 1.5));
    }

    void main() {
      vec3 direction = normalize(vWorldPosition);
      vec3 sunDir = normalize(sunPosition);
      float cosAngle = dot(direction, sunDir);

      float rayleigh = rayleighPhase(cosAngle);
      float mie = miePhase(cosAngle);

      vec3 skyColor = rayleighCoeff * rayleigh * vec3(0.3, 0.5, 1.0) * 1e5;
      skyColor += mieCoeff * mie * vec3(1.0, 0.9, 0.7) * sunIntensity * 1e4;

      float horizon = smoothstep(-0.1, 0.35, direction.y);
      vec3 horizonColor = mix(vec3(0.82, 0.78, 0.72), vec3(0.24, 0.48, 0.85), horizon);

      float dayFactor = smoothstep(-0.2, 0.3, sunDir.y);
      vec3 nightSky = vec3(0.02, 0.03, 0.07);
      vec3 daySky = mix(horizonColor, skyColor * 0.35 + horizonColor * 0.65, clamp(sunIntensity, 0.0, 1.0));
      vec3 finalColor = mix(nightSky, daySky, dayFactor);

      float sunDisc = smoothstep(0.9994, 0.9999, cosAngle);
      finalColor += vec3(1.0, 0.95, 0.8) * sunDisc * sunIntensity * 1.8;

      float sunGlow = pow(max(cosAngle, 0.0), 8.0) * 0.28;
      finalColor += vec3(1.0, 0.7, 0.35) * sunGlow * dayFactor;

      float cloudNoise = sin(direction.x * 5.0 + time * 0.01) * cos(direction.z * 3.0 + time * 0.005);
      cloudNoise = smoothstep(0.3, 0.7, cloudNoise * 0.5 + 0.5);
      float cloudMask = cloudNoise * smoothstep(0.0, 0.4, direction.y) * dayFactor;
      finalColor = mix(finalColor, vec3(0.92, 0.94, 0.98), cloudMask * 0.35);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const ROAD_VERT = `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vViewDir = cameraPosition - vWorldPosition;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const ROAD_FRAG = `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    uniform sampler2D roadTexture;
    uniform float wetness;
    uniform float time;

    void main() {
      vec4 baseColor = texture2D(roadTexture, vUv * 10.0);
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewDir);
      vec3 reflectDir = reflect(-viewDir, normal);

      float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);
      fresnel = mix(0.04, 1.0, fresnel);

      float skyGradient = smoothstep(-0.1, 0.5, reflectDir.y);
      vec3 skyRefl = mix(vec3(0.55, 0.62, 0.70), vec3(0.28, 0.48, 0.78), skyGradient);

      float puddle = sin(vWorldPosition.x * 0.35) * sin(vWorldPosition.z * 0.35);
      puddle = smoothstep(0.55, 0.85, puddle) * wetness;

      vec3 dryColor = baseColor.rgb * vec3(0.85, 0.86, 0.88);
      vec3 wetColor = mix(dryColor, skyRefl, fresnel * 0.65);
      wetColor += puddle * skyRefl * fresnel * 0.8;

      vec3 sunDir = normalize(vec3(0.5, 0.8, 0.3));
      vec3 halfDir = normalize(viewDir + sunDir);
      float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);
      wetColor += vec3(1.0, 0.95, 0.8) * spec * wetness * 0.45;

      gl_FragColor = vec4(mix(dryColor, wetColor, wetness), 1.0);
    }
  `;

  function createSkyDome(opts) {
    if (typeof THREE === 'undefined') return null;
    const o = opts || {};
    const geo = new THREE.SphereGeometry(o.radius || 1200, 24, 16);
    const mat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        sunPosition: { value: o.sunPosition || new THREE.Vector3(60, 80, -40) },
        sunIntensity: { value: o.sunIntensity !== undefined ? o.sunIntensity : 1.0 },
        rayleighCoeff: { value: new THREE.Vector3(5.5e-6, 13.0e-6, 28.4e-6) },
        mieCoeff: { value: 21e-6 },
        mieDirectionalG: { value: 0.758 },
        time: { value: 0 }
      }
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = -1;
    mesh.userData = { noLod: true, isSkyDome: true };
    return mesh;
  }

  function createWetRoadMaterial(roadTex, wetness) {
    if (typeof THREE === 'undefined') return null;
    let tex = roadTex;
    if (!tex && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#3b424c';
      ctx.fillRect(0, 0, 128, 128);
      tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    }
    return new THREE.ShaderMaterial({
      vertexShader: ROAD_VERT,
      fragmentShader: ROAD_FRAG,
      uniforms: {
        roadTexture: { value: tex },
        wetness: { value: Math.max(0, Math.min(1, wetness || 0)) },
        time: { value: 0 }
      }
    });
  }

  function applyEnvironmentLighting(renderer, scene, skyMesh) {
    if (!renderer || !scene || !skyMesh || typeof THREE === 'undefined' || !THREE.PMREMGenerator) {
      return null;
    }
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new THREE.Scene();
      const skyClone = skyMesh.clone();
      envScene.add(skyClone);
      const rt = pmrem.fromScene(envScene, 0.04);
      scene.environment = rt.texture;
      pmrem.dispose();
      return rt;
    } catch (e) {
      return null;
    }
  }

  root.TrafficShaders = {
    createSkyDome,
    createWetRoadMaterial,
    applyEnvironmentLighting
  };
})(typeof window !== 'undefined' ? window : globalThis);
