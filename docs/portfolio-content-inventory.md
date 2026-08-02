# Portfolio Content Inventory

A complete text/content audit from **Hero → Contact**, for reframing and copy rewrites.

> **Source of truth:** Most narrative copy lives in `src/lib/constants.ts`. Section headings and UI labels are in the respective component files.

---

## Global Identity

Used across the site (meta tags, footer, hero intro, etc.).

| Field | Current text |
|-------|--------------|
| **Name** | Jose Marie Lim |
| **Role** | Full-Stack Developer & AI Systems Engineer |
| **Tagline** (OG/Twitter title) | Building Intelligent Digital Systems |
| **Description** (meta + hero intro) | From modern interfaces to intelligent systems — designing and engineering products powered by data, automation, and AI |
| **Email** | josemarelim7@gmail.com |

**SEO keywords:** fullstack developer, AI systems engineer, Next.js, premium web development, portfolio

---

## Navigation

**Nav links:** Home · About · Projects · Tech Stack · Contact

**Hero side rail:** Social (GitHub, LinkedIn, Email)

---

## 1. Hero

*Current layout — `ENABLE_HERO_BRAIN = false`*

### Rotating roles

Cycles every 3.8s:

- AI Systems Engineer
- Fullstack Developer
- Premium Web Architect
- Product-minded Engineer

### Main headline

```
Full-Stack
& AI Systems
Engineer
```

### Intro paragraph

> Hi! I'm **Jose Marie**. From modern interfaces to intelligent systems — designing and engineering products powered by data, automation, and AI

### CTAs

- View projects
- Get in touch

### Availability

- Open to new projects

### Metrics

| Value | Label |
|-------|-------|
| 7+ | Live products |
| Full-stack | + AI systems |
| End-to-end | Product delivery |

---

### Alternate hero (dormant)

*Only shown when `ENABLE_HERO_BRAIN = true`*

#### Capability pillars

Defined in `HERO_CAPABILITIES` — not wired to the current hero layout.

1. **AI & data systems** — NLP, scraping pipelines, sentiment analysis, and production dashboards.
2. **Full-stack delivery** — Next.js frontends with FastAPI, Supabase, Redis, and Dockerized backends.
3. **Products in the wild** — News intelligence, marketplace tooling, and premium business websites — live and maintained.

#### Knowledge graph panel (`MY_BRAIN`)

| Field | Text |
|-------|------|
| Title | Developer Knowledge Graph |
| Hint | A living network of technologies, systems, and lessons learned through building products, platforms, and AI-powered solutions. |
| Experience line | Tap, hover, or explore the neural pathways behind how I think and build. |
| Pipeline | Ingest → Encode → Reason → Deliver |
| 3D note | This is the 2D projection. The full 3D model reveals itself during collaboration. |
| Dynamic stat | `{N} synapses` (computed from graph edges) |

---

## 2. About

| Element | Text |
|---------|------|
| **Section heading** | About Me |
| **Intro** | Full-Stack Developer building modern web applications, intelligent automation, and AI-powered systems that transform data into practical solutions. |

### Quote (boxed)

> Great software isn't just built to work—it is built to solve real problems.

### Experience

I've built an NLP-powered news intelligence platform, automated data pipelines, marketplace analytics tools, and business websites, working across frontend, backend, web scraping, and data engineering.

### Tags (`ABOUT_TAGS`)

- Full-Stack
- AI
- Automation
- NLP
- Web Scraping
- Data Engineering

---

## 3. Projects

| Element | Text |
|---------|------|
| **Section heading** | Selected Projects |
| **Description** | AI platforms, production web apps, and commerce tooling — shipped and maintained. |
| **Empty state** | No projects yet. |

### Project 01 — PH VibeCheck AI — Philippine News Intelligence

Undergraduate thesis (Best Paper Award in NLP line up): real-time Philippine news aggregation with automated scraping, VADER sentiment scores showing how outlets portray topics, spaCy entity extraction, and Pearson correlation analysis comparing how sources differ in tone — plus search, trends, and entity dashboards across major PH publishers.

**Stack:** Next.js, FastAPI, Supabase, Redis, Celery, Docker, DistilBERT, VADER NLP, spaCy

### Project 02 — Skyward Japanese Restaurant Website

Premium restaurant site for Skyward Japanese Cuisine in Iloilo — cinematic hero, featured menu, gallery, visit info, and mobile-first UX built for local discovery and reservations.

**Stack:** Next.js, TypeScript, Tailwind CSS, Framer Motion

### Project 03 — IAASE — Iloilo iPhone Deal Intelligence

Facebook Marketplace pipeline using GraphQL with Playwright fallback, dual accounts (discovery vs. monitoring), and Supabase storage. Benchmarks iPhone variants against Iloilo prices, then applies rule-based AI on titles and descriptions to flag red flags (no True Tone, no Face ID, broken/replaced screen, etc.) and deduct repair risk from estimated profit on the dashboard.

**Stack:** Next.js, Supabase, Playwright, GraphQL, Rule-based AI, TypeScript, PostgreSQL

### Project detail page labels

- Back
- Full Tech Stack
- Links
- Live Demo
- GitHub

### Defined but unused (`PROJECT_FILTERS`)

- All
- AI Systems
- Web Apps
- Commerce

---

## 4. Tech Stack

| Element | Text |
|---------|------|
| **Section heading** | My Stack |
| **Description** | Tools I use to build fast interfaces, reliable backends, and intelligent data products. |

### Frontend

Next.js, React, TypeScript, JavaScript, Tailwind CSS, Framer Motion, GSAP, Vite

### Backend

Node.js, FastAPI, Supabase, Firebase, Redis, Celery, Docker, PostgreSQL, Python

### AI / Data

DistilBERT, VADER NLP, spaCy

---

## 5. Process

| Element | Text |
|---------|------|
| **Section heading** | How I Work |
| **Description** | A minimal, repeatable process that keeps strategy, design, and engineering aligned. |

| Step | Title | Description |
|------|-------|-------------|
| 01 | Strategy | Define goals, audience, and technical requirements for a focused product direction. |
| 02 | Design | Craft premium UI systems with cinematic hierarchy, spacing, and interaction patterns. |
| 03 | Development | Build performant fullstack applications with clean architecture and modern tooling. |
| 04 | Optimization | Refine performance, SEO, accessibility, and analytics for measurable impact. |
| 05 | Launch | Deploy, monitor, and iterate with confidence on production infrastructure. |

---

## 6. Contact

| Element | Text |
|---------|------|
| **Heading** | Get in Touch |
| **Body** | Open to collaborations with brands, startups, and businesses ready to elevate their digital presence with premium engineering and design. |

### Quick links

Email · GitHub · LinkedIn · Messenger

### Form panel

| Element | Text |
|---------|------|
| **Heading** | Send a message |
| **Subtext** | Share your project details and I'll respond as soon as possible. |
| **Fields** | Name · Email · Message |
| **Submit button** | Send Message / Sending… |

### Form messages

| Type | Text |
|------|------|
| Validation | Please complete all fields before sending. |
| Success | Message sent. I'll get back to you soon. |
| Error | Something went wrong. Please try again or email directly. |
| Name required | Name is required. |
| Email required | Email is required. |
| Email invalid | Enter a valid email address. |
| Message required | Message is required. |

---

## Footer

*(Appears after Contact)*

| Element | Text |
|---------|------|
| **Name** | Jose Marie Lim |
| **Role line** | Full-Stack Developer & AI Systems Engineer |
| **Copyright** | © {year} Jose Marie Lim. All rights reserved. |
| **Watermark** | Jose (first name, decorative background text) |

---

## Where to edit

| Content | Location |
|---------|----------|
| Site identity, about, projects, process, tech stack, hero metrics | `src/lib/constants.ts` |
| Hero headline, CTAs, intro template | `src/components/HeroSection.tsx` |
| Rotating roles | `src/components/HeroRotatingText.tsx` |
| Section headings & inline copy | `src/components/*Section.tsx` |
| Contact form labels & messages | `src/components/ContactForm.tsx`, `src/lib/validation.ts` |
| SEO metadata | `src/app/layout.tsx` |

---

## Framing notes

Current voice is **capability-heavy and premium-agency** ("premium engineering," "cinematic," "intelligent systems") with three proof pillars: AI/data, full-stack delivery, and live products. The hero headline and rotating roles overlap — both communicate full-stack + AI in different words.

**Rewrite worksheet columns (optional):**

| Section | Current headline | Current proof | Current CTA |
|---------|------------------|---------------|-------------|
| Hero | Full-Stack & AI Systems Engineer | 7+ live products, metrics | View projects / Get in touch |
| About | About Me | Intro + quote + experience + tags | — |
| Projects | Selected Projects | 3 project descriptions | Open project detail |
| Tech Stack | My Stack | Tool lists | — |
| Process | How I Work | 5-step pipeline | — |
| Contact | Get in Touch | Collaboration pitch | Email / form |
