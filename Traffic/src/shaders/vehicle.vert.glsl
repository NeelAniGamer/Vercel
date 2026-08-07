varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewDir;

uniform vec3 cameraPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vViewDir = cameraPosition - vWorldPosition;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
