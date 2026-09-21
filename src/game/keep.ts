import type { BuildingId } from '../data/types';
import { FORT_NAMES } from './world';

export const TOWER_MAX_RANK = 4;
/** Extra pads (mill) unlock once the hut reaches this level. */
export const KEEP_EXTRA_LEVEL = 3;

export type KeepSnap = {
  buildingLevels: Record<BuildingId, number>;
  towerLevels: number[];
  fortLevel?: number;
};

export function towerRanks(state: KeepSnap): number[] {
  const lv = state.towerLevels?.length === 4 ? state.towerLevels : [0, 0, 0, 0];
  return lv.map((n) => Math.max(0, Math.min(TOWER_MAX_RANK, Math.floor(n))));
}

export function towersBuilt(state: KeepSnap): number {
  return towerRanks(state).filter((n) => n > 0).length;
}

/** Wall rank is the lowest of the four towers. Missing a tower means no wall. */
export function wallRankFrom(ranks: number[]): number {
  if (ranks.length !== 4 || ranks.some((n) => n < 1)) return 0;
  return Math.min(...ranks);
}

export function wallRank(state: KeepSnap): number {
  return wallRankFrom(towerRanks(state));
}

export function keepRank(state: KeepSnap): number {
  return Math.max(1, state.buildingLevels.castle ?? 1);
}

/** Towers may rise up to the hut’s current level. After the hut grows, they can rise again. */
export function towerCap(state: KeepSnap): number {
  return Math.min(TOWER_MAX_RANK, keepRank(state));
}

export function towerCanGrow(
  state: KeepSnap,
  i: number
): { ok: boolean; next: number; cap: number; message: string } {
  const ranks = towerRanks(state);
  const lv = ranks[i] ?? 0;
  const cap = towerCap(state);
  if (lv >= TOWER_MAX_RANK) {
    return { ok: false, next: lv, cap, message: 'This tower is as strong as it gets — cement.' };
  }
  if (lv >= cap) {
    return {
      ok: false,
      next: lv,
      cap,
      message:
        lv === 0
          ? 'Tap a gold square to plant this tower.'
          : `Upgrade the keep first. Then this tower can grow past ${FORT_NAMES[lv]}.`,
    };
  }
  return { ok: true, next: lv + 1, cap, message: '' };
}

export function keepCanGrow(state: KeepSnap): {
  ok: boolean;
  have: number;
  need: number;
  rank: number;
  message: string;
} {
  const rank = keepRank(state);
  const ranks = towerRanks(state);
  const built = ranks.filter((n) => n > 0).length;
  const walls = wallRank(state);
  if (built < 4) {
    return {
      ok: false,
      have: built,
      need: 4,
      rank,
      message: `Find all four towers first (${built}/4). Walls go up when every corner is planted.`,
    };
  }
  if (walls < rank) {
    const have = ranks.filter((n) => n >= rank).length;
    return {
      ok: false,
      have,
      need: 4,
      rank,
      message: `Upgrade the towers again (${have}/4 at hut ${rank}). Then the hut can grow.`,
    };
  }
  return {
    ok: true,
    have: 4,
    need: 4,
    rank,
    message: 'Walls are up. Tap the hut to grow it.',
  };
}

/** Old saves stored towers as 0/1 and the ring rank on fortLevel. */
export function hydrateTowers(
  towerLevels: number[] | undefined,
  fortLevel: number | undefined
): { towerLevels: number[]; fortLevel: number } {
  const raw =
    towerLevels?.length === 4
      ? towerLevels.map((n) => Math.max(0, Math.min(TOWER_MAX_RANK, Math.floor(n))))
      : [0, 0, 0, 0];
  const fort = Math.max(0, Math.min(TOWER_MAX_RANK, Math.floor(fortLevel ?? 0)));
  const built = raw.filter((n) => n > 0).length;
  const maxT = Math.max(0, ...raw);
  const towers = built >= 1 && maxT <= 1 && fort > 1 ? raw.map((n) => (n > 0 ? fort : 0)) : raw;
  return { towerLevels: towers, fortLevel: wallRankFrom(towers) };
}
