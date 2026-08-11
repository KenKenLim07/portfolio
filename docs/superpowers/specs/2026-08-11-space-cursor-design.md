# Space Cursor — Design Spec

**Date:** 2026-08-11  
**Status:** Approved for planning  
**Feature:** Custom spaceship cursor for the portfolio

## Goal

Replace the system arrow cursor on fine-pointer devices with a small spaceship that follows the pointer, rotates toward movement, and shows a subtle accent glow on interactive targets — matching the site’s space theme.

## Decisions (locked)

| Choice | Decision |
|--------|----------|
| Cursor type | Small spaceship / rocket replacing the arrow |
| Interactive feedback | Same size; soft accent glow only |
| Orientation | Rotate to face movement direction |
| Implementation | Hidden system cursor + floating SVG (`SpaceCursor` client component) |

## Behavior & scope

- **Desktop / fine pointer only** — enable when `(hover: hover) and (pointer: fine)` matches. Touch devices keep the system cursor.
- **Hide** the native cursor while the custom cursor is active (`html.has-space-cursor { cursor: none }`).
- **Ship** — inline SVG (~20–28px), geometric craft (triangle body, short wings, soft thruster tip). No emoji. Colors from theme CSS variables (`--accent-from`, `--foreground` / stroke).
- **Follow** — smooth lerp toward pointer (light lag, not sticky).
- **Rotate** — nose toward velocity; when nearly still, keep last heading.
- **Interactive (“hot”)** — when over `a`, `button`, `[role="button"]`, `input`, `textarea`, `select`, `label`, `summary`, or `.cursor-pointer`: add glow class; **do not** scale.
- **Reduced motion** — if `prefers-reduced-motion: reduce`: snap to pointer (no lerp), fixed orientation (no spin), glow still allowed.
- **Leave window** — hide ship; restore system cursor until pointer re-enters.
- **Text fields** — over `input` / `textarea` / `[contenteditable]`, show the **system I-beam** (temporarily disable custom cursor) so typing stays precise.

## Components & tech

| Piece | Role |
|--------|------|
| `src/components/SpaceCursor.tsx` | Client component: rAF follow + rotation; interactive hit-test; mount/unmount media listeners |
| `src/app/globals.css` | `.has-space-cursor`, `.space-cursor`, `.space-cursor--hot` styles |
| `src/app/layout.tsx` | Mount `<SpaceCursor />` once beside `SiteBackground` |

### Interaction detection

Use `document.elementFromPoint` + `closest(...)` against the interactive selector list above. Toggle a `--hot` class for accent glow (transition ~200ms).

### Performance & a11y

- Single `requestAnimationFrame` loop while the pointer is active/moving; no GSAP for this feature.
- Cursor element: `pointer-events: none`, high z-index (above UI, below any modal if needed — prefer `z-[100]` or site max + 1), `aria-hidden="true"`.
- Keep existing `cursor-pointer` classes on clickable elements for fallback when custom cursor is off.
- Do not rely on hover-only for primary actions (mobile unchanged).
- No continuous decorative loop on the ship (no infinite thruster spin).

## UX constraints (from ui-ux-pro-max)

- Respect `prefers-reduced-motion`.
- Glow / state transitions in the 150–300ms range.
- SVG only for the ship mark.
- Desktop custom cursor; touch uses system cursor.

## Out of scope

- Mobile / coarse-pointer custom cursor
- Click ripples, particle trails, or sound
- Per-page cursor variants
- Replacing form I-beam with the ship

## Acceptance criteria

1. On a desktop fine pointer, the system arrow is hidden and a spaceship follows the pointer.
2. The ship rotates toward movement; idle keeps last heading.
3. Over links/buttons (and listed interactive targets), a soft accent glow appears without size change.
4. Over text inputs, the system I-beam is used instead of the ship.
5. Touch / coarse pointers never get `cursor: none` or the floating ship.
6. Reduced-motion users get snap follow and no rotation.
7. Leaving the window hides the ship; re-entering restores it.
