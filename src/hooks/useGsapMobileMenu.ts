"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { gsap, initGsap } from "@/lib/gsap";

type ClipPaths = {
  closed: string;
  open: string;
  holeX: number;
  holeY: number;
};

type UseGsapMobileMenuOptions = {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
};

type PullSample = {
  el: HTMLElement;
  /** Layout center (viewport) with transforms cleared. */
  layoutX: number;
  layoutY: number;
  /** Distance from hole — used for proximity order. */
  radius: number;
  /** Fixed direction from hole to rest position (no orbit). */
  angle: number;
};

const VORTEX = {
  duration: 0.85,
  stagger: 0.075,
  spitLead: 0.05,
  morph: 0.28,
  easeOpen: "power3.out",
  easeClose: "power4.in",
} as const;

function measureClipPaths(
  trigger: HTMLElement,
  panel: HTMLElement,
): ClipPaths {
  const panelRect = panel.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const holeX = triggerRect.left + triggerRect.width / 2;
  const holeY = triggerRect.top + triggerRect.height / 2;
  const origin = `${holeX - panelRect.left}px ${holeY - panelRect.top}px`;

  return {
    closed: `circle(0px at ${origin})`,
    open: `circle(150vmax at ${origin})`,
    holeX,
    holeY,
  };
}

function applyClip(panel: HTMLElement, clip: string) {
  gsap.set(panel, {
    clipPath: clip,
    WebkitClipPath: clip,
  });
}

function menuItems(panel: HTMLElement) {
  return panel.querySelectorAll<HTMLElement>(
    "[data-menu-link], [data-menu-chrome]",
  );
}

function iconParts(trigger: HTMLElement) {
  const lines = trigger.querySelector<HTMLElement>("[data-burger-lines]");
  const vortex = trigger.querySelector<HTMLElement>("[data-burger-vortex]");
  const rings = trigger.querySelectorAll<HTMLElement>("[data-vortex-ring]");
  const core = trigger.querySelector<HTMLElement>("[data-vortex-core]");
  const close = trigger.querySelector<HTMLElement>("[data-burger-close]");
  return { lines, vortex, rings, core, close };
}

function hideClose(close: HTMLElement | null) {
  if (!close) return;
  gsap.set(close, {
    opacity: 0,
    scale: 0.2,
    rotate: 0,
    visibility: "hidden",
  });
}

function showCloseSettled(close: HTMLElement | null) {
  if (!close) return;
  gsap.set(close, {
    opacity: 1,
    scale: 1,
    rotate: 0,
    visibility: "visible",
  });
}

function resetItemsAtRest(items: NodeListOf<HTMLElement> | HTMLElement[]) {
  gsap.set(items, {
    opacity: 0,
    scale: 1,
    rotate: 0,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    force3D: true,
  });
}

/**
 * Snapshot each item's layout center + vector to the hole.
 * Clears transforms first so layout is the resting menu position.
 */
function samplePulls(
  items: NodeListOf<HTMLElement> | HTMLElement[],
  holeX: number,
  holeY: number,
): PullSample[] {
  gsap.set(items, {
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
    filter: "blur(0px)",
    force3D: true,
  });

  return Array.from(items).map((el) => {
    const r = el.getBoundingClientRect();
    const layoutX = r.left + r.width / 2;
    const layoutY = r.top + r.height / 2;
    const dx = layoutX - holeX;
    const dy = layoutY - holeY;
    return {
      el,
      layoutX,
      layoutY,
      radius: Math.hypot(dx, dy) || 1,
      angle: Math.atan2(dy, dx),
    };
  });
}

/** Nearest to the hole first — how a blackhole actually pulls. */
function byProximity(samples: PullSample[]): PullSample[] {
  return [...samples].sort((a, b) => a.radius - b.radius);
}

/**
 * Straight pull into the hole (no orbit, no text spin).
 * t=0 at rest, t=1 inside the hole.
 */
function setPullProgress(
  sample: PullSample,
  holeX: number,
  holeY: number,
  t: number,
) {
  const radius = sample.radius * (1 - t);
  const px = holeX + Math.cos(sample.angle) * radius;
  const py = holeY + Math.sin(sample.angle) * radius;

  const scale = gsap.utils.interpolate(1, 0.02, Math.pow(t, 1.4));
  const opacity =
    t < 0.4 ? 1 : Math.max(0, 1 - Math.pow((t - 0.4) / 0.6, 1.5));
  const blur = t > 0.55 ? ((t - 0.55) / 0.45) * 7 : 0;

  gsap.set(sample.el, {
    x: px - sample.layoutX,
    y: py - sample.layoutY,
    scale,
    rotate: 0,
    opacity,
    filter: blur > 0.05 ? `blur(${blur}px)` : "blur(0px)",
    transformOrigin: "50% 50%",
    force3D: true,
  });
}

function parkItemsInHole(
  samples: PullSample[],
  holeX: number,
  holeY: number,
) {
  samples.forEach((sample) => {
    setPullProgress(sample, holeX, holeY, 1);
  });
}

/** suck: closest in first; spit: LIFO — farthest (last in) out first. */
function addPullTweens(
  tl: gsap.core.Timeline,
  samples: PullSample[],
  holeX: number,
  holeY: number,
  mode: "suck" | "spit",
  startAt: number,
  duration: number,
) {
  const ordered =
    mode === "suck"
      ? byProximity(samples)
      : [...byProximity(samples)].reverse();

  ordered.forEach((sample, i) => {
    const proxy = { t: mode === "suck" ? 0 : 1 };
    const delay = i * VORTEX.stagger;

    tl.to(
      proxy,
      {
        t: mode === "suck" ? 1 : 0,
        duration,
        ease: mode === "suck" ? VORTEX.easeClose : VORTEX.easeOpen,
        onUpdate: () => {
          setPullProgress(sample, holeX, holeY, proxy.t);
        },
        onComplete: () => {
          if (mode === "spit") {
            gsap.set(sample.el, {
              x: 0,
              y: 0,
              scale: 1,
              rotate: 0,
              opacity: 1,
              filter: "blur(0px)",
            });
          }
        },
      },
      startAt + delay,
    );
  });
}

export function useGsapMobileMenu({
  open,
  triggerRef,
}: UseGsapMobileMenuOptions) {
  const prefersReducedMotion = useGsapReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const clipRef = useRef<ClipPaths | null>(null);
  const isOpenRef = useRef(false);
  const spinTweensRef = useRef<gsap.core.Tween[]>([]);

  const stopSpin = () => {
    spinTweensRef.current.forEach((t) => t.kill());
    spinTweensRef.current = [];
  };

  const startSpin = (rings: NodeListOf<HTMLElement>) => {
    stopSpin();
    rings.forEach((ring, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      spinTweensRef.current.push(
        gsap.to(ring, {
          rotation: 360 * dir,
          duration: 0.9 + i * 0.28,
          ease: "none",
          repeat: -1,
        }),
      );
    });
  };

  const morphToBlackhole = (
    tl: gsap.core.Timeline,
    parts: ReturnType<typeof iconParts>,
    at: number,
  ) => {
    const { lines, vortex, rings, core } = parts;
    if (!vortex) return;

    gsap.set(vortex, {
      visibility: "visible",
      display: "block",
      opacity: 0,
      scale: 0.35,
      pointerEvents: "none",
    });
    startSpin(rings);

    tl.to(
      vortex,
      {
        opacity: 1,
        scale: 1.65,
        duration: VORTEX.morph,
        ease: "power2.out",
      },
      at,
    );

    if (core) {
      tl.fromTo(
        core,
        { scale: 0.45 },
        { scale: 1, duration: VORTEX.morph, ease: "power2.out" },
        at,
      );
    }

    if (lines) {
      tl.to(
        lines,
        {
          opacity: 0,
          scale: 0.2,
          rotate: 90,
          duration: VORTEX.morph * 0.75,
          ease: "power2.in",
        },
        at,
      );
    }
  };

  const morphToBurger = (
    tl: gsap.core.Timeline,
    parts: ReturnType<typeof iconParts>,
    at: number,
  ) => {
    const { lines, vortex, close } = parts;
    if (close) {
      tl.to(
        close,
        {
          opacity: 0,
          scale: 0.15,
          duration: VORTEX.morph * 0.7,
          ease: "power2.in",
          onComplete: () => hideClose(close),
        },
        at,
      );
    }
    if (vortex) {
      tl.to(
        vortex,
        {
          opacity: 0,
          scale: 0.2,
          duration: VORTEX.morph,
          ease: "power2.in",
          onComplete: () => {
            gsap.set(vortex, { visibility: "hidden" });
            stopSpin();
          },
        },
        at,
      );
    }
    if (lines) {
      const top = lines.querySelector("[data-burger-line='top']");
      const bottom = lines.querySelector("[data-burger-line='bottom']");
      if (top && bottom) {
        gsap.set(top, { attr: { x1: 3, y1: 9, x2: 21, y2: 9 } });
        gsap.set(bottom, { attr: { x1: 3, y1: 15, x2: 21, y2: 15 } });
      }
      tl.fromTo(
        lines,
        { opacity: 0, scale: 0.35, rotate: -40 },
        {
          opacity: 1,
          scale: 1,
          rotate: 0,
          duration: VORTEX.morph,
          ease: "power2.out",
        },
        at,
      );
    }
  };

  useLayoutEffect(() => {
    initGsap();
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!overlay || !panel) return;

    gsap.set(overlay, {
      opacity: 0,
      visibility: "hidden",
      pointerEvents: "none",
    });
    gsap.set(panel, { pointerEvents: "none" });

    if (trigger) {
      const clips = measureClipPaths(trigger, panel);
      applyClip(panel, clips.closed);
      const { lines, vortex, close } = iconParts(trigger);
      if (lines) gsap.set(lines, { opacity: 1, scale: 1, rotate: 0 });
      if (vortex) {
        gsap.set(vortex, {
          opacity: 0,
          scale: 0.2,
          visibility: "hidden",
        });
      }
      hideClose(close);
    }

    resetItemsAtRest(menuItems(panel));
    gsap.set(menuItems(panel), { transformOrigin: "50% 50%" });

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      stopSpin();
    };
  }, [triggerRef]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!overlay || !panel || !trigger) return;

    const items = menuItems(panel);
    const clips = measureClipPaths(trigger, panel);
    clipRef.current = clips;
    const parts = iconParts(trigger);

    if (prefersReducedMotion) {
      timelineRef.current?.kill();
      timelineRef.current = null;
      stopSpin();

      if (open) {
        gsap.set(overlay, {
          opacity: 1,
          visibility: "visible",
          pointerEvents: "auto",
        });
        applyClip(panel, clips.open);
        gsap.set(panel, { pointerEvents: "auto" });
        gsap.set(items, {
          opacity: 1,
          scale: 1,
          rotate: 0,
          x: 0,
          y: 0,
          filter: "blur(0px)",
        });
        if (parts.lines) gsap.set(parts.lines, { opacity: 0, scale: 0.2 });
        if (parts.vortex) {
          gsap.set(parts.vortex, {
            opacity: 0,
            scale: 0.2,
            visibility: "hidden",
          });
        }
        showCloseSettled(parts.close);
        isOpenRef.current = true;
      } else {
        gsap.set(overlay, {
          opacity: 0,
          visibility: "hidden",
          pointerEvents: "none",
        });
        applyClip(panel, clips.closed);
        gsap.set(panel, { pointerEvents: "none" });
        resetItemsAtRest(items);
        if (parts.lines) gsap.set(parts.lines, { opacity: 1, scale: 1, rotate: 0 });
        if (parts.vortex) {
          gsap.set(parts.vortex, {
            opacity: 0,
            scale: 0.2,
            visibility: "hidden",
          });
        }
        hideClose(parts.close);
        isOpenRef.current = false;
      }
      return;
    }

    // ——— OPEN: blackhole → spit content → spit X last → hole fades ———
    if (open) {
      timelineRef.current?.kill();

      applyClip(panel, clips.open);
      gsap.set(panel, { visibility: "visible", pointerEvents: "none" });

      const samples = samplePulls(items, clips.holeX, clips.holeY);
      parkItemsInHole(samples, clips.holeX, clips.holeY);
      applyClip(panel, clips.closed);

      if (parts.vortex) {
        gsap.set(parts.vortex, {
          opacity: 0,
          scale: 0.2,
          visibility: "hidden",
        });
      }
      if (parts.lines) {
        gsap.set(parts.lines, { opacity: 1, scale: 1, rotate: 0 });
      }
      // X starts parked inside the hole
      if (parts.close) {
        gsap.set(parts.close, {
          visibility: "visible",
          opacity: 0,
          scale: 0.12,
          rotate: -40,
        });
      }

      const itemDur = VORTEX.duration * 0.95;
      const tl = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: () => {
          isOpenRef.current = true;
        },
      });
      timelineRef.current = tl;

      morphToBlackhole(tl, parts, 0);

      const contentAt = VORTEX.morph * 0.35;
      const spitStart = contentAt + VORTEX.spitLead;
      const spitEnd =
        spitStart +
        itemDur +
        Math.max(0, samples.length - 1) * VORTEX.stagger;

      tl.to(
        overlay,
        {
          opacity: 1,
          visibility: "visible",
          duration: VORTEX.duration * 0.45,
          ease: "power2.out",
          onStart: () => {
            gsap.set(overlay, { pointerEvents: "auto" });
          },
        },
        0,
      ).to(
        panel,
        {
          clipPath: clips.open,
          WebkitClipPath: clips.open,
          duration: VORTEX.duration,
          ease: VORTEX.easeOpen,
          onStart: () => {
            gsap.set(panel, {
              visibility: "visible",
              pointerEvents: "auto",
            });
          },
        },
        contentAt,
      );

      addPullTweens(
        tl,
        samples,
        clips.holeX,
        clips.holeY,
        "spit",
        spitStart,
        itemDur,
      );

      // X spits out last, then the blackhole disappears under it
      const xAt = spitEnd - 0.04;
      if (parts.close) {
        tl.to(
          parts.close,
          {
            opacity: 1,
            scale: 1,
            rotate: 0,
            duration: 0.34,
            ease: "power3.out",
          },
          xAt,
        );
      }
      if (parts.vortex) {
        tl.to(
          parts.vortex,
          {
            opacity: 0,
            scale: 0.35,
            duration: 0.32,
            ease: "power2.in",
            onComplete: () => {
              gsap.set(parts.vortex!, { visibility: "hidden" });
              stopSpin();
            },
          },
          xAt + 0.1,
        );
      }

      return;
    }

    // ——— CLOSE: X → blackhole → suck content → burger lines ———
    if (
      isOpenRef.current ||
      (timelineRef.current && timelineRef.current.progress() > 0)
    ) {
      timelineRef.current?.kill();

      const closedClip = clipRef.current?.closed ?? clips.closed;

      // Sample at resting layout (clears mid-tween transforms)
      const samples = samplePulls(items, clips.holeX, clips.holeY);

      if (parts.lines) {
        gsap.set(parts.lines, { opacity: 0, scale: 0.35 });
      }

      const tl = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: () => {
          isOpenRef.current = false;
          hideClose(parts.close);
          gsap.set(overlay, {
            opacity: 0,
            visibility: "hidden",
            pointerEvents: "none",
          });
          applyClip(panel, closedClip);
          gsap.set(panel, { pointerEvents: "none" });
          resetItemsAtRest(items);
        },
      });
      timelineRef.current = tl;

      // Blackhole reappears as X gets pulled back in
      if (parts.vortex) {
        gsap.set(parts.vortex, {
          visibility: "visible",
          opacity: 0,
          scale: 0.4,
        });
        startSpin(parts.rings);
        tl.to(
          parts.vortex,
          {
            opacity: 1,
            scale: 1.85,
            duration: 0.26,
            ease: "power2.out",
          },
          0,
        );
      }
      if (parts.close) {
        tl.to(
          parts.close,
          {
            opacity: 0,
            scale: 0.1,
            rotate: 35,
            duration: 0.22,
            ease: "power2.in",
            onComplete: () => hideClose(parts.close),
          },
          0,
        );
      }

      // 1) Suck while panel stays open
      const suckAt = 0.2;
      const suckDur = VORTEX.duration * 0.72;
      const pullEnd =
        suckAt +
        suckDur +
        Math.max(0, samples.length - 1) * VORTEX.stagger;

      addPullTweens(
        tl,
        samples,
        clips.holeX,
        clips.holeY,
        "suck",
        suckAt,
        suckDur,
      );

      // 2) Collapse after suck
      const collapseAt = pullEnd - 0.08;
      const collapseDur = 0.38;

      tl.to(
        panel,
        {
          clipPath: closedClip,
          WebkitClipPath: closedClip,
          duration: collapseDur,
          ease: VORTEX.easeClose,
          onStart: () => {
            gsap.set(panel, { pointerEvents: "none" });
          },
        },
        collapseAt,
      );

      tl.to(
        overlay,
        {
          opacity: 0,
          duration: collapseDur * 0.55,
          ease: "power2.in",
          onComplete: () => {
            gsap.set(overlay, {
              visibility: "hidden",
              pointerEvents: "none",
            });
          },
        },
        collapseAt + collapseDur * 0.2,
      );

      // 3) Restore burger lines
      morphToBurger(tl, parts, collapseAt + collapseDur * 0.4);

      return;
    }

    gsap.set(overlay, {
      opacity: 0,
      visibility: "hidden",
      pointerEvents: "none",
    });
    applyClip(panel, clips.closed);
    gsap.set(panel, { pointerEvents: "none" });
    resetItemsAtRest(items);
    if (parts.lines) gsap.set(parts.lines, { opacity: 1, scale: 1, rotate: 0 });
    if (parts.vortex) {
      gsap.set(parts.vortex, {
        opacity: 0,
        scale: 0.2,
        visibility: "hidden",
      });
    }
    hideClose(parts.close);
    stopSpin();
    isOpenRef.current = false;
  }, [open, prefersReducedMotion, triggerRef]);

  return { overlayRef, panelRef };
}
