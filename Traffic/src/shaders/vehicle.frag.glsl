// Vehicle shader with car paint, glass, and chrome
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewDir;

uniform vec3 paintColor;
uniform float metalness;
uniform float roughness;
uniform float clearcoat;
uniform vec3 cameraPosition;
uniform vec3 sunDirection;
uniform vec3 sunColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewDir);
  
  // Base paint color
  vec3 baseColor = paintColor;
  
  // Metallic flake effect
  float flake = sin(vUv.x * 200.0) * sin(vUv.y * 200.0) * 0.02;
  baseColor += flake * metalness;
  
  // Diffuse lighting
  float NdotL = max(dot(normal, sunDirection), 0.0);
  vec3 diffuse = baseColor * sunColor * NdotL;
  
  // Specular (Blinn-Phong)
  vec3 halfDir = normalize(viewDir + sunDirection);
  float NdotH = max(dot(normal, halfDir), 0.0);
  float specPower = mix(16.0, 256.0, 1.0 - roughness);
  vec3 specular = sunColor * pow(NdotH, specPower) * (1.0 - roughness);
  
  // Clearcoat reflection (Fresnel)
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);
  vec3 clearcoatReflect = sunColor * fresnel * clearcoat * 0.5;
  
  // Ambient
  vec3 ambient = baseColor * vec3(0.1, 0.12, 0.15);
  
  vec3 finalColor = ambient + diffuse + specular * metalness + clearcoatReflect;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
