import vertSrc from "./shaders/reveal.vert?raw";
import fragSrc from "./shaders/reveal.frag?raw";
import texAsset from "../assets/portrait/cutout.png";

// Pure, testable gate for the cursor-reveal shader.
export function shouldEnableShader(env: {
  reducedMotion: boolean;
  finePointer: boolean;
  hasWebGL: boolean;
}): boolean {
  return !env.reducedMotion && env.finePointer && env.hasWebGL;
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
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const probe = document.createElement("canvas");
  const hasWebGL = !!(probe.getContext("webgl") || probe.getContext("experimental-webgl"));
  if (!shouldEnableShader({ reducedMotion, finePointer, hasWebGL })) return;

  const canvas = document.createElement("canvas");
  canvas.className = "portrait-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
  if (!gl) return;

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(program);
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

  const sizeCanvas = () => {
    const rect = host.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  };

  let mouse = { x: -1, y: -1 };
  let raf = 0;
  let visible = true;
  let ready = false;

  const render = () => {
    raf = 0;
    if (!visible || document.hidden || !ready) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uRadius, 0.32);
    gl.uniform1i(uTheme, THEME_INDEX[document.documentElement.dataset.theme ?? "midnight"] ?? 0);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const requestRender = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };

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
    requestRender();
  };

  host.addEventListener("pointermove", (event) => {
    const rect = host.getBoundingClientRect();
    mouse = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    requestRender();
  });
  host.addEventListener("pointerleave", () => {
    mouse = { x: -1, y: -1 };
    requestRender();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) requestRender();
  });
  window.addEventListener("resize", () => {
    if (ready) sizeCanvas();
    requestRender();
  });
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) requestRender();
  }).observe(host);
  // Re-render when the theme flips so the in-shader treatment updates.
  new MutationObserver(requestRender).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
}
