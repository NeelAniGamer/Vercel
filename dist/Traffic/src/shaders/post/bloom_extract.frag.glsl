// Bloom extraction - bright pass filter
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float threshold;
uniform float softKnee;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  float brightness = max(color.r, max(color.g, color.b));
  
  float knee = threshold * softKnee;
  float soft = brightness - threshold + knee;
  soft = clamp(soft, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 0.00001);
  
  float contribution = max(soft, brightness - threshold);
  contribution /= max(brightness, 0.00001);
  
  gl_FragColor = vec4(color.rgb * contribution, color.a);
}
