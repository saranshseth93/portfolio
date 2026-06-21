// Custom cursor (a dot with a trailing ring) plus magnetic pull on key controls.
// Desktop fine-pointer only, and skipped under reduced motion.
const MAGNETIC = ".cv-button, .contact-email, .swatch, .lab-chip, .lab-btn, .lab-reset, .dot-nav-item";
const INTERACTIVE = "a, button, input, " + MAGNETIC;

export function initCursor(): void {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  dot.setAttribute("aria-hidden", "true");
  ring.setAttribute("aria-hidden", "true");
  document.body.append(ring, dot);
  document.body.classList.add("has-custom-cursor");

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let shown = false;
  dot.style.opacity = "0";
  ring.style.opacity = "0";
  window.addEventListener("pointermove", (e) => {
    if (!shown) { shown = true; dot.style.opacity = "1"; ring.style.opacity = "1"; }
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  });
  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  document.addEventListener("pointerover", (e) => {
    if ((e.target as Element).closest(INTERACTIVE)) document.body.classList.add("cursor-hover");
  });
  document.addEventListener("pointerout", (e) => {
    if ((e.target as Element).closest(INTERACTIVE)) document.body.classList.remove("cursor-hover");
  });

  // Magnetic pull: the element drifts toward the pointer while hovered.
  for (const el of document.querySelectorAll<HTMLElement>(MAGNETIC)) {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  }
}
