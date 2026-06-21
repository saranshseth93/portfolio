// The wordmark leans into the cursor: Unbounded is a variable font, so each
// letter's weight swells as the pointer nears it and eases back when it leaves.
// Desktop fine-pointer only; reduced-motion and touch keep the static bold name.
const REST = 500; // resting weight once the load settle relaxes
const PEAK = 700; // heaviest weight directly under the pointer (font axis max)
const RADIUS = 150; // px falloff around each letter
const SETTLE_END = 680; // matches the name-settle keyframe end, so there is no jump

export function initHeroName(): void {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = document.querySelector<HTMLElement>(".hero-name");
  if (!el) return;

  // Split into per-letter spans once the load animation has settled, so the
  // settle plays on the whole word first and screen readers keep the real name.
  const start = () => {
    const text = el.textContent ?? "";
    el.setAttribute("aria-label", text.trim());
    el.classList.add("is-split");
    el.textContent = "";
    const letters: HTMLElement[] = [];
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "hero-name-ch";
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch === " " ? " " : ch;
      span.style.fontVariationSettings = `"wght" ${SETTLE_END}, "opsz" 144`;
      el.appendChild(span);
      letters.push(span);
    }

    const cur = letters.map(() => SETTLE_END);
    const target = letters.map(() => REST);
    let px = -1e4, py = -1e4, running = false;

    // Recompute targets on pointer move (one layout read per move, not per frame).
    const aim = () => {
      for (let i = 0; i < letters.length; i++) {
        const r = letters[i].getBoundingClientRect();
        const dx = px - (r.left + r.width / 2);
        const dy = py - (r.top + r.height / 2);
        const prox = Math.max(0, 1 - Math.hypot(dx, dy) / RADIUS);
        target[i] = REST + (PEAK - REST) * prox * prox;
      }
    };

    const tick = () => {
      let active = false;
      for (let i = 0; i < letters.length; i++) {
        cur[i] += (target[i] - cur[i]) * 0.16;
        letters[i].style.fontVariationSettings = `"wght" ${Math.round(cur[i])}, "opsz" 144`;
        if (Math.abs(target[i] - cur[i]) > 0.4) active = true;
      }
      running = active;
      if (active) requestAnimationFrame(tick);
    };
    const run = () => { if (!running) { running = true; requestAnimationFrame(tick); } };

    window.addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; aim(); run(); });
    el.addEventListener("pointerleave", () => { px = -1e4; py = -1e4; aim(); run(); });
    run(); // relax from the settle weight down to REST
  };

  // Wait out the 0.9s settle; fall back to a timer if animationend already fired.
  let started = false;
  const once = () => { if (!started) { started = true; start(); } };
  el.addEventListener("animationend", once, { once: true });
  setTimeout(once, 1000);
}
