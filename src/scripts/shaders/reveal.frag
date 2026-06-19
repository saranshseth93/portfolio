precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_mouse;     // normalised pointer, x = -1 when absent
uniform float u_radius;   // reveal radius in uv units
uniform int u_theme;      // 0 midnight, 1 pixel, 2 blueprint
uniform vec2 u_res;       // canvas pixel size

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Themed treatment generated in-shader so it matches the static CSS look per theme.
vec3 treat(vec2 uv, float g) {
  if (u_theme == 1) {
    // Pixel: quantise to a green / amber phosphor ramp.
    float q = floor(g * 4.0) / 3.0;
    vec3 green = vec3(0.36, 0.90, 0.36);
    vec3 amber = vec3(1.0, 0.69, 0.0);
    return mix(green, amber, step(0.7, g)) * (0.25 + 0.75 * q);
  } else if (u_theme == 2) {
    // Blueprint: cyan duotone, dark blue shadows to bright cyan highlights.
    vec3 lo = vec3(0.04, 0.12, 0.22);
    vec3 hi = vec3(0.31, 0.76, 0.97);
    return mix(lo, hi, pow(g, 0.85));
  }
  // Midnight: clean B&W with a slight contrast lift.
  return vec3(clamp((g - 0.5) * 1.08 + 0.5, 0.0, 1.0));
}

void main() {
  vec4 src = texture2D(u_tex, v_uv);
  float g = luma(src.rgb);
  vec3 treated = treat(v_uv, g);
  vec3 original = vec3(g); // the real B&W photo underneath

  float reveal = 0.0;
  if (u_mouse.x > -0.5) {
    // Correct for aspect so the reveal stays circular, not oval.
    vec2 d = v_uv - u_mouse;
    d.x *= u_res.x / u_res.y;
    float dist = length(d);
    reveal = 1.0 - smoothstep(u_radius * 0.55, u_radius, dist);
  }

  vec3 col = mix(treated, original, reveal);
  gl_FragColor = vec4(col * src.a, src.a);
}
