/** 3×3 overworld — camp in the center, pine forests around it. */

export const MAP = 3;
export const CAMP_COL = 1;
export const CAMP_ROW = 1;

export function cellKey(c: number, r: number) {
  return `${c},${r}`;
}

export function tileOf(xPct: number, yPct: number) {
  const c = Math.min(MAP - 1, Math.max(0, Math.floor((xPct / 100) * MAP)));
  const r = Math.min(MAP - 1, Math.max(0, Math.floor((yPct / 100) * MAP)));
  return { c, r };
}

export function tileOrigin(c: number, r: number) {
  return { x: (c / MAP) * 100, y: (r / MAP) * 100 };
}

export function localToWorld(c: number, r: number, lx: number, ly: number) {
  return {
    x: ((c + lx) / MAP) * 100,
    y: ((r + ly) / MAP) * 100,
  };
}

export function startRevealed(): string[] {
  return [cellKey(CAMP_COL, CAMP_ROW)];
}

export type TreeDef = { id: string; x: number; y: number; wood: number; tile: string };
export type EnemyDef = { id: string; x: number; y: number; coins: number };
export type MineDef = { id: string; x: number; y: number; coins: number; tile: string; cover: string[] };

export const CAMP = { x: 50, y: 50 };

/**
 * Camp plots inside the tower ring (36.5–63.5).
 * `w`/`h` are max footprint as % of the whole 3×3 world — sprites must not exceed this.
 */
export const PLOTS = {
  mill: { x: 41.4, y: 42.6, w: 6.4, h: 6.4 },
  workshop: { x: 58.6, y: 42.6, w: 6.4, h: 6.4 },
  farm: { x: 41.4, y: 51.4, w: 6.4, h: 6.4 },
  hut: { x: 50, y: 49.2, w: 9.2, h: 9.2 },
  shed: { x: 58.6, y: 51.4, w: 6.4, h: 6.4 },
  store: { x: 50, y: 57.4, w: 4.2, h: 4.2 },
  flag: { x: 50, y: 61.2, w: 3.6, h: 3.6 },
  wall: { x: 46, y: 43.5, w: 4, h: 4 },
} as const;

export const BUILD_SPOTS = {
  hut: { x: PLOTS.hut.x, y: PLOTS.hut.y },
  wall: { x: PLOTS.wall.x, y: PLOTS.wall.y },
  farm: { x: PLOTS.farm.x, y: PLOTS.farm.y },
  shed: { x: PLOTS.shed.x, y: PLOTS.shed.y },
  workshop: { x: PLOTS.workshop.x, y: PLOTS.workshop.y },
  mill: { x: PLOTS.mill.x, y: PLOTS.mill.y },
  store: { x: PLOTS.store.x, y: PLOTS.store.y },
  flag: { x: PLOTS.flag.x, y: PLOTS.flag.y },
} as const;

/** Courtyard invite pads for unrecruited friends (camp tile, south of hut). */
export const COURT_PADS: { id: 'mira' | 'blink' | 'nana'; x: number; y: number }[] = [
  { id: 'mira', x: 45.2, y: 54.0 },
  { id: 'blink', x: 54.8, y: 54.0 },
  { id: 'nana', x: 50.0, y: 56.6 },
];

/** Early / mid / late look. Size stays the plot — art changes, it does not grow out of tile. */
export function buildingPhase(level: number, maxLevel: number): 1 | 2 | 3 {
  if (level <= 1) return 1;
  if (level >= maxLevel) return 3;
  return 2;
}

export const TOWER_SLOTS = [
  { i: 0, x: 36.5, y: 36.5 },
  { i: 1, x: 63.5, y: 36.5 },
  { i: 2, x: 36.5, y: 63.5 },
  { i: 3, x: 63.5, y: 63.5 },
];

export const TOWER_COST = { wood: 8, coins: 8 };
export const FORT_COST = { wood: 16, coins: 16 };
export const DEPOSIT_REACH = 6.2;
export const FORT_NAMES = ['', 'wood', 'stone', 'brick', 'cement'] as const;

/** Pairs of tower indexes that share a perimeter line (N, W, E, S). */
export const WALL_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
];

const FOREST_LAYOUT: { c: number; r: number; trees: [number, number][] }[] = [
  { c: 0, r: 0, trees: [[0.22, 0.28], [0.48, 0.2], [0.72, 0.32], [0.3, 0.55], [0.62, 0.58], [0.4, 0.78], [0.78, 0.72]] },
  { c: 1, r: 0, trees: [[0.18, 0.3], [0.42, 0.18], [0.7, 0.26], [0.28, 0.58], [0.58, 0.5], [0.78, 0.68], [0.48, 0.8]] },
  { c: 2, r: 0, trees: [[0.24, 0.22], [0.55, 0.3], [0.78, 0.2], [0.32, 0.52], [0.68, 0.55], [0.2, 0.75], [0.6, 0.78]] },
  { c: 0, r: 1, trees: [[0.2, 0.22], [0.45, 0.18], [0.28, 0.48], [0.18, 0.7], [0.5, 0.62], [0.38, 0.82], [0.68, 0.78]] },
  { c: 2, r: 1, trees: [[0.3, 0.2], [0.62, 0.18], [0.78, 0.4], [0.55, 0.52], [0.28, 0.6], [0.7, 0.72], [0.42, 0.82]] },
  { c: 0, r: 2, trees: [[0.22, 0.24], [0.5, 0.2], [0.78, 0.32], [0.3, 0.5], [0.62, 0.48], [0.2, 0.75], [0.58, 0.78]] },
  { c: 1, r: 2, trees: [[0.2, 0.22], [0.48, 0.28], [0.75, 0.2], [0.32, 0.52], [0.65, 0.55], [0.22, 0.78], [0.7, 0.75]] },
  { c: 2, r: 2, trees: [[0.28, 0.2], [0.55, 0.28], [0.78, 0.22], [0.22, 0.5], [0.6, 0.52], [0.4, 0.75], [0.72, 0.78]] },
];

const FOREST_TREES: TreeDef[] = FOREST_LAYOUT.flatMap((tile, ti) =>
  tile.trees.map(([lx, ly], i) => {
    const p = localToWorld(tile.c, tile.r, lx, ly);
    return {
      id: `p${ti}-${i}`,
      x: p.x,
      y: p.y,
      wood: 3 + (i % 2),
      tile: cellKey(tile.c, tile.r),
    };
  })
);

/** Trees stacked on the gold vein — chop them to uncover the mine. */
const MINE_COVER: TreeDef[] = [
  { id: 'cover-n0', ...localToWorld(1, 0, 0.5, 0.4), wood: 4, tile: cellKey(1, 0) },
  { id: 'cover-n1', ...localToWorld(1, 0, 0.56, 0.46), wood: 3, tile: cellKey(1, 0) },
  { id: 'cover-n2', ...localToWorld(1, 0, 0.45, 0.47), wood: 4, tile: cellKey(1, 0) },
].map((t) => ({ id: t.id, x: t.x, y: t.y, wood: t.wood, tile: t.tile }));

export const TREES: TreeDef[] = [...FOREST_TREES, ...MINE_COVER];

/** One gold vein, hidden under the north-woods cluster. */
export const MINES: MineDef[] = [
  {
    id: 'gold-n',
    ...localToWorld(1, 0, 0.5, 0.44),
    coins: 10,
    tile: cellKey(1, 0),
    cover: ['cover-n0', 'cover-n1', 'cover-n2'],
  },
];

export function mineIsOpen(mine: MineDef, chopped: Record<string, boolean> | string[]) {
  const has = Array.isArray(chopped) ? (id: string) => chopped.includes(id) : (id: string) => !!chopped[id];
  return mine.cover.every(has);
}

export const MINE_REACH = 5.4;
export const MINE_MS = 640;
export const MINE_COOL_MS = 2800;

export const TROLL_HP = 3;
export const TROLL_AGGRO = 18;
export const TROLL_SPEED = 11;
export const HORDE_SPEED = 4.5;
export const CHOP_REACH = 5.2;
export const HUT_REACH = 7;
/** Total wood + coins that can sit on your back before you must dump. */
export const CARRY_MAX = 20;
export const PICK_REACH = 3.4;
export const MAGNET_REACH = 6.5;
export const STACK_MS = 140;
export const DESTACK_MS = 130;
export const FLY_MS = 420;

export function distPct(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

export function spawnEdge(wave: number): { x: number; y: number } {
  const side = wave % 4;
  if (side === 0) return { x: 8 + (wave % 5) * 4, y: 8 };
  if (side === 1) return { x: 92, y: 10 + (wave % 5) * 5 };
  if (side === 2) return { x: 12 + (wave % 5) * 5, y: 92 };
  return { x: 8, y: 18 + (wave % 5) * 5 };
}
