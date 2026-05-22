import { BRAIN_KNOWLEDGE, type BrainSkill } from "@/lib/constants";

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

/** Skill slots across the mesh (wider spread, no silhouette guide) */
const LOBE_LAYOUT: Record<
  BrainSkill["lobe"],
  readonly { x: number; y: number }[]
> = {
  crown: [{ x: 50, y: 24 }],
  center: [
    { x: 44, y: 40 },
    { x: 56, y: 40 },
    { x: 50, y: 36 },
    { x: 46, y: 50 },
    { x: 54, y: 50 },
  ],
  base: [
    { x: 40, y: 66 },
    { x: 50, y: 70 },
    { x: 60, y: 66 },
    { x: 50, y: 76 },
  ],
  left: [
    { x: 30, y: 28 },
    { x: 26, y: 36 },
    { x: 34, y: 38 },
    { x: 22, y: 46 },
    { x: 28, y: 52 },
    { x: 24, y: 60 },
    { x: 32, y: 64 },
    { x: 30, y: 70 },
  ],
  right: [
    { x: 70, y: 28 },
    { x: 74, y: 34 },
    { x: 66, y: 36 },
    { x: 78, y: 44 },
    { x: 72, y: 50 },
    { x: 76, y: 56 },
    { x: 68, y: 62 },
    { x: 74, y: 68 },
    { x: 70, y: 72 },
  ],
};

function inHemisphere(x: number, y: number, side: "L" | "R") {
  const hx = side === "L" ? 32 : 68;
  const dx = (x - hx) / 36;
  const dy = (y - CY) / 34;
  return dx * dx + dy * dy <= 1;
}

export function isInsideMesh(x: number, y: number) {
  return inHemisphere(x, y, "L") || inHemisphere(x, y, "R");
}

function lobeIndex(skill: BrainSkill) {
  return BRAIN_KNOWLEDGE.filter((s) => s.lobe === skill.lobe).findIndex(
    (s) => s.id === skill.id,
  );
}

function positionForSkill(skill: BrainSkill) {
  const slots = LOBE_LAYOUT[skill.lobe];
  const idx = lobeIndex(skill) % slots.length;
  return slots[idx];
}

function buildMacroNodes(): NeuralNode[] {
  const core: NeuralNode = {
    id: "core",
    label: "Inference",
    x: CX,
    y: CY,
    tier: "core",
  };

  const macros = BRAIN_KNOWLEDGE.map((skill) => {
    const { x, y } = positionForSkill(skill);
    return {
      id: skill.id,
      label: skill.label,
      x,
      y,
      tier: "macro" as const,
      hemisphere:
        skill.lobe === "left" ? ("L" as const) : skill.lobe === "right" ? ("R" as const) : undefined,
    };
  });

  return [core, ...macros];
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
    const r = 6 + ring * 3.4;
    const x = CX + Math.cos(angle) * r * (0.85 + (ring % 2) * 0.08);
    const y = CY + Math.sin(angle) * r * 0.95;

    if (!isInsideMesh(x, y)) continue;
    if (Math.hypot(x - CX, y - CY) < 4.5) continue;

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

function dist(a: NeuralNode, b: NeuralNode) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function synapseKey(a: string, b: string) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function buildMacroConnections(macros: NeuralNode[]): [string, string][] {
  const pairs: [string, string][] = [];
  const ids = new Set(macros.map((m) => m.id));

  const chain = (lobe: BrainSkill["lobe"]) => {
    const list = BRAIN_KNOWLEDGE.filter((s) => s.lobe === lobe).map((s) => s.id);
    for (let i = 0; i < list.length; i++) {
      pairs.push([list[i], list[(i + 1) % list.length]]);
    }
  };

  for (const lobe of ["left", "right", "center", "base"] as const) {
    chain(lobe);
  }

  const crown = BRAIN_KNOWLEDGE.find((s) => s.lobe === "crown");
  const centerFirst = BRAIN_KNOWLEDGE.find((s) => s.lobe === "center");
  const baseFirst = BRAIN_KNOWLEDGE.find((s) => s.lobe === "base");
  if (crown) {
    if (centerFirst) pairs.push([crown.id, centerFirst.id]);
    const leftFirst = BRAIN_KNOWLEDGE.find((s) => s.lobe === "left");
    const rightFirst = BRAIN_KNOWLEDGE.find((s) => s.lobe === "right");
    if (leftFirst) pairs.push([crown.id, leftFirst.id]);
    if (rightFirst) pairs.push([crown.id, rightFirst.id]);
  }
  if (baseFirst && centerFirst) {
    pairs.push([baseFirst.id, centerFirst.id]);
  }

  for (const skill of BRAIN_KNOWLEDGE) {
    for (const target of skill.links ?? []) {
      if (ids.has(target)) pairs.push([skill.id, target]);
    }
  }

  return pairs;
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
    const midInside = isInsideMesh((a.x + b.x) / 2, (a.y + b.y) / 2);
    const bridge =
      a.tier === "macro" &&
      b.tier === "macro" &&
      (a.id === "core" ||
        b.id === "core" ||
        BRAIN_KNOWLEDGE.find((s) => s.id === a.id)?.lobe === "center" ||
        BRAIN_KNOWLEDGE.find((s) => s.id === b.id)?.lobe === "center" ||
        BRAIN_KNOWLEDGE.find((s) => s.id === a.id)?.lobe === "base" ||
        BRAIN_KNOWLEDGE.find((s) => s.id === b.id)?.lobe === "base");
    if (!midInside && !bridge) return;
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
      add(m.id, n.id, dist(m, n) < 12);
    }
  }

  const innerMicro = [...micro]
    .sort((a, b) => dist(core, a) - dist(core, b))
    .slice(0, 14);
  for (const n of innerMicro) {
    add(core.id, n.id, true);
  }

  for (const [a, b] of buildMacroConnections(macro)) {
    add(a, b, true);
  }

  return edges;
}

export const NEURAL_NODES: NeuralNode[] = [
  ...buildMacroNodes(),
  ...buildMicroNodes(),
];

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
