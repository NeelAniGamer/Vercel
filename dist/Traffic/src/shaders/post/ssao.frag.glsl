// SSAO - Screen Space Ambient Occlusion
varying vec2 vUv;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform vec2 resolution;
uniform float radius;
uniform float bias;
uniform int samples;

const int MAX_SAMPLES = 16;
uniform vec3 sampleKernel[MAX_SAMPLES];

float getDepth(vec2 uv) {
  return texture2D(tDepth, uv).r;
}

vec3 getNormal(vec2 uv) {
  return normalize(texture2D(tNormal, uv).xyz * 2.0 - 1.0);
}

void main() {
  vec2 texelSize = 1.0 / resolution;
  float depth = getDepth(vUv);
  vec3 normal = getNormal(vUv);
  vec3 position = vec3(vUv, depth);
  
  float occlusion = 0.0;
  
  for (int i = 0; i < MAX_SAMPLES; i++) {
    if (i >= samples) break;
    
    vec3 samplePos = position + sampleKernel[i] * radius;
    float sampleDepth = getDepth(samplePos.xy);
    
    float rangeCheck = smoothstep(0.0, 1.0, radius / abs(depth - sampleDepth));
    occlusion += (sampleDepth <= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
  }
  
  occlusion = 1.0 - (occlusion / float(samples));
  
  gl_FragColor = vec4(vec3(occlusion), 1.0);
}
