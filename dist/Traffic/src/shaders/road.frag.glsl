// Wet road shader with reflections and puddles
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewDir;

uniform sampler2D roadTexture;
uniform sampler2D normalMap;
uniform vec3 cameraPosition;
uniform float wetness; // 0 = dry, 1 = fully wet
uniform float time;

void main() {
  vec4 baseColor = texture2D(roadTexture, vUv * 10.0);
  
  // Normal mapping for surface detail
  vec3 normal = normalize(vNormal);
  vec3 tangent = normalize(cross(normal, vec3(0.0, 0.0, 1.0)));
  vec3 bitangent = cross(normal, tangent);
  mat3 TBN = mat3(tangent, bitangent, normal);
  
  vec3 normalSample = texture2D(normalMap, vUv * 20.0).rgb * 2.0 - 1.0;
  normal = normalize(TBN * normalSample);
  
  // Reflection
  vec3 viewDir = normalize(vViewDir);
  vec3 reflectDir = reflect(-viewDir, normal);
  
  // Fresnel effect (stronger at grazing angles)
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);
  fresnel = mix(0.04, 1.0, fresnel);
  
  // Sky reflection color (simplified)
  float skyGradient = smoothstep(-0.1, 0.5, reflectDir.y);
  vec3 skyRefl = mix(vec3(0.6, 0.65, 0.7), vec3(0.3, 0.5, 0.8), skyGradient);
  
  // Puddle mask (procedural based on UV)
  float puddle = sin(vUv.x * 50.0) * sin(vUv.y * 50.0);
  puddle = smoothstep(0.7, 0.9, puddle) * wetness;
  
  // Combine
  vec3 dryColor = baseColor.rgb * vec3(0.4, 0.4, 0.42); // asphalt grey
  vec3 wetColor = mix(dryColor, skyRefl, fresnel * 0.7);
  wetColor += puddle * skyRefl * fresnel;
  
  // Specular highlight from sun
  vec3 sunDir = normalize(vec3(0.5, 0.8, 0.3));
  vec3 halfDir = normalize(viewDir + sunDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);
  wetColor += vec3(1.0, 0.95, 0.8) * spec * wetness * 0.5;
  
  vec3 finalColor = mix(dryColor, wetColor, wetness);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
