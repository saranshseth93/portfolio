import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// The motion stage for the whole page: smooth scroll (Lenis) driving GSAP ScrollTrigger,
// scroll reveals, hero parallax, smooth in-page anchors, and the registry that chapters
// hook into for scroll-scrubbed timelines. Everything here is progressive enhancement and is
// skipped entirely under reduced motion, where the page scrolls natively and is fully visible.

gsap.registerPlugin(ScrollTrigger, SplitText);

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initReveals(): void {
  const targets = gsap.utils.toArray<HTMLElement>("[data-reveal]");
  for (const el of targets) {
    el.classList.add("reveal-init"); // hidden only now that JS runs; no-JS stays visible
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        el.style.transitionDelay = `${Number(el.dataset.revealDelay ?? 0)}ms`;
        el.classList.add("reveal-in");
        el.classList.remove("reveal-init");
      },
    });
  }
}

function initHeroParallax(): void {
  const portrait = document.querySelector<HTMLElement>("[data-hero-portrait]");
  const hero = document.querySelector<HTMLElement>("#hero");
  if (!portrait || !hero) return;
  gsap.to(portrait, {
    yPercent: 12,
    ease: "none",
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
  });
}

function initAnchors(lenis: Lenis): void {
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
}

// A headline rises line by line from behind a mask, scrubbed to scroll; supporting
// content staggers in as it enters. The plain text is the no-JS / reduced-motion default.
function initChapterReveals(): void {
  for (const headline of gsap.utils.toArray<HTMLElement>("[data-split]")) {
    let lines: Element[] = [headline];
    try {
      lines = new SplitText(headline, { type: "lines", mask: "lines" }).lines;
    } catch {
      /* SplitText unavailable: animate the whole headline instead */
    }
    gsap.from(lines, {
      yPercent: 120,
      opacity: 0,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: headline, start: "top 82%", end: "top 38%", scrub: 0.6 },
    });
  }

  for (const group of gsap.utils.toArray<HTMLElement>("[data-stagger]")) {
    gsap.from(group.children, {
      y: 44,
      opacity: 0,
      filter: "blur(6px)",
      duration: 1,
      stagger: 0.12,
      ease: "expo.out",
      scrollTrigger: { trigger: group, start: "top 82%" },
    });
  }
}

let registered = false;

export function initScrollStage(): void {
  if (registered || prefersReducedMotion()) return;
  registered = true;

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  });

  // Drive ScrollTrigger from Lenis, and Lenis from GSAP's ticker (one rAF loop).
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  initAnchors(lenis);
  initReveals();
  initHeroParallax();
  initChapterReveals();

  ScrollTrigger.refresh();
}
