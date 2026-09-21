import type { Resources } from '../data/types';

export function canAfford(have: Resources, cost: Partial<Resources>): boolean {
  return (Object.keys(cost) as (keyof Resources)[]).every((k) => have[k] >= (cost[k] ?? 0));
}

export function pay(have: Resources, cost: Partial<Resources>): Resources {
  const next = { ...have };
  for (const k of Object.keys(cost) as (keyof Resources)[]) {
    next[k] -= cost[k] ?? 0;
  }
  return next;
}

export function gain(have: Resources, add: Partial<Resources>): Resources {
  const next = { ...have };
  for (const k of Object.keys(add) as (keyof Resources)[]) {
    next[k] += add[k] ?? 0;
  }
  return next;
}

export function scaleCost(
  base: Partial<Resources>,
  level: number,
  discount = 0
): Partial<Resources> {
  const factor = Math.max(0.5, 1 + (level - 1) * 0.55 - discount);
  const out: Partial<Resources> = {};
  for (const k of Object.keys(base) as (keyof Resources)[]) {
    out[k] = Math.ceil((base[k] ?? 0) * factor);
  }
  return out;
}
