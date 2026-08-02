# About Me Section Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the About section into a stacked skim layout: heading → intro → boxed quote → credibility paragraph → six skill pills, using the locked copy from the design spec.

**Architecture:** Keep content in `src/lib/constants.ts` (`ABOUT` + `ABOUT_TAGS`). Replace the current lead + belief wall + Core Focus checklist in `AboutSection.tsx` with a single-column stack that reuses `Section`, `SectionHeading` (title only), `AnimatedSection` / `AnimatedItem`, and existing `Badge` chips. No new routes or design tokens.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, existing GSAP reveal wrappers (`AnimatedSection`), Lucide removed from About (no Check list).

**Spec:** `docs/superpowers/specs/2026-08-03-about-section-redesign.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/constants.ts` | Locked About copy + `ABOUT_TAGS`; remove dead `ABOUT_HIGHLIGHTS` / unused About fields |
| `src/components/AboutSection.tsx` | Stacked skim UI |
| `docs/portfolio-content-inventory.md` | Keep inventory accurate if it documents old About fields (light edit only) |

---

### Task 1: Update About content constants

**Files:**
- Modify: `src/lib/constants.ts` (About block near end of file)
- Modify (if present): `docs/portfolio-content-inventory.md` About section only

- [ ] **Step 1: Replace the About data shape**

Replace the existing `ABOUT` / `ABOUT_HIGHLIGHTS` / `ABOUT_EXPERIENCE` block with:

```ts
export const ABOUT = {
  intro:
    "Full-Stack Developer building modern web applications, intelligent automation, and AI-powered systems that transform data into practical solutions.",
  quote:
    "Great software isn't just built to work—it is built to solve real problems.",
  experience:
    "I've built an NLP-powered news intelligence platform, automated data pipelines, marketplace analytics tools, and business websites, working across frontend, backend, web scraping, and data engineering.",
} as const;

export const ABOUT_TAGS = [
  "Full-Stack",
  "AI",
  "Automation",
  "NLP",
  "Web Scraping",
  "Data Engineering",
] as const;
```

Remove exports that become unused:

- `ABOUT_HIGHLIGHTS`
- `ABOUT_EXPERIENCE`
- Old `ABOUT` keys: `belief`, `title`, `lead`, `paragraphs`

- [ ] **Step 2: Fix any broken imports**

Run:

```bash
rg "ABOUT_HIGHLIGHTS|ABOUT_EXPERIENCE|ABOUT\.(belief|lead|paragraphs|title)" src docs
```

Expected: only `AboutSection.tsx` (still old) and possibly `docs/portfolio-content-inventory.md`. Update the inventory About subsection to describe `ABOUT` + `ABOUT_TAGS` instead of the removed fields (do not rewrite unrelated inventory sections).

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts docs/portfolio-content-inventory.md
git commit -m "$(cat <<'EOF'
Update About copy and tags for stacked skim layout.

EOF
)"
```

---

### Task 2: Rebuild `AboutSection` stacked layout

**Files:**
- Modify: `src/components/AboutSection.tsx` (replace entire file)

- [ ] **Step 1: Implement the stacked section**

Replace `src/components/AboutSection.tsx` with:

```tsx
import { ABOUT, ABOUT_TAGS } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";

export function AboutSection() {
  return (
    <Section id="about">
      <SectionHeading label="" title="About Me" className="mb-10 md:mb-12" />

      <AnimatedSection className="flex max-w-3xl flex-col gap-8 md:gap-10">
        <AnimatedItem>
          <p className="text-base leading-relaxed text-muted md:text-lg md:leading-relaxed">
            {ABOUT.intro}
          </p>
        </AnimatedItem>

        <AnimatedItem>
          <figure className="radius-panel border border-border border-l-[3px] border-l-[var(--accent-from)] bg-surface px-5 py-5 md:px-6 md:py-6">
            <blockquote className="font-display text-xl font-semibold leading-snug tracking-tight text-foreground md:text-2xl">
              &ldquo;{ABOUT.quote}&rdquo;
            </blockquote>
          </figure>
        </AnimatedItem>

        <AnimatedItem>
          <p className="text-base leading-relaxed text-muted md:text-lg md:leading-relaxed">
            {ABOUT.experience}
          </p>
        </AnimatedItem>

        <AnimatedItem>
          <ul className="flex list-none flex-wrap gap-2 p-0">
            {ABOUT_TAGS.map((tag) => (
              <li key={tag}>
                <Badge>{tag}</Badge>
              </li>
            ))}
          </ul>
        </AnimatedItem>
      </AnimatedSection>
    </Section>
  );
}
```

Notes for the implementer:

- Do **not** pass `description` to `SectionHeading`.
- Do **not** reintroduce the glass Core Focus card or `Check` icons.
- `gap-8 md:gap-10` is the intentional breathing room between blocks.
- Quote uses `border-l-[3px]` + accent token for the visual break from the spec.
- `Badge` already provides outline pills; no `cursor-pointer` (static labels).
- Typographic quotes via `&ldquo;` / `&rdquo;` around `ABOUT.quote` (quote string itself has no wrapping quotes).

- [ ] **Step 2: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: exit code `0`.

- [ ] **Step 3: Visual check**

Run the dev server if not already running (`npm run dev`), open `/#about`, and verify:

- Heading only (no long lead under the title)
- Intro → boxed quote → experience → six pills
- Generous space between blocks
- No horizontal scroll at ~375px width
- Reduced-motion still shows content (reveal wrappers already handle this)

- [ ] **Step 4: Commit**

```bash
git add src/components/AboutSection.tsx
git commit -m "$(cat <<'EOF'
Rebuild About section as stacked skim layout.

EOF
)"
```

---

### Task 3: Spec self-check (done by implementer before claiming complete)

- [ ] **Step 1: Walk the success criteria**

From `docs/superpowers/specs/2026-08-03-about-section-redesign.md`:

| Criterion | How to verify |
|-----------|----------------|
| Scannable, not three dense paragraphs | Visual: four content beats only |
| Quote visually distinct | Accent left border + surface panel |
| Six skill pills, no checklist card | Count pills; no `Check` / glass card |
| Copy matches locked text | Diff against spec Content section |
| Responsive 375–1440 | Resize; no overflow-x |

- [ ] **Step 2: Confirm no leftover About APIs**

```bash
rg "ABOUT_HIGHLIGHTS|ABOUT_EXPERIENCE|ABOUT\.(belief|lead|paragraphs|title)" src
```

Expected: no matches under `src/`.

---

## Spec coverage (plan self-review)

| Spec requirement | Task |
|------------------|------|
| Stacked skim structure | Task 2 |
| Locked copy + six tags | Task 1 |
| Boxed quote with accent border | Task 2 |
| Remove Core Focus / highlights | Tasks 1–2 |
| Drop SectionHeading description | Task 2 |
| Keep mega title + motion | Task 2 |
| Out of scope (hero/projects/filters) | Not scheduled |
