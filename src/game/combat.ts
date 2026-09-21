import type { BuildingId } from '../data/types';
import { TOWER_SLOTS } from './world';

export const FORT = {
  l: TOWER_SLOTS[0].x,
  r: TOWER_SLOTS[1].x,
  t: TOWER_SLOTS[0].y,
  b: TOWER_SLOTS[2].y,
};

export const BASH_MS = 720;
export const BASH_REACH = 5.4;

export type BashHit =
  | { kind: 'wall'; i: number }
  | { kind: 'tower'; i: number }
  | { kind: 'building'; id: BuildingId };

export function maxBuildingHp(id: BuildingId, level: number): number {
  if (id === 'castle') return 40 + Math.max(1, level) * 16;
  if (id === 'lookout' || id === 'wall') return 0;
  if (level <= 0) return 0;
  return 18 + level * 12;
}

export function maxTowerHp(placed: boolean, fortLevel: number): number {
  if (!placed) return 0;
  return 26 + Math.max(1, fortLevel) * 10;
}

export function maxWallEdgeHp(fortLevel: number): number {
  if (fortLevel < 1) return 0;
  return 32 + fortLevel * 14;
}

export function hordeSize(levelN: number, wave: number): number {
  return Math.min(8, 2 + Math.floor(levelN / 3) + Math.max(0, wave - 1));
}

export function clampToWalls(
  x: number,
  y: number,
  nx: number,
  ny: number,
  wallHp: number[],
  fortLevel: number
): { x: number; y: number; hit: BashHit | null } {
  if (fortLevel < 1) return { x: nx, y: ny, hit: null };
  const { l, r, t, b } = FORT;
  const pad = 0.6;

  if (y < t && ny >= t - pad && nx >= l && nx <= r && (wallHp[0] ?? 0) > 0) {
    return { x: nx, y: t - pad, hit: { kind: 'wall', i: 0 } };
  }
  if (y > b && ny <= b + pad && nx >= l && nx <= r && (wallHp[3] ?? 0) > 0) {
    return { x: nx, y: b + pad, hit: { kind: 'wall', i: 3 } };
  }
  if (x < l && nx >= l - pad && ny >= t && ny <= b && (wallHp[1] ?? 0) > 0) {
    return { x: l - pad, y: ny, hit: { kind: 'wall', i: 1 } };
  }
  if (x > r && nx <= r + pad && ny >= t && ny <= b && (wallHp[2] ?? 0) > 0) {
    return { x: r + pad, y: ny, hit: { kind: 'wall', i: 2 } };
  }
  return { x: nx, y: ny, hit: null };
}
