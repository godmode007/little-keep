import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BUILDINGS, HEROES, QUESTS } from '../data/catalog';
import type { BuildingId, Fund, HeroId, QuestId, Resources } from '../data/types';
import { maxBuildingHp, maxTowerHp, maxWallEdgeHp } from '../game/combat';
import {
  hydrateTowers,
  keepCanGrow,
  towerCanGrow,
  towerRanks,
  wallRankFrom,
} from '../game/keep';
import { CARRY_MAX, FORT_NAMES, MINES, TOWER_COST } from '../game/world';
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
  carryingWood: number;
  carryingCoins: number;
  buildingFund: Record<string, Fund>;
  towerLevels: number[];
  fortLevel: number;
  revealedCells: string[];
  towerCharge: number[];
  buildingHp: Record<BuildingId, number>;
  towerHp: number[];
  wallHp: number[];
  hordeWave: number;
  hordeLevelN: number;
  choppedTrees: string[];
  revealedMines: string[];

  startGame: (name: string) => void;
  collect: () => { ok: boolean; message: string };
  upgrade: (id: BuildingId) => { ok: boolean; message: string };
  recruit: (id: HeroId) => { ok: boolean; message: string };
  doQuest: (id: QuestId) => { ok: boolean; message: string };
  pickWood: (n: number, quiet?: boolean) => { ok: boolean; message: string; taken: number; leftover: number };
  pickCoins: (n: number, quiet?: boolean) => { ok: boolean; message: string; taken: number; leftover: number };
  dropWood: () => { ok: boolean; message: string };
  bankCarry: () => { ok: boolean; message: string };
  earnCoins: (n: number, quiet?: boolean) => { ok: boolean; message: string; taken: number; leftover: number };
  feedBuilding: (id: BuildingId) => { ok: boolean; message: string };
  chopTree: (id: string) => { ok: boolean; message: string; revealedMine: boolean };
  feedTower: (i: number) => { ok: boolean; message: string };
  feedPiece: (spot: string, kind: 'wood' | 'coins') => { ok: boolean; message: string };
  chargeTower: (i: number) => { ok: boolean; message: string };
  raidCamp: () => { ok: boolean; message: string };
  hitWall: (i: number, n?: number) => { ok: boolean; message: string; hp: number };
  hitTower: (i: number, n?: number) => { ok: boolean; message: string; hp: number };
  hitBuilding: (id: BuildingId, n?: number) => { ok: boolean; message: string; hp: number };
  markHordeWave: (n: number, levelN: number) => void;
  revealCells: (keys: string[]) => void;
  reset: () => void;
}

const initial = (): Omit<
  KidsState,
  | 'startGame'
  | 'collect'
  | 'upgrade'
  | 'recruit'
  | 'doQuest'
  | 'pickWood'
  | 'pickCoins'
  | 'dropWood'
  | 'bankCarry'
  | 'earnCoins'
  | 'chopTree'
  | 'feedBuilding'
  | 'feedTower'
  | 'feedPiece'
  | 'chargeTower'
  | 'raidCamp'
  | 'hitWall'
  | 'hitTower'
  | 'hitBuilding'
  | 'markHordeWave'
  | 'revealCells'
  | 'reset'
> => ({
  playerName: '',
  started: false,
  resources: { food: 22, wood: 4, stars: 0, coins: 0 },
  buildingLevels: { castle: 1, wall: 0, farm: 0, hut: 0, workshop: 0, lookout: 0, mill: 0 },
  recruited: ['pip'],
  questsDone: [],
  lastMessage: null,
  lastCollectAt: 0,
  carryingWood: 0,
  carryingCoins: 0,
  buildingFund: {},
  towerLevels: [0, 0, 0, 0],
  fortLevel: 0,
  revealedCells: [],
  towerCharge: [0, 0, 0, 0],
  buildingHp: {
    castle: maxBuildingHp('castle', 1),
    wall: 0,
    farm: 0,
    hut: 0,
    workshop: 0,
    lookout: 0,
    mill: 0,
  },
  towerHp: [0, 0, 0, 0],
  wallHp: [0, 0, 0, 0],
  hordeWave: 0,
  hordeLevelN: 1,
  choppedTrees: [],
  revealedMines: [],
});

function emptyFund(): Fund {
  return { wood: 0, coins: 0 };
}

function takeCarry(state: KidsState, n: number) {
  const room = Math.max(0, CARRY_MAX - state.carryingWood - state.carryingCoins);
  const taken = Math.min(Math.max(0, n), room);
  return { taken, leftover: Math.max(0, n) - taken, total: state.carryingWood + state.carryingCoins + taken };
}

function pullLoot(state: KidsState, wantW: number, wantC: number) {
  const takeCarryW = Math.min(state.carryingWood, wantW);
  const takeBankW = Math.min(state.resources.wood, wantW - takeCarryW);
  const takeCarryC = Math.min(state.carryingCoins, wantC);
  const takeBankC = Math.min(state.resources.coins, wantC - takeCarryC);
  return {
    takeCarryW,
    takeBankW,
    takeCarryC,
    takeBankC,
    takeW: takeCarryW + takeBankW,
    takeC: takeCarryC + takeBankC,
  };
}

function syncFort(towerLevels: number[], buildingLevels: Record<BuildingId, number>) {
  const built = towerLevels.filter((n) => n > 0).length;
  return { ...buildingLevels, lookout: built, wall: wallRankFrom(towerLevels) };
}

function keepGrewMessage(level: number): string {
  return `The hut grew to lv ${level}! Tap the towers to rank them again.`;
}

function applyTowerFund(
  state: KidsState,
  i: number,
  addW: number,
  addC: number
): { ok: boolean; message: string; patch: Partial<KidsState> | null } {
  const towerLevels = towerRanks(state);
  const grow = towerCanGrow({ ...state, towerLevels }, i);
  if (!grow.ok) {
    return { ok: false, message: grow.message, patch: null };
  }
  const discount = (state.buildingLevels.workshop ?? 0) * 0.08;
  const cost = scaleCost(TOWER_COST, grow.next, discount);
  const needW = cost.wood ?? 0;
  const needC = cost.coins ?? 0;
  const key = `tower-${i}`;
  const fund = { ...(state.buildingFund[key] ?? emptyFund()) };
  fund.wood += addW;
  fund.coins += addC;
  let message = `Corner ${i + 1} 🪵 ${fund.wood}/${needW} · 🪙 ${fund.coins}/${needC}`;
  const prevWalls = wallRankFrom(towerLevels);
  const towerHp = [...(state.towerHp.length === 4 ? state.towerHp : [0, 0, 0, 0])];
  let fortLevel = prevWalls;
  let wallHp = state.wallHp;
  if (fund.wood >= needW && fund.coins >= needC) {
    fund.wood -= needW;
    fund.coins -= needC;
    const prevLv = towerLevels[i] ?? 0;
    towerLevels[i] = grow.next;
    towerHp[i] = maxTowerHp(true, grow.next);
    const nowWalls = wallRankFrom(towerLevels);
    const built = towerLevels.filter((n) => n > 0).length;
    fortLevel = nowWalls;
    if (prevLv === 0 && nowWalls < 1) {
      message = `Tower planted. ${4 - built} more corners for the wood wall.`;
    } else if (nowWalls > prevWalls) {
      wallHp = fullWallHp(nowWalls);
      message =
        nowWalls === 1
          ? 'All four towers are up — a wood wall rings the fort!'
          : `All four towers match — the wall is ${FORT_NAMES[nowWalls]} now. Tap the hut to grow it.`;
    } else {
      const lag = towerLevels.filter((n) => n < grow.next).length;
      message = lag
        ? `Tower is ${FORT_NAMES[grow.next]}. Rank the other ${lag} so the wall can rise.`
        : `Tower is ${FORT_NAMES[grow.next]}.`;
    }
  }
  return {
    ok: true,
    message,
    patch: {
      buildingFund: { ...state.buildingFund, [key]: fund },
      towerLevels,
      fortLevel,
      towerHp,
      wallHp: fortLevel >= 1 ? wallHp : state.wallHp,
      buildingLevels: syncFort(towerLevels, state.buildingLevels),
      lastMessage: message,
    },
  };
}

function fullWallHp(fortLevel: number): number[] {
  const max = maxWallEdgeHp(fortLevel);
  return [max, max, max, max];
}

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
          lastCollectAt: 0,
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
        const level = state.buildingLevels[id] ?? 0;
        if (level >= def.maxLevel) return { ok: false, message: 'Already maxed!' };
        if ((state.buildingLevels.castle ?? 1) < def.unlockCastle && id !== 'castle') {
          return { ok: false, message: `Need Castle ${def.unlockCastle} first.` };
        }
        if (id === 'castle') {
          const gate = keepCanGrow(state);
          if (!gate.ok) {
            set({ lastMessage: gate.message });
            return { ok: false, message: gate.message };
          }
        }
        const discount = (state.buildingLevels.workshop ?? 0) * 0.08;
        const cost = scaleCost(def.baseCost, Math.max(1, level + 1), discount);
        if (!canAfford(state.resources, cost)) {
          return { ok: false, message: 'Need more wood or coins.' };
        }
        const nextLevel = level + 1;
        const lastMessage =
          id === 'lookout'
            ? nextLevel === 1
              ? 'A security tower now watches the camp!'
              : `Security tower ${nextLevel} is up — taller and covering another corner!`
            : id === 'wall'
              ? nextLevel === 1
                ? 'Palisade walls ring the hut!'
                : `The palisade grows taller (lv ${nextLevel})!`
              : id === 'castle'
                ? keepGrewMessage(nextLevel)
                : `${def.name} is now level ${nextLevel} — it grew!`;
        set({
          resources: pay(state.resources, cost),
          buildingLevels: { ...state.buildingLevels, [id]: nextLevel },
          buildingHp: { ...state.buildingHp, [id]: maxBuildingHp(id, nextLevel) },
          lastMessage,
        });
        return { ok: true, message: lastMessage };
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
          lastMessage: `${hero.name} the ${hero.race.toLowerCase()} ${hero.role.toLowerCase()} joined your party!`,
        });
        return {
          ok: true,
          message: `${hero.name} joined! ${hero.presence}`,
        };
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

      pickWood: (n, quiet) => {
        const state = get();
        const { taken, leftover, total } = takeCarry(state, n);
        if (!taken) {
          const message = 'Back is full. Dump at the storehouse.';
          if (!quiet) set({ lastMessage: message });
          return { ok: false, message, taken: 0, leftover: n };
        }
        const message =
          leftover || total >= CARRY_MAX
            ? `Back is full (${total}/${CARRY_MAX}). Dump at the storehouse.`
            : `🪵 stacked ${total}/${CARRY_MAX}. Dump at the storehouse.`;
        set({ carryingWood: state.carryingWood + taken, lastMessage: quiet ? state.lastMessage : message });
        return { ok: true, message, taken, leftover };
      },

      pickCoins: (n, quiet) => {
        const state = get();
        const { taken, leftover, total } = takeCarry(state, n);
        if (!taken) {
          const message = 'Back is full. Dump at the storehouse.';
          if (!quiet) set({ lastMessage: message });
          return { ok: false, message, taken: 0, leftover: n };
        }
        const message =
          leftover || total >= CARRY_MAX
            ? `Back is full (${total}/${CARRY_MAX}). Dump at the storehouse.`
            : `🪙 stacked ${total}/${CARRY_MAX}. Dump at the storehouse.`;
        set({ carryingCoins: state.carryingCoins + taken, lastMessage: quiet ? state.lastMessage : message });
        return { ok: true, message, taken, leftover };
      },

      dropWood: () => get().bankCarry(),

      bankCarry: () => {
        const state = get();
        const w = state.carryingWood;
        const c = state.carryingCoins;
        if (!w && !c) return { ok: false, message: 'Nothing on your back.' };
        const message = `Stored ${w} wood and ${c} coins in the storehouse.`;
        set({
          carryingWood: 0,
          carryingCoins: 0,
          resources: gain(state.resources, { wood: w, coins: c }),
          lastMessage: message,
        });
        return { ok: true, message };
      },

      chopTree: (id) => {
        const state = get();
        if (state.choppedTrees.includes(id)) return { ok: true, message: '', revealedMine: false };
        const choppedTrees = [...state.choppedTrees, id];
        const revealedMines = [...state.revealedMines];
        let revealedMine = false;
        let message = '';
        for (const mine of MINES) {
          if (revealedMines.includes(mine.id)) continue;
          if (mine.cover.every((t) => choppedTrees.includes(t))) {
            revealedMines.push(mine.id);
            revealedMine = true;
            message = 'A gold vein under the stumps!';
          }
        }
        set({
          choppedTrees,
          revealedMines,
          lastMessage: revealedMine ? message : state.lastMessage,
        });
        return { ok: true, message, revealedMine };
      },

      earnCoins: (n, quiet) => get().pickCoins(n, quiet),

      feedBuilding: (id) => {
        const state = get();
        if (id === 'lookout') return { ok: false, message: 'Walk onto a gold square to raise a tower.' };
        if (id === 'wall') return { ok: false, message: 'Buy all 4 corner squares — they become the wall.' };
        const def = BUILDINGS.find((b) => b.id === id);
        if (!def) return { ok: false, message: 'Hmm, unknown building.' };
        if (id !== 'castle' && (state.buildingLevels.castle ?? 1) < def.unlockCastle) {
          return { ok: false, message: `Need a bigger hut first.` };
        }
        const level = state.buildingLevels[id] ?? 0;
        if (level >= def.maxLevel) {
          const w = state.carryingWood;
          const c = state.carryingCoins;
          if (!w && !c) return { ok: false, message: `${def.name} is as big as it gets.` };
          set({
            carryingWood: 0,
            carryingCoins: 0,
            resources: gain(state.resources, { wood: w, coins: c }),
            lastMessage: `Stored ${w} wood and ${c} coins.`,
          });
          return { ok: true, message: 'Stored at camp.' };
        }
        const cost = scaleCost(def.baseCost, Math.max(1, level + 1), (state.buildingLevels.workshop ?? 0) * 0.08);
        const needW = cost.wood ?? 0;
        const needC = cost.coins ?? 0;
        const fund = { ...(state.buildingFund[id] ?? emptyFund()) };
        const pulled = pullLoot(
          state,
          Math.max(state.carryingWood, Math.max(0, needW - fund.wood)),
          Math.max(state.carryingCoins, Math.max(0, needC - fund.coins))
        );
        if (!pulled.takeW && !pulled.takeC) {
          if (id === 'castle' && fund.wood >= needW && fund.coins >= needC) {
            const gate = keepCanGrow(state);
            if (!gate.ok) {
              set({ lastMessage: gate.message });
              return { ok: false, message: gate.message };
            }
          }
          const message = `${def.name} needs 🪵 ${fund.wood}/${needW} · 🪙 ${fund.coins}/${needC}`;
          set({ lastMessage: message });
          return { ok: false, message };
        }
        fund.wood += pulled.takeW;
        fund.coins += pulled.takeC;
        let buildingLevels = { ...state.buildingLevels };
        let message = `${def.name} 🪵 ${fund.wood}/${needW} · 🪙 ${fund.coins}/${needC}`;
        if (fund.wood >= needW && fund.coins >= needC) {
          if (id === 'castle') {
            const gate = keepCanGrow({ ...state, buildingLevels });
            if (!gate.ok) {
              message = gate.message;
            } else {
              fund.wood -= needW;
              fund.coins -= needC;
              buildingLevels[id] = level + 1;
              message = keepGrewMessage(level + 1);
            }
          } else {
            fund.wood -= needW;
            fund.coins -= needC;
            buildingLevels[id] = level + 1;
            message = `${def.name} grew to lv ${level + 1}!`;
          }
        }
        const buildingHp = { ...state.buildingHp };
        if (buildingLevels[id] !== level) buildingHp[id] = maxBuildingHp(id, buildingLevels[id] ?? 0);
        set({
          carryingWood: state.carryingWood - pulled.takeCarryW,
          carryingCoins: state.carryingCoins - pulled.takeCarryC,
          resources: {
            ...state.resources,
            wood: state.resources.wood - pulled.takeBankW,
            coins: state.resources.coins - pulled.takeBankC,
          },
          buildingFund: { ...state.buildingFund, [id]: fund },
          buildingLevels,
          buildingHp,
          lastMessage: message,
        });
        return { ok: true, message };
      },

      feedTower: (i) => {
        const state = get();
        if (i < 0 || i > 3) return { ok: false, message: 'No square there.' };
        const grow = towerCanGrow(state, i);
        if (!grow.ok) {
          set({ lastMessage: grow.message });
          return { ok: false, message: grow.message };
        }
        const discount = (state.buildingLevels.workshop ?? 0) * 0.08;
        const cost = scaleCost(TOWER_COST, grow.next, discount);
        const needW = cost.wood ?? 0;
        const needC = cost.coins ?? 0;
        const key = `tower-${i}`;
        const fund = state.buildingFund[key] ?? emptyFund();
        const pulled = pullLoot(
          state,
          Math.max(0, needW - fund.wood),
          Math.max(0, needC - fund.coins)
        );
        if (!pulled.takeW && !pulled.takeC) {
          const message = `Corner ${i + 1} needs 🪵 ${fund.wood}/${needW} · 🪙 ${fund.coins}/${needC}`;
          set({ lastMessage: message });
          return { ok: false, message };
        }
        const result = applyTowerFund(state, i, pulled.takeW, pulled.takeC);
        if (!result.ok || !result.patch) {
          set({ lastMessage: result.message });
          return { ok: false, message: result.message };
        }
        set({
          ...result.patch,
          carryingWood: state.carryingWood - pulled.takeCarryW,
          carryingCoins: state.carryingCoins - pulled.takeCarryC,
          resources: {
            ...state.resources,
            wood: state.resources.wood - pulled.takeBankW,
            coins: state.resources.coins - pulled.takeBankC,
          },
        });
        return { ok: true, message: result.message };
      },

      feedPiece: (spot, kind) => {
        const state = get();
        const takeW = kind === 'wood' ? 1 : 0;
        const takeC = kind === 'coins' ? 1 : 0;
        if (takeW && state.carryingWood < 1) return { ok: false, message: 'No wood on your back.' };
        if (takeC && state.carryingCoins < 1) return { ok: false, message: 'No coins on your back.' };

        if (spot === 'store') {
          set({
            carryingWood: state.carryingWood - takeW,
            carryingCoins: state.carryingCoins - takeC,
            resources: gain(state.resources, { wood: takeW, coins: takeC }),
            lastMessage: 'Stored at the storehouse.',
          });
          return { ok: true, message: 'Stored at the storehouse.' };
        }

        const discount = (state.buildingLevels.workshop ?? 0) * 0.08;
        const towerMatch = /^tower-(\d)$/.exec(spot);

        if (towerMatch) {
          const i = Number(towerMatch[1]);
          const towerLevels = towerRanks(state);
          const lv = towerLevels[i] ?? 0;
          const heal = kind === 'wood' ? 10 : 6;
          if (lv > 0) {
            const tMax = maxTowerHp(true, lv);
            const tHp = state.towerHp[i] ?? tMax;
            if (tHp < tMax) {
              const towerHp = [...(state.towerHp.length === 4 ? state.towerHp : [0, 0, 0, 0])];
              towerHp[i] = Math.min(tMax, tHp + heal);
              set({
                carryingWood: state.carryingWood - takeW,
                carryingCoins: state.carryingCoins - takeC,
                towerHp,
                lastMessage: 'The tower is patched.',
              });
              return { ok: true, message: 'The tower is patched.' };
            }
          }
          const walls = wallRankFrom(towerLevels);
          if (lv > 0 && walls >= 1) {
            const wMax = maxWallEdgeHp(walls);
            const wallHp = [...(state.wallHp.length === 4 ? state.wallHp : fullWallHp(walls))];
            let weakest = 0;
            for (let e = 1; e < 4; e++) if ((wallHp[e] ?? 0) < (wallHp[weakest] ?? 0)) weakest = e;
            if ((wallHp[weakest] ?? 0) < wMax) {
              wallHp[weakest] = Math.min(wMax, (wallHp[weakest] ?? 0) + heal);
              set({
                carryingWood: state.carryingWood - takeW,
                carryingCoins: state.carryingCoins - takeC,
                wallHp,
                lastMessage: 'The wall is patched.',
              });
              return { ok: true, message: 'The wall is patched.' };
            }
          }
          const result = applyTowerFund(state, i, takeW, takeC);
          if (!result.ok || !result.patch) {
            set({ lastMessage: result.message });
            return { ok: false, message: result.message };
          }
          set({
            ...result.patch,
            carryingWood: state.carryingWood - takeW,
            carryingCoins: state.carryingCoins - takeC,
          });
          return { ok: true, message: result.message };
        }

        const id = spot as BuildingId;
        if (id === 'lookout' || id === 'wall') {
          return { ok: false, message: 'Walk onto a gold square to raise a tower.' };
        }
        const def = BUILDINGS.find((b) => b.id === id);
        if (!def) return { ok: false, message: 'Hmm, unknown building.' };
        if (id !== 'castle' && (state.buildingLevels.castle ?? 1) < def.unlockCastle) {
          return { ok: false, message: 'Need a bigger hut first.' };
        }
        const level = state.buildingLevels[id] ?? 0;
        const hpMax = maxBuildingHp(id, Math.max(id === 'castle' ? 1 : 0, level));
        const hpNow = state.buildingHp[id] ?? hpMax;
        if (hpMax > 0 && hpNow < hpMax) {
          const heal = kind === 'wood' ? 10 : 6;
          set({
            carryingWood: state.carryingWood - takeW,
            carryingCoins: state.carryingCoins - takeC,
            buildingHp: { ...state.buildingHp, [id]: Math.min(hpMax, hpNow + heal) },
            lastMessage: `${def.name} is patched.`,
          });
          return { ok: true, message: `${def.name} is patched.` };
        }
        if (level >= def.maxLevel) {
          set({
            carryingWood: state.carryingWood - takeW,
            carryingCoins: state.carryingCoins - takeC,
            resources: gain(state.resources, { wood: takeW, coins: takeC }),
          });
          return { ok: true, message: 'Stored at camp.' };
        }
        const cost = scaleCost(def.baseCost, Math.max(1, level + 1), discount);
        const needW = cost.wood ?? 0;
        const needC = cost.coins ?? 0;
        const fund = { ...(state.buildingFund[id] ?? emptyFund()) };
        fund.wood += takeW;
        fund.coins += takeC;
        let buildingLevels = { ...state.buildingLevels };
        let message = `${def.name} 🪵 ${fund.wood}/${needW} · 🪙 ${fund.coins}/${needC}`;
        if (fund.wood >= needW && fund.coins >= needC) {
          if (id === 'castle') {
            const gate = keepCanGrow({ ...state, buildingLevels });
            if (!gate.ok) {
              message = gate.message;
            } else {
              fund.wood -= needW;
              fund.coins -= needC;
              buildingLevels[id] = level + 1;
              message = keepGrewMessage(level + 1);
            }
          } else {
            fund.wood -= needW;
            fund.coins -= needC;
            buildingLevels[id] = level + 1;
            message = `${def.name} grew to lv ${level + 1}!`;
          }
        }
        const buildingHp = { ...state.buildingHp };
        if (buildingLevels[id] !== level) buildingHp[id] = maxBuildingHp(id, buildingLevels[id] ?? 0);
        set({
          carryingWood: state.carryingWood - takeW,
          carryingCoins: state.carryingCoins - takeC,
          buildingFund: { ...state.buildingFund, [id]: fund },
          buildingLevels,
          buildingHp,
          lastMessage: message,
        });
        return { ok: true, message };
      },

      hitWall: (i, n = 1) => {
        const state = get();
        const fortLevel = state.fortLevel ?? 0;
        const max = maxWallEdgeHp(fortLevel);
        if (max <= 0) return { ok: false, message: 'No wall there.', hp: 0 };
        const wallHp = [...(state.wallHp.length === 4 ? state.wallHp : fullWallHp(fortLevel))];
        const hp = Math.max(0, (wallHp[i] ?? max) - n);
        wallHp[i] = hp;
        const message = hp <= 0 ? 'A wall gave way — trolls can pour through!' : state.lastMessage;
        set({ wallHp, lastMessage: message ?? state.lastMessage });
        return { ok: true, message: message ?? '', hp };
      },

      hitTower: (i, n = 1) => {
        const state = get();
        const lv = state.towerLevels[i] ?? 0;
        const placed = lv > 0;
        const max = maxTowerHp(placed, lv);
        if (max <= 0) return { ok: false, message: 'No tower there.', hp: 0 };
        const towerHp = [...(state.towerHp.length === 4 ? state.towerHp : [0, 0, 0, 0])];
        const hp = Math.max(0, (towerHp[i] ?? max) - n);
        towerHp[i] = hp;
        const message = hp <= 0 ? 'A tower is down! Repair it with wood.' : state.lastMessage;
        set({ towerHp, lastMessage: message ?? state.lastMessage });
        return { ok: true, message: message ?? '', hp };
      },

      hitBuilding: (id, n = 1) => {
        const state = get();
        const level = state.buildingLevels[id] ?? 0;
        const max = maxBuildingHp(id, level);
        if (max <= 0) return { ok: false, message: 'Nothing to bash.', hp: 0 };
        const hp = Math.max(0, (state.buildingHp[id] ?? max) - n);
        const message = hp <= 0 ? `${BUILDINGS.find((b) => b.id === id)?.name ?? 'A building'} is battered! Patch it with wood.` : state.lastMessage;
        set({ buildingHp: { ...state.buildingHp, [id]: hp }, lastMessage: message ?? state.lastMessage });
        return { ok: true, message: message ?? '', hp };
      },

      markHordeWave: (n, levelN) => {
        set({ hordeWave: n, hordeLevelN: levelN });
      },

      raidCamp: () => {
        const n = Math.min(3, get().resources.wood);
        const message = n
          ? `A troll nicked ${n} wood from the hut!`
          : 'A troll reached camp — the hut held!';
        set({
          resources: n ? { ...get().resources, wood: get().resources.wood - n } : get().resources,
          lastMessage: message,
        });
        return { ok: true, message };
      },

      chargeTower: (i) => {
        const state = get();
        if (state.resources.stars < 1) {
          return { ok: false, message: 'Need a star to power the tower.' };
        }
        const towerCharge = [...state.towerCharge];
        towerCharge[i] = (towerCharge[i] ?? 0) + 1;
        set({
          resources: pay(state.resources, { stars: 1 }),
          towerCharge,
          buildingLevels: {
            ...state.buildingLevels,
            lookout: Math.max(state.buildingLevels.lookout ?? 0, i + 1),
          },
          lastMessage: 'The watch tower drinks a star and glows!',
        });
        return { ok: true, message: 'Tower powered!' };
      },

      revealCells: (keys) => {
        const have = new Set(get().revealedCells);
        let changed = false;
        for (const k of keys) {
          if (!have.has(k)) {
            have.add(k);
            changed = true;
          }
        }
        if (changed) set({ revealedCells: [...have] });
      },

      reset: () => set({ ...initial() }),
    }),
    {
      name: 'little-keep-save-v1',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<KidsState>;
        let carryingWood = p.carryingWood ?? 0;
        let carryingCoins = p.carryingCoins ?? 0;
        const resources = {
          ...current.resources,
          ...p.resources,
          coins: p.resources?.coins ?? current.resources.coins,
        };
        const extra = carryingWood + carryingCoins - CARRY_MAX;
        if (extra > 0) {
          const dumpW = Math.min(carryingWood, extra);
          carryingWood -= dumpW;
          const dumpC = extra - dumpW;
          carryingCoins -= dumpC;
          resources.wood += dumpW;
          resources.coins += dumpC;
        }
        const hydrated = hydrateTowers(p.towerLevels, p.fortLevel);
        return {
          ...current,
          ...p,
          resources,
          buildingLevels: { ...current.buildingLevels, mill: 0, ...p.buildingLevels },
          revealedCells: p.revealedCells ?? current.revealedCells,
          towerCharge: p.towerCharge?.length === 4 ? p.towerCharge : current.towerCharge,
          carryingWood,
          carryingCoins,
          buildingFund: p.buildingFund ?? current.buildingFund,
          towerLevels: hydrated.towerLevels,
          fortLevel: hydrated.fortLevel,
          buildingHp: p.buildingHp
            ? { ...current.buildingHp, ...p.buildingHp }
            : (() => {
                const lv = { ...current.buildingLevels, ...p.buildingLevels };
                const hp = { ...current.buildingHp };
                (Object.keys(lv) as BuildingId[]).forEach((id) => {
                  if ((lv[id] ?? 0) > 0) hp[id] = maxBuildingHp(id, lv[id] ?? 0);
                });
                return hp;
              })(),
          towerHp:
            p.towerHp?.length === 4
              ? p.towerHp
              : hydrated.towerLevels.map((n) => (n > 0 ? maxTowerHp(true, n) : 0)),
          wallHp:
            p.wallHp?.length === 4
              ? p.wallHp
              : hydrated.fortLevel >= 1
                ? fullWallHp(hydrated.fortLevel)
                : current.wallHp,
          hordeWave: p.hordeWave ?? 0,
          hordeLevelN: p.hordeLevelN ?? 1,
          choppedTrees: p.choppedTrees ?? current.choppedTrees,
          revealedMines: p.revealedMines ?? current.revealedMines,
        };
      },
    }
  )
);

export { partyPower };
