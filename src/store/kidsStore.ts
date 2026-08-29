import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BUILDINGS, HEROES, QUESTS } from '../data/catalog';
import type { BuildingId, HeroId, QuestId, Resources } from '../data/types';
import { canAfford, gain, pay, scaleCost } from '../game/economy';

export interface KidsState {
  playerName: string;
  started: boolean;
  resources: Resources;
  buildingLevels: Record<BuildingId, number>;
  recruited: HeroId[];
  questsDone: QuestId[];
  lastMessage: string | null;
  lastCollectAt: number;

  startGame: (name: string) => void;
  collect: () => { ok: boolean; message: string };
  upgrade: (id: BuildingId) => { ok: boolean; message: string };
  recruit: (id: HeroId) => { ok: boolean; message: string };
  doQuest: (id: QuestId) => { ok: boolean; message: string };
  reset: () => void;
}

const initial = (): Omit<
  KidsState,
  'startGame' | 'collect' | 'upgrade' | 'recruit' | 'doQuest' | 'reset'
> => ({
  playerName: '',
  started: false,
  resources: { food: 40, wood: 30, stars: 0 },
  buildingLevels: { castle: 1, farm: 1, hut: 1, workshop: 0 },
  recruited: ['pip'],
  questsDone: [],
  lastMessage: null,
  lastCollectAt: 0,
});

function partyPower(recruited: HeroId[]): number {
  return HEROES.filter((h) => recruited.includes(h.id)).reduce((sum, h) => sum + h.power, 0);
}

export const useKidsStore = create<KidsState>()(
  persist(
    (set, get) => ({
      ...initial(),

      startGame: (name) => {
        set({
          ...initial(),
          playerName: name.trim() || 'Ruler',
          started: true,
          lastCollectAt: Date.now(),
        });
      },

      collect: () => {
        const state = get();
        const now = Date.now();
        const waitMs = 4000;
        if (now - state.lastCollectAt < waitMs) {
          const secs = Math.ceil((waitMs - (now - state.lastCollectAt)) / 1000);
          return { ok: false, message: `Wait ${secs}s for more supplies!` };
        }

        let food = 8;
        let wood = 6;
        for (const b of BUILDINGS) {
          const level = state.buildingLevels[b.id];
          if (!level || !b.produces) continue;
          food += (b.produces.food ?? 0) * level;
          wood += (b.produces.wood ?? 0) * level;
        }

        const resources = gain(state.resources, { food, wood });
        const message = `Collected +${food} food and +${wood} wood!`;
        set({ resources, lastCollectAt: now, lastMessage: message });
        return { ok: true, message };
      },

      upgrade: (id) => {
        const state = get();
        const def = BUILDINGS.find((b) => b.id === id);
        if (!def) return { ok: false, message: 'Hmm, unknown building.' };
        const level = state.buildingLevels[id];
        if (level >= def.maxLevel) return { ok: false, message: 'Already maxed!' };
        if (state.buildingLevels.castle < def.unlockCastle && id !== 'castle') {
          return { ok: false, message: `Need Castle ${def.unlockCastle} first.` };
        }
        const discount = state.buildingLevels.workshop * 0.08;
        const cost = scaleCost(def.baseCost, Math.max(1, level + 1), discount);
        if (!canAfford(state.resources, cost)) {
          return { ok: false, message: 'Need more food or wood.' };
        }
        set({
          resources: pay(state.resources, cost),
          buildingLevels: { ...state.buildingLevels, [id]: level + 1 },
          lastMessage: `${def.name} is now level ${level + 1}!`,
        });
        return { ok: true, message: `${def.name} leveled up!` };
      },

      recruit: (id) => {
        const state = get();
        if (state.recruited.includes(id)) {
          return { ok: false, message: 'Already in your party!' };
        }
        const hero = HEROES.find((h) => h.id === id);
        if (!hero) return { ok: false, message: 'Who?' };
        if (!canAfford(state.resources, hero.recruitCost)) {
          return { ok: false, message: 'Save up a bit more!' };
        }
        set({
          resources: pay(state.resources, hero.recruitCost),
          recruited: [...state.recruited, id],
          lastMessage: `${hero.name} joined your party!`,
        });
        return { ok: true, message: `${hero.name} joined!` };
      },

      doQuest: (id) => {
        const state = get();
        if (state.questsDone.includes(id)) {
          return { ok: false, message: 'You already finished this one!' };
        }
        const quest = QUESTS.find((q) => q.id === id);
        if (!quest) return { ok: false, message: 'Quest missing.' };
        if (state.buildingLevels.castle < quest.unlockCastle) {
          return { ok: false, message: `Need Castle ${quest.unlockCastle}.` };
        }
        if (!canAfford(state.resources, quest.cost)) {
          return { ok: false, message: 'Pack more supplies first.' };
        }
        const power = partyPower(state.recruited);
        if (power < quest.powerNeeded) {
          return {
            ok: false,
            message: `Need ${quest.powerNeeded} power (you have ${power}). Recruit friends!`,
          };
        }
        let resources = pay(state.resources, quest.cost);
        resources = gain(resources, {
          stars: quest.rewardStars,
          food: quest.rewardFood ?? 0,
          wood: quest.rewardWood ?? 0,
        });
        const message = `Quest complete! +${quest.rewardStars} stars ⭐`;
        set({
          resources,
          questsDone: [...state.questsDone, id],
          lastMessage: message,
        });
        return { ok: true, message };
      },

      reset: () => set({ ...initial() }),
    }),
    {
      name: 'little-keep-save-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export { partyPower };
