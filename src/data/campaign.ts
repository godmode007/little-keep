import type { BuildingId, HeroId, QuestId } from './types';

export interface FogNodeDef {
  i: number;
  x: number;
  y: number;
  /** Fog rect as % of the world (Kingshot-style region, not a chip). */
  left: number;
  top: number;
  width: number;
  height: number;
  fogTitle: string;
  fogSentence: string;
  lockedSentence: string;
  towerMeta: string;
  cleared: 'tower' | 'well';
}

export interface LevelDef {
  n: number;
  name: string;
  chip: string;
  winQuests: QuestId[];
  winLookout?: number;
  winRecruited?: HeroId[];
  winBuildings?: Partial<Record<BuildingId, number>>;
  flagQuest?: QuestId;
  fogFocus?: number;
  /** How many horde waves this chapter sends. */
  hordes: number;
}

/** Third patch is the brook well. Cap 4; we ship 3. */
export const FOG_NODES: FogNodeDef[] = [
  {
    i: 0,
    x: 14,
    y: 30,
    left: 0,
    top: 0,
    width: 24,
    height: 44,
    fogTitle: 'Misty Woods',
    fogSentence: 'These woods hide the next watch tower. Spend wood to clear a path.',
    lockedSentence: 'Clear the nearer woods first.',
    towerMeta: 'Near woods',
    cleared: 'tower',
  },
  {
    i: 1,
    x: 88,
    y: 26,
    left: 78,
    top: 0,
    width: 22,
    height: 42,
    fogTitle: 'Deeper Woods',
    fogSentence: 'The deeper woods hide the next watch tower.',
    lockedSentence: 'A watch tower waits farther in. Clear the nearer woods first.',
    towerMeta: 'Deeper woods',
    cleared: 'tower',
  },
  {
    i: 2,
    x: 10,
    y: 72,
    left: 0,
    top: 58,
    width: 28,
    height: 42,
    fogTitle: 'Misty Brook',
    fogSentence: 'Mist sits on the brook. Clear it and a wishing well stands by the path.',
    lockedSentence: 'The brook is still lost in the trees. Clear the pine woods first.',
    towerMeta: 'Wishing well',
    cleared: 'well',
  },
];

export const LEVELS: LevelDef[] = [
  {
    n: 1,
    name: 'Little Keep Wakes',
    hordes: 2,
    chip: 'Raise a watch tower and help the baker.',
    winQuests: ['baker'],
    winLookout: 1,
    flagQuest: 'baker',
    fogFocus: 0,
  },
  {
    n: 2,
    name: 'Ranger at the Gate',
    hordes: 2,
    chip: 'Mira the Ranger wants to join your party.',
    winQuests: [],
    winRecruited: ['mira'],
  },
  {
    n: 3,
    name: 'Trolls in the Patch',
    hordes: 3,
    chip: 'Shoo the garden trolls off the veggies.',
    winQuests: ['garden'],
    flagQuest: 'garden',
  },
  {
    n: 4,
    name: 'Stones Go Higher',
    hordes: 3,
    chip: 'Make the castle bigger.',
    winQuests: [],
    winBuildings: { castle: 2 },
  },
  {
    n: 5,
    name: 'Shop on the Path',
    hordes: 3,
    chip: 'Build a Workshop in the empty slot.',
    winQuests: [],
    winBuildings: { workshop: 1 },
  },
  {
    n: 6,
    name: 'Whiskers in the Weeds',
    hordes: 4,
    chip: 'Find the lost kitten.',
    winQuests: ['kitten'],
    flagQuest: 'kitten',
  },
  {
    n: 7,
    name: 'Fairy on the Lawn',
    hordes: 4,
    chip: 'Blink the Fairy wants to join.',
    winQuests: [],
    winRecruited: ['blink'],
  },
  {
    n: 8,
    name: 'Watch in the Pines',
    hordes: 4,
    chip: 'Clear the deeper woods for a second watch tower.',
    winQuests: [],
    winLookout: 2,
    fogFocus: 1,
  },
  {
    n: 9,
    name: 'Higher Halls',
    hordes: 5,
    chip: 'Grow the castle again.',
    winQuests: [],
    winBuildings: { castle: 3 },
  },
  {
    n: 10,
    name: 'Ogre on the Path',
    hordes: 5,
    chip: 'Shoo the sleepy ogre off the berry path.',
    winQuests: ['woods'],
    flagQuest: 'woods',
  },
  {
    n: 11,
    name: 'Party of Four',
    hordes: 5,
    chip: 'Nana the Cleric completes the party.',
    winQuests: [],
    winRecruited: ['nana'],
  },
  {
    n: 12,
    name: 'Banner Keep',
    hordes: 6,
    chip: 'Raise the castle to level 4.',
    winQuests: [],
    winBuildings: { castle: 4 },
  },
  {
    n: 13,
    name: 'Misty Brook',
    hordes: 6,
    chip: 'Clear the brook mist so a wishing well can stand.',
    winQuests: [],
    winLookout: 3,
    fogFocus: 2,
  },
  {
    n: 14,
    name: 'Crowned Keep',
    hordes: 6,
    chip: 'The castle is as big as it gets.',
    winQuests: [],
    winBuildings: { castle: 5 },
  },
  {
    n: 15,
    name: 'Lanterns Out',
    hordes: 7,
    chip: 'Shoo lantern trolls so the path can glow.',
    winQuests: ['lantern'],
    flagQuest: 'lantern',
  },
  {
    n: 16,
    name: 'Star Fair',
    hordes: 8,
    chip: 'Throw a party for the whole keep.',
    winQuests: ['fair'],
    flagQuest: 'fair',
  },
];
