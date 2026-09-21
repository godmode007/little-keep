import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  type ImageSourcePropType,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BUILDINGS, HEROES } from '../data/catalog';
import { HERO_ART } from '../data/heroArt';
import type { BuildingId, HeroId } from '../data/types';
import { scaleCost } from '../game/economy';
import {
  BASH_MS,
  BASH_REACH,
  clampToWalls,
  hordeSize,
  maxBuildingHp,
  maxTowerHp,
  maxWallEdgeHp,
} from '../game/combat';
import { KEEP_EXTRA_LEVEL, keepCanGrow, towerCanGrow, wallRank } from '../game/keep';
import { campaignComplete, currentLevel } from '../game/progress';
import {
  BUILD_SPOTS,
  PLOTS,
  buildingPhase,
  CAMP,
  CHOP_REACH,
  HORDE_SPEED,
  MAP,
  FORT_NAMES,
  CARRY_MAX,
  DESTACK_MS,
  FLY_MS,
  MAGNET_REACH,
  MINES,
  mineIsOpen,
  MINE_COOL_MS,
  MINE_MS,
  MINE_REACH,
  PICK_REACH,
  STACK_MS,
  TOWER_COST,
  TOWER_SLOTS,
  TREES,
  TROLL_HP,
  WALL_EDGES,
  cellKey,
  distPct,
  spawnEdge,
  startRevealed,
  tileOf,
  tileOrigin,
} from '../game/world';
import { useKidsStore } from '../store/kidsStore';
import { colors, fonts } from '../theme/theme';
import { FieldSheet, type FieldTarget } from './FieldSheet';
import { HeroPortrait } from './HeroPortrait';
import { Joystick } from './Joystick';

const PINE_ART = require('../../assets/game/pine.png') as ImageSourcePropType;
const STUMP_ART = require('../../assets/game/pine-stump.png') as ImageSourcePropType;
const HUT_ART = [
  require('../../assets/game/hut.png'),
  require('../../assets/game/hut-2.png'),
  require('../../assets/game/hut-3.png'),
] as ImageSourcePropType[];
const FARM_ART = [
  require('../../assets/game/farm.png'),
  require('../../assets/game/farm-2.png'),
  require('../../assets/game/farm-3.png'),
] as ImageSourcePropType[];
const SHED_ART = [
  require('../../assets/game/shed.png'),
  require('../../assets/game/shed-2.png'),
  require('../../assets/game/shed-3.png'),
] as ImageSourcePropType[];
const WORKSHOP_ART = [
  require('../../assets/game/workshop.png'),
  require('../../assets/game/workshop-2.png'),
  require('../../assets/game/workshop-3.png'),
] as ImageSourcePropType[];
const MILL_ART = [
  require('../../assets/game/mill.png'),
  require('../../assets/game/mill-2.png'),
  require('../../assets/game/mill-3.png'),
] as ImageSourcePropType[];
function phaseArt(arts: ImageSourcePropType[], level: number, maxLevel: number) {
  return arts[buildingPhase(Math.max(1, level), maxLevel) - 1];
}
const POST_WOOD = require('../../assets/game/fence-post-wood.png') as ImageSourcePropType;
const POST_STONE = require('../../assets/game/fence-post-stone.png') as ImageSourcePropType;
const POST_BRICK = require('../../assets/game/fence-post-brick.png') as ImageSourcePropType;
const POST_CEMENT = require('../../assets/game/fence-post-cement.png') as ImageSourcePropType;
function postArt(lv: number): ImageSourcePropType {
  if (lv >= 4) return POST_CEMENT;
  if (lv >= 3) return POST_BRICK;
  if (lv >= 2) return POST_STONE;
  return POST_WOOD;
}
const TOWER_WOOD = require('../../assets/game/tower.png') as ImageSourcePropType;
const TOWER_STONE = require('../../assets/game/tower-stone.png') as ImageSourcePropType;
const TOWER_BRICK = require('../../assets/game/tower-brick.png') as ImageSourcePropType;
const TOWER_CEMENT = require('../../assets/game/tower-cement.png') as ImageSourcePropType;
function towerArt(lv: number): ImageSourcePropType {
  if (lv >= 4) return TOWER_CEMENT;
  if (lv >= 3) return TOWER_BRICK;
  if (lv >= 2) return TOWER_STONE;
  return TOWER_WOOD;
}
const MINE_ART = require('../../assets/game/mine.png') as ImageSourcePropType;
const TROLL_ART = require('../../assets/game/troll.png') as ImageSourcePropType;
const PIP_CHOP = require('../../assets/game/pip-chop.png') as ImageSourcePropType;

const TILE_SCALE = 1.12;
const COLLECT_WAIT_MS = 4000;
const HERO_SIZE = 64;
const PINE_W = 72;
const PINE_H = 128;
const TOWER_PLOT = 6.2;
const MINE_SIZE = 72;
const TROLL_SIZE = 56;
const TAP_SLOP = 12;
const REACH = 4.4;
const BOW_REACH = 7.2;
const SPEED = 32;
const STICK_MAX = 48;
const CHOP_MS = 520;
const WAVE_MS = 26000;
const TOWER_RANGE = 12;
const WEAPON: Record<HeroId, string> = {
  pip: '⚔️',
  mira: '🏹',
  blink: '✨',
  nana: '💖',
};
const HIT_MS: Record<HeroId, number> = { pip: 400, mira: 520, blink: 460, nana: 600 };

type Foe = { id: string; x: number; y: number; coins: number; hp: number; max: number; nextBash: number };
type Drop = { id: string; x: number; y: number; kind: 'coin' | 'wood'; n: number };
type Fly = { id: string; kind: 'coin' | 'wood'; x0: number; y0: number; x1: number; y1: number; t0: number };

function nearStore(p: { x: number; y: number }) {
  return distPct(p.x, p.y, BUILD_SPOTS.store.x, BUILD_SPOTS.store.y) <= 7.2;
}

function canMine(mine: (typeof MINES)[number], chopped: Record<string, boolean>, revealed: string[]) {
  return revealed.includes(mine.id) || mineIsOpen(mine, chopped);
}

function spotPos(spot: string): { x: number; y: number } | null {
  if (spot === 'store') return BUILD_SPOTS.store;
  if (spot === 'castle') return BUILD_SPOTS.hut;
  const tower = /^tower-(\d)$/.exec(spot);
  if (tower) {
    const slot = TOWER_SLOTS[Number(tower[1])];
    return slot ? { x: slot.x, y: slot.y } : null;
  }
  if (spot === 'farm') return BUILD_SPOTS.farm;
  if (spot === 'hut') return BUILD_SPOTS.shed;
  if (spot === 'workshop') return BUILD_SPOTS.workshop;
  if (spot === 'mill') return BUILD_SPOTS.mill;
  return null;
}

function HpMark({ hp, max }: { hp: number; max: number }) {
  if (max <= 0) return null;
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  return (
    <View style={styles.bHpTrack}>
      <View
        style={[styles.bHpFill, { width: `${pct}%`, backgroundColor: pct < 35 ? '#E24A3E' : '#4A9A5C' }]}
      />
    </View>
  );
}

function burstDrops(x: number, y: number, n: number, kind: Drop['kind'], seed: string): Drop[] {
  const count = Math.max(1, Math.round(n));
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const r = 1.15 + (i % 3) * 0.5;
    return {
      id: `${seed}-${i}`,
      x: x + Math.cos(a) * r,
      y: y + Math.sin(a) * r * 0.7,
      kind,
      n: 1,
    };
  });
}

function worldSize(viewW: number, viewH: number) {
  if (viewW <= 0 || viewH <= 0) return { w: 0, h: 0, tile: 0 };
  const tile = Math.max(viewW, viewH * 0.9) * TILE_SCALE;
  return { w: tile * MAP, h: tile * MAP, tile };
}

function clampCam(x: number, y: number, viewW: number, viewH: number, worldW: number, worldH: number) {
  const minX = Math.min(0, viewW - worldW);
  const minY = Math.min(0, viewH - worldH);
  return {
    x: Math.max(minX, Math.min(0, x)),
    y: Math.max(minY, Math.min(0, y)),
  };
}

function collectYield(buildingLevels: Record<BuildingId, number>) {
  let food = 6;
  let wood = 4;
  for (const b of BUILDINGS) {
    const level = buildingLevels[b.id];
    if (!level || !b.produces) continue;
    food += (b.produces.food ?? 0) * level;
    wood += (b.produces.wood ?? 0) * level;
  }
  return { food, wood };
}

function hitPct(px: number, py: number, x: number, y: number, size: number, worldW: number, worldH: number) {
  const halfX = ((size / 2 + 8) / worldW) * 100;
  const halfY = ((size / 2 + 8) / worldH) * 100;
  return Math.abs(px - x) <= halfX && Math.abs(py - y) <= halfY;
}

function heroReach(id: HeroId) {
  return id === 'mira' ? BOW_REACH : REACH;
}

function plotPx(worldW: number, pct: number) {
  if (worldW <= 0) return 56;
  return Math.max(48, Math.round((pct / 100) * worldW));
}

export function KeepField() {
  const lastCollectAt = useKidsStore((s) => s.lastCollectAt);
  const recruited = useKidsStore((s) => s.recruited);
  const questsDone = useKidsStore((s) => s.questsDone);
  const buildingLevels = useKidsStore((s) => s.buildingLevels);
  const collect = useKidsStore((s) => s.collect);
  const pickWood = useKidsStore((s) => s.pickWood);
  const pickCoins = useKidsStore((s) => s.pickCoins);
  const feedPiece = useKidsStore((s) => s.feedPiece);
  const chopTree = useKidsStore((s) => s.chopTree);
  const revealedMines = useKidsStore((s) => s.revealedMines);
  const choppedTrees = useKidsStore((s) => s.choppedTrees);
  const hitWall = useKidsStore((s) => s.hitWall);
  const hitTower = useKidsStore((s) => s.hitTower);
  const hitBuilding = useKidsStore((s) => s.hitBuilding);
  const markHordeWave = useKidsStore((s) => s.markHordeWave);
  const buildingHp = useKidsStore((s) => s.buildingHp);
  const towerHp = useKidsStore((s) => s.towerHp);
  const wallHp = useKidsStore((s) => s.wallHp);
  const hordeWave = useKidsStore((s) => s.hordeWave);
  const hordeLevelN = useKidsStore((s) => s.hordeLevelN);
  const feedBuilding = useKidsStore((s) => s.feedBuilding);
  const feedTower = useKidsStore((s) => s.feedTower);
  const raidCamp = useKidsStore((s) => s.raidCamp);
  const revealCells = useKidsStore((s) => s.revealCells);
  const carryingWood = useKidsStore((s) => s.carryingWood);
  const carryingCoins = useKidsStore((s) => s.carryingCoins);
  const buildingFund = useKidsStore((s) => s.buildingFund);
  const towerLevels = useKidsStore((s) => s.towerLevels);
  const fortLevel = useKidsStore((s) => s.fortLevel ?? 0);
  const revealedCells = useKidsStore((s) => s.revealedCells);
  const towerCharge = useKidsStore((s) => s.towerCharge);
  const castle = buildingLevels.castle ?? 1;
  const farmLv = buildingLevels.farm ?? 0;
  const hutLv = buildingLevels.hut ?? 0;
  const workshopLv = buildingLevels.workshop ?? 0;
  const millLv = buildingLevels.mill ?? 0;
  const lookout = buildingLevels.lookout ?? 0;
  const towers = towerLevels.length === 4 ? towerLevels : [0, 0, 0, 0];
  const towersBuilt = towers.filter((n) => n > 0).length;
  const ringLevel = wallRank({ buildingLevels, towerLevels: towers, fortLevel });
  const keepSnap = { buildingLevels, towerLevels: towers, fortLevel: ringLevel };
  const done = campaignComplete({ questsDone, recruited, buildingLevels });
  const chapter = currentLevel({ questsDone, recruited, buildingLevels });
  const hordeCap = chapter.hordes;

  const [box, setBox] = useState({ width: 0, height: 0 });
  const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState<FieldTarget | null>(null);
  const [floats, setFloats] = useState<{ key: number; food: number; wood: number } | null>(null);
  const [avatar, setAvatar] = useState<HeroId>('pip');
  const [walking, setWalking] = useState(false);
  const [face, setFace] = useState(1);
  const [chopped, setChopped] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((useKidsStore.getState().choppedTrees ?? []).map((id) => [id, true]))
  );
  const [chopId, setChopId] = useState<string | null>(null);
  const [mineId, setMineId] = useState<string | null>(null);
  const [mineCool, setMineCool] = useState<Record<string, number>>({});
  const [foes, setFoes] = useState<Foe[]>([]);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [shot, setShot] = useState<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    key: number;
    arrow?: boolean;
  } | null>(null);
  const [loot, setLoot] = useState<{ x: number; y: number; n: number; key: number } | null>(null);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [flies, setFlies] = useState<Fly[]>([]);
  const [fieldPad, setFieldPad] = useState<{ x: number; y: number; kx: number; ky: number } | null>(null);
  const [wave, setWave] = useState(0);

  const world = useMemo(() => worldSize(box.width, box.height), [box.width, box.height]);
  const boxRef = useRef(box);
  const worldRef = useRef(world);
  boxRef.current = box;
  worldRef.current = world;
  const [camXY, setCamXY] = useState({ x: 0, y: 0 });
  const camNow = useRef({ x: 0, y: 0 });
  const dragged = useRef(false);
  const bob = useRef(new Animated.Value(0)).current;
  const partyAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const posRef = useRef({ x: CAMP.x, y: CAMP.y });
  const stickRef = useRef({ x: 0, y: 0 });
  const fieldStickRef = useRef({ x: 0, y: 0 });
  const keysRef = useRef({ x: 0, y: 0 });
  const walkingRef = useRef(false);
  const revealRef = useRef(revealCells);
  revealRef.current = revealCells;
  const foesRef = useRef(foes);
  foesRef.current = foes;
  const avatarRef = useRef(avatar);
  avatarRef.current = avatar;
  const choppedRef = useRef(chopped);
  choppedRef.current = chopped;
  useEffect(() => {
    if (!choppedTrees.length) return;
    setChopped((s) => {
      const next = { ...s };
      let changed = false;
      for (const id of choppedTrees) {
        if (!next[id]) {
          next[id] = true;
          changed = true;
        }
      }
      return changed ? next : s;
    });
  }, [choppedTrees]);
  const chopUntil = useRef(0);
  const chopTarget = useRef<string | null>(null);
  const mineUntil = useRef(0);
  const mineTarget = useRef<string | null>(null);
  const mineCoolRef = useRef<Record<string, number>>({});
  const dropsRef = useRef<Drop[]>([]);
  const lastHit = useRef(0);
  const lastTower = useRef(0);
  const lastFlush = useRef(0);
  const lastWave = useRef(0);
  const lastFeed = useRef(0);
  const lastPick = useRef(0);
  const lastDestack = useRef(0);
  const dumpSpotRef = useRef<string | null>(null);
  const fliesRef = useRef<Fly[]>([]);
  const waveRef = useRef(0);
  const towerLvRef = useRef(towerLevels);
  towerLvRef.current = towerLevels.length === 4 ? towerLevels : [0, 0, 0, 0];
  const raidRef = useRef(raidCamp);
  raidRef.current = raidCamp;
  const pickRef = useRef(pickWood);
  pickRef.current = pickWood;
  const pickCoinsRef = useRef(pickCoins);
  pickCoinsRef.current = pickCoins;
  const feedPieceRef = useRef(feedPiece);
  feedPieceRef.current = feedPiece;
  const chopTreeRef = useRef(chopTree);
  chopTreeRef.current = chopTree;
  const minesOpenRef = useRef<string[]>([]);
  minesOpenRef.current = revealedMines;
  const hitWallRef = useRef(hitWall);
  hitWallRef.current = hitWall;
  const hitTowerRef = useRef(hitTower);
  hitTowerRef.current = hitTower;
  const hitBuildingRef = useRef(hitBuilding);
  hitBuildingRef.current = hitBuilding;
  const markWaveRef = useRef(markHordeWave);
  markWaveRef.current = markHordeWave;

  const syncAvatar = (w = worldRef.current, b = boxRef.current) => {
    if (w.w <= 0 || b.width <= 0) return;
    const px = (posRef.current.x / 100) * w.w;
    const py = (posRef.current.y / 100) * w.h;
    partyAnim.setValue({ x: px, y: py });
    const follow = clampCam(b.width / 2 - px, b.height / 2 - py, b.width, b.height, w.w, w.h);
    if (Math.abs(follow.x - camNow.current.x) > 0.5 || Math.abs(follow.y - camNow.current.y) > 0.5) {
      camNow.current = follow;
      setCamXY(follow);
    }
  };

  const revealed = revealedCells.length ? revealedCells : startRevealed();
  const revealedSet = useMemo(() => new Set(revealed), [revealed]);

  useEffect(() => {
    const stale = revealedCells.some((k) => {
      const [c, r] = k.split(',').map(Number);
      return c > MAP - 1 || r > MAP - 1;
    });
    if (stale || !revealedCells.includes(cellKey(1, 1))) {
      useKidsStore.setState({ revealedCells: startRevealed() });
    }
    const lv = useKidsStore.getState().towerLevels;
    const built = (lv ?? []).filter((n) => n > 0).length;
    const look = useKidsStore.getState().buildingLevels.lookout ?? 0;
    if (look > 0 && built === 0) {
      const next = [0, 0, 0, 0];
      for (let i = 0; i < Math.min(4, look); i++) next[i] = 1;
      const all = next.every((n) => n === 1);
      useKidsStore.setState({ towerLevels: next, fortLevel: all ? Math.max(1, useKidsStore.getState().fortLevel) : 0 });
    } else if (built >= 4 && (useKidsStore.getState().fortLevel ?? 0) < 1) {
      useKidsStore.setState({ fortLevel: 1 });
    }
  }, [revealCells, revealedCells]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 80);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!floats) return;
    const t = setTimeout(() => setFloats(null), 1000);
    return () => clearTimeout(t);
  }, [floats]);

  useEffect(() => {
    if (!loot) return;
    const t = setTimeout(() => setLoot(null), 900);
    return () => clearTimeout(t);
  }, [loot]);

  useEffect(() => {
    if (!shot) return;
    const t = setTimeout(() => setShot(null), 320);
    return () => clearTimeout(t);
  }, [shot]);

  useEffect(() => {
    if (!walking && !chopId && !mineId) {
      bob.setValue(0);
      return;
    }
    const busy = Boolean(chopId || mineId);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: busy ? 90 : 140, useNativeDriver: false }),
        Animated.timing(bob, { toValue: 0, duration: busy ? 90 : 140, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob, walking, chopId, mineId]);

  useEffect(() => {
    syncAvatar(world, box);
  }, [box.height, box.width, world.h, world.w]);

  useEffect(() => {
    if (hordeLevelN === chapter.n) waveRef.current = hordeWave;
  }, [hordeLevelN, hordeWave, chapter.n]);

  useEffect(() => {
    let raf = 0;
    let last = Date.now();
    const tick = () => {
      const nowTick = Date.now();
      const dt = Math.min(0.05, (nowTick - last) / 1000);
      last = nowTick;
      const who = avatarRef.current;
      const reachNow = heroReach(who);
      const chopping = nowTick < chopUntil.current;
      const mining = nowTick < mineUntil.current;
      const busy = chopping || mining;
      const bagNow = useKidsStore.getState();
      const carryLoad = Math.min(1, (bagNow.carryingWood + bagNow.carryingCoins) / CARRY_MAX);
      const room = Math.max(0, CARRY_MAX - bagNow.carryingWood - bagNow.carryingCoins);
      const speed = SPEED * (1 - 0.42 * carryLoad);

      let mx = stickRef.current.x + fieldStickRef.current.x + keysRef.current.x;
      let my = stickRef.current.y + fieldStickRef.current.y + keysRef.current.y;
      const mag = Math.hypot(mx, my);
      const w = worldRef.current;

      if (!busy && mag > 0.15 && w.w > 0) {
        mx /= mag;
        my /= mag;
        if (mx > 0.2) setFace(1);
        else if (mx < -0.2) setFace(-1);
        const next = {
          x: Math.max(4, Math.min(96, posRef.current.x + mx * speed * dt)),
          y: Math.max(4, Math.min(96, posRef.current.y + my * speed * dt)),
        };
        const readyMine =
          room > 0
            ? MINES.find(
                (m) =>
                  canMine(m, choppedRef.current, minesOpenRef.current) &&
                  distPct(next.x, next.y, m.x, m.y) <= MINE_REACH &&
                  nowTick >= (mineCoolRef.current[m.id] ?? 0)
              )
            : undefined;
        const tree =
          room > 0
            ? TREES.find((t) => !choppedRef.current[t.id] && distPct(next.x, next.y, t.x, t.y) <= CHOP_REACH)
            : undefined;
        if (readyMine) {
          mineUntil.current = nowTick + MINE_MS;
          mineTarget.current = readyMine.id;
          setMineId(readyMine.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        } else if (tree) {
          chopUntil.current = nowTick + CHOP_MS;
          chopTarget.current = tree.id;
          setChopId(tree.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        } else {
          posRef.current = next;
        }
        const cell = tileOf(posRef.current.x, posRef.current.y);
        revealRef.current([cellKey(cell.c, cell.r)]);
        if (!walkingRef.current) {
          walkingRef.current = true;
          setWalking(true);
        }
      } else if (walkingRef.current && !busy) {
        walkingRef.current = false;
        setWalking(false);
      }

      if (chopTarget.current && nowTick >= chopUntil.current) {
        const id = chopTarget.current;
        const tree = TREES.find((t) => t.id === id);
        chopTarget.current = null;
        setChopId(null);
        if (tree && !choppedRef.current[id]) {
          choppedRef.current = { ...choppedRef.current, [id]: true };
          setChopped((s) => ({ ...s, [id]: true }));
          chopTreeRef.current(id);
          minesOpenRef.current = useKidsStore.getState().revealedMines;
          dropsRef.current = dropsRef.current.concat(burstDrops(tree.x, tree.y, tree.wood, 'wood', `${id}-w`));
        }
      }

      if (mineTarget.current && nowTick >= mineUntil.current) {
        const id = mineTarget.current;
        const mine = MINES.find((m) => m.id === id);
        mineTarget.current = null;
        setMineId(null);
        if (mine) {
          mineCoolRef.current = { ...mineCoolRef.current, [id]: nowTick + MINE_COOL_MS };
          setMineCool(mineCoolRef.current);
          dropsRef.current = dropsRef.current.concat(burstDrops(mine.x, mine.y, mine.coins, 'coin', `${id}-m`));
          setLoot({ x: mine.x, y: mine.y, n: mine.coins, key: nowTick });
        }
      }

      const standMine =
        !busy &&
        !mineTarget.current &&
        room > 0 &&
        MINES.find(
          (m) =>
            canMine(m, choppedRef.current, minesOpenRef.current) &&
            distPct(posRef.current.x, posRef.current.y, m.x, m.y) <= MINE_REACH &&
            nowTick >= (mineCoolRef.current[m.id] ?? 0)
        );
      if (standMine) {
        mineUntil.current = nowTick + MINE_MS;
        mineTarget.current = standMine.id;
        setMineId(standMine.id);
      }

      const p = posRef.current;

      const snap = useKidsStore.getState();
      const chapter = currentLevel({
        questsDone: snap.questsDone,
        recruited: snap.recruited,
        buildingLevels: snap.buildingLevels,
      });
      const hordeCap = chapter.hordes;
      if (snap.hordeLevelN !== chapter.n) {
        waveRef.current = 0;
        markWaveRef.current(0, chapter.n);
        lastWave.current = mag > 0.15 ? nowTick + 6000 : 0;
      }
      if (mag > 0.15 && lastWave.current === 0 && waveRef.current < hordeCap) lastWave.current = nowTick + 9000;
      if (lastWave.current && nowTick >= lastWave.current && waveRef.current < hordeCap) {
        waveRef.current += 1;
        lastWave.current = waveRef.current >= hordeCap ? 0 : nowTick + WAVE_MS;
        const n = hordeSize(chapter.n, waveRef.current);
        const spawned: Foe[] = [];
        for (let i = 0; i < n; i++) {
          const edge = spawnEdge(waveRef.current + i);
          spawned.push({
            id: `w${waveRef.current}-${i}`,
            x: edge.x,
            y: edge.y,
            coins: 8,
            hp: TROLL_HP,
            max: TROLL_HP,
            nextBash: 0,
          });
        }
        foesRef.current = [...foesRef.current.filter((f) => f.hp > 0), ...spawned];
        markWaveRef.current(waveRef.current, chapter.n);
        setWave(waveRef.current);
      }

      const wallsNow = snap.wallHp.length === 4 ? snap.wallHp : [0, 0, 0, 0];
      const towersHpNow = snap.towerHp.length === 4 ? snap.towerHp : [0, 0, 0, 0];
      const fortNow = snap.fortLevel ?? 0;
      let trollsMoved = false;
      foesRef.current = foesRef.current.map((f) => {
        if (f.hp <= 0) return f;
        const dCamp = distPct(f.x, f.y, CAMP.x, CAMP.y);
        const step = HORDE_SPEED * dt;
        const d = Math.max(0.2, dCamp);
        const nx = f.x + ((CAMP.x - f.x) / d) * step;
        const ny = f.y + ((CAMP.y - f.y) / d) * step;

        let hit = null as ReturnType<typeof clampToWalls>['hit'];
        for (const slot of TOWER_SLOTS) {
          if ((towersHpNow[slot.i] ?? 0) > 0 && distPct(nx, ny, slot.x, slot.y) < 4.4) {
            hit = { kind: 'tower', i: slot.i };
            break;
          }
        }
        const blocked = hit ? { x: f.x, y: f.y, hit } : clampToWalls(f.x, f.y, nx, ny, wallsNow, fortNow);
        if (blocked.hit) {
          trollsMoved = true;
          if (nowTick >= (f.nextBash ?? 0)) {
            if (blocked.hit.kind === 'wall') hitWallRef.current(blocked.hit.i, 1);
            else if (blocked.hit.kind === 'tower') hitTowerRef.current(blocked.hit.i, 1);
          }
          return { ...f, x: blocked.x, y: blocked.y, nextBash: nowTick >= (f.nextBash ?? 0) ? nowTick + BASH_MS : f.nextBash };
        }

        const spots: { id: BuildingId; x: number; y: number }[] = [
          { id: 'castle', ...BUILD_SPOTS.hut },
          { id: 'farm', ...BUILD_SPOTS.farm },
          { id: 'hut', ...BUILD_SPOTS.shed },
          { id: 'workshop', ...BUILD_SPOTS.workshop },
          { id: 'mill', ...BUILD_SPOTS.mill },
        ];
        let near: { id: BuildingId; x: number; y: number; dist: number } | null = null;
        for (const s of spots) {
          const lv = s.id === 'castle' ? snap.buildingLevels.castle ?? 1 : snap.buildingLevels[s.id] ?? 0;
          const max = maxBuildingHp(s.id, lv);
          if (max <= 0) continue;
          const hp = snap.buildingHp[s.id] ?? max;
          if (hp <= 0) continue;
          const dd = distPct(blocked.x, blocked.y, s.x, s.y);
          if (dd <= BASH_REACH && (!near || dd < near.dist)) near = { ...s, dist: dd };
        }
        if (near) {
          trollsMoved = true;
          if (nowTick >= (f.nextBash ?? 0)) hitBuildingRef.current(near.id, 1);
          return { ...f, x: blocked.x, y: blocked.y, nextBash: nowTick >= (f.nextBash ?? 0) ? nowTick + BASH_MS : f.nextBash };
        }

        if (dCamp < 6) {
          const keepHp = snap.buildingHp.castle ?? maxBuildingHp('castle', snap.buildingLevels.castle ?? 1);
          if (keepHp <= 0) {
            raidRef.current();
            trollsMoved = true;
            return { ...f, hp: 0 };
          }
          trollsMoved = true;
          if (nowTick >= (f.nextBash ?? 0)) hitBuildingRef.current('castle', 1);
          return { ...f, x: blocked.x, y: blocked.y, nextBash: nowTick >= (f.nextBash ?? 0) ? nowTick + BASH_MS : f.nextBash };
        }

        trollsMoved = true;
        return { ...f, x: blocked.x, y: blocked.y };
      });

      if (nowTick - lastTower.current > 480) {
        lastTower.current = nowTick;
        for (const slot of TOWER_SLOTS) {
          const tlv = towerLvRef.current[slot.i] ?? 0;
          if (tlv < 1) continue;
          if ((useKidsStore.getState().towerHp[slot.i] ?? 1) <= 0) continue;
          const foe = foesRef.current.find((f) => f.hp > 0 && distPct(slot.x, slot.y, f.x, f.y) <= TOWER_RANGE + tlv);
          if (!foe) continue;
          foesRef.current = foesRef.current.map((f) => {
            if (f.id !== foe.id || f.hp <= 0) return f;
            const hp = f.hp - 1;
            if (hp <= 0) {
              dropsRef.current = dropsRef.current.concat(burstDrops(f.x, f.y, f.coins, 'coin', f.id));
            }
            return { ...f, hp };
          });
          setShot({ x0: slot.x, y0: slot.y - 1.2, x1: foe.x, y1: foe.y, key: nowTick, arrow: true });
          break;
        }
      }

      let nearest: Foe | null = null;
      let nearestD = 999;
      for (const f of foesRef.current) {
        if (f.hp <= 0) continue;
        const d = distPct(p.x, p.y, f.x, f.y);
        if (d < nearestD) {
          nearestD = d;
          nearest = f;
        }
      }
      const inRange = nearest !== null && nearestD <= reachNow ? nearest : null;
      if (inRange && nowTick - lastHit.current >= HIT_MS[who]) {
        lastHit.current = nowTick;
        const hitId = inRange.id;
        foesRef.current = foesRef.current.map((f) => {
          if (f.id !== hitId || f.hp <= 0) return f;
          const hp = f.hp - 1;
          if (hp <= 0) {
            dropsRef.current = dropsRef.current.concat(burstDrops(f.x, f.y, f.coins, 'coin', f.id));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
          }
          return { ...f, hp };
        });
        setShot({ x0: p.x, y0: p.y, x1: inRange.x, y1: inRange.y, key: nowTick });
      }

      const tid = inRange && inRange.hp > 0 ? inRange.id : nearest !== null && nearest.hp > 0 ? nearest.id : null;
      setTargetId((cur) => (cur === tid ? cur : tid));

      let dropsMoved = false;
      if (dropsRef.current.length) {
        const bagPick = useKidsStore.getState();
        let roomLeft = Math.max(0, CARRY_MAX - bagPick.carryingWood - bagPick.carryingCoins);
        const canPick = roomLeft > 0 && nowTick - lastPick.current >= STACK_MS;
        let picked: Drop | null = null;
        let pickedD = 999;
        const kept: Drop[] = [];
        for (const drop of dropsRef.current) {
          const d = distPct(p.x, p.y, drop.x, drop.y);
          if (canPick && d <= PICK_REACH && d < pickedD) {
            if (picked) kept.push(picked);
            picked = drop;
            pickedD = d;
            continue;
          }
          if (roomLeft > 0 && d <= MAGNET_REACH) {
            const pull = Math.min(1, 12 * dt);
            kept.push({
              ...drop,
              x: drop.x + (p.x - drop.x) * pull,
              y: drop.y + (p.y - drop.y) * pull,
            });
            dropsMoved = true;
            continue;
          }
          kept.push(drop);
        }
        if (picked) {
          lastPick.current = nowTick;
          dropsMoved = true;
          const take = Math.min(picked.n, 1);
          if (picked.kind === 'wood') pickRef.current(take, true);
          else pickCoinsRef.current(take, true);
          if (picked.n > take) kept.push({ ...picked, n: picked.n - take });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        }
        if (dropsMoved) dropsRef.current = kept;
      }

      if (nowTick - lastDestack.current >= DESTACK_MS) {
        const bag = useKidsStore.getState();
        const spot = dumpSpotRef.current;
        if (spot === 'store' && (bag.carryingWood > 0 || bag.carryingCoins > 0)) {
          const pos = spotPos(spot);
          if (pos && nearStore(p)) {
            lastDestack.current = nowTick;
            const launched: Fly[] = [];
            let fed = false;
            if (bag.carryingWood > 0) {
              const r = feedPieceRef.current(spot, 'wood');
              if (r.ok) {
                fed = true;
                launched.push({
                  id: `fw${nowTick}`,
                  kind: 'wood',
                  x0: p.x - 1.2,
                  y0: p.y - 1.4,
                  x1: pos.x,
                  y1: pos.y,
                  t0: nowTick,
                });
              } else {
                dumpSpotRef.current = null;
              }
            }
            if (dumpSpotRef.current && bag.carryingCoins > 0) {
              const r = feedPieceRef.current(spot, 'coins');
              if (r.ok) {
                fed = true;
                launched.push({
                  id: `fc${nowTick}`,
                  kind: 'coin',
                  x0: p.x + 1.2,
                  y0: p.y - 1.4,
                  x1: pos.x,
                  y1: pos.y,
                  t0: nowTick,
                });
              } else if (!fed) {
                dumpSpotRef.current = null;
              }
            }
            if (launched.length) {
              fliesRef.current = [...fliesRef.current.filter((f) => nowTick - f.t0 < FLY_MS), ...launched];
              setFlies(fliesRef.current);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
            }
          }
        } else if (!bag.carryingWood && !bag.carryingCoins) {
          dumpSpotRef.current = null;
        }
      }

      if (fliesRef.current.length && nowTick - lastFeed.current > 80) {
        lastFeed.current = nowTick;
        const live = fliesRef.current.filter((f) => nowTick - f.t0 < FLY_MS);
        if (live.length !== fliesRef.current.length) {
          fliesRef.current = live;
          setFlies(live);
        }
      }

      if (trollsMoved || inRange || chopping || mining || dropsMoved || nowTick - lastFlush.current > 80) {
        lastFlush.current = nowTick;
        setFoes(foesRef.current);
        setDrops(dropsRef.current);
      }

      syncAvatar();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [partyAnim]);

  useEffect(() => {
    const onDown = (e: { key: string; preventDefault: () => void }) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') keysRef.current.y = -1;
      if (k === 'arrowdown' || k === 's') keysRef.current.y = 1;
      if (k === 'arrowleft' || k === 'a') keysRef.current.x = -1;
      if (k === 'arrowright' || k === 'd') keysRef.current.x = 1;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault?.();
    };
    const onUp = (e: { key: string }) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') keysRef.current.y = 0;
      if (k === 'arrowdown' || k === 's') keysRef.current.y = 0;
      if (k === 'arrowleft' || k === 'a') keysRef.current.x = 0;
      if (k === 'arrowright' || k === 'd') keysRef.current.x = 0;
    };
    const g = globalThis as typeof globalThis & {
      addEventListener?: (t: string, fn: (e: { key: string; preventDefault: () => void }) => void) => void;
      removeEventListener?: (t: string, fn: (e: { key: string }) => void) => void;
    };
    g.addEventListener?.('keydown', onDown);
    g.addEventListener?.('keyup', onUp);
    return () => {
      g.removeEventListener?.('keydown', onDown);
      g.removeEventListener?.('keyup', onUp);
    };
  }, []);

  const collectReady = lastCollectAt === 0 || now - lastCollectAt >= COLLECT_WAIT_MS;
  const reach = heroReach(avatar);
  const alive = foes.filter((f) => f.hp > 0);
  const reachPx = world.w > 0 ? (reach / 100) * world.w : 90;
  const hutSize = plotPx(world.w, PLOTS.hut.w);
  const farmSize = plotPx(world.w, PLOTS.farm.w);
  const shedSize = plotPx(world.w, PLOTS.shed.w);
  const workshopSize = plotPx(world.w, PLOTS.workshop.w);
  const millSize = plotPx(world.w, PLOTS.mill.w);
  const storeSize = plotPx(world.w, PLOTS.store.w);
  const towerSize = plotPx(world.w, TOWER_PLOT);
  const wallFill =
    ringLevel >= 4 ? '#B0B4B0' : ringLevel === 3 ? '#B04A40' : ringLevel === 2 ? '#8A929C' : '#6B4428';
  const wallInk =
    ringLevel >= 4 ? '#5A5E5A' : ringLevel === 3 ? '#5A241E' : ringLevel === 2 ? '#3E4450' : '#3A2414';
  const wallRuns =
    ringLevel < 1
      ? []
      : WALL_EDGES.map(([a, b], edge) => {
          const A = TOWER_SLOTS[a];
          const B = TOWER_SLOTS[b];
          const horiz = Math.abs(A.y - B.y) < 1;
          const span = Math.abs(horiz ? A.x - B.x : A.y - B.y);
          const postH = Math.max(26, Math.round(towerSize * 0.2));
          const postW = Math.round(postH * 0.38);
          const postN = Math.max(8, Math.round(span / (horiz ? 1.2 : 1.4)));
          const gate = edge === 3;
          const posts: { x: number; y: number; w: number; h: number }[] = [];
          for (let i = 0; i < postN; i++) {
            const t = (i / (postN - 1)) * 1.04 - 0.02;
            if (gate && Math.abs(t - 0.5) < 0.11) continue;
            posts.push({
              x: A.x + (B.x - A.x) * t,
              y: A.y + (B.y - A.y) * t,
              w: postW,
              h: postH,
            });
          }
          const rails = gate
            ? [
                { t0: -0.02, t1: 0.39 },
                { t0: 0.61, t1: 1.02 },
              ]
            : [{ t0: -0.02, t1: 1.02 }];
          return {
            key: `run-${edge}`,
            edge,
            horiz,
            x: (A.x + B.x) / 2,
            y: (A.y + B.y) / 2,
            span,
            posts,
            rails: rails.map((r) => {
              const x0 = A.x + (B.x - A.x) * r.t0;
              const y0 = A.y + (B.y - A.y) * r.t0;
              const x1 = A.x + (B.x - A.x) * r.t1;
              const y1 = A.y + (B.y - A.y) * r.t1;
              return {
                x: (x0 + x1) / 2,
                y: (y0 + y1) / 2,
                span: Math.abs(horiz ? x1 - x0 : y1 - y0),
              };
            }),
          };
        });
  const keepGate = keepCanGrow(keepSnap);
  const visWood = Math.min(carryingWood, CARRY_MAX);
  const visCoins = Math.min(carryingCoins, CARRY_MAX);
  const carryTotal = carryingWood + carryingCoins;

  const onSparkleCollect = () => {
    if (!farmLv) return;
    const state = useKidsStore.getState();
    const ready = state.lastCollectAt === 0 || Date.now() - state.lastCollectAt >= COLLECT_WAIT_MS;
    if (!ready) return;
    const amounts = collectYield(state.buildingLevels);
    const result = collect();
    if (!result.ok) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    setFloats({ key: Date.now(), food: amounts.food, wood: amounts.wood });
  };

  const doAction = () => {
    const p = posRef.current;
    const nowTick = Date.now();
    const bag = useKidsStore.getState();
    const roomNow = Math.max(0, CARRY_MAX - bag.carryingWood - bag.carryingCoins);
    const readyMine =
      roomNow > 0
        ? MINES.find(
            (m) =>
              canMine(m, choppedRef.current, minesOpenRef.current) &&
              distPct(p.x, p.y, m.x, m.y) <= MINE_REACH + 2 &&
              nowTick >= (mineCoolRef.current[m.id] ?? 0)
          )
        : undefined;
    if (readyMine && !mineTarget.current) {
      mineUntil.current = nowTick + MINE_MS;
      mineTarget.current = readyMine.id;
      setMineId(readyMine.id);
      return;
    }
    const tree =
      roomNow > 0
        ? TREES.find((t) => !choppedRef.current[t.id] && distPct(p.x, p.y, t.x, t.y) <= CHOP_REACH + 2)
        : undefined;
    if (tree && !chopTarget.current) {
      chopUntil.current = Date.now() + CHOP_MS;
      chopTarget.current = tree.id;
      setChopId(tree.id);
      return;
    }
    if (bag.carryingWood > 0 || bag.carryingCoins > 0) {
      if (nearStore(p)) {
        dumpSpotRef.current = 'store';
        lastDestack.current = 0;
      } else {
        useKidsStore.setState({ lastMessage: 'Dump at the storehouse. Then tap a building to Upgrade.' });
      }
    }
  };

  const startDump = (spot: string) => {
    dumpSpotRef.current = spot;
    lastDestack.current = 0;
  };

  const handleTap = (locX: number, locY: number) => {
    if (world.w <= 0) return;
    const wx = locX - camNow.current.x;
    const wy = locY - camNow.current.y;
    const px = (wx / world.w) * 100;
    const py = (wy / world.h) * 100;
    if (hitPct(px, py, BUILD_SPOTS.store.x, BUILD_SPOTS.store.y, storeSize, world.w, world.h)) {
      if (carryingWood > 0 || carryingCoins > 0) startDump('store');
      else setSelected('store');
      return;
    }
    if (hitPct(px, py, BUILD_SPOTS.hut.x, BUILD_SPOTS.hut.y, hutSize, world.w, world.h)) {
      setSelected('castle');
      return;
    }
    if (hitPct(px, py, BUILD_SPOTS.wall.x, BUILD_SPOTS.wall.y, 56, world.w, world.h)) {
      setSelected('wall');
      return;
    }
    if (hitPct(px, py, BUILD_SPOTS.farm.x, BUILD_SPOTS.farm.y, farmSize, world.w, world.h)) {
      if (farmLv && collectReady) onSparkleCollect();
      else setSelected('farm');
      return;
    }
    if (hitPct(px, py, BUILD_SPOTS.shed.x, BUILD_SPOTS.shed.y, hutLv > 0 ? shedSize : 56, world.w, world.h)) {
      setSelected('hut');
      return;
    }
    if (hitPct(px, py, BUILD_SPOTS.workshop.x, BUILD_SPOTS.workshop.y, workshopLv > 0 ? workshopSize : 64, world.w, world.h)) {
      setSelected('workshop');
      return;
    }
    if (castle >= KEEP_EXTRA_LEVEL && hitPct(px, py, BUILD_SPOTS.mill.x, BUILD_SPOTS.mill.y, millLv > 0 ? millSize : 64, world.w, world.h)) {
      setSelected('mill');
      return;
    }
    const mineHit = MINES.find(
      (m) => canMine(m, chopped, revealedMines) && hitPct(px, py, m.x, m.y, MINE_SIZE, world.w, world.h)
    );
    if (mineHit) {
      if (distPct(posRef.current.x, posRef.current.y, mineHit.x, mineHit.y) <= MINE_REACH + 2) {
        doAction();
        return;
      }
      setSelected('mine');
      return;
    }
    if (hitPct(px, py, BUILD_SPOTS.flag.x, BUILD_SPOTS.flag.y, 48, world.w, world.h)) {
      setSelected('flag');
      return;
    }
    for (const slot of TOWER_SLOTS) {
      if (hitPct(px, py, slot.x, slot.y, towerSize, world.w, world.h)) {
        setSelected(`tower-${slot.i}`);
        return;
      }
    }
    const tree = TREES.find((t) => !chopped[t.id] && hitPct(px, py, t.x, t.y, PINE_W, world.w, world.h));
    if (tree) doAction();
  };

  const tapRef = useRef(handleTap);
  tapRef.current = handleTap;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 4,
        onPanResponderGrant: (e) => {
          dragged.current = false;
          const { locationX, locationY } = e.nativeEvent;
          setFieldPad({ x: locationX, y: locationY, kx: 0, ky: 0 });
        },
        onPanResponderMove: (_, g) => {
          const mag = Math.hypot(g.dx, g.dy) || 1;
          if (mag > TAP_SLOP) dragged.current = true;
          const scale = Math.min(1, STICK_MAX / mag);
          const kx = g.dx * scale;
          const ky = g.dy * scale;
          fieldStickRef.current = { x: kx / STICK_MAX, y: ky / STICK_MAX };
          setFieldPad((p) => (p ? { ...p, kx, ky } : p));
        },
        onPanResponderRelease: (e) => {
          fieldStickRef.current = { x: 0, y: 0 };
          setFieldPad(null);
          if (dragged.current) return;
          tapRef.current(e.nativeEvent.locationX, e.nativeEvent.locationY);
        },
        onPanResponderTerminate: () => {
          fieldStickRef.current = { x: 0, y: 0 };
          setFieldPad(null);
        },
      }),
    []
  );

  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, chopId || mineId ? -10 : -7] });
  const bobR = bob.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] });
  const shotU = shot ? Math.min(1, (now - shot.key) / 280) : 0;
  const shotX = shot ? shot.x0 + (shot.x1 - shot.x0) * shotU : 0;
  const shotY = shot ? shot.y0 + (shot.y1 - shot.y0) * shotU : 0;
  const shotDeg = shot ? (Math.atan2(shot.y1 - shot.y0, shot.x1 - shot.x0) * 180) / Math.PI : 0;
  const heroY = posRef.current.y;
  const pinesBack = TREES.filter((t) => t.y <= heroY);
  const pinesFront = TREES.filter((t) => t.y > heroY);

  const renderPine = (t: (typeof TREES)[number]) => {
    const shaking = chopId === t.id;
    return (
      <Image
        key={t.id}
        source={chopped[t.id] ? STUMP_ART : PINE_ART}
        style={{
          position: 'absolute',
          left: `${t.x}%`,
          top: `${t.y}%`,
          width: chopped[t.id] ? 40 : PINE_W,
          height: chopped[t.id] ? 36 : PINE_H,
          marginLeft: chopped[t.id] ? -20 : -PINE_W / 2,
          marginTop: chopped[t.id] ? -18 : -PINE_H + 12,
          transform: shaking ? [{ rotate: now % 160 < 80 ? '-6deg' : '6deg' }] : undefined,
        }}
        resizeMode="contain"
      />
    );
  };

  return (
    <View
      style={styles.fieldBox}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setBox((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
      }}
    >
      <View style={styles.viewport} {...panResponder.panHandlers}>
        <View style={[styles.world, { width: world.w, height: world.h, left: camXY.x, top: camXY.y }]}>
          {Array.from({ length: MAP }, (_, r) =>
            Array.from({ length: MAP }, (_, c) => {
              const origin = tileOrigin(c, r);
              const isCamp = c === 1 && r === 1;
              const seen = revealedSet.has(cellKey(c, r));
              return (
                <View
                  key={cellKey(c, r)}
                  style={{
                    position: 'absolute',
                    left: `${origin.x}%`,
                    top: `${origin.y}%`,
                    width: `${100 / MAP}%`,
                    height: `${100 / MAP}%`,
                    overflow: 'hidden',
                  }}
                >
                  <LinearGradient
                    colors={isCamp ? ['#8FCB7A', '#6FBF73', '#5AAA62'] : ['#4F9A5C', '#3E8A4E', '#2F6F3C']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {!seen ? <View style={styles.tileFog} /> : null}
                </View>
              );
            })
          )}

          {wallRuns
            .filter((run) => (wallHp[run.edge] ?? 1) > 0)
            .map((run) => {
              const railPx = 6;
              return (
                <Fragment key={run.key}>
                  {run.rails.flatMap((seg, si) => {
                    const longPx = (seg.span / 100) * (run.horiz ? world.w : world.h);
                    return [ -5, 4 ].map((off, ri) => (
                      <View
                        key={`${run.key}-r${si}-${ri}`}
                        style={{
                          position: 'absolute',
                          left: `${seg.x}%`,
                          top: `${seg.y}%`,
                          width: run.horiz ? longPx : railPx,
                          height: run.horiz ? railPx : longPx,
                          marginLeft: run.horiz ? -longPx / 2 : -railPx / 2 + off,
                          marginTop: run.horiz ? -railPx / 2 + off : -longPx / 2,
                          backgroundColor: wallFill,
                          borderRadius: 3,
                          borderWidth: 1.5,
                          borderColor: wallInk,
                          zIndex: 3,
                        }}
                      />
                    ));
                  })}
                  {run.posts.map((post, i) => (
                    <Image
                      key={`${run.key}-p${i}`}
                      source={postArt(ringLevel)}
                      style={{
                        position: 'absolute',
                        left: `${post.x}%`,
                        top: `${post.y}%`,
                        width: post.w,
                        height: post.h,
                        marginLeft: -post.w / 2,
                        marginTop: -post.h * (run.horiz ? 0.82 : 0.55),
                        zIndex: 4,
                      }}
                      resizeMode="contain"
                    />
                  ))}
                </Fragment>
              );
            })}

          {ringLevel >= 1
            ? WALL_EDGES.map(([a, b], edge) => {
                const max = maxWallEdgeHp(ringLevel);
                const A = TOWER_SLOTS[a];
                const B = TOWER_SLOTS[b];
                return (
                  <View
                    key={`whp-${edge}`}
                    style={{
                      position: 'absolute',
                      left: `${(A.x + B.x) / 2}%`,
                      top: `${(A.y + B.y) / 2}%`,
                      marginLeft: -20,
                      marginTop: 6,
                      zIndex: 5,
                    }}
                  >
                    <HpMark hp={wallHp[edge] ?? max} max={max} />
                  </View>
                );
              })
            : null}

          <View
            style={{
              position: 'absolute',
              left: `${BUILD_SPOTS.hut.x}%`,
              top: `${BUILD_SPOTS.hut.y}%`,
              width: hutSize,
              height: hutSize,
              marginLeft: -hutSize / 2,
              marginTop: -hutSize / 2,
              alignItems: 'center',
            }}
          >
            <Image source={phaseArt(HUT_ART, castle, 5)} style={{ width: hutSize, height: hutSize }} resizeMode="contain" />
            <Text style={styles.fundTag}>
              {castle >= 5
                ? `lv ${castle} max`
                : keepGate.ok
                  ? `lv ${castle}  tap to upgrade`
                  : `lv ${castle}  ${keepGate.message}`}
            </Text>
            <HpMark hp={buildingHp.castle ?? maxBuildingHp('castle', castle)} max={maxBuildingHp('castle', castle)} />
          </View>

          {farmLv > 0 ? (
            <View
              style={{
                position: 'absolute',
                left: `${BUILD_SPOTS.farm.x}%`,
                top: `${BUILD_SPOTS.farm.y}%`,
                width: farmSize,
                height: farmSize,
                marginLeft: -farmSize / 2,
                marginTop: -farmSize / 2,
                alignItems: 'center',
              }}
            >
              <Image source={phaseArt(FARM_ART, farmLv, 5)} style={{ width: farmSize, height: farmSize }} resizeMode="contain" />
              {collectReady ? <Text style={styles.sparkle}>✨</Text> : null}
              <Text style={styles.fundTag}>{`lv ${farmLv}`}</Text>
              <HpMark hp={buildingHp.farm ?? maxBuildingHp('farm', farmLv)} max={maxBuildingHp('farm', farmLv)} />
            </View>
          ) : (
            <View style={[styles.pad, { left: `${BUILD_SPOTS.farm.x}%`, top: `${BUILD_SPOTS.farm.y}%` }]}>
              <Text style={styles.padLabel}>🌾</Text>
            </View>
          )}

          {hutLv > 0 ? (
            <View
              style={{
                position: 'absolute',
                left: `${BUILD_SPOTS.shed.x}%`,
                top: `${BUILD_SPOTS.shed.y}%`,
                width: shedSize,
                height: shedSize,
                marginLeft: -shedSize / 2,
                marginTop: -shedSize / 2,
                alignItems: 'center',
              }}
            >
              <Image source={phaseArt(SHED_ART, hutLv, 5)} style={{ width: shedSize, height: shedSize }} resizeMode="contain" />
              <Text style={styles.fundTag}>{`lv ${hutLv}`}</Text>
              <HpMark hp={buildingHp.hut ?? maxBuildingHp('hut', hutLv)} max={maxBuildingHp('hut', hutLv)} />
            </View>
          ) : (
            <View style={[styles.pad, { left: `${BUILD_SPOTS.shed.x}%`, top: `${BUILD_SPOTS.shed.y}%` }]}>
              <Text style={styles.padLabel}>🪵</Text>
            </View>
          )}

          {workshopLv > 0 ? (
            <View
              style={{
                position: 'absolute',
                left: `${BUILD_SPOTS.workshop.x}%`,
                top: `${BUILD_SPOTS.workshop.y}%`,
                width: workshopSize,
                height: workshopSize,
                marginLeft: -workshopSize / 2,
                marginTop: -workshopSize / 2,
                alignItems: 'center',
              }}
            >
              <Image source={phaseArt(WORKSHOP_ART, workshopLv, 3)} style={{ width: workshopSize, height: workshopSize }} resizeMode="contain" />
              <Text style={styles.fundTag}>{`lv ${workshopLv}`}</Text>
              <HpMark
                hp={buildingHp.workshop ?? maxBuildingHp('workshop', workshopLv)}
                max={maxBuildingHp('workshop', workshopLv)}
              />
            </View>
          ) : castle >= 2 ? (
            <View style={[styles.pad, { left: `${BUILD_SPOTS.workshop.x}%`, top: `${BUILD_SPOTS.workshop.y}%` }]}>
              <Text style={styles.padLabel}>🛠️</Text>
              <Text style={styles.fundTag}>+</Text>
            </View>
          ) : null}

          <View style={[styles.pad, { left: `${BUILD_SPOTS.store.x}%`, top: `${BUILD_SPOTS.store.y}%` }]}>
            <Text style={styles.padLabel}>📦</Text>
            <Text style={styles.fundTag}>store</Text>
          </View>

          {castle >= KEEP_EXTRA_LEVEL ? (
            millLv > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  left: `${BUILD_SPOTS.mill.x}%`,
                  top: `${BUILD_SPOTS.mill.y}%`,
                  width: millSize,
                  height: millSize,
                  marginLeft: -millSize / 2,
                  marginTop: -millSize / 2,
                  alignItems: 'center',
                }}
              >
                <Image source={phaseArt(MILL_ART, millLv, 5)} style={{ width: millSize, height: millSize }} resizeMode="contain" />
                <Text style={styles.fundTag}>{`lv ${millLv}`}</Text>
                <HpMark hp={buildingHp.mill ?? maxBuildingHp('mill', millLv)} max={maxBuildingHp('mill', millLv)} />
              </View>
            ) : (
              <View style={[styles.pad, { left: `${BUILD_SPOTS.mill.x}%`, top: `${BUILD_SPOTS.mill.y}%` }]}>
                <Text style={styles.padLabel}>⚙️</Text>
                <Text style={styles.fundTag}>+</Text>
              </View>
            )
          ) : null}

          {MINES.filter((mine) => canMine(mine, chopped, revealedMines) && revealedSet.has(mine.tile)).map((mine) => {
            const cooling = now < (mineCool[mine.id] ?? 0);
            const digging = mineId === mine.id;
            return (
              <View
                key={mine.id}
                style={{
                  position: 'absolute',
                  left: `${mine.x}%`,
                  top: `${mine.y}%`,
                  width: MINE_SIZE,
                  height: MINE_SIZE,
                  marginLeft: -MINE_SIZE / 2,
                  marginTop: -MINE_SIZE / 2,
                  alignItems: 'center',
                  opacity: cooling ? 0.72 : 1,
                }}
              >
                <Image
                  source={MINE_ART}
                  style={{
                    width: MINE_SIZE,
                    height: MINE_SIZE,
                    transform: digging ? [{ rotate: now % 160 < 80 ? '-4deg' : '4deg' }] : undefined,
                  }}
                  resizeMode="contain"
                />
                {!cooling && !digging ? <Text style={styles.sparkle}>✨</Text> : null}
                <Text style={styles.fundTag}>{cooling ? 'cooling' : 'gold mine'}</Text>
              </View>
            );
          })}

          {TOWER_SLOTS.map((slot) => {
            const lv = towers[slot.i] ?? 0;
            const size = towerSize;
            const grow = towerCanGrow(keepSnap, slot.i);
            const nextCost = scaleCost(TOWER_COST, Math.max(1, grow.next), (workshopLv ?? 0) * 0.08);
            const fund = buildingFund[`tower-${slot.i}`] ?? { wood: 0, coins: 0 };
            let tag = `${fund.wood}/${nextCost.wood ?? 0}`;
            if (lv === 0) tag = `${towersBuilt}/4  ${fund.wood}/${nextCost.wood ?? 0}`;
            else if (lv >= 4) tag = 'cement';
            else if (!grow.ok) tag = `lv ${lv}  grow the hut first`;
            else tag = `${FORT_NAMES[lv]} → ${FORT_NAMES[grow.next]}  ${fund.wood}/${nextCost.wood ?? 0}`;
            return (
              <View
                key={`tw-${slot.i}`}
                style={{
                  position: 'absolute',
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: 88,
                  height: 88,
                  marginLeft: -44,
                  marginTop: -44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 4,
                }}
              >
                {lv === 0 ? <View style={styles.plot} /> : null}
                {lv > 0 ? (
                  <Image
                    source={towerArt(lv)}
                    style={{
                      width: size,
                      height: size,
                      marginTop: -size / 2,
                      opacity: (towerHp[slot.i] ?? 1) <= 0 ? 0.4 : 1,
                    }}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.plotCost}>{`🪵${nextCost.wood} 🪙${nextCost.coins}`}</Text>
                )}
                <Text style={styles.fundTag}>{tag}</Text>
                {lv > 0 ? (
                  <HpMark
                    hp={towerHp[slot.i] ?? maxTowerHp(true, lv)}
                    max={maxTowerHp(true, lv)}
                  />
                ) : null}
              </View>
            );
          })}

          <View style={[styles.mark, { left: `${BUILD_SPOTS.flag.x}%`, top: `${BUILD_SPOTS.flag.y}%` }]}>
            <Text style={styles.flag}>🚩</Text>
          </View>

          {pinesBack.map(renderPine)}

          {drops.map((drop) => (
            <View
              key={drop.id}
              style={{
                position: 'absolute',
                left: `${drop.x}%`,
                top: `${drop.y}%`,
                width: 22,
                height: 22,
                marginLeft: -11,
                marginTop: -11,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {drop.kind === 'coin' ? <View style={styles.groundCoin} /> : <View style={styles.groundLog} />}
            </View>
          ))}

          {alive.map((e) => (
            <View
              key={e.id}
              style={{
                position: 'absolute',
                left: `${e.x}%`,
                top: `${e.y}%`,
                width: TROLL_SIZE,
                height: TROLL_SIZE,
                marginLeft: -TROLL_SIZE / 2,
                marginTop: -TROLL_SIZE / 2,
                alignItems: 'center',
              }}
            >
              {targetId === e.id ? <View style={styles.agro} /> : null}
              <Image source={TROLL_ART} style={{ width: TROLL_SIZE, height: TROLL_SIZE }} resizeMode="contain" />
              <View style={styles.hpTrack}>
                <View style={[styles.hpFill, { width: `${(e.hp / e.max) * 100}%` }]} />
              </View>
            </View>
          ))}

          <Animated.View
            style={[
              styles.rings,
              { transform: [{ translateX: partyAnim.x }, { translateY: partyAnim.y }] },
            ]}
          >
            <View
              style={[
                styles.rangeRing,
                {
                  width: reachPx * 2,
                  height: reachPx * 2,
                  marginLeft: -reachPx,
                  marginTop: -reachPx,
                  borderRadius: reachPx,
                },
              ]}
            />
            <View style={styles.footRing} />
          </Animated.View>

          <Animated.View
            style={[
              styles.heroWrap,
              {
                transform: [
                  { translateX: Animated.add(partyAnim.x, -HERO_SIZE / 2) },
                  { translateY: Animated.add(Animated.add(partyAnim.y, -HERO_SIZE / 2), bobY) },
                  ...(chopId ? [{ rotate: bobR }] : []),
                ],
              },
            ]}
          >
            {visWood > 0 ? (
              <View
                style={[
                  styles.stack,
                  {
                    left: face > 0 ? -14 : 42,
                    transform: [{ translateX: walking || chopId || mineId ? (now % 180 < 90 ? 2 : -2) : 0 }],
                  },
                ]}
              >
                {Array.from({ length: visWood }, (_, i) => (
                  <View key={`w-${i}`} style={[styles.log, { bottom: i * 8 }]} />
                ))}
              </View>
            ) : null}
            {visCoins > 0 ? (
              <View
                style={[
                  styles.stack,
                  {
                    left: face > 0 ? 42 : -14,
                    transform: [{ translateX: walking || chopId || mineId ? (now % 180 < 90 ? -2 : 2) : 0 }],
                  },
                ]}
              >
                {Array.from({ length: visCoins }, (_, i) => (
                  <View key={`c-${i}`} style={[styles.coinBit, { bottom: i * 8 }]} />
                ))}
              </View>
            ) : null}
            <Image
              source={chopId && avatar === 'pip' ? PIP_CHOP : HERO_ART[avatar]}
              style={[styles.heroArt, { transform: [{ scaleX: face }] }]}
              resizeMode="contain"
            />
            {chopId ? <Text style={styles.chopFx}>🪓</Text> : mineId ? <Text style={styles.chopFx}>🪙</Text> : null}
          </Animated.View>

          {pinesFront.map(renderPine)}

          {shot ? (
            <Text
              style={[
                styles.shot,
                {
                  left: `${shotX}%`,
                  top: `${shotY}%`,
                  transform: [{ rotate: `${shotDeg}deg` }],
                },
              ]}
            >
              {shot.arrow ? '🏹' : WEAPON[avatar]}
            </Text>
          ) : null}
          {flies.map((f) => {
            const u = Math.min(1, (now - f.t0) / FLY_MS);
            const ease = 1 - (1 - u) * (1 - u);
            const x = f.x0 + (f.x1 - f.x0) * ease;
            const y = f.y0 + (f.y1 - f.y0) * ease - Math.sin(u * Math.PI) * 4;
            return (
              <View
                key={f.id}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  marginLeft: f.kind === 'wood' ? -10 : -8,
                  marginTop: f.kind === 'wood' ? -4 : -8,
                  zIndex: 8,
                }}
              >
                {f.kind === 'wood' ? <View style={styles.log} /> : <View style={styles.coinBit} />}
              </View>
            );
          })}
          {loot ? (
            <Text style={[styles.float, { left: `${loot.x}%`, top: `${loot.y}%` }]}>{`+${loot.n} 🪙`}</Text>
          ) : null}
          {floats ? (
            <Text style={[styles.float, { left: `${BUILD_SPOTS.farm.x}%`, top: `${BUILD_SPOTS.farm.y}%` }]}>
              {`+${floats.food} 🍎`}
            </Text>
          ) : null}
        </View>
      </View>

      <LinearGradient colors={['rgba(180, 214, 224, 0)', 'rgba(180, 214, 224, 0.5)']} style={styles.mist} />

      <View style={styles.chip}>
        <Text style={styles.chipText}>
          {done
            ? 'The keep is yours.'
            : carryTotal >= CARRY_MAX
              ? `Back is full (${CARRY_MAX}/${CARRY_MAX}) — dump at the storehouse.`
              : mineId
                ? 'Mining gold!'
                : carryingWood || carryingCoins
                  ? `Back ${carryTotal}/${CARRY_MAX}  🪵${carryingWood}  🪙${carryingCoins} — dump at the storehouse.`
                  : chopId
                    ? 'Chop! Chop!'
                    : drops.length
                      ? 'Walk over the coins to stack them on your back.'
                      : !keepGate.ok
                        ? keepGate.message
                        : wave
                          ? `Horde ${Math.min(wave, hordeCap)}/${hordeCap}. ${ringLevel ? `${FORT_NAMES[ringLevel]} wall.` : `${towersBuilt}/4 towers for the wood wall.`}`
                          : ringLevel
                            ? keepGate.message
                            : 'Tap a gold square to plant a tower. Walls go up when all four are planted.'}
        </Text>
      </View>

      <View style={styles.hunt}>
        <Text style={styles.huntText}>
          {wave ? `🌊${Math.min(wave, hordeCap)}/${hordeCap}  🧌${alive.length}` : `🏕️ ${hordeCap} hordes`}
        </Text>
      </View>

      <View style={styles.avatars}>
        {HEROES.map((h) => {
          const locked = h.id !== 'pip' && !recruited.includes(h.id);
          const active = avatar === h.id && !locked;
          return (
            <Pressable
              key={h.id}
              accessibilityRole="button"
              accessibilityLabel={
                locked
                  ? `${h.name} the ${h.role}, not recruited yet`
                  : `Play as ${h.name} the ${h.role}`
              }
              onPress={() => {
                if (locked) {
                  setSelected(h.id);
                  return;
                }
                setAvatar(h.id);
                setSelected(h.id);
              }}
              style={[styles.avatarBtn, active && styles.avatarOn]}
            >
              <HeroPortrait id={h.id} size={56} selected={active} dimmed={false} />
              {locked ? <View style={styles.avatarLockBadge} pointerEvents="none" /> : null}
              <Text style={[styles.avatarTag, locked && styles.avatarTagLock]} numberOfLines={1}>
                {h.race === 'Fairy' ? 'Fairy' : h.role}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={styles.homeBtn}
        onPress={() => {
          posRef.current = { ...CAMP };
          syncAvatar();
        }}
      >
        <Text style={styles.homeGlyph}>Camp</Text>
      </Pressable>

      <View style={styles.joyWrap}>
        <Joystick
          onVector={(x, y) => {
            stickRef.current = { x, y };
          }}
        />
      </View>

      {fieldPad ? (
        <View style={[styles.padHalo, { left: fieldPad.x - 55, top: fieldPad.y - 55, pointerEvents: 'none' }]}>
          <View style={[styles.padKnob, { transform: [{ translateX: fieldPad.kx }, { translateY: fieldPad.ky }] }]} />
        </View>
      ) : null}

      <Pressable style={styles.action} onPress={doAction}>
        <Text style={styles.actionGlyph}>{mineId ? '🪙' : chopId ? '🪓' : WEAPON[avatar]}</Text>
        <Text style={styles.actionLabel}>
          {mineId ? 'Mine' : chopId ? 'Chop' : carryingWood || carryingCoins ? 'Dump' : 'Action'}
        </Text>
      </Pressable>

      {selected ? <FieldSheet target={selected} onClose={() => setSelected(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBox: { flex: 1, backgroundColor: colors.meadowDeep },
  viewport: { flex: 1, overflow: 'hidden' },
  world: { position: 'absolute', pointerEvents: 'none' },
  tileFog: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(40, 70, 50, 0.55)',
  },
  chip: {
    position: 'absolute',
    left: 12,
    right: 96,
    top: 8,
    backgroundColor: colors.panel,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 8,
    pointerEvents: 'none',
  },
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
  },
  hunt: {
    position: 'absolute',
    right: 12,
    top: 8,
    backgroundColor: colors.panel,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    zIndex: 8,
  },
  huntText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  mist: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    zIndex: 4,
    pointerEvents: 'none',
  },
  mark: {
    position: 'absolute',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: { position: 'absolute', top: -18, fontSize: 22 },
  flag: { fontSize: 28 },
  charge: { position: 'absolute', top: -10, fontSize: 12 },
  needStar: { position: 'absolute', top: -8, fontSize: 14, opacity: 0.7 },
  plot: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderWidth: 3,
    borderColor: colors.gold,
    backgroundColor: 'rgba(242, 193, 78, 0.22)',
    borderRadius: 6,
  },
  plotCost: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 2,
  },
  fundTag: {
    position: 'absolute',
    bottom: -14,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.ink,
  },
  pad: {
    position: 'absolute',
    width: 48,
    height: 36,
    marginLeft: -24,
    marginTop: -18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 248, 232, 0.7)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(43, 58, 66, 0.12)',
  },
  padLabel: { fontSize: 16 },
  spotTag: { position: 'absolute', bottom: -6, fontSize: 14 },
  agro: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(232, 74, 62, 0.28)',
    borderWidth: 3,
    borderColor: 'rgba(232, 74, 62, 0.8)',
    top: -6,
  },
  hpTrack: {
    width: 28,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(43, 58, 66, 0.35)',
    overflow: 'hidden',
    marginTop: -4,
  },
  hpFill: { height: 5, backgroundColor: '#E24A3E', borderRadius: 3 },
  bHpTrack: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(43, 58, 66, 0.35)',
    overflow: 'hidden',
    marginTop: 3,
  },
  bHpFill: { height: 5, borderRadius: 3 },
  rings: { position: 'absolute', left: 0, top: 0, width: 0, height: 0 },
  rangeRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 248, 232, 0.7)',
  },
  footRing: {
    position: 'absolute',
    width: 46,
    height: 16,
    marginLeft: -23,
    marginTop: 18,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.gold,
    backgroundColor: 'rgba(242, 193, 78, 0.22)',
  },
  heroWrap: { position: 'absolute', left: 0, top: 0, width: HERO_SIZE, height: HERO_SIZE, overflow: 'visible' },
  heroArt: { width: HERO_SIZE, height: HERO_SIZE, zIndex: 2 },
  stack: { position: 'absolute', bottom: 16, width: 22, height: 8, zIndex: 1 },
  log: {
    position: 'absolute',
    width: 20,
    height: 8,
    borderRadius: 3,
    backgroundColor: '#8B5A2B',
    borderWidth: 1.5,
    borderColor: '#4A2E16',
  },
  coinBit: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F2C14E',
    borderWidth: 1.5,
    borderColor: '#C4922A',
  },
  groundCoin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F2C14E',
    borderWidth: 2,
    borderColor: '#C4922A',
  },
  groundLog: {
    width: 20,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#8B5A2B',
    borderWidth: 1.5,
    borderColor: '#4A2E16',
  },
  chopFx: { position: 'absolute', right: -8, top: -6, fontSize: 20 },
  shot: { position: 'absolute', fontSize: 28, marginLeft: -14, marginTop: -20 },
  float: {
    position: 'absolute',
    zIndex: 6,
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    color: colors.ink,
    marginLeft: -28,
  },
  avatars: { position: 'absolute', right: 10, top: 86, gap: 10, zIndex: 12, alignItems: 'center' },
  avatarBtn: {
    width: 56,
    alignItems: 'center',
    gap: 2,
    position: 'relative',
  },
  avatarOn: {},
  avatarLockBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(43, 58, 66, 0.28)',
    borderWidth: 2,
    borderColor: 'rgba(255, 248, 232, 0.55)',
    borderStyle: 'dashed',
  },
  avatarTag: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.ink,
    backgroundColor: colors.cream,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: 64,
    textAlign: 'center',
  },
  avatarTagLock: { opacity: 0.55 },
  homeBtn: {
    position: 'absolute',
    left: 12,
    top: 86,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  homeGlyph: { fontFamily: fonts.displayMed, fontSize: 13, color: colors.ink },
  joyWrap: { position: 'absolute', left: 16, bottom: 18, zIndex: 12 },
  padHalo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11,
  },
  padKnob: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  action: {
    position: 'absolute',
    right: 16,
    bottom: 28,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.coral,
    borderWidth: 3,
    borderColor: '#D45A3C',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  actionGlyph: { fontSize: 28 },
  actionLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.ink },
});
