precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_mouse;     // reveal centre in uv space
uniform float u_radius;   // reveal radius in uv units
uniform int u_theme;      // 0 midnight, 1 pixel, 2 blueprint
uniform vec2 u_res;       // canvas pixel size
uniform float u_time;     // seconds

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Themed treatment generated in-shader, with a little life per theme.
vec3 treat(vec2 uv, float g) {
  if (u_theme == 1) {
    // Pixel: quantise to a green / amber phosphor ramp, plus a drifting scanline.
    float q = floor(g * 4.0) / 3.0;
    vec3 green = vec3(0.36, 0.90, 0.36);
    vec3 amber = vec3(1.0, 0.69, 0.0);
    vec3 col = mix(green, amber, step(0.7, g)) * (0.25 + 0.75 * q);
    float scan = 0.92 + 0.08 * sin(uv.y * u_res.y * 0.5 - u_time * 6.0);
    return col * scan;
  } else if (u_theme == 2) {
    // Blueprint: cyan duotone with a scanner line sweeping down, like a drawing being traced.
    vec3 lo = vec3(0.04, 0.12, 0.22);
    vec3 hi = vec3(0.31, 0.76, 0.97);
    vec3 col = mix(lo, hi, pow(g, 0.85));
    float sweep = fract(u_time * 0.12);
    float line = smoothstep(0.03, 0.0, abs(uv.y - sweep));
    return col + vec3(0.2, 0.5, 0.7) * line * g;
  }
  // Midnight: clean B&W with a slight contrast lift.
  return vec3(clamp((g - 0.5) * 1.08 + 0.5, 0.0, 1.0));
}

void main() {
  vec4 src = texture2D(u_tex, v_uv);
  float g = luma(src.rgb);
  vec3 treated = treat(v_uv, g);
  vec3 original = vec3(g); // the real B&W photo underneath

  vec2 d = v_uv - u_mouse;
  d.x *= u_res.x / u_res.y; // keep the reveal circular
  float dist = length(d);
  // Soft feathered edge, with a faint ring of accent right at the boundary.
  float reveal = 1.0 - smoothstep(u_radius * 0.5, u_radius, dist);
  float ring = smoothstep(u_radius * 0.78, u_radius * 0.94, dist) * (1.0 - smoothstep(u_radius * 0.94, u_radius * 1.02, dist));

  vec3 col = mix(treated, original, reveal);
  col += treated * ring * 0.6; // subtle glow at the reveal edge

  gl_FragColor = vec4(col * src.a, src.a);
}
