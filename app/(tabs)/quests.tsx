import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BigButton } from '../../src/components/BigButton';
import { Bubble } from '../../src/components/Bubble';
import { Shell } from '../../src/components/Shell';
import { Toast } from '../../src/components/Toast';
import { TopBar } from '../../src/components/TopBar';
import { QUESTS } from '../../src/data/catalog';
import { partyPower, useKidsStore } from '../../src/store/kidsStore';
import { colors, fonts } from '../../src/theme/theme';

export default function QuestsScreen() {
  const insets = useSafeAreaInsets();
  const castle = useKidsStore((s) => s.buildingLevels.castle);
  const recruited = useKidsStore((s) => s.recruited);
  const questsDone = useKidsStore((s) => s.questsDone);
  const doQuest = useKidsStore((s) => s.doQuest);
  const reset = useKidsStore((s) => s.reset);
  const lastMessage = useKidsStore((s) => s.lastMessage);
  const power = partyPower(recruited);

  const available = QUESTS.filter((q) => castle >= q.unlockCastle);

  return (
    <Shell>
      <View style={{ paddingTop: insets.top + 8 }}>
        <TopBar />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Quests</Text>
        <Text style={styles.sub}>
          Party power {power}. Shoo trolls and ogres — never slay them. The gate flag on Home opens the next adventure too.
        </Text>

        {available.map((q) => {
          const done = questsDone.includes(q.id);
          const cost = Object.entries(q.cost)
            .map(([k, v]) => `${v} ${k}`)
            .join(' · ');
          const rewardBits = [`${q.rewardStars} stars`];
          if (q.rewardFood) rewardBits.push(`${q.rewardFood} food`);
          if (q.rewardWood) rewardBits.push(`${q.rewardWood} wood`);
          return (
            <Bubble key={q.id} style={done ? styles.doneCard : undefined}>
              <View style={styles.head}>
                <View style={[styles.badge, done && styles.badgeDone]}>
                  <Text style={styles.badgeGlyph}>{q.emoji}</Text>
                </View>
                <View style={styles.copy}>
                  <Text style={styles.name}>{q.name}</Text>
                  <Text style={styles.blurb}>{q.blurb}</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                Needs power {q.powerNeeded} · Costs {cost || 'nothing'} · Reward {rewardBits.join(' · ')}
              </Text>
              {done ? (
                <Text style={styles.done}>Finished — the keep is safer</Text>
              ) : (
                <BigButton
                  label="Go Adventure"
                  tone="green"
                  onPress={() => doQuest(q.id)}
                  style={{ marginTop: 10 }}
                />
              )}
            </Bubble>
          );
        })}

        <BigButton label="Start Over" tone="soft" onPress={reset} style={{ marginTop: 8 }} />
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
    lineHeight: 21,
  },
  head: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(242, 193, 78, 0.28)',
    borderWidth: 2,
    borderColor: colors.goldDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDone: {
    backgroundColor: 'rgba(111, 191, 115, 0.28)',
    borderColor: colors.meadowDeep,
  },
  badgeGlyph: { fontSize: 26 },
  copy: { flex: 1 },
  name: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.ink },
  blurb: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, marginTop: 4 },
  meta: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.inkSoft, marginTop: 10 },
  done: {
    marginTop: 10,
    fontFamily: fonts.displayMed,
    fontSize: 16,
    color: colors.meadowDeep,
  },
  doneCard: {
    borderColor: 'rgba(62, 154, 74, 0.35)',
  },
});
