# About Section Scrub Exit — Design

**Date:** 2026-08-03  
**Status:** Implemented (About only)  
**Scope:** About section only (other sections unchanged until validated)

## Problem

Hero exit is **scroll-scrubbed** (suck-up tied to scroll, reverses on scroll up). About uses `AnimatedSection` → `createDirectionalScrollReveal`: **one-shot** enter/exit at thresholds. About Me heading + lead and the lower block do not feel consistent with the hero.

## Goal

About should match the hero motion model:

1. **Enter once** when `#about` comes into view (staggered fade-up).
2. **Scrubbed exit** while scrolling through/out of About (staggered suck-up).
3. **Scrub reverse** when scrolling back up (content comes back continuously).

## Non-goals

- Changing Projects / Tech / Process / Contact motion.
- Changing hero timing or dual-panel resize logic.
- Reworking About content/layout.

## Approach (approved: A)

Reuse the hero scrub pattern via a shared binder; About gets its own hook. Disable competing `AnimatedSection` tweens inside About only.

### 1. Shared scrub binder

- Generalize `bindHeroExitScrub` into a section-agnostic helper (e.g. `bindSectionExitScrub`) that accepts:
  - `section` trigger element
  - `layers` (same shape as `HeroExitLayer`)
  - scroll band config (start / end / scrub / hold / tween timing)
- Hero keeps current behavior by calling the shared helper with `heroScrollReveal` band values (thin wrapper or rename + alias).
- Do **not** add peak-lock / early-end experiments that previously caused rewind bugs.

### 2. About scroll band

Tied to `#about` (not each nested block):

| Setting | Intent |
|--------|--------|
| `start` | When About is established in view (e.g. top near upper viewport) |
| `end` | While leaving About (e.g. bottom crossing mid/lower viewport) — tuned so exit finishes while section is still readable, like hero |
| `scrub` | Same family as hero (`1.25`) for consistent feel |
| Hold then layered exit | Same structure as hero: dead zone → staggered `fromTo` opacity/y upward |

Exact `%` values tuned in implementation against desktop + mobile.

### 3. Layers (stagger order)

1. **Heading** — title (+ description if present)  
2. **Belief** — blockquote  
3. **Body** — paragraphs + Core Focus card (one layer, or light internal stagger)

Sequential suck-up like hero copy → rail.

### 4. About markup / hook

- `AboutSection` becomes a client island (or thin client child) with a content ref.
- Mark layer roots with data attributes (e.g. `data-about-layer="heading" | "belief" | "body"`).
- New hook `useAboutScrollReveal(contentRef)`:
  - One-shot enter when `#about` intersects (mirror hero mount entrance, not scrub-enter).
  - Then `bindSectionExitScrub` on `#about`.
  - `prefers-reduced-motion`: skip motion; leave content visible.

### 5. Disable old About motion

- About must **not** run `createDirectionalScrollReveal` on the same nodes.
- Options (pick simplest in implementation):
  - `SectionHeading` / blocks accept `animate={false}` and render static wrappers with `data-gsap-reveal` (or about-specific attrs) for the scrub hook; **or**
  - About inlines heading markup and drops `AnimatedSection` for this section only.
- Other sections keep using `SectionHeading` + `AnimatedSection` unchanged.

### 6. CSS

- Reuse existing `.gsap-reveal` / `.gsap-bound` rules where possible so pre-hydrate state stays opacity 0 until bound.
- No hero-only CSS hacks that force About opacity 1.

## Success criteria

- Scroll down through About: heading → belief → body suck up continuously with scroll.
- Scroll back up: same content scrubs back in (not a separate one-shot “pop from above”).
- First arrival from hero: clear staggered enter (not blank, not already fully painted without motion).
- Hero exit unchanged; no early rewind regression on hero.
- Resize across breakpoints does not blank About (single panel — no dual mobile/desktop trees).

## Risks

| Risk | Mitigation |
|------|------------|
| Double animation (scrub + AnimatedSection) | Hard-disable About directional reveals |
| Enter fights exit scrub | Bind exit only after enter completes (same as hero) |
| Scroll band too short/long | Tune start/end with markers off; match hero feel |
| Shared refactor breaks hero | Keep hero wrapper calling shared binder with identical config |

## Follow-up (out of scope)

If About feels right, apply the same hook pattern to Projects → Tech → Process (not Contact `last` variant without care).
