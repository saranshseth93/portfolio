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

// Approach: a pinned, scrubbed cinematic sequence. The headline words fly up with a
// touch of rotation, an accent line draws across, then the principles reveal in turn.
function initApproach(): void {
  const section = document.querySelector<HTMLElement>("#approach");
  if (!section) return;
  const headline = section.querySelector<HTMLElement>(".approach-headline");
  const lead = section.querySelector<HTMLElement>(".chapter-lead");
  const rule = section.querySelector<HTMLElement>(".chapter-rule");
  const principles = section.querySelectorAll<HTMLElement>(".principle");
  if (!headline) return;

  let words: Element[] = [headline];
  try {
    words = new SplitText(headline, { type: "words", mask: "words" }).words;
  } catch {
    /* SplitText unavailable: animate the whole headline */
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=130%",
      scrub: 0.8,
      pin: true,
      anticipatePin: 1,
    },
  });
  tl.from(words, { yPercent: 130, rotate: 7, opacity: 0, stagger: 0.09, ease: "power4.out" });
  if (lead) tl.from(lead, { y: 48, opacity: 0, ease: "power2.out" }, "-=0.25");
  if (rule) tl.from(rule, { scaleX: 0, transformOrigin: "left center", ease: "power2.inOut" }, "-=0.15");
  if (principles.length) {
    tl.from(principles, { y: 70, opacity: 0, filter: "blur(8px)", stagger: 0.12, ease: "expo.out" }, "-=0.05");
  }
}

// Experience: the same pinned, scrubbed sequence as Approach. Headline words fly up, the
// accent line draws, then each role reveals in turn. Pinned so it holds while it plays.
function initExperience(): void {
  const section = document.querySelector<HTMLElement>("#experience");
  if (!section) return;
  const headline = section.querySelector<HTMLElement>("[data-exp-headline]");
  const rule = section.querySelector<HTMLElement>(".chapter-rule");
  const items = section.querySelectorAll<HTMLElement>(".exp-item");
  if (!headline) return;

  let words: Element[] = [headline];
  try { words = new SplitText(headline, { type: "words", mask: "words" }).words; } catch { /* */ }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=130%",
      scrub: 0.8,
      pin: true,
      anticipatePin: 1,
    },
  });
  tl.from(words, { yPercent: 130, rotate: 7, opacity: 0, stagger: 0.09, ease: "power4.out" });
  if (rule) tl.from(rule, { scaleX: 0, transformOrigin: "left center", ease: "power2.inOut" }, "-=0.15");
  if (items.length) {
    tl.from(items, { y: 70, opacity: 0, filter: "blur(8px)", stagger: 0.14, ease: "expo.out" }, "-=0.05");
  }
}

// Design-system lab: a cinematic entrance (not pinned, so it never traps scroll while you
// drag the controls). Headline rises, line draws, the panel lifts in.
function initLabReveal(): void {
  const section = document.querySelector<HTMLElement>("#lab");
  if (!section) return;
  const headline = section.querySelector<HTMLElement>("[data-lab-headline]");
  const rule = section.querySelector<HTMLElement>(".chapter-rule");
  const panel = section.querySelector<HTMLElement>(".lab");

  if (headline) {
    let words: Element[] = [headline];
    try { words = new SplitText(headline, { type: "words", mask: "words" }).words; } catch { /* */ }
    gsap.from(words, {
      yPercent: 120, opacity: 0, stagger: 0.08, ease: "power4.out",
      scrollTrigger: { trigger: headline, start: "top 84%", end: "top 48%", scrub: 0.6 },
    });
  }
  if (rule) {
    gsap.from(rule, {
      scaleX: 0, transformOrigin: "left center", ease: "power2.out",
      scrollTrigger: { trigger: rule, start: "top 88%", end: "top 60%", scrub: 0.6 },
    });
  }
  if (panel) {
    gsap.from(panel, {
      y: 60, opacity: 0, filter: "blur(8px)", ease: "expo.out", duration: 1,
      scrollTrigger: { trigger: panel, start: "top 82%" },
    });
  }
}

// Credibility: the statement reveals line by line, then the stack tags stagger in.
function initCredibility(): void {
  const section = document.querySelector<HTMLElement>("#credibility");
  if (!section) return;
  const statement = section.querySelector<HTMLElement>("[data-cred-statement]");
  const stack = section.querySelector<HTMLElement>("[data-cred-stack]");
  if (statement) {
    let lines: Element[] = [statement];
    try { lines = new SplitText(statement, { type: "lines", mask: "lines" }).lines; } catch { /* */ }
    gsap.from(lines, {
      yPercent: 110, opacity: 0, stagger: 0.12, ease: "power3.out",
      scrollTrigger: { trigger: statement, start: "top 82%", end: "bottom 55%", scrub: 0.6 },
    });
  }
  if (stack) {
    gsap.from(stack.children, {
      y: 24, opacity: 0, stagger: 0.05, ease: "power2.out",
      scrollTrigger: { trigger: stack, start: "top 88%" },
    });
  }
}

// Contact: headline rises, the email and links fade up.
function initContact(): void {
  const section = document.querySelector<HTMLElement>("#contact");
  if (!section) return;
  const headline = section.querySelector<HTMLElement>("[data-contact-headline]");
  const rest = section.querySelectorAll<HTMLElement>(".chapter-lead, .contact-email, [data-contact-links]");
  if (headline) {
    let words: Element[] = [headline];
    try { words = new SplitText(headline, { type: "words", mask: "words" }).words; } catch { /* */ }
    gsap.from(words, {
      yPercent: 120, opacity: 0, stagger: 0.08, ease: "power4.out",
      scrollTrigger: { trigger: headline, start: "top 84%", end: "top 48%", scrub: 0.6 },
    });
  }
  if (rest.length) {
    gsap.from(rest, {
      y: 30, opacity: 0, stagger: 0.1, ease: "power3.out",
      scrollTrigger: { trigger: section, start: "top 70%" },
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
  initApproach();
  initExperience();
  initLabReveal();
  initCredibility();
  initContact();

  ScrollTrigger.refresh();
}
