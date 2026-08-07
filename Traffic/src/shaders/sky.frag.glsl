// Atmospheric scattering sky shader
// Based on Bruneton's precomputed atmospheric scattering (simplified)
varying vec3 vWorldPosition;
varying vec2 vUv;

uniform vec3 sunPosition;
uniform float sunIntensity;
uniform vec3 rayleighCoeff;
uniform float mieCoeff;
uniform float mieDirectionalG;
uniform float time;

const float PI = 3.14159265359;
const float n = 1.0003; // refractive index of air
const float N = 2.545e25; // molecules per unit volume

// Rayleigh phase function
float rayleighPhase(float cosAngle) {
  return (3.0 / (16.0 * PI)) * (1.0 + cosAngle * cosAngle);
}

// Mie phase function (Henyey-Greenstein)
float miePhase(float cosAngle) {
  float g2 = mieDirectionalG * mieDirectionalG;
  return (1.0 - g2) / (4.0 * PI * pow(1.0 + g2 - 2.0 * mieDirectionalG * cosAngle, 1.5));
}

void main() {
  vec3 direction = normalize(vWorldPosition);
  
  // Sun elevation (-1 to 1)
  float sunElevation = dot(direction, normalize(sunPosition));
  float cosAngle = dot(direction, normalize(sunPosition));
  
  // Atmospheric scattering
  float rayleigh = rayleighPhase(cosAngle);
  float mie = miePhase(cosAngle);
  
  // Color based on sun position
  vec3 skyColor = rayleighCoeff * rayleigh * vec3(0.3, 0.5, 1.0);
  skyColor += mieCoeff * mie * vec3(1.0, 0.9, 0.7) * sunIntensity;
  
  // Horizon gradient
  float horizon = smoothstep(-0.1, 0.3, direction.y);
  vec3 horizonColor = mix(
    vec3(0.8, 0.7, 0.6), // warm horizon
    vec3(0.2, 0.4, 0.8), // blue zenith
    horizon
  );
  
  // Night/day blend
  float dayFactor = smoothstep(-0.2, 0.3, normalize(sunPosition).y);
  vec3 nightSky = vec3(0.02, 0.02, 0.05);
  vec3 daySky = mix(horizonColor, skyColor * 0.5 + horizonColor * 0.5, sunIntensity);
  
  vec3 finalColor = mix(nightSky, daySky, dayFactor);
  
  // Sun disc
  float sunDisc = smoothstep(0.9995, 0.9999, sunElevation);
  finalColor += vec3(1.0, 0.95, 0.8) * sunDisc * sunIntensity * 2.0;
  
  // Sun glow
  float sunGlow = pow(max(sunElevation, 0.0), 8.0) * 0.3;
  finalColor += vec3(1.0, 0.7, 0.3) * sunGlow * dayFactor;
  
  // Clouds (simple procedural)
  float cloudNoise = sin(direction.x * 5.0 + time * 0.01) * cos(direction.z * 3.0 + time * 0.005);
  cloudNoise = smoothstep(0.3, 0.7, cloudNoise * 0.5 + 0.5);
  float cloudMask = cloudNoise * smoothstep(0.0, 0.4, direction.y) * dayFactor;
  finalColor = mix(finalColor, vec3(0.9, 0.9, 0.95), cloudMask * 0.4);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
