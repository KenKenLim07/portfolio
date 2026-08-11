# Space Cursor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a desktop-only custom spaceship cursor that follows the pointer, rotates toward movement, and glows on interactive targets.

**Architecture:** A single client component (`SpaceCursor`) mounts from the root layout. On fine-pointer devices it hides the system cursor via an `html` class, drives a fixed SVG with `requestAnimationFrame` (lerp + heading), and toggles a hot glow via `elementFromPoint`. Touch devices and text fields keep the system cursor. No GSAP.

**Tech Stack:** Next.js App Router, React client component, CSS variables / `globals.css`, `matchMedia` for pointer + reduced-motion.

**Spec:** `docs/superpowers/specs/2026-08-11-space-cursor-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `src/components/SpaceCursor.tsx` | Create — pointer tracking, rotation, hot/text-field logic, SVG ship |
| `src/app/globals.css` | Modify — hide native cursor, ship + hot glow styles |
| `src/app/layout.tsx` | Modify — mount `<SpaceCursor />` once |

---

### Task 1: Add cursor CSS

**Files:**
- Modify: `src/app/globals.css` (append after existing utility blocks, e.g. near `.process-card` or at end of interaction utilities)

- [ ] **Step 1: Append space-cursor styles**

Add this block to `src/app/globals.css`:

```css
/* Space cursor — desktop fine-pointer only (class set by SpaceCursor) */
html.has-space-cursor,
html.has-space-cursor * {
  cursor: none !important;
}

html.has-space-cursor.has-space-cursor-text,
html.has-space-cursor.has-space-cursor-text * {
  cursor: text !important;
}

.space-cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  pointer-events: none;
  opacity: 0;
  will-change: transform, opacity;
  color: var(--accent-from);
  filter: drop-shadow(0 0 0 transparent);
  transition:
    opacity 0.15s ease,
    filter 0.2s ease,
    color 0.2s ease;
}

.space-cursor.is-visible {
  opacity: 1;
}

.space-cursor--hot {
  color: var(--accent-to);
  filter: drop-shadow(0 0 6px color-mix(in oklab, var(--accent-from) 70%, transparent));
}

.space-cursor svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
```

- [ ] **Step 2: Sanity-check CSS loads**

Run: `npm run dev` (or confirm already running) and open the site — no visual change yet until the component mounts.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "$(cat <<'EOF'
Add space cursor CSS foundation.

EOF
)"
```

---

### Task 2: Build `SpaceCursor` component

**Files:**
- Create: `src/components/SpaceCursor.tsx`

- [ ] **Step 1: Create the component with full behavior**

```tsx
"use client";

import { useEffect, useRef } from "react";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const INTERACTIVE =
  "a,button,[role='button'],input,textarea,select,label,summary,.cursor-pointer";

const TEXT_FIELD = "input,textarea,[contenteditable='true'],[contenteditable='']";

const LERP = 0.28;
const MIN_SPEED = 0.4;

function isTextField(el: Element | null): boolean {
  if (!el) return false;
  return Boolean(el.closest(TEXT_FIELD));
}

function isInteractive(el: Element | null): boolean {
  if (!el || isTextField(el)) return false;
  return Boolean(el.closest(INTERACTIVE));
}

/** Geometric spaceship — nose points toward +Y in local SVG (rotated in JS). */
function ShipMark() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden fill="none">
      <path
        d="M14 3 L20 18 L14 15 L8 18 Z"
        fill="currentColor"
        fillOpacity="0.92"
      />
      <path
        d="M14 15 L18 22 L14 19.5 L10 22 Z"
        fill="currentColor"
        fillOpacity="0.45"
      />
      <circle cx="14" cy="11" r="1.4" fill="var(--background)" fillOpacity="0.85" />
    </svg>
  );
}

export function SpaceCursor() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fineMq = window.matchMedia(FINE_POINTER);
    const motionMq = window.matchMedia(REDUCED_MOTION);
    const root = document.documentElement;
    const el = elRef.current;
    if (!el) return;

    let enabled = fineMq.matches;
    let reduced = motionMq.matches;
    let raf = 0;
    let visible = false;
    let hot = false;
    let textMode = false;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let angle = -90; // nose-up default (SVG nose is +Y after CSS rotate)
    let prevX = 0;
    let prevY = 0;
    let hasPoint = false;

    const setEnabledClass = (on: boolean) => {
      root.classList.toggle("has-space-cursor", on);
    };

    const setTextClass = (on: boolean) => {
      root.classList.toggle("has-space-cursor-text", on);
    };

    const show = (on: boolean) => {
      visible = on;
      el.classList.toggle("is-visible", on);
    };

    const setHot = (on: boolean) => {
      if (hot === on) return;
      hot = on;
      el.classList.toggle("space-cursor--hot", on);
    };

    const applyTransform = () => {
      // SVG nose points down (+Y); rotate so nose follows heading where 0° = right.
      // Movement angle from atan2(dy, dx) is 0° = right; ship local nose is +Y = 90° CSS.
      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle + 90}deg)`;
    };

    const hitTest = (clientX: number, clientY: number) => {
      el.style.visibility = "hidden";
      const under = document.elementFromPoint(clientX, clientY);
      el.style.visibility = "";

      const nextText = isTextField(under);
      if (nextText !== textMode) {
        textMode = nextText;
        setTextClass(textMode);
        show(enabled && hasPoint && !textMode);
      }

      if (textMode) {
        setHot(false);
        return;
      }

      setHot(isInteractive(under));
    };

    const tick = () => {
      raf = 0;
      if (!enabled || !hasPoint || textMode) return;

      const dx = targetX - x;
      const dy = targetY - y;

      if (reduced) {
        x = targetX;
        y = targetY;
      } else {
        x += dx * LERP;
        y += dy * LERP;

        const vx = x - prevX;
        const vy = y - prevY;
        const speed = Math.hypot(vx, vy);
        if (speed > MIN_SPEED) {
          angle = (Math.atan2(vy, vx) * 180) / Math.PI;
        }
        prevX = x;
        prevY = y;
      }

      applyTransform();

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!enabled) return;
      targetX = e.clientX;
      targetY = e.clientY;

      if (!hasPoint) {
        hasPoint = true;
        x = targetX;
        y = targetY;
        prevX = x;
        prevY = y;
        applyTransform();
      }

      hitTest(e.clientX, e.clientY);

      if (!textMode) show(true);

      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      hasPoint = false;
      show(false);
      setHot(false);
      textMode = false;
      setTextClass(false);
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const syncMedia = () => {
      enabled = fineMq.matches;
      reduced = motionMq.matches;
      setEnabledClass(enabled);
      if (!enabled) {
        onLeave();
        setEnabledClass(false);
        setTextClass(false);
      }
    };

    syncMedia();
    fineMq.addEventListener("change", syncMedia);
    motionMq.addEventListener("change", syncMedia);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      fineMq.removeEventListener("change", syncMedia);
      motionMq.removeEventListener("change", syncMedia);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      if (raf) cancelAnimationFrame(raf);
      setEnabledClass(false);
      setTextClass(false);
    };
  }, []);

  return (
    <div
      ref={elRef}
      className="space-cursor"
      aria-hidden
    >
      <ShipMark />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck the new file**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | head -40`  
Expected: no errors related to `SpaceCursor.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/SpaceCursor.tsx
git commit -m "$(cat <<'EOF'
Add SpaceCursor spaceship pointer component.

EOF
)"
```

---

### Task 3: Mount in root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Import and render `SpaceCursor`**

In `src/app/layout.tsx`:

1. Add import:

```tsx
import { SpaceCursor } from "@/components/SpaceCursor";
```

2. Inside `<ThemeProvider>`, mount next to `SiteBackground`:

```tsx
<ThemeProvider>
  <SiteBackground />
  <SpaceCursor />
  <GsapProvider>{children}</GsapProvider>
</ThemeProvider>
```

- [ ] **Step 2: Build**

Run: `npm run build`  
Expected: compile succeeds.

- [ ] **Step 3: Manual acceptance (desktop)**

With `npm run dev` open on a mouse/trackpad:

1. System arrow hidden; spaceship follows pointer.
2. Ship rotates toward movement; idle keeps last heading.
3. Hover a nav link / button → accent glow, same size.
4. Focus a contact form text field → system I-beam; ship hidden.
5. Move pointer out of the window → ship hides.
6. (If available) DevTools device mode / touch → no `cursor: none`, no ship.
7. (Optional) emulate `prefers-reduced-motion: reduce` → snap follow, no rotation.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "$(cat <<'EOF'
Mount SpaceCursor in the root layout.

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Fine-pointer only | Task 2 (`FINE_POINTER` + `has-space-cursor`) |
| Hide native cursor | Task 1 + Task 2 |
| SVG ship + accent colors | Task 2 (`ShipMark` + `currentColor`) |
| Lerp follow | Task 2 (`LERP`) |
| Rotate toward movement | Task 2 (`atan2` + transform) |
| Hot glow, no scale | Task 1 `.space-cursor--hot` + Task 2 `setHot` |
| Reduced motion | Task 2 (`reduced` branch) |
| Leave window hide | Task 2 (`pointerleave` / `blur`) |
| Text field I-beam | Task 1 `.has-space-cursor-text` + Task 2 `TEXT_FIELD` |
| Mount once in layout | Task 3 |
| No GSAP / no infinite thruster spin | Task 2 (rAF only) |

## Out of scope (do not implement)

- Particle trails, click ripples, sound
- Mobile custom cursor
- Per-page variants
