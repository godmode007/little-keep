import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FOG_NODES } from '../data/campaign';
import { BUILDINGS, HEROES, QUESTS } from '../data/catalog';
import type { BuildingId, HeroId, QuestId, Resources } from '../data/types';
import { scaleCost } from '../game/economy';
import { KEEP_EXTRA_LEVEL, keepCanGrow, towerCanGrow } from '../game/keep';
import { currentLevel } from '../game/progress';
import { FORT_NAMES, TOWER_COST } from '../game/world';
import { useKidsStore } from '../store/kidsStore';
import { colors, fonts } from '../theme/theme';
import { BigButton } from './BigButton';
import { HeroPortrait } from './HeroPortrait';

export type FieldTarget =
  | 'castle'
  | 'wall'
  | 'farm'
  | 'hut'
  | 'workshop'
  | 'mill'
  | 'lookout'
  | 'mine'
  | 'store'
  | 'pip'
  | 'mira'
  | 'blink'
  | 'nana'
  | 'flag'
  | `woods-${number}`
  | `tower-${number}`;

type Props = {
  target: FieldTarget;
  onClose: () => void;
};

function costText(cost: Partial<Resources>): string {
  return (Object.entries(cost) as [keyof Resources, number][])
    .filter(([, v]) => v)
    .map(([k, v]) => `${v} ${k}`)
    .join(' · ');
}

export function FieldSheet({ target, onClose }: Props) {
  const buildingLevels = useKidsStore((s) => s.buildingLevels);
  const questsDone = useKidsStore((s) => s.questsDone);
  const upgrade = useKidsStore((s) => s.upgrade);
  const feedTower = useKidsStore((s) => s.feedTower);
  const doQuest = useKidsStore((s) => s.doQuest);
  const recruit = useKidsStore((s) => s.recruit);
  const recruited = useKidsStore((s) => s.recruited);
  const workshop = buildingLevels.workshop ?? 0;
  const castle = buildingLevels.castle ?? 1;
  const lookout = buildingLevels.lookout ?? 0;
  const fortLevel = useKidsStore((s) => s.fortLevel ?? 0);
  const towerLevels = useKidsStore((s) => s.towerLevels);
  const keepSnap = { buildingLevels, towerLevels, fortLevel };
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [target]);

  const runUpgrade = (id: BuildingId) => {
    const result = upgrade(id);
    if (result.ok) onClose();
    else setError(result.message);
  };

  const runQuest = (id: QuestId) => {
    const result = doQuest(id);
    if (result.ok) onClose();
    else setError(result.message);
  };

  const runRecruit = (id: HeroId) => {
    const result = recruit(id);
    if (result.ok) onClose();
    else setError(result.message);
  };

  let title = '';
  let sentence = '';
  let meta: string | null = null;
  let heroId: HeroId | null = null;
  let raceLine: string | null = null;
  let primary: { label: string; tone: 'gold' | 'green' | 'coral'; onPress: () => void } | null = null;

  const woodsMatch = /^woods-(\d+)$/.exec(target);
  const towerMatch = /^tower-(\d+)$/.exec(target);

  if (woodsMatch) {
    const node = FOG_NODES[Number(woodsMatch[1])];
    const def = BUILDINGS.find((b) => b.id === 'lookout')!;
    if (!node) {
      title = 'Woods';
      sentence = 'The trees are quiet.';
    } else if (lookout < node.i) {
      title = node.fogTitle;
      sentence = node.lockedSentence;
    } else if (lookout >= def.maxLevel) {
      title = node.cleared === 'well' ? 'Wishing Well' : 'Watch Tower';
      sentence = 'The woods are clear.';
    } else {
      const cost = scaleCost(def.baseCost, Math.max(1, lookout + 1), workshop * 0.08);
      title = node.fogTitle;
      sentence = node.fogSentence;
      meta = `Cost: ${costText(cost)}`;
      primary = { label: 'Build tower', tone: 'gold', onPress: () => runUpgrade('lookout') };
    }
  } else if (towerMatch) {
    const i = Number(towerMatch[1]);
    const lv = (towerLevels.length === 4 ? towerLevels : [0, 0, 0, 0])[i] ?? 0;
    const grow = towerCanGrow(keepSnap, i);
    const cost = scaleCost(TOWER_COST, Math.max(1, grow.next), workshop * 0.08);
    title = 'Security Tower';
    meta = lv > 0 ? `${FORT_NAMES[lv]} · lv ${lv}` : 'Empty gold square';
    sentence = grow.ok
      ? lv === 0
        ? 'Plant this corner. All four towers raise a wood wall, then the hut can grow.'
        : `Rank this tower to ${FORT_NAMES[grow.next]}. When all four match, the wall rises.`
      : grow.message;
    if (grow.ok) {
      meta = `${meta} · Next: ${costText(cost)}`;
      primary = {
        label: lv === 0 ? 'Build' : 'Upgrade',
        tone: 'gold',
        onPress: () => {
          const result = feedTower(i);
          if (result.ok) onClose();
          else setError(result.message);
        },
      };
    }
  } else if (target === 'store') {
    title = 'Storehouse';
    sentence = 'Dump wood and coins here. Then tap a building and hit Upgrade — unbought pads never take loot.';
  } else if (target === 'mine') {
    title = 'Gold Mine';
    sentence = 'Chop the pines hiding this vein, then walk in to gather coins.';
  } else if (target === 'workshop' && castle < 2) {
    title = 'Workshop';
    sentence = 'Need a bigger hut first. Opens after hut 2.';
  } else if (target === 'mill' && castle < KEEP_EXTRA_LEVEL) {
    title = 'Mill';
    sentence = `Need hut ${KEEP_EXTRA_LEVEL} first. Then a mill pad opens inside the west wall.`;
  } else if (target === 'workshop' && workshop < 1) {
    const def = BUILDINGS.find((b) => b.id === 'workshop')!;
    const cost = scaleCost(def.baseCost, 1, workshop * 0.08);
    title = 'Workshop';
    sentence = 'Build a Workshop.';
    meta = `Cost: ${costText(cost)}`;
    primary = { label: 'Build', tone: 'gold', onPress: () => runUpgrade('workshop') };
  } else if (
    target === 'castle' ||
    target === 'wall' ||
    target === 'farm' ||
    target === 'hut' ||
    target === 'workshop' ||
    target === 'mill' ||
    target === 'lookout'
  ) {
    const def = BUILDINGS.find((b) => b.id === target)!;
    const level = buildingLevels[def.id] ?? 0;
    const maxed = level >= def.maxLevel;
    title = def.name;
    meta = `Level ${level} of ${def.maxLevel}`;
    if (target === 'castle') {
      const gate = keepCanGrow(keepSnap);
      sentence = maxed
        ? 'The hut is as big as it gets.'
        : gate.ok
          ? 'Tap Upgrade to spend from the storehouse. After the hut grows, the towers can rank up again.'
          : gate.message;
    } else if (target === 'wall') {
      sentence = level === 0 ? 'Raise palisade walls around camp.' : 'Upgrade to grow the walls taller and close the ring.';
    } else if (target === 'farm') {
      sentence = level === 0 ? 'Tap Upgrade to build the farm from the storehouse.' : 'Food is growing. Tap Upgrade to make the barn bigger.';
    } else if (target === 'hut') {
      sentence = level === 0 ? 'Build a woodshed.' : 'Wood is stacking. Upgrade to make the shed bigger.';
    } else if (target === 'lookout') {
      sentence =
        level === 0
          ? 'Build a security tower on a camp corner. It shoos trolls.'
          : 'Upgrade to raise a taller tower on the next corner.';
    } else if (target === 'mill') {
      sentence = maxed ? 'The mill is as big as it gets.' : 'Grind grain for extra food. It stands inside the west wall.';
    } else {
      sentence = maxed ? 'The workshop is fully stocked.' : 'A real workshop on the grass. Makes building a little cheaper.';
    }
    if (!maxed) {
      const cost = scaleCost(def.baseCost, Math.max(1, level + 1), workshop * 0.08);
      meta = `${meta} · Next: ${costText(cost)}`;
      const gated = target === 'castle' && !keepCanGrow(keepSnap).ok;
      primary = gated
        ? null
        : { label: level === 0 ? 'Build' : 'Upgrade', tone: 'gold', onPress: () => runUpgrade(def.id) };
    }
  } else if (target === 'flag') {
    const chapter = currentLevel({
      questsDone,
      recruited,
      buildingLevels,
    });
    const preferred = chapter.flagQuest
      ? QUESTS.find((q) => q.id === chapter.flagQuest)
      : undefined;
    const quest =
      preferred && castle >= preferred.unlockCastle && !questsDone.includes(preferred.id)
        ? preferred
        : QUESTS.find((q) => castle >= q.unlockCastle && !questsDone.includes(q.id));
    if (!quest) {
      title = 'Gate';
      sentence = 'All adventures done.';
    } else {
      title = quest.name;
      sentence = quest.blurb;
      meta = `Needs power ${quest.powerNeeded}`;
      primary = { label: 'Go Adventure', tone: 'green', onPress: () => runQuest(quest.id) };
    }
  } else {
    const hero = HEROES.find((h) => h.id === (target as HeroId))!;
    const inParty = recruited.includes(hero.id);
    heroId = hero.id;
    title = `${hero.name} ${hero.title}`;
    raceLine = `${hero.race} · ${hero.role}`;
    sentence = inParty ? hero.presence : hero.blurb;
    meta = `Power ${hero.power}${inParty ? ' · In the party' : ' · Waiting to join'}`;
    if (!inParty) {
      const cost = costText(hero.recruitCost);
      meta = `${meta}${cost ? ` · ${cost}` : ' · Free friend'}`;
      primary = {
        label: `Recruit ${hero.name}`,
        tone: 'coral',
        onPress: () => runRecruit(hero.id),
      };
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close sheet"
      />
      <View style={styles.sheet} accessibilityViewIsModal>
        <View style={styles.handle} />
        {heroId ? (
          <View style={styles.heroRow}>
            <HeroPortrait id={heroId} size={88} selected />
            <View style={styles.heroCopy}>
              <Text style={styles.title}>{title}</Text>
              {raceLine ? <Text style={styles.race}>{raceLine}</Text> : null}
              {meta ? <Text style={styles.meta}>{meta}</Text> : null}
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.title}>{title}</Text>
            {meta ? <Text style={styles.meta}>{meta}</Text> : null}
          </>
        )}
        <Text style={styles.sentence}>{sentence}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {primary ? (
          <BigButton label={primary.label} tone={primary.tone} onPress={primary.onPress} />
        ) : null}
        <BigButton label="Close" tone="soft" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(43, 58, 66, 0.28)',
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroCopy: { flex: 1, gap: 4 },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
  },
  race: {
    fontFamily: fonts.displayMed,
    fontSize: 15,
    color: colors.meadowDeep,
  },
  meta: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.inkSoft,
  },
  sentence: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
  },
  error: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.coral,
  },
});
