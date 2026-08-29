import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BigButton } from '../../src/components/BigButton';
import { Bubble } from '../../src/components/Bubble';
import { Shell } from '../../src/components/Shell';
import { Toast } from '../../src/components/Toast';
import { TopBar } from '../../src/components/TopBar';
import { GOALS } from '../../src/data/catalog';
import { partyPower, useKidsStore } from '../../src/store/kidsStore';
import { colors, fonts } from '../../src/theme/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const collect = useKidsStore((s) => s.collect);
  const resources = useKidsStore((s) => s.resources);
  const buildingLevels = useKidsStore((s) => s.buildingLevels);
  const recruited = useKidsStore((s) => s.recruited);
  const questsDone = useKidsStore((s) => s.questsDone);
  const lastMessage = useKidsStore((s) => s.lastMessage);
  const setMsg = useKidsStore((s) => s.lastMessage);

  const goals = useMemo(
    () =>
      GOALS.map((g) => ({
        ...g,
        done: g.check({
          castleLevel: buildingLevels.castle,
          heroes: recruited,
          questsDone,
          stars: resources.stars,
        }),
      })),
    [buildingLevels.castle, recruited, questsDone, resources.stars]
  );

  const doneCount = goals.filter((g) => g.done).length;

  return (
    <Shell>
      <View style={{ paddingTop: insets.top + 8 }}>
        <TopBar />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heroTitle}>Your Little Keep</Text>
        <Text style={styles.sub}>
          Castle {buildingLevels.castle} · Power {partyPower(recruited)} · Goals {doneCount}/
          {goals.length}
        </Text>

        <Bubble>
          <Text style={styles.bigEmoji}>🏰</Text>
          <Text style={styles.tip}>
            Tap Collect to gather food and wood. Then build, recruit friends, and finish quests!
          </Text>
          <BigButton
            label="Collect Supplies"
            tone="green"
            onPress={() => collect()}
            style={{ marginTop: 12 }}
          />
        </Bubble>

        <Bubble title="Star Goals">
          {goals.map((g) => (
            <Text key={g.id} style={[styles.goal, g.done && styles.goalDone]}>
              {g.done ? '✅' : '⭐'} {g.label}
            </Text>
          ))}
        </Bubble>

        {setMsg ? <Text style={styles.hint}>Last: {setMsg}</Text> : null}
      </ScrollView>
      <Toast message={lastMessage} />
    </Shell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.ink,
  },
  sub: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.inkSoft,
    marginBottom: 14,
    marginTop: 4,
  },
  bigEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  tip: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
    textAlign: 'center',
  },
  goal: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 8,
  },
  goalDone: { color: colors.meadowDeep },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
