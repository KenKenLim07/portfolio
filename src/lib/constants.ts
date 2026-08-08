export const SITE = {
  name: "Jose Marie Lim",
  role: "Full-Stack Developer • AI Systems",
  email: "josemarelim7@gmail.com",
  tagline: "Building Intelligent Digital Systems",
  description:
    "a Full-Stack Developer who builds modern web applications, intelligent automation, and AI-powered systems that transform data into practical solutions.",
  url: "https://portfolio.example.com",
} as const;

/** Set true to restore the interactive knowledge-graph hero panel */
export const ENABLE_HERO_BRAIN = false;

/** Temporary layout debug — colored borders on hero regions. Set false before shipping. */
export const HERO_LAYOUT_DEBUG = false;

/** Hero right column — capability pillars (minimal, max 3) */
export const HERO_CAPABILITIES = [
  {
    title: "AI & data systems",
    description:
      "NLP, scraping pipelines, sentiment analysis, and production dashboards.",
  },
  {
    title: "Full-stack delivery",
    description:
      "Next.js frontends with FastAPI, Supabase, Redis, and Dockerized backends.",
  },
  {
    title: "Products in the wild",
    description:
      "News intelligence, marketplace tooling, and premium business websites — live and maintained.",
  },
] as const;

/** Hero “My brain” knowledge map — ties to #about */
export const MY_BRAIN = {
  previewTitle: "Developer Knowledge Graph",
  interactionHint:
    "A living network of technologies, systems, and lessons learned through building products, platforms, and AI-powered solutions.",
  experienceLine:
    "Tap, hover, or explore the neural pathways behind how I think and build.",
  pipeline: "Ingest → Encode → Reason → Deliver",
  preview3d:
    "This is the 2D projection. The full 3D model reveals itself during collaboration.",
} as const;

/**
 * Skills on the hero knowledge mesh. Add entries here — positions are placed automatically.
 *
 * - `lobe`: `"crown"` (top), `"left"` / `"right"`, `"center"` (mid), `"base"` (bottom)
 * - `links`: optional ids of related skills (primary synapses between them)
 */
export type BrainSkill = {
  id: string;
  label: string;
  lobe: "crown" | "left" | "right" | "center" | "base";
  links?: readonly string[];
};

export const BRAIN_KNOWLEDGE: readonly BrainSkill[] = [
  { id: "nlp", label: "NLP", lobe: "crown", links: ["web", "embed"] },
  { id: "web", label: "Next.js", lobe: "left", links: ["ui", "vite", "docker"] },
  { id: "vite", label: "Vite", lobe: "left", links: ["web", "ui"] },
  { id: "scrape", label: "Ingest", lobe: "left", links: ["scraper", "data", "celery"] },
  { id: "scraper", label: "Scraper", lobe: "left", links: ["scrape", "data", "postgres"] },
  { id: "data", label: "Data Pipe", lobe: "left", links: ["postgres", "docker", "cache"] },
  { id: "postgres", label: "PostgreSQL", lobe: "left", links: ["data", "api", "docker"] },
  { id: "docker", label: "Docker", lobe: "left", links: ["data", "api", "cache", "postgres"] },
  {
    id: "cache",
    label: "Redis",
    lobe: "left",
    links: ["docker", "celery", "postgres", "supabase"],
  },
  { id: "typescript", label: "TypeScript", lobe: "center", links: ["web", "api", "vite"] },
  { id: "python", label: "Python", lobe: "center", links: ["api", "nlp", "celery", "data"] },
  { id: "rag", label: "RAG", lobe: "center", links: ["nlp", "embed", "postgres"] },
  { id: "embed", label: "Embeddings", lobe: "right", links: ["nlp", "api", "rag"] },
  { id: "api", label: "FastAPI", lobe: "right", links: ["celery", "docker", "postgres", "python"] },
  { id: "celery", label: "Celery", lobe: "right", links: ["api", "data", "cache", "scraper"] },
  { id: "cicd", label: "CI/CD", lobe: "right", links: ["docker", "github", "edge", "testing"] },
  { id: "github", label: "GitHub Actions", lobe: "right", links: ["cicd", "web", "testing"] },
  { id: "ui", label: "UI Layer", lobe: "right", links: ["web", "vite", "edge"] },
  { id: "edge", label: "Edge", lobe: "right", links: ["ui", "cache", "cicd"] },
  {
    id: "supabase",
    label: "Supabase",
    lobe: "right",
    links: ["postgres", "api", "docker", "cache"],
  },
  { id: "testing", label: "Testing", lobe: "base", links: ["web", "api", "cicd", "github"] },
  { id: "monitoring", label: "Monitoring", lobe: "base", links: ["api", "edge", "docker"] },
  { id: "deploy", label: "Deploy", lobe: "base", links: ["cicd", "edge", "docker", "web"] },
];

/** Hero status line + quick stats (edit freely) */
export const HERO_AVAILABILITY = "Open to new projects" as const;

/** Hero metric blocks (large number + label) */
export const HERO_METRICS = [
  { value: "7+", label: "Projects Built" },
  { value: "35K+", label: "News Articles Processed" },
  { value: "1K+", label: "Facebook Marketplace Listings Collected" },
] as const;

/** @deprecated Use HERO_METRICS */
export const HERO_STATS = HERO_METRICS.map((m) => ({
  emphasis: m.value,
  label: m.label,
}));

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Tech Stack", href: "#tech-stack" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
] as const;

export const SOCIAL_LINKS = {
  github: "https://github.com/KenKenLim07",
  linkedin: "https://www.linkedin.com/in/jose-marie-lim-dev/",
  facebook: "https://www.facebook.com/josemarie.lim",
} as const;

export type Testimonial = {
  text: string;
  name: string;
  role: string;
};

/** Replace with real client / collaborator quotes when available */
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    text: "Jose turned messy marketplace data into a clear dashboard we actually use every week. Fast delivery, careful about edge cases.",
    name: "Maria Santos",
    role: "Marketplace Operator",
  },
  {
    text: "The news intelligence build was ambitious. He handled NLP, pipelines, and the UI without losing sight of what the product needed to do.",
    name: "Daniel Cruz",
    role: "Product Lead",
  },
  {
    text: "Our restaurant site finally feels premium on mobile. Clean structure, smooth performance, and easy for the team to update.",
    name: "Ana Reyes",
    role: "Restaurant Owner",
  },
  {
    text: "He ships like a full team — frontend, backend, scraping, and automation — and still explains decisions in plain language.",
    name: "Kevin Ong",
    role: "Startup Founder",
  },
  {
    text: "Deadlines were tight and the requirements kept moving. Jose stayed calm, prioritized well, and delivered something maintainable.",
    name: "Liza Mendoza",
    role: "Operations Manager",
  },
  {
    text: "The automation cut hours of manual collection. Reliable pipelines and a UI that non-engineers can follow.",
    name: "Ryan Villanueva",
    role: "Data Analyst",
  },
  {
    text: "Strong eye for hierarchy and interaction. The site looks intentional, not like a template with extra polish.",
    name: "Sophie Tan",
    role: "Brand Designer",
  },
  {
    text: "From scoping to deploy, communication was clear. We always knew what was shipping next and why.",
    name: "Mark Dela Cruz",
    role: "Project Stakeholder",
  },
  {
    text: "He cares about long-term value — performance, accessibility, and code we can keep building on.",
    name: "Patricia Go",
    role: "Tech Collaborator",
  },
] as const;

export type ProjectCategory = "ai" | "web" | "commerce";

export type ProjectFilterId = "all" | ProjectCategory;

export const PROJECT_FILTERS: readonly {
  id: ProjectFilterId;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "ai", label: "AI Systems" },
  { id: "web", label: "Web Apps" },
  { id: "commerce", label: "Commerce" },
] as const;

export type Project = {
  id: string;
  title: string;
  description: string;
  stack: string[];
  /** Use 2:1 screenshots (e.g. 1600×800) for a flush fit in project cards */
  image: string;
  gradient: string;
  category: ProjectCategory;
  featured?: boolean;
  liveUrl?: string;
  githubUrl?: string;
  /** CSS object-position when using cover (default: center) */
  imagePosition?: string;
};

export const PROJECTS: Project[] = [
  {
    id: "news-intelligence",
    title: "Philippine News Intelligence",
    category: "ai",
    featured: true,
    description:
      "Undergraduate thesis (Best Paper Award in NLP line up): real-time Philippine news aggregation with automated scraping, VADER sentiment scores showing how outlets portray topics, spaCy entity extraction, and Pearson correlation analysis comparing how sources differ in tone — plus search, trends, and entity dashboards across major PH publishers.",
    stack: [
      "Next.js",
      "FastAPI",
      "Supabase",
      "Redis",
      "Celery",
      "Docker",
      "DistilBERT",
      "VADER NLP",
      "spaCy",
    ],
    image: "/projects/news.png",
    gradient: "from-slate-900 via-blue-950 to-slate-950",
    liveUrl: "https://ph-vibe-check.vercel.app/",
  },
  {
    id: "iphone-scraper",
    title: "Iloilo iPhone Deal Intelligence",
    category: "commerce",
    description:
      "Facebook Marketplace pipeline using GraphQL with Playwright fallback, dual accounts (discovery vs. monitoring), and Supabase storage. Benchmarks iPhone variants against Iloilo prices, then applies rule-based AI on titles and descriptions to flag red flags (no True Tone, no Face ID, broken/replaced screen, etc.) and deduct repair risk from estimated profit on the dashboard.",
    stack: [
      "Next.js",
      "Supabase",
      "Playwright",
      "GraphQL",
      "Rule-based AI",
      "TypeScript",
      "PostgreSQL",
    ],
    image: "/projects/iphone.png",
    gradient: "from-zinc-950 via-slate-900 to-sky-950",
    liveUrl: "https://iloilo-apple-deals.vercel.app/",
  },
  {
    id: "skyward-restaurant",
    title: "Skyward Japanese Restaurant Website",
    category: "web",
    description:
      "Premium restaurant site for Skyward Japanese Cuisine in Iloilo — cinematic hero, featured menu, gallery, visit info, and mobile-first UX built for local discovery and reservations.",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    image: "/projects/skyward.png",
    gradient: "from-zinc-950 via-stone-900 to-amber-950",
    liveUrl: "https://skyward-iloilo.vercel.app/",
  },
];

export const TECH_STACK = {
  frontend: [
    "Next.js",
    "React",
    "TypeScript",
    "JavaScript",
    "Tailwind CSS",
    "Framer Motion",
    "GSAP",
    "Vite",
  ],
  backend: [
    "Node.js",
    "FastAPI",
    "Supabase",
    "Firebase",
    "Redis",
    "Celery",
    "Docker",
    "PostgreSQL",
    "Python",
  ],
  ai: ["DistilBERT", "VADER NLP", "spaCy"],
} as const;

/** Deduped stack tags for hero panel (max 10) */
export const HERO_STACK_PREVIEW = [
  ...new Set([
    ...TECH_STACK.frontend,
    ...TECH_STACK.backend,
    ...TECH_STACK.ai,
  ]),
].slice(0, 10) as readonly string[];

export const PROCESS_STEPS = [
  {
    step: "01",
    title: "Strategy",
    description:
      "Define goals, audience, and technical requirements for a focused product direction.",
  },
  {
    step: "02",
    title: "Design",
    description:
      "Craft premium UI systems with cinematic hierarchy, spacing, and interaction patterns.",
  },
  {
    step: "03",
    title: "Development",
    description:
      "Build performant fullstack applications with clean architecture and modern tooling.",
  },
  {
    step: "04",
    title: "Optimization",
    description:
      "Refine performance, SEO, accessibility, and analytics for measurable impact.",
  },
  {
    step: "05",
    title: "Launch",
    description:
      "Deploy, monitor, and iterate with confidence on production infrastructure.",
  },
] as const;

export const ABOUT = {
  lead: "I enjoy building complete software systems, from intuitive user interfaces to backend services, automated data pipelines, and AI-powered features. I'm most motivated by projects that solve real-world problems and transform raw data into meaningful insights.",
  belief:
    "Great software isn't just built to work. It should solve real problems.",
  paragraphs: [
    "My recent work includes an NLP-powered news intelligence platform, automated web scraping pipelines, marketplace analytics tools, and modern business websites. Every project has strengthened my experience across frontend, backend, databases, and data engineering.",
  ],
} as const;
