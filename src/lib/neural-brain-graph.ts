export type NeuralNode = {
  id: string;
  x: number;
  y: number;
  label?: string;
  tier: "core" | "macro" | "micro";
  hemisphere?: "L" | "R";
};

export type NeuralEdge = {
  from: string;
  to: string;
  primary?: boolean;
};

const GOLDEN = 2.399963;
const CX = 50;
const CY = 48;

/**
 * Superior (top-down) brain silhouette — wide oval, twin hemispheres,
 * shallow central fissure at the crown, narrow brainstem at the base.
 */
export const BRAIN_OUTER_PATH =
  "M 50 23 " +
  "C 47 21 44 22 41 25 " +
  "C 30 24 20 30 17 40 " +
  "C 14 50 15 60 20 68 " +
  "C 25 74 33 77 41 77 " +
  "C 46 77 48 76 49 75 " +
  "C 49 79 50 82 51 75 " +
  "C 52 76 54 77 59 77 " +
  "C 67 77 75 74 80 68 " +
  "C 85 60 86 50 83 40 " +
  "C 80 30 70 24 59 25 " +
  "C 56 22 53 21 50 23 Z";

/** Clip path = same as outer (network stays inside brain) */
export const BRAIN_CLIP_PATH = BRAIN_OUTER_PATH;

/** Interior sulci — longitudinal fissure + lobe folds */
export const BRAIN_SULCI_PATHS = [
  "M 50 25 L 50 73",
  "M 50 32 C 46 34 43 40 44 46",
  "M 50 32 C 54 34 57 40 56 46",
  "M 50 54 C 45 56 40 60 38 65",
  "M 50 54 C 55 56 60 60 62 65",
  "M 30 38 C 34 40 36 44 35 48",
  "M 70 38 C 66 40 64 44 65 48",
  "M 26 50 C 30 48 34 50 36 54",
  "M 74 50 C 70 48 66 50 64 54",
] as const;

/** Legacy export for stroke overlays */
export const BRAIN_OUTLINE_PATHS = [
  BRAIN_OUTER_PATH,
  ...BRAIN_SULCI_PATHS,
] as const;

/** Left / right hemisphere ellipses (for node placement) */
function inHemisphere(x: number, y: number, side: "L" | "R") {
  const hx = side === "L" ? 35 : 65;
  const dx = (x - hx) / 32;
  const dy = (y - CY) / 27;
  const topBias = y < 32 ? 0.92 : 1;
  return dx * dx + (dy * topBias) ** 2 <= 1;
}

export function isInsideBrain(x: number, y: number) {
  return inHemisphere(x, y, "L") || inHemisphere(x, y, "R");
}

function buildMicroNodes(): NeuralNode[] {
  const nodes: NeuralNode[] = [];
  let i = 0;
  let attempts = 0;

  while (nodes.length < 52 && attempts < 400) {
    attempts++;
    const t = (i + attempts * 0.37) / 52;
    const angle = t * Math.PI * 2 * GOLDEN;
    const ring = (nodes.length % 6) + 1;
    const r = 6 + ring * 3.2;
    const x = CX + Math.cos(angle) * r * (0.85 + (ring % 2) * 0.08);
    const y = CY + Math.sin(angle) * r * 0.95;

    if (!isInsideBrain(x, y)) continue;
    if (Math.hypot(x - CX, y - CY) < 5) continue;

    nodes.push({
      id: `m${nodes.length}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      tier: "micro",
      hemisphere: x < CX ? "L" : "R",
    });
    i++;
  }

  return nodes;
}

const macroNodes: NeuralNode[] = [
  { id: "core", label: "Inference", x: CX, y: CY, tier: "core" },
  { id: "nlp", label: "NLP", x: 50, y: 27, tier: "macro" },
  { id: "web", label: "Next.js", x: 25, y: 35, tier: "macro", hemisphere: "L" },
  { id: "scrape", label: "Ingest", x: 19, y: 48, tier: "macro", hemisphere: "L" },
  { id: "data", label: "Data Pipe", x: 22, y: 61, tier: "macro", hemisphere: "L" },
  { id: "cache", label: "Redis", x: 32, y: 72, tier: "macro", hemisphere: "L" },
  { id: "embed", label: "Embeddings", x: 75, y: 35, tier: "macro", hemisphere: "R" },
  { id: "api", label: "FastAPI", x: 81, y: 48, tier: "macro", hemisphere: "R" },
  { id: "ui", label: "UI Layer", x: 78, y: 61, tier: "macro", hemisphere: "R" },
  { id: "edge", label: "Edge", x: 68, y: 72, tier: "macro", hemisphere: "R" },
];

function dist(a: NeuralNode, b: NeuralNode) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function synapseKey(a: string, b: string) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function buildEdges(nodes: NeuralNode[]): NeuralEdge[] {
  const edgeSet = new Set<string>();
  const edges: NeuralEdge[] = [];
  const micro = nodes.filter((n) => n.tier === "micro");
  const macro = nodes.filter((n) => n.tier === "macro");
  const core = nodes.find((n) => n.tier === "core")!;

  const add = (from: string, to: string, primary = false) => {
    if (from === to) return;
    const key = synapseKey(from, to);
    if (edgeSet.has(key)) return;
    const a = nodes.find((n) => n.id === from)!;
    const b = nodes.find((n) => n.id === to)!;
    if (!isInsideBrain((a.x + b.x) / 2, (a.y + b.y) / 2)) return;
    edgeSet.add(key);
    edges.push({ from, to, primary });
  };

  for (let i = 0; i < micro.length; i++) {
    for (let j = i + 1; j < micro.length; j++) {
      if (dist(micro[i], micro[j]) < 10.5) {
        add(micro[i].id, micro[j].id);
      }
    }
  }

  const left = micro.filter((n) => n.hemisphere === "L");
  const right = micro.filter((n) => n.hemisphere === "R");
  for (let i = 0; i < 10; i++) {
    const l = left[(i * 5) % left.length];
    const r = right[(i * 5 + 2) % right.length];
    if (l && r) add(l.id, r.id);
  }

  for (const m of macro) {
    add(m.id, core.id, true);
  }

  for (const m of macro) {
    const nearest = [...micro]
      .sort((a, b) => dist(m, a) - dist(m, b))
      .slice(0, 5);
    for (const n of nearest) {
      add(m.id, n.id, dist(m, n) < 13);
    }
  }

  const innerMicro = [...micro]
    .sort((a, b) => dist(core, a) - dist(core, b))
    .slice(0, 14);
  for (const n of innerMicro) {
    add(core.id, n.id, true);
  }

  const ring: [string, string][] = [
    ["web", "scrape"],
    ["scrape", "data"],
    ["data", "cache"],
    ["cache", "edge"],
    ["edge", "ui"],
    ["ui", "api"],
    ["api", "embed"],
    ["embed", "nlp"],
    ["nlp", "web"],
    ["web", "data"],
    ["scrape", "nlp"],
    ["api", "cache"],
    ["embed", "ui"],
    ["data", "edge"],
  ];
  for (const [a, b] of ring) {
    add(a, b, true);
  }

  return edges;
}

export const NEURAL_NODES: NeuralNode[] = [...macroNodes, ...buildMicroNodes()];

export const NEURAL_EDGES: NeuralEdge[] = buildEdges(NEURAL_NODES);

export const NEURAL_MACRO = NEURAL_NODES.filter((n) => n.tier === "macro");
export const NEURAL_MICRO = NEURAL_NODES.filter((n) => n.tier === "micro");
export const NEURAL_CORE = NEURAL_NODES.find((n) => n.tier === "core")!;

export function getNeuralNode(id: string) {
  return NEURAL_NODES.find((n) => n.id === id)!;
}

export function synapsePath(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  bend = 0.18,
) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  return `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
}
