import {
  ABOUT,
  HERO_AVAILABILITY,
  HERO_CAPABILITIES,
  PROJECTS,
  SITE,
  SOCIAL_LINKS,
  TECH_STACK,
} from "@/lib/constants";

/** Curated portfolio facts injected into the chat system prompt. */
export function buildPortfolioKnowledge(): string {
  const projects = PROJECTS.map(
    (p) =>
      `### ${p.title}\n` +
      `- Category: ${p.category}${p.featured ? " (featured)" : ""}\n` +
      `- ${p.description}\n` +
      `- Stack: ${p.stack.join(", ")}\n` +
      (p.liveUrl ? `- Live: ${p.liveUrl}\n` : "") +
      (p.githubUrl ? `- GitHub: ${p.githubUrl}\n` : ""),
  ).join("\n");

  const capabilities = HERO_CAPABILITIES.map(
    (c) => `- **${c.title}:** ${c.description}`,
  ).join("\n");

  return `# Portfolio knowledge for ${SITE.name}

## Profile
- Name: ${SITE.name}
- Role: ${SITE.role}
- Tagline: ${SITE.tagline}
- Description: ${SITE.description}
- Email: ${SITE.email}
- Resume PDF: ${SITE.resumeUrl}
- Availability: ${HERO_AVAILABILITY}

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

## Social
- GitHub: ${SOCIAL_LINKS.github}
- LinkedIn: ${SOCIAL_LINKS.linkedin}
- Facebook: ${SOCIAL_LINKS.facebook}

## FAQ
- How to contact: Use the contact form on this site, or email ${SITE.email}.
- Resume: Available at ${SITE.resumeUrl} (Resume link in the nav and contact section).
- Availability: ${HERO_AVAILABILITY}.
- What he builds: Full-stack web apps, AI/NLP systems, scraping pipelines, dashboards, and premium business websites.
`;
}

export function buildChatSystemPrompt(): string {
  return `You are a helpful assistant on ${SITE.name}'s personal portfolio website.
Answer questions about ${SITE.name}'s work, skills, projects, and how to get in touch.

Rules:
- Use ONLY the portfolio knowledge below. Do not invent employers, job titles, dates, clients, metrics, or skills that are not present.
- If something is unknown or not in the knowledge, say you don't have that detail and suggest emailing ${SITE.email} or using the contact form.
- Keep answers concise (2–4 short paragraphs or a short bullet list). Be professional and friendly.
- Prefer linking visitors to live project URLs or the resume when relevant.
- Do not discuss topics unrelated to ${SITE.name}'s portfolio except to politely redirect.

## Portfolio knowledge
${buildPortfolioKnowledge()}`;
}
