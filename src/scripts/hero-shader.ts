import vertSrc from "./shaders/reveal.vert?raw";
import fragSrc from "./shaders/reveal.frag?raw";
import texAsset from "../assets/portrait/portrait-1200.webp";

// The reveal is ambient: it drifts across the portrait on its own so every device
// (phones included) sees the effect, and follows the pointer or a dragging finger
// when the visitor takes over. Enabled wherever WebGL is available and motion is
// allowed; reduced-motion users get the static themed image instead.
export function shouldEnableShader(env: { reducedMotion: boolean; hasWebGL: boolean }): boolean {
  return !env.reducedMotion && env.hasWebGL;
}

const THEME_INDEX: Record<string, number> = { midnight: 0, pixel: 1, blueprint: 2 };

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
  }
  return shader;
}

export function initHeroShader(): void {
  const host = document.querySelector<HTMLElement>("[data-hero-portrait]");
  const img = host?.querySelector<HTMLImageElement>(".portrait-img");
  if (!host || !img) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const probe = document.createElement("canvas");
  const hasWebGL = !!(probe.getContext("webgl") || probe.getContext("experimental-webgl"));
  if (!shouldEnableShader({ reducedMotion, hasWebGL })) return;

  const canvas = document.createElement("canvas");
  canvas.className = "portrait-canvas";
  canvas.setAttribute("aria-hidden", "true");
  // Cap resolution; touch devices (usually higher DPR, weaker GPU) get 1x.
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.5);

  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
  if (!gl) return;

  let program: WebGLProgram;
  try {
    program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  } catch {
    return;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uMouse = gl.getUniformLocation(program, "u_mouse");
  const uRadius = gl.getUniformLocation(program, "u_radius");
  const uTheme = gl.getUniformLocation(program, "u_theme");
  const uRes = gl.getUniformLocation(program, "u_res");
  const uTime = gl.getUniformLocation(program, "u_time");

  const sizeCanvas = () => {
    const rect = host.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  };

  // Reveal centre: lerps toward an ambient orbit, or toward the pointer when active.
  const pointer = { x: 0.5, y: 0.42 };
  const current = { x: 0.5, y: 0.42 };
  let lastInteract = -10000;
  let visible = true;
  let ready = false;
  let running = false;

  const render = (timeMs: number) => {
    const t = timeMs / 1000;
    const idle = timeMs - lastInteract > 1600;
    const target = idle
      ? { x: 0.5 + 0.24 * Math.sin(t * 0.45), y: 0.42 + 0.18 * Math.sin(t * 0.72 + 1.3) }
      : pointer;
    current.x += (target.x - current.x) * 0.08;
    current.y += (target.y - current.y) * 0.08;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uMouse, current.x, current.y);
    gl.uniform1f(uRadius, idle ? 0.34 : 0.3);
    gl.uniform1i(uTheme, THEME_INDEX[document.documentElement.dataset.theme ?? "midnight"] ?? 0);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  // Throttle to ~30fps: plenty for a slow ambient drift, and half the GPU work.
  let lastDraw = 0;
  const frame = (time: number) => {
    if (!visible || document.hidden || !ready) {
      running = false;
      return;
    }
    if (time - lastDraw >= 33) {
      render(time);
      lastDraw = time;
    }
    requestAnimationFrame(frame);
  };
  const ensureRunning = () => {
    if (!running && visible && !document.hidden && ready) {
      running = true;
      requestAnimationFrame(frame);
    }
  };

  const setPointer = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = (event.clientY - rect.top) / rect.height;
    lastInteract = performance.now();
  };
  host.addEventListener("pointermove", setPointer);
  host.addEventListener("pointerdown", setPointer);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) ensureRunning();
  });
  window.addEventListener("resize", () => {
    if (ready) sizeCanvas();
  });
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    ensureRunning();
  }).observe(host);

  const texImage = new Image();
  texImage.decoding = "async";
  texImage.src = texAsset.src;
  texImage.onload = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texImage);
    sizeCanvas();
    ready = true;
    img.style.visibility = "hidden";
    host.appendChild(canvas);
    ensureRunning();
  };
}
