import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BigButton } from '../../src/components/BigButton';
import { Bubble } from '../../src/components/Bubble';
import { Shell } from '../../src/components/Shell';
import { Toast } from '../../src/components/Toast';
import { TopBar } from '../../src/components/TopBar';
import { BUILDINGS } from '../../src/data/catalog';
import { scaleCost } from '../../src/game/economy';
import { useKidsStore } from '../../src/store/kidsStore';
import { colors, fonts } from '../../src/theme/theme';

export default function BuildScreen() {
  const insets = useSafeAreaInsets();
  const buildingLevels = useKidsStore((s) => s.buildingLevels);
  const upgrade = useKidsStore((s) => s.upgrade);
  const lastMessage = useKidsStore((s) => s.lastMessage);
  const castle = buildingLevels.castle;
  const workshop = buildingLevels.workshop;

  return (
    <Shell>
      <View style={{ paddingTop: insets.top + 8 }}>
        <TopBar />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Build</Text>
        <Text style={styles.sub}>
          Dump wood and coins at the storehouse on Home, then tap a building to Upgrade. Plant all four towers so the wall comes up, then grow the hut. After hut 3 a mill opens inside the west wall.
        </Text>

        {BUILDINGS.filter(
          (b) => b.id !== 'wall' && (castle >= b.unlockCastle || b.id === 'castle')
        ).map((b) => {
          const level = buildingLevels[b.id];
          const cost = scaleCost(b.baseCost, Math.max(1, level + 1), workshop * 0.08);
          const costText = Object.entries(cost)
            .map(([k, v]) => `${v} ${k}`)
            .join(' · ');
          const fieldOnly = b.id === 'lookout';
          return (
            <Bubble key={b.id}>
              <Text style={styles.emoji}>{b.emoji}</Text>
              <Text style={styles.name}>
                {b.name} · Lv {level}/{b.maxLevel}
              </Text>
              <Text style={styles.blurb}>{b.blurb}</Text>
              {b.produces ? (
                <Text style={styles.meta}>
                  Makes{' '}
                  {Object.entries(b.produces)
                    .map(([k, v]) => `${v} ${k}`)
                    .join(', ')}{' '}
                  each collect × level
                </Text>
              ) : null}
              <Text style={styles.cost}>{level >= b.maxLevel ? 'Maxed!' : `Next: ${costText}`}</Text>
              {fieldOnly ? (
                <Text style={styles.meta}>Tap a gold square on Home to plant or rank that tower.</Text>
              ) : (
                <BigButton
                  label={level === 0 ? 'Build' : 'Upgrade'}
                  tone="gold"
                  disabled={level >= b.maxLevel}
                  onPress={() => upgrade(b.id)}
                  style={{ marginTop: 10 }}
                />
              )}
            </Bubble>
          );
        })}
      </ScrollView>
      <Toast message={lastMessage} />
    </Shell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontFamily: fonts.display, fontSize: 32, color: colors.ink },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    marginBottom: 12,
  },
  emoji: { fontSize: 36, marginBottom: 4 },
  name: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.ink },
  blurb: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, marginTop: 4 },
  meta: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.meadowDeep, marginTop: 6 },
  cost: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.inkSoft, marginTop: 6 },
});
