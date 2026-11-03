// Pixel model of the hero scene: a hamster on a wheel above its burrow.
// Plain, erasable TypeScript with no imports, so Node can run it directly from scripts/make-og.mjs
// (to draw og-image.png and favicon.svg) and React can render it as SVG rects.

export type Role =
  | "sky1" | "sky2" | "sky3" | "sun" | "cloud"
  | "grass" | "soil" | "soilDark" | "tunnel" | "seed"
  | "wood" | "rim" | "rimShade" | "spoke"
  | "outline" | "fur" | "belly" | "pink" | "eye" | "zzz";

export type Rect = { x: number; y: number; w: number; h: number; role: Role };

/** A named layer. Layers with `frame` set are animation frames shown one at a time. */
export type Layer = { id: string; rects: Rect[]; frame?: { group: string; index: number; count: number } };

export type HamsterState = "running" | "napping";

export const SCENE_W = 96;
export const SCENE_H = 64;

/** Colors used by the PNG renderer. The site uses the same values as --px-* custom properties in src/styles.css. */
export const PALETTE: Record<Role, string> = {
  sky1: "#bfe3f8",
  sky2: "#a6d8f5",
  sky3: "#8ccbf0",
  sun: "#f6c453",
  cloud: "#fff8ec",
  grass: "#7fb05a",
  soil: "#9a6a3e",
  soilDark: "#7a4f2b",
  tunnel: "#4f321a",
  seed: "#f6c453",
  wood: "#6b4423",
  rim: "#fff8ec",
  rimShade: "#c9b79c",
  spoke: "#c9b79c",
  outline: "#2e1d10",
  fur: "#e39a52",
  belly: "#fff1dc",
  pink: "#f2a0a0",
  eye: "#2e1d10",
  zzz: "#fff8ec",
};

// Sprite legend: o outline, b fur, w belly, p pink, e eye, . transparent
const SPRITE_ROLES: Record<string, Role> = { o: "outline", b: "fur", w: "belly", p: "pink", e: "eye" };

const HAMSTER_RUN = [
  "..........oo....",
  "....oooooopbo...",
  "..oobbbbbbbbbo..",
  ".obbbbbbbbbbbbo.",
  ".obbbbbbbbbbebbo",
  "obbbbbbbbbbbbbpo",
  "obbbbbbbbbbwwbbo",
  "obbbbbbbbbwwwwo.",
  ".obwwwwwwwwwwwo.",
  "..oooooooooooo..",
];
const LEGS_A = ["...o.o....o.o..."];
const LEGS_B = ["..o.o....o.o...."];

const HAMSTER_NAP = [
  ".....oo.oo......",
  "...oobpobpoo....",
  "..obbbbbbbbbo...",
  ".obbbbbbbbbbbo..",
  ".obbbbbbbboobbo.",
  "obbbbbbbbbbbbpo.",
  "obbbbbbbbbwwwwo.",
  ".obbbbbbwwwwwo..",
  "..oooooooooooo..",
];

/** Merge horizontal runs of one role into single rects. */
function spriteRects(rows: string[], ox: number, oy: number, legend: Record<string, Role> = SPRITE_ROLES): Rect[] {
  const out: Rect[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      const role = legend[ch];
      if (!role) { x++; continue; }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      out.push({ x: ox + x, y: oy + y, w: end - x, h: 1, role });
      x = end;
    }
  });
  return out;
}

/** Pixel set from a predicate over the grid, merged into horizontal runs. */
function fromGrid(x0: number, y0: number, x1: number, y1: number, role: Role, hit: (x: number, y: number) => boolean): Rect[] {
  const out: Rect[] = [];
  for (let y = y0; y <= y1; y++) {
    let x = x0;
    while (x <= x1) {
      if (!hit(x, y)) { x++; continue; }
      let end = x + 1;
      while (end <= x1 && hit(end, y)) end++;
      out.push({ x, y, w: end - x, h: 1, role });
      x = end;
    }
  }
  return out;
}

/** Bresenham line as 1x1 rects. */
function line(x0: number, y0: number, x1: number, y1: number, role: Role): Rect[] {
  const out: Rect[] = [];
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  for (;;) {
    out.push({ x, y, w: 1, h: 1, role });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
  return out;
}

const WHEEL = { cx: 36, cy: 25, r: 18 };
const GROUND_Y = 46;
export const SPOKE_FRAMES = 3;

export function buildScene(): Layer[] {
  const { cx, cy, r } = WHEEL;
  const layers: Layer[] = [];

  layers.push({
    id: "sky",
    rects: [
      { x: 0, y: 0, w: SCENE_W, h: 16, role: "sky1" },
      { x: 0, y: 16, w: SCENE_W, h: 16, role: "sky2" },
      { x: 0, y: 32, w: SCENE_W, h: GROUND_Y - 32, role: "sky3" },
    ],
  });

  layers.push({
    id: "sun",
    rects: fromGrid(76, 4, 90, 18, "sun", (x, y) => Math.hypot(x + 0.5 - 83.5, y + 0.5 - 11.5) < 6.2),
  });

  layers.push({
    id: "clouds",
    rects: [
      { x: 70, y: 26, w: 14, h: 3, role: "cloud" },
      { x: 73, y: 24, w: 7, h: 2, role: "cloud" },
      { x: 58, y: 7, w: 12, h: 3, role: "cloud" },
      { x: 61, y: 5, w: 5, h: 2, role: "cloud" },
    ],
  });

  // Ground, grass edge and the burrow: a shaft down to a seed chamber.
  layers.push({
    id: "ground",
    rects: [
      { x: 0, y: GROUND_Y, w: SCENE_W, h: SCENE_H - GROUND_Y, role: "soil" },
      { x: 0, y: GROUND_Y, w: SCENE_W, h: 2, role: "grass" },
      { x: 0, y: 60, w: SCENE_W, h: 4, role: "soilDark" },
      { x: 8, y: 52, w: 2, h: 1, role: "soilDark" },
      { x: 26, y: 56, w: 3, h: 1, role: "soilDark" },
      { x: 44, y: 51, w: 2, h: 1, role: "soilDark" },
      { x: 72, y: 46, w: 6, h: 2, role: "tunnel" },
      { x: 73, y: 48, w: 4, h: 6, role: "tunnel" },
      { x: 58, y: 53, w: 30, h: 6, role: "tunnel" },
      { x: 60, y: 52, w: 26, h: 1, role: "tunnel" },
      { x: 61, y: 57, w: 2, h: 1, role: "seed" },
      { x: 64, y: 56, w: 2, h: 2, role: "seed" },
      { x: 67, y: 57, w: 2, h: 1, role: "seed" },
      { x: 80, y: 57, w: 2, h: 1, role: "seed" },
      { x: 83, y: 56, w: 2, h: 2, role: "seed" },
    ],
  });

  // Stand: two short legs from under the rim to the grass.
  const footY = cy + r - 4;
  layers.push({
    id: "stand",
    rects: [
      ...line(cx - 8, footY, cx - 12, GROUND_Y - 1, "wood"),
      ...line(cx - 7, footY, cx - 11, GROUND_Y - 1, "wood"),
      ...line(cx + 8, footY, cx + 12, GROUND_Y - 1, "wood"),
      ...line(cx + 9, footY, cx + 13, GROUND_Y - 1, "wood"),
    ],
  });

  // Spokes: six spokes, three frames 20 degrees apart (the pattern repeats every 60 degrees).
  for (let f = 0; f < SPOKE_FRAMES; f++) {
    const rects: Rect[] = [];
    for (let s = 0; s < 6; s++) {
      const a = ((s * 60 + f * 20) * Math.PI) / 180;
      rects.push(...line(cx, cy, Math.round(cx + Math.cos(a) * (r - 2)), Math.round(cy + Math.sin(a) * (r - 2)), "spoke"));
    }
    layers.push({ id: `spokes-${f}`, rects, frame: { group: "spokes", index: f, count: SPOKE_FRAMES } });
  }

  layers.push({
    id: "rim",
    rects: [
      ...fromGrid(cx - r, cy - r, cx + r, cy + r, "rim", (x, y) => {
        const d = Math.hypot(x + 0.5 - (cx + 0.5), y + 0.5 - (cy + 0.5));
        return d >= r - 2 && d < r;
      }),
      ...fromGrid(cx - r, cy - r, cx + r, cy + r, "rimShade", (x, y) => {
        const d = Math.hypot(x + 0.5 - (cx + 0.5), y + 0.5 - (cy + 0.5));
        return d >= r - 3 && d < r - 2;
      }),
      { x: cx - 1, y: cy - 1, w: 3, h: 3, role: "wood" },
    ],
  });

  return layers;
}

/** The hamster layers for one state. Running has two leg frames; napping adds floating Zs. */
export function buildHamster(state: HamsterState): Layer[] {
  const { cx, cy, r } = WHEEL;
  const floor = cy + r - 3; // first row inside the rim shade at the bottom of the wheel
  if (state === "running") {
    const top = floor - HAMSTER_RUN.length - 1;
    const left = cx - 8;
    return [
      { id: "hamster", rects: spriteRects(HAMSTER_RUN, left, top) },
      { id: "legs-0", rects: spriteRects(LEGS_A, left, top + HAMSTER_RUN.length), frame: { group: "legs", index: 0, count: 2 } },
      { id: "legs-1", rects: spriteRects(LEGS_B, left, top + HAMSTER_RUN.length), frame: { group: "legs", index: 1, count: 2 } },
    ];
  }
  const top = floor - HAMSTER_NAP.length;
  const left = cx - 8;
  const z = (x: number, y: number, s: number): Rect[] => [
    { x, y, w: s, h: 1, role: "zzz" },
    ...Array.from({ length: s - 2 }, (_, i) => ({ x: x + s - 2 - i, y: y + 1 + i, w: 1, h: 1, role: "zzz" as Role })),
    { x, y: y + s - 1, w: s, h: 1, role: "zzz" },
  ];
  return [
    { id: "hamster", rects: spriteRects(HAMSTER_NAP, left, top) },
    { id: "zzz", rects: [...z(cx + 20, top + 2, 3), ...z(cx + 24, top - 4, 4), ...z(cx + 29, top - 11, 5)] },
  ];
}

/** Hamster head for the favicon, 16 x 16. */
export const FAVICON_ROWS = [
  "................",
  "...oo......oo...",
  "..opbo....obpo..",
  "..obbboooobbbo..",
  "...obbbbbbbbo...",
  "..obbbbbbbbbbo..",
  ".obbebbbbbbebbo.",
  ".obbbbbppbbbbbo.",
  ".obwwbbbbbbwwbo.",
  ".obwwwbbbbwwwbo.",
  "..obbwwwwwwbbo..",
  "...obbbbbbbbo...",
  "....oooooooo....",
  "................",
  "................",
  "................",
];
export const FAVICON_RECTS = spriteRects(FAVICON_ROWS, 0, 2);
