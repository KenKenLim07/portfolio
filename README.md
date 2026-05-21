# Premium Developer Portfolio

A cinematic, dark-mode portfolio built with Next.js (App Router), Tailwind CSS, TypeScript, and Framer Motion.

## Stack

- **Next.js 16** — App Router, static generation, SEO metadata
- **Tailwind CSS v4** — Design tokens, glass effects, responsive layout
- **Framer Motion** — Scroll reveals, stagger animations, reduced-motion support
- **Lucide React** — UI icons (brand icons via inline SVG)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Customize

Edit `src/lib/constants.ts` for:

- Name, role, email, tagline
- Navigation links
- Featured projects (images in `public/projects/`)
- Services, tech stack, process steps
- Social URLs

Optional environment variables:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Deploy

Deploy to [Vercel](https://vercel.com) with zero config:

```bash
npm run build
```

## Project structure

```
src/
├── app/              # Layout, page, global styles
├── components/       # Section components + UI primitives
├── components/icons/ # Brand SVG icons
└── lib/              # Constants, motion variants, utils
```
# portfolio
