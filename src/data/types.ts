export type ResourceKey = 'food' | 'wood' | 'stars';

export type BuildingId = 'castle' | 'farm' | 'hut' | 'workshop';

export type HeroId = 'pip' | 'mira' | 'blink' | 'nana';

export type QuestId =
  | 'baker'
  | 'garden'
  | 'kitten'
  | 'woods'
  | 'fair';

export interface Resources {
  food: number;
  wood: number;
  stars: number;
}

export interface BuildingDef {
  id: BuildingId;
  name: string;
  blurb: string;
  emoji: string;
  maxLevel: number;
  unlockCastle: number;
  baseCost: Partial<Resources>;
  produces?: Partial<Pick<Resources, 'food' | 'wood'>>;
}

export interface HeroDef {
  id: HeroId;
  name: string;
  title: string;
  blurb: string;
  emoji: string;
  power: number;
  recruitCost: Partial<Resources>;
}

export interface QuestDef {
  id: QuestId;
  name: string;
  blurb: string;
  emoji: string;
  powerNeeded: number;
  cost: Partial<Resources>;
  rewardStars: number;
  rewardFood?: number;
  rewardWood?: number;
  unlockCastle: number;
}

export interface GoalDef {
  id: string;
  label: string;
  check: (s: {
    castleLevel: number;
    heroes: HeroId[];
    questsDone: QuestId[];
    stars: number;
  }) => boolean;
}
