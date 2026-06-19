import Lenis from "lenis";

// Studio-grade motion: smooth scroll, masked blur reveals on scroll, and a subtle
// hero parallax. All of it is progressive enhancement and is skipped under reduced
// motion, where the page scrolls natively and everything is visible at once.

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initReveal(): void {
  const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
  if (!("IntersectionObserver" in window) || targets.length === 0) return;

  // Hide only once JS runs, so a no-JS page shows everything.
  for (const el of targets) el.classList.add("reveal-init");

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.style.transitionDelay = `${Number(el.dataset.revealDelay ?? 0)}ms`;
        el.classList.add("reveal-in");
        el.classList.remove("reveal-init");
        observer.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
  );

  for (const el of targets) observer.observe(el);
}

function initParallax(lenis: Lenis): void {
  const portrait = document.querySelector<HTMLElement>("[data-hero-portrait]");
  if (!portrait) return;
  lenis.on("scroll", ({ scroll }: { scroll: number }) => {
    // Portrait lags the scroll slightly for depth. Capped so it never drifts far.
    const shift = Math.min(scroll, window.innerHeight) * 0.08;
    portrait.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
  });
}

export function initMotion(): void {
  if (prefersReducedMotion()) return;

  const lenis = new Lenis({
    duration: 1.1,
    // easeOutExpo: fast start, long glide. The studio feel.
    easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  });

  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // Smooth the in-page scroll cue.
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: 0 });
    });
  }

  initReveal();
  initParallax(lenis);
}
