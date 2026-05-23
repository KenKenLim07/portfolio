export const SITE = {
  name: "Jose Marie Lim",
  role: "Full-Stack Developer & AI Systems Engineer",
  email: "josemarelim7@gmail.com",
  tagline: "Building Intelligent Digital Systems",
  description:
    "From modern interfaces to intelligent systems — designing and engineering products powered by data, automation, and AI",
  url: "https://portfolio.example.com",
} as const;

/** Hero “My brain” knowledge map — ties to #about */
export const MY_BRAIN = {
  previewTitle: "2D Preview of My Brain",
  interactionHint:
    "Tap, hover, or explore the neural pathways behind how I think and build.",
  experienceLine:
    "Every node represents experience. Every connection represents lessons learned, patterns recognized, and systems built.",
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
  { id: "cache", label: "Redis", lobe: "left", links: ["docker", "celery", "postgres"] },
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
  { id: "testing", label: "Testing", lobe: "base", links: ["web", "api", "cicd", "github"] },
  { id: "monitoring", label: "Monitoring", lobe: "base", links: ["api", "edge", "docker"] },
  { id: "deploy", label: "Deploy", lobe: "base", links: ["cicd", "edge", "docker", "web"] },
];

/** Hero status line + quick stats (edit freely) */
export const HERO_AVAILABILITY = "Open to new projects" as const;

export const HERO_STATS = [
  { emphasis: `${BRAIN_KNOWLEDGE.length}+`, label: "skills mapped" },
  { emphasis: "Full-stack", label: "+ AI systems" },
  { emphasis: "Ship", label: "data → product" },
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
  image: string;
  gradient: string;
  category: ProjectCategory;
  featured?: boolean;
  liveUrl?: string;
  githubUrl?: string;
};

export const PROJECTS: Project[] = [
  {
    id: "news-intelligence",
    title: "Philippine News Intelligence Platform",
    category: "ai",
    featured: true,
    description:
      "AI-powered news aggregation and sentiment analysis platform that monitors multiple Philippine news sources in real time using NLP pipelines, automated scraping systems, and analytics dashboards.",
    stack: [
      "Next.js",
      "FastAPI",
      "Supabase",
      "Redis",
      "Celery",
      "Docker",
      "DistilBERT",
      "VADER NLP",
    ],
    image: "/projects/news-intelligence.svg",
    gradient: "from-slate-900 via-indigo-950 to-violet-950",
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: "skyward-restaurant",
    title: "Skyward Japanese Restaurant Website",
    category: "web",
    description:
      "Premium restaurant website focused on cinematic presentation, modern branding, mobile-first UX, and elegant customer experience.",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    image: "/projects/skyward-restaurant.svg",
    gradient: "from-zinc-950 via-stone-900 to-amber-950",
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: "beauty-storefront",
    title: "Beauty Brand Storefront",
    category: "commerce",
    description:
      "Modern ecommerce-style storefront for a beauty distributor focused on conversion, branding, and premium visual presentation.",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Stripe"],
    image: "/projects/beauty-storefront.svg",
    gradient: "from-zinc-950 via-rose-950 to-fuchsia-950",
    liveUrl: "#",
    githubUrl: "#",
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
  frontend: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion"],
  backend: ["FastAPI", "Supabase", "Redis", "Celery", "Docker"],
  ai: [
    "DistilBERT",
    "VADER NLP",
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
] as const;
