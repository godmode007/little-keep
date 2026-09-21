export type ResourceKey = 'food' | 'wood' | 'stars' | 'coins';

export type BuildingId = 'castle' | 'wall' | 'farm' | 'hut' | 'workshop' | 'lookout' | 'mill';

export type HeroId = 'pip' | 'mira' | 'blink' | 'nana';

export type QuestId =
  | 'baker'
  | 'garden'
  | 'kitten'
  | 'woods'
  | 'lantern'
  | 'fair';

export interface Resources {
  food: number;
  wood: number;
  stars: number;
  coins: number;
}

export type Fund = { wood: number; coins: number };

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
  /** Short race label shown in sheets / Friends (e.g. Wood Elf). */
  race: string;
  /** Class role for kids (e.g. Ranger). */
  role: string;
  blurb: string;
  /** One kid sentence when they join or stand on the lawn. */
  presence: string;
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
