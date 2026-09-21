import { LEVELS, type LevelDef } from '../data/campaign';
import type { BuildingId, HeroId, QuestId } from '../data/types';

export type ProgressSnap = {
  questsDone: QuestId[];
  recruited: HeroId[];
  buildingLevels: Record<BuildingId, number>;
};

export function isLevelMet(level: LevelDef, s: ProgressSnap): boolean {
  if (level.winQuests.some((id) => !s.questsDone.includes(id))) return false;
  if (level.winLookout != null && (s.buildingLevels.lookout ?? 0) < level.winLookout) {
    return false;
  }
  if (level.winRecruited?.some((id) => !s.recruited.includes(id))) return false;
  if (level.winBuildings) {
    for (const [id, min] of Object.entries(level.winBuildings) as [BuildingId, number][]) {
      if ((s.buildingLevels[id] ?? 0) < min) return false;
    }
  }
  return true;
}

/** First unmet row. If every row is met, returns the last level (campaign complete). */
export function currentLevel(s: ProgressSnap): LevelDef {
  for (const level of LEVELS) {
    if (!isLevelMet(level, s)) return level;
  }
  return LEVELS[LEVELS.length - 1];
}

export function campaignComplete(s: ProgressSnap): boolean {
  return LEVELS.every((level) => isLevelMet(level, s));
}
