export const SITE = {
  name: "Jose Marie Lim",
  role: "Full-Stack Developer & AI Systems Engineer",
  email: "josemarelim7@gmail.com",
  tagline: "Building Intelligent Digital Systems",
  description:
    "From modern interfaces to intelligent systems — designing and engineering products powered by data, automation, and AI",
  url: "https://portfolio.example.com",
} as const;

/** Set true to restore the interactive knowledge-graph hero panel */
export const ENABLE_HERO_BRAIN = false;

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

/** Short labels for hero work tiles (full titles live on project cards) */
export const HERO_WORK_LABELS: Record<string, { tag: string; shortTitle: string }> =
  {
    "news-intelligence": {
      tag: "Thesis · Best Paper",
      shortTitle: "PH VibeCheck AI",
    },
    "skyward-restaurant": {
      tag: "Web · Iloilo",
      shortTitle: "Skyward Japanese Cuisine",
    },
    "iphone-scraper": {
      tag: "Commerce · Automation",
      shortTitle: "IAASE iPhone Deals",
    },
  };

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

export const HERO_STATS = [
  { emphasis: "3", label: "live products" },
  { emphasis: "Full-stack", label: "+ AI systems" },
  { emphasis: "Thesis", label: "Best Paper" },
] as const;

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Projects", href: "#projects" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Tech Stack", href: "#tech-stack" },
  { label: "Contact", href: "#contact" },
] as const;

export const SOCIAL_LINKS = {
  github: "https://github.com",
  linkedin: "https://linkedin.com",
  messenger: "https://m.me",
} as const;

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
    title: "PH VibeCheck AI — Philippine News Intelligence",
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
      "VADER",
      "spaCy",
    ],
    image: "/projects/news.png",
    gradient: "from-slate-900 via-indigo-950 to-violet-950",
    liveUrl: "https://ph-vibe-check.vercel.app/",
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
  {
    id: "iphone-scraper",
    title: "IAASE — Iloilo iPhone Deal Intelligence",
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
];

export const SERVICES = [
  {
    title: "Premium Business Websites",
    description:
      "High-converting, brand-forward websites engineered for credibility and growth.",
    icon: "Globe",
  },
  {
    title: "Restaurant Websites",
    description:
      "Cinematic dining experiences with mobile-first menus, reservations, and storytelling.",
    icon: "UtensilsCrossed",
  },
  {
    title: "Fullstack Web Applications",
    description:
      "Scalable platforms with modern frontends, robust APIs, and production-ready architecture.",
    icon: "Layers",
  },
  {
    title: "AI-Powered Dashboards",
    description:
      "Intelligent analytics interfaces with real-time data, NLP, and automated insights.",
    icon: "Brain",
  },
  {
    title: "UI/UX Design",
    description:
      "Minimal, premium interfaces with intentional hierarchy and polished interactions.",
    icon: "Palette",
  },
  {
    title: "SEO Optimization",
    description:
      "Technical SEO, performance tuning, and structured content for discoverability.",
    icon: "Search",
  },
  {
    title: "Data Visualization Systems",
    description:
      "Clear, actionable charts and dashboards for complex operational data.",
    icon: "BarChart3",
  },
] as const;

export const TECH_STACK = {
  frontend: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Vite"],
  backend: ["FastAPI", "Supabase", "Redis", "Celery", "Docker", "PostgreSQL", "Python"],
  ai: [
    "DistilBERT",
    "VADER NLP",
    "spaCy",
    "Real-Time Data Pipelines",
    "Sentiment Analysis",
  ],
} as const;

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
  title: "Scalable engineering-Intelligent systems.",
  lead: "I build AI-powered platforms, modern web applications, and digital systems engineered for performance, usability, and scale.",
  paragraphs: [
    "I am Jose Marie Lim, a Full-Stack Developer and AI Systems Engineer working across backend infrastructure, premium frontend development, real-time systems, analytics pipelines, and workflow automation.",
    "My goal is to create products that are not only visually refined, but architecturally robust and operationally reliable.",
  ],
} as const;

export const ABOUT_HIGHLIGHTS = [
  "Frontend engineering",
  "Fullstack development",
  "AI-powered systems",
  "Modern UI/UX",
  "Scalable backend architecture",
  "Digital business modernization",
] as const;

export const ABOUT_EXPERIENCE = [
  "Real-time systems",
  "Analytics platforms",
  "AI-assisted workflows",
  "Business-focused web experiences",
  "Data visualization systems",
  "Scraping pipelines",
  "Data Science",
] as const;
