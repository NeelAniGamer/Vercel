// Final composite - combines all post-processing
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tBloom;
uniform sampler2D tSSAO;
uniform float bloomIntensity;
uniform float ssaoIntensity;
uniform float exposure;
uniform float contrast;
uniform float saturation;
uniform vec3 colorGradeShadows;
uniform vec3 colorGradeHighlights;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  
  // Add bloom
  vec4 bloom = texture2D(tBloom, vUv);
  color.rgb += bloom.rgb * bloomIntensity;
  
  // Apply SSAO
  float ao = texture2D(tSSAO, vUv).r;
  color.rgb *= mix(1.0, ao, ssaoIntensity);
  
  // Exposure
  color.rgb *= exposure;
  
  // Contrast
  color.rgb = (color.rgb - 0.5) * contrast + 0.5;
  
  // Saturation
  float grey = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  color.rgb = mix(vec3(grey), color.rgb, saturation);
  
  // Color grading
  float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 graded = mix(colorGradeShadows, colorGradeHighlights, luminance);
  color.rgb *= graded;
  
  // Tone mapping (ACES approximation)
  color.rgb = (color.rgb * (2.51 * color.rgb + 0.03)) / (color.rgb * (2.43 * color.rgb + 0.59) + 0.14);
  
  // Gamma correction
  color.rgb = pow(color.rgb, vec3(1.0 / 2.2));
  
  gl_FragColor = vec4(color.rgb, 1.0);
}
