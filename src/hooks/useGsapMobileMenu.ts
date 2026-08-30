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
  /** Fires after the close timeline settles (or instant close in reduced motion). */
  onCloseComplete?: () => void;
};

type PullSample = {
  el: HTMLElement;
  clone: HTMLElement | null;
  layoutX: number;
  layoutY: number;
  width: number;
  height: number;
  radius: number;
  angle: number;
};

type HoleParts = {
  lines: HTMLElement | null;
  close: HTMLElement | null;
  disk: HTMLElement | null;
  coreWrap: HTMLElement | null;
  rings: HTMLElement[];
  core: HTMLElement | null;
  holeLayers: HTMLElement[];
};

const VORTEX = {
  duration: 0.85,
  stagger: 0.075,
  spitLead: 0.05,
  morph: 0.28,
  easeOpen: "power3.out",
  easeClose: "power4.in",
  /** Visual size of the fixed hole layers (px). */
  holeSize: 60,
} as const;

function measureClipPaths(
  trigger: HTMLElement,
  panel: HTMLElement,
): ClipPaths {
  const panelRect = panel.getBoundingClientRect();
  // Prefer the icon glyph box so the hole lines up with burger / X, not button padding
  const icon =
    trigger.querySelector<HTMLElement>("[data-menu-trigger-icon]") ?? trigger;
  const iconRect = icon.getBoundingClientRect();
  const holeX = iconRect.left + iconRect.width / 2;
  const holeY = iconRect.top + iconRect.height / 2;
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

function resolveParts(
  trigger: HTMLElement,
  disk: HTMLElement | null,
  coreWrap: HTMLElement | null,
): HoleParts {
  const lines = trigger.querySelector<HTMLElement>("[data-burger-lines]");
  const close = trigger.querySelector<HTMLElement>("[data-burger-close]");
  const rings = [
    ...Array.from(
      disk?.querySelectorAll<HTMLElement>("[data-vortex-ring]") ?? [],
    ),
    ...Array.from(
      coreWrap?.querySelectorAll<HTMLElement>("[data-vortex-ring]") ?? [],
    ),
  ];
  const core =
    coreWrap?.querySelector<HTMLElement>("[data-vortex-core]") ?? null;
  const holeLayers = [disk, coreWrap].filter(Boolean) as HTMLElement[];
  return { lines, close, disk, coreWrap, rings, core, holeLayers };
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

function pinHoleLayers(
  layers: HTMLElement[],
  holeX: number,
  holeY: number,
) {
  layers.forEach((layer) => {
    gsap.set(layer, {
      position: "fixed",
      left: holeX,
      top: holeY,
      xPercent: -50,
      yPercent: -50,
      x: 0,
      y: 0,
      width: VORTEX.holeSize,
      height: VORTEX.holeSize,
      transformOrigin: "50% 50%",
    });
  });
}

function hideHoleLayers(layers: HTMLElement[]) {
  layers.forEach((layer) => {
    gsap.set(layer, {
      opacity: 0,
      scale: 0.2,
      visibility: "hidden",
    });
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
    visibility: "visible",
    force3D: true,
    clearProps: "position,left,top,width,height,margin,zIndex",
  });
}

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
    visibility: "visible",
    force3D: true,
    clearProps: "position,left,top,width,height,margin,zIndex",
  });

  return Array.from(items).map((el) => {
    const r = el.getBoundingClientRect();
    const layoutX = r.left + r.width / 2;
    const layoutY = r.top + r.height / 2;
    const dx = layoutX - holeX;
    const dy = layoutY - holeY;
    return {
      el,
      clone: null,
      layoutX,
      layoutY,
      width: r.width,
      height: r.height,
      radius: Math.hypot(dx, dy) || 1,
      angle: Math.atan2(dy, dx),
    };
  });
}

function byProximity(samples: PullSample[]): PullSample[] {
  return [...samples].sort((a, b) => a.radius - b.radius);
}

function clearFlight(flight: HTMLElement | null) {
  if (!flight) return;
  flight.replaceChildren();
}

/**
 * Clone items into the flight layer (between disk z-64 and core z-66).
 * Originals stay in the panel (hidden) so React layout never reshuffles.
 */
function launchClones(
  samples: PullSample[],
  flight: HTMLElement,
) {
  clearFlight(flight);
  samples.forEach((sample) => {
    const clone = sample.el.cloneNode(true) as HTMLElement;
    clone.setAttribute("aria-hidden", "true");
    clone.style.pointerEvents = "none";
    clone.style.listStyle = "none";
    // Avoid duplicate interactive ids / focus
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    clone.querySelectorAll("a,button").forEach((node) => {
      node.setAttribute("tabindex", "-1");
    });

    flight.appendChild(clone);
    sample.clone = clone;

    gsap.set(sample.el, { opacity: 0, visibility: "hidden" });
    gsap.set(clone, {
      position: "fixed",
      left: sample.layoutX - sample.width / 2,
      top: sample.layoutY - sample.height / 2,
      width: sample.width,
      height: sample.height,
      margin: 0,
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
      opacity: 1,
      filter: "blur(0px)",
      transformOrigin: "50% 50%",
      force3D: true,
    });
  });
}

function setPullProgress(
  sample: PullSample,
  holeX: number,
  holeY: number,
  t: number,
) {
  const target = sample.clone ?? sample.el;
  const radius = sample.radius * (1 - t);
  const px = holeX + Math.cos(sample.angle) * radius;
  const py = holeY + Math.sin(sample.angle) * radius;

  // Stay readable over the disk; only vanish as they enter the core
  const scale = gsap.utils.interpolate(1, 0.04, Math.pow(t, 1.55));
  const opacity =
    t < 0.72 ? 1 : Math.max(0, 1 - Math.pow((t - 0.72) / 0.28, 1.35));
  const blur = t > 0.7 ? ((t - 0.7) / 0.3) * 6 : 0;

  gsap.set(target, {
    x: px - sample.layoutX,
    y: py - sample.layoutY,
    scale,
    rotate: 0,
    opacity,
    filter: blur > 0.05 ? `blur(${blur}px)` : "blur(0px)",
    force3D: true,
  });
}

function parkItemsInHole(
  samples: PullSample[],
  flight: HTMLElement,
  holeX: number,
  holeY: number,
) {
  launchClones(samples, flight);
  samples.forEach((sample) => {
    setPullProgress(sample, holeX, holeY, 1);
  });
}

/** Reveal originals in place and wipe clones — all at once (no stagger reshuffle). */
function settleFromFlight(
  samples: PullSample[],
  flight: HTMLElement | null,
) {
  samples.forEach((sample) => {
    gsap.set(sample.el, {
      opacity: 1,
      visibility: "visible",
      scale: 1,
      rotate: 0,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      clearProps: "position,left,top,width,height,margin,zIndex",
    });
    sample.clone = null;
  });
  clearFlight(flight);
}

function addPullTweens(
  tl: gsap.core.Timeline,
  samples: PullSample[],
  holeX: number,
  holeY: number,
  mode: "suck" | "spit",
  startAt: number,
  duration: number,
  flight: HTMLElement | null,
) {
  const ordered =
    mode === "suck"
      ? byProximity(samples)
      : [...byProximity(samples)].reverse();

  if (mode === "suck" && flight) {
    launchClones(samples, flight);
  }

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
      },
      startAt + delay,
    );
  });

  if (mode === "spit") {
    const spitEnd =
      startAt +
      duration +
      Math.max(0, samples.length - 1) * VORTEX.stagger;
    tl.call(() => settleFromFlight(samples, flight), undefined, spitEnd);
  }
}

export function useGsapMobileMenu({
  open,
  triggerRef,
  onCloseComplete,
}: UseGsapMobileMenuOptions) {
  const prefersReducedMotion = useGsapReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const diskRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const flightRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const clipRef = useRef<ClipPaths | null>(null);
  const isOpenRef = useRef(false);
  const spinTweensRef = useRef<gsap.core.Tween[]>([]);
  const onCloseCompleteRef = useRef(onCloseComplete);

  onCloseCompleteRef.current = onCloseComplete;

  const notifyCloseComplete = () => {
    onCloseCompleteRef.current?.();
  };

  const stopSpin = () => {
    spinTweensRef.current.forEach((t) => t.kill());
    spinTweensRef.current = [];
  };

  const startSpin = (rings: HTMLElement[]) => {
    stopSpin();
    rings.forEach((ring, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      // Inner rim spins faster — closest to the hole
      const duration = i === 0 ? 0.85 : 1.35;
      spinTweensRef.current.push(
        gsap.to(ring, {
          rotation: `+=${360 * dir}`,
          duration,
          ease: "none",
          repeat: -1,
        }),
      );
    });
  };

  const morphToBlackhole = (
    tl: gsap.core.Timeline,
    parts: HoleParts,
    holeX: number,
    holeY: number,
    at: number,
  ) => {
    const { lines, holeLayers, rings, core } = parts;
    if (!holeLayers.length) return;

    pinHoleLayers(holeLayers, holeX, holeY);
    holeLayers.forEach((layer) => {
      gsap.set(layer, {
        visibility: "visible",
        opacity: 0,
        scale: 0.35,
        pointerEvents: "none",
      });
    });
    startSpin(rings);

    tl.to(
      holeLayers,
      {
        opacity: 1,
        scale: 1.2,
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
    parts: HoleParts,
    at: number,
  ) => {
    const { lines, close, holeLayers } = parts;
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
    if (holeLayers.length) {
      tl.to(
        holeLayers,
        {
          opacity: 0,
          scale: 0.2,
          duration: VORTEX.morph,
          ease: "power2.in",
          onComplete: () => {
            hideHoleLayers(holeLayers);
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
    const disk = diskRef.current;
    const coreWrap = coreRef.current;
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
      const parts = resolveParts(trigger, disk, coreWrap);
      if (parts.lines) gsap.set(parts.lines, { opacity: 1, scale: 1, rotate: 0 });
      pinHoleLayers(parts.holeLayers, clips.holeX, clips.holeY);
      hideHoleLayers(parts.holeLayers);
      hideClose(parts.close);
    }

    resetItemsAtRest(menuItems(panel));
    gsap.set(menuItems(panel), { transformOrigin: "50% 50%" });

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      stopSpin();
      clearFlight(flightRef.current);
    };
  }, [triggerRef]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    const disk = diskRef.current;
    const coreWrap = coreRef.current;
    const flight = flightRef.current;
    if (!overlay || !panel || !trigger) return;

    const items = menuItems(panel);
    const clips = measureClipPaths(trigger, panel);
    clipRef.current = clips;
    const parts = resolveParts(trigger, disk, coreWrap);
    pinHoleLayers(parts.holeLayers, clips.holeX, clips.holeY);

    if (prefersReducedMotion) {
      timelineRef.current?.kill();
      timelineRef.current = null;
      stopSpin();
      clearFlight(flight);

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
          visibility: "visible",
          scale: 1,
          rotate: 0,
          x: 0,
          y: 0,
          filter: "blur(0px)",
        });
        if (parts.lines) gsap.set(parts.lines, { opacity: 0, scale: 0.2 });
        hideHoleLayers(parts.holeLayers);
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
        hideHoleLayers(parts.holeLayers);
        hideClose(parts.close);
        const wasOpen = isOpenRef.current;
        isOpenRef.current = false;
        if (wasOpen) notifyCloseComplete();
      }
      return;
    }

    // ——— OPEN ———
    if (open) {
      timelineRef.current?.kill();
      clearFlight(flight);

      applyClip(panel, clips.open);
      gsap.set(panel, { visibility: "visible", pointerEvents: "none" });

      const samples = samplePulls(items, clips.holeX, clips.holeY);
      if (flight) {
        parkItemsInHole(samples, flight, clips.holeX, clips.holeY);
      }
      applyClip(panel, clips.closed);

      hideHoleLayers(parts.holeLayers);
      if (parts.lines) {
        gsap.set(parts.lines, { opacity: 1, scale: 1, rotate: 0 });
      }
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

      morphToBlackhole(tl, parts, clips.holeX, clips.holeY, 0);

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
        flight,
      );

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
      if (parts.holeLayers.length) {
        tl.to(
          parts.holeLayers,
          {
            opacity: 0,
            scale: 0.35,
            duration: 0.32,
            ease: "power2.in",
            onComplete: () => {
              hideHoleLayers(parts.holeLayers);
              stopSpin();
            },
          },
          xAt + 0.1,
        );
      }

      return;
    }

    // ——— CLOSE ———
    if (
      isOpenRef.current ||
      (timelineRef.current && timelineRef.current.progress() > 0)
    ) {
      timelineRef.current?.kill();
      clearFlight(flight);

      const closedClip = clipRef.current?.closed ?? clips.closed;
      const samples = samplePulls(items, clips.holeX, clips.holeY);

      if (parts.lines) {
        gsap.set(parts.lines, { opacity: 0, scale: 0.35 });
      }

      const tl = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: () => {
          isOpenRef.current = false;
          hideClose(parts.close);
          clearFlight(flight);
          gsap.set(overlay, {
            opacity: 0,
            visibility: "hidden",
            pointerEvents: "none",
          });
          applyClip(panel, closedClip);
          gsap.set(panel, { pointerEvents: "none" });
          resetItemsAtRest(items);
          notifyCloseComplete();
        },
      });
      timelineRef.current = tl;

      if (parts.holeLayers.length) {
        pinHoleLayers(parts.holeLayers, clips.holeX, clips.holeY);
        parts.holeLayers.forEach((layer) => {
          gsap.set(layer, {
            visibility: "visible",
            opacity: 0,
            scale: 0.4,
          });
        });
        startSpin(parts.rings);
        tl.to(
          parts.holeLayers,
          {
            opacity: 1,
            scale: 1.25,
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
        flight,
      );

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

      morphToBurger(tl, parts, collapseAt + collapseDur * 0.4);

      return;
    }

    clearFlight(flight);
    gsap.set(overlay, {
      opacity: 0,
      visibility: "hidden",
      pointerEvents: "none",
    });
    applyClip(panel, clips.closed);
    gsap.set(panel, { pointerEvents: "none" });
    resetItemsAtRest(items);
    if (parts.lines) gsap.set(parts.lines, { opacity: 1, scale: 1, rotate: 0 });
    hideHoleLayers(parts.holeLayers);
    hideClose(parts.close);
    stopSpin();
    const wasOpen =
      isOpenRef.current ||
      Boolean(timelineRef.current && timelineRef.current.progress() > 0);
    isOpenRef.current = false;
    if (!open && wasOpen) notifyCloseComplete();
  }, [open, prefersReducedMotion, triggerRef]);

  return { overlayRef, panelRef, diskRef, coreRef, flightRef };
}
