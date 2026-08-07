// Building shader with animated windows and baked AO
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

uniform vec3 buildingColor;
uniform vec3 windowColor;
uniform float windowDensity;
uniform float time;
uniform float nightFactor; // 0 = day, 1 = night

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec3 normal = normalize(vNormal);
  
  // Base building color
  vec3 baseColor = buildingColor;
  
  // Window pattern
  vec2 windowUv = vUv * vec2(8.0, 20.0) * windowDensity;
  vec2 id = floor(windowUv);
  vec2 gf = fract(windowUv);
  
  // Window border
  float border = step(0.1, gf.x) * step(gf.x, 0.9) * step(0.1, gf.y) * step(gf.y, 0.9);
  
  // Window light (random on/off, brighter at night)
  float r = random(id);
  float windowOn = step(0.4, r);
  float flicker = 1.0 - step(0.98, r) * abs(sin(time * 3.0 + r * 10.0)) * 0.5;
  
  vec3 windowLit = windowColor * windowOn * flicker * (0.3 + nightFactor * 0.7);
  vec3 windowOff = vec3(0.05, 0.05, 0.08);
  
  vec3 windowFinal = mix(windowOff, windowLit, border);
  
  // Mix building facade with windows
  vec3 facade = baseColor * vec3(0.7, 0.7, 0.75);
  float windowMask = border * windowDensity;
  vec3 finalColor = mix(facade, windowFinal, windowMask);
  
  // Simple lighting
  vec3 sunDir = normalize(vec3(0.5, 0.8, 0.3));
  float NdotL = max(dot(normal, sunDir), 0.0);
  finalColor *= (0.4 + NdotL * 0.6);
  
  // Night darkening
  finalColor *= (1.0 - nightFactor * 0.3);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
