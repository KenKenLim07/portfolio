import {
  ABOUT,
  HERO_AVAILABILITY,
  HERO_CAPABILITIES,
  PROJECTS,
  SITE,
  SOCIAL_LINKS,
  TECH_STACK,
} from "@/lib/constants";

function absoluteUrl(path: string): string {
  const base = SITE.url.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Curated portfolio facts injected into the chat system prompt. */
export function buildPortfolioKnowledge(): string {
  const projects = PROJECTS.map(
    (p) =>
      `### ${p.title} (id: ${p.id})\n` +
      `- Category: ${p.category}${p.featured ? " (featured)" : ""}\n` +
      `- ${p.description}\n` +
      `- Stack: ${p.stack.join(", ")}\n` +
      (p.liveUrl ? `- Live demo: ${p.liveUrl}\n` : "") +
      (p.githubUrl ? `- Source code: ${p.githubUrl}\n` : "") +
      `- Portfolio case study: ${absoluteUrl(`/projects/${p.id}`)}`,
  ).join("\n\n");

  const canonicalLinks = PROJECTS.flatMap((p) => {
    const links: string[] = [];
    if (p.liveUrl) links.push(`${p.title} live → ${p.liveUrl}`);
    if (p.githubUrl) links.push(`${p.title} GitHub → ${p.githubUrl}`);
    links.push(`${p.title} on this portfolio → ${absoluteUrl(`/projects/${p.id}`)}`);
    return links;
  }).join("\n");

  const capabilities = HERO_CAPABILITIES.map(
    (c) => `- **${c.title}:** ${c.description}`,
  ).join("\n");

  return `# Portfolio knowledge for ${SITE.name}

## Profile
- Name: ${SITE.name}
- Role: ${SITE.role}
- Tagline: ${SITE.tagline}
- Description: ${SITE.description}
- Portfolio website: ${SITE.url}
- Email: ${SITE.email}
- Resume PDF: ${absoluteUrl(SITE.resumeUrl)}
- Availability: ${HERO_AVAILABILITY}

## Canonical links (copy EXACTLY — never change domains, paths, or spelling)
- Portfolio home: ${SITE.url}
- Resume PDF: ${absoluteUrl(SITE.resumeUrl)}
- GitHub profile: ${SOCIAL_LINKS.github}
- LinkedIn: ${SOCIAL_LINKS.linkedin}
- Facebook: ${SOCIAL_LINKS.facebook}
${canonicalLinks}

## About
${ABOUT.lead}

Belief: ${ABOUT.belief}

${ABOUT.paragraphs.join("\n\n")}

## Capabilities
${capabilities}

## Projects
${projects}

## Tech stack
- Frontend: ${TECH_STACK.frontend.join(", ")}
- Backend: ${TECH_STACK.backend.join(", ")}
- AI: ${TECH_STACK.ai.join(", ")}

## FAQ
- How to contact: Use the contact form on ${SITE.url} or email ${SITE.email}.
- Resume: ${absoluteUrl(SITE.resumeUrl)}
- Availability: ${HERO_AVAILABILITY}.
- What he builds: Full-stack web apps, AI/NLP systems, scraping pipelines, dashboards, and premium business websites.
- Note: Project source repos are mostly under github.com/itskenlim; personal GitHub profile is ${SOCIAL_LINKS.github}.
`;
}

export function buildChatSystemPrompt(): string {
  return `You are a helpful assistant on ${SITE.name}'s personal portfolio website (${SITE.url}).
Answer questions about ${SITE.name}'s work, skills, projects, and how to get in touch.

Rules:
- Use ONLY the portfolio knowledge below. Do not invent employers, job titles, dates, clients, metrics, or skills that are not present.
- For URLs: copy them EXACTLY from the "Canonical links" section. Never guess, shorten, or modify a URL. If a URL is not listed, say you don't have it and suggest the contact form.
- Do not use placeholder domains like portfolio.example.com or made-up Vercel links.
- If something is unknown or not in the knowledge, say you don't have that detail and suggest emailing ${SITE.email} or using the contact form on ${SITE.url}.
- Keep answers concise (2–4 short paragraphs or a short bullet list). Be professional and friendly.
- When sharing project links, prefer the exact Live demo and Source code URLs from Canonical links.
- Do not discuss topics unrelated to ${SITE.name}'s portfolio except to politely redirect.

## Portfolio knowledge
${buildPortfolioKnowledge()}`;
}
