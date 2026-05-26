# Project Details Pages (Selected Projects) Design

## Goal
Match Tajmirul’s “Selected Projects” interaction:
- The homepage shows *selected projects* in a compact format (project title + a few techstack items).
- Clicking a project opens a dedicated **project details** screen that shows the full story, full tech stack, and project links.
- The details screen includes a clear **Back** button to return to the homepage projects section.

## Non-goals
- Introducing a CMS/DB or external content pipeline.
- Rewriting the entire Projects UI layout (filters + rail behavior can remain).

## UX / Behavior
### Homepage: `Selected Projects`
- Keep the existing category filters (`All`, `AI Systems`, `Web Apps`, `Commerce`).
- The “featured” card at the top of the section becomes the click target for details.
- The rail cards become click targets as well (optional: still update the featured card when clicked).
- Featured + rail cards should be visually minimal:
  - Show project `title`
  - Show `stack` preview chips (few items)
  - Hide the long description and the inline “Live Demo / GitHub” buttons (those move to the details page)

### Details page: `/projects/[id]`
- A top “Back” control returns to `/#projects`.
- Hero area:
  - Use `project.image` with the same gradient overlay approach already used in `ProjectCard`.
  - Show `project.title`.
  - Show `project.description` as the **story** (full text).
- Full tech stack:
  - Render all `project.stack` items as chips.
  - If available, display brand icons using `src/components/TechBrandIcon.tsx` (fallback to Lucide for items without official brand icons).
- Links:
  - Render “Live Demo” if `project.liveUrl` exists.
  - Render “GitHub” if `project.githubUrl` exists.

## Data model
Use the existing static data:
- `src/lib/constants.ts` → `PROJECTS` array

Re-use:
- `project.description` as the story content on the details page.
- `project.stack` as the full tech stack content on the details page.

Optional normalization:
- Ensure stack strings match what `TechBrandIcon` expects where possible (e.g. prefer `"VADER NLP"` over `"VADER"`), so the details page can show brand icons reliably.

## Routing / Rendering
- Add a route: `src/app/projects/[id]/page.tsx`
- Pre-render using `generateStaticParams()` derived from `PROJECTS`.
- In the page:
  - Find the project by `id`.
  - If not found, render `notFound()`.

## Accessibility
- Cards are rendered as semantic `button`/links with focus rings.
- “Back” is a normal link so keyboard navigation works.
- Ensure external links (`Live Demo`, `GitHub`) use `target="_blank"` + `rel="noopener noreferrer"`.

## Implementation outline (high level)
1. Create `/projects/[id]` details page that renders story, full stack, and links.
2. Update `ProjectCard` to support a “minimal card” mode:
   - remove description paragraph + inline links
   - keep title + tech preview chips
3. Update `ProjectsSection` so clicking any project navigates to `/projects/[id]`.

