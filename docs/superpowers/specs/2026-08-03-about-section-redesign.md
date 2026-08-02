# About Me section redesign

**Date:** 2026-08-03  
**Status:** Approved for planning  
**Goal:** Replace the bloated multi-paragraph About section with a recruiter-scannable stacked layout that keeps personality via a quoted belief.

## Context

The current About section (`AboutSection.tsx` + `ABOUT` / `ABOUT_HIGHLIGHTS` in `constants.ts`) combines:

- A long `SectionHeading` lead
- A large belief blockquote
- Additional body paragraph(s)
- A glass “Core Focus” card with nine checklist items

That reads as a wall of sentences. The user wants a clearer visual rhythm and less text, optimized for a ~10-second recruiter skim, without feeling overly compressed.

## Decision

**Layout: Stacked skim** (approved)

1. Heading — “About Me” (keep existing mega `SectionHeading` title treatment; **no** long description prop)
2. One short introduction paragraph
3. Quote — boxed visual break (accent left border)
4. One short credibility / project-experience paragraph
5. Skill tags / pills (six chips; **replace** the Core Focus checklist card)

**Not chosen:** chips-first or split two-column layouts (explored in brainstorm; stacked matches the user’s sketch and preferred pacing).

## Content (locked)

```text
Full-Stack Developer building modern web applications, intelligent automation, and AI-powered systems that transform data into practical solutions.

“Great software isn’t just built to work—it is built to solve real problems.”

I’ve built an NLP-powered news intelligence platform, automated data pipelines, marketplace analytics tools, and business websites, working across frontend, backend, web scraping, and data engineering.

[ Full-Stack ] [ AI ] [ Automation ] [ NLP ] [ Web Scraping ] [ Data Engineering ]
```

## Visual / UX

- Preserve site tokens (slate studio neutrals, indigo accent `--accent-from`).
- Quote: surface panel, subtle border, **3px accent left border**, display/semibold quote type — one clear visual break between intro and credibility.
- Tags: compact outline pills (not a glass checklist with Check icons). No emoji icons.
- Spacing: generous vertical rhythm between the five blocks (intro / quote / credibility / tags) so the section does not feel “jumpy” or over-compressed.
- Motion: keep existing `AnimatedSection` / reveal patterns; stagger blocks lightly if already used elsewhere.
- Respect `prefers-reduced-motion`.
- Responsive: single column at all breakpoints; tags wrap; no side Core Focus column.
- Interactive chips are non-links unless product later adds filter behavior — default is static labels with no cursor-pointer unless they become actionable.

## Implementation scope

### In scope

- Rewrite `ABOUT` (and related) constants to match locked copy + tag list.
- Rebuild `AboutSection.tsx` to the five-block stacked structure.
- Remove unused Core Focus / `ABOUT_HIGHLIGHTS` usage from About (delete or leave unused export only if still referenced elsewhere — prefer remove dead About-only data).
- Drop `SectionHeading` `description={ABOUT.lead}` (intro moves into the body stack).

### Out of scope

- Hero, projects, contact, or global design-system changes.
- New fonts or color themes.
- Making skill chips filter the projects grid.

## Success criteria

- About is scannable in one viewport on desktop without reading three dense paragraphs.
- Quote is visually distinct as a break, not another body paragraph.
- Six skill pills are visible without a checklist card.
- Copy matches the locked text above (aside from typographic quotes / apostrophe normalization).
- No layout regression on 375px–1440px; no horizontal scroll.

## Files likely touched

- `src/components/AboutSection.tsx`
- `src/lib/constants.ts` (`ABOUT`, `ABOUT_HIGHLIGHTS` / new `ABOUT_TAGS`)
