import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BigButton } from '../../src/components/BigButton';
import { Bubble } from '../../src/components/Bubble';
import { HeroPortrait } from '../../src/components/HeroPortrait';
import { Shell } from '../../src/components/Shell';
import { Toast } from '../../src/components/Toast';
import { TopBar } from '../../src/components/TopBar';
import { HEROES } from '../../src/data/catalog';
import { partyPower, useKidsStore } from '../../src/store/kidsStore';
import { colors, fonts } from '../../src/theme/theme';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const recruited = useKidsStore((s) => s.recruited);
  const recruit = useKidsStore((s) => s.recruit);
  const lastMessage = useKidsStore((s) => s.lastMessage);
  const inPartyCount = recruited.length;

  return (
    <Shell>
      <View style={{ paddingTop: insets.top + 8 }}>
        <TopBar />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Hero Friends</Text>
        <Text style={styles.sub}>
          Party {inPartyCount}/4 · Power {partyPower(recruited)}
        </Text>
        <Text style={styles.hint}>
          Pip is human. Mira is a wood elf. Blink is a fairy wizard. Nana is a high elf cleric.
        </Text>

        {HEROES.map((h) => {
          const inParty = recruited.includes(h.id);
          const cost = Object.entries(h.recruitCost)
            .map(([k, v]) => `${v} ${k}`)
            .join(' · ');
          return (
            <Bubble key={h.id} style={inParty ? styles.joinedCard : undefined}>
              <View style={styles.row}>
                <HeroPortrait id={h.id} size={96} selected={inParty} />
                <View style={styles.copy}>
                  <Text style={styles.name}>
                    {h.name} {h.title}
                  </Text>
                  <Text style={styles.race}>
                    {h.race} · {h.role}
                  </Text>
                  <Text style={styles.blurb}>{inParty ? h.presence : h.blurb}</Text>
                  <Text style={styles.meta}>Power {h.power}</Text>
                </View>
              </View>
              {inParty ? (
                <Text style={styles.joined}>On the lawn with you</Text>
              ) : (
                <>
                  <Text style={styles.cost}>{cost || 'Free friend'}</Text>
                  <BigButton
                    label={`Recruit ${h.name}`}
                    tone="coral"
                    onPress={() => recruit(h.id)}
                    style={{ marginTop: 10 }}
                  />
                </>
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
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
    marginBottom: 14,
  },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  copy: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.ink },
  race: { fontFamily: fonts.displayMed, fontSize: 14, color: colors.meadowDeep },
  blurb: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, marginTop: 4 },
  meta: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.inkSoft, marginTop: 6 },
  cost: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.inkSoft, marginTop: 10 },
  joined: {
    marginTop: 12,
    fontFamily: fonts.displayMed,
    fontSize: 16,
    color: colors.meadowDeep,
  },
  joinedCard: {
    borderColor: 'rgba(62, 154, 74, 0.35)',
    backgroundColor: 'rgba(255, 248, 232, 0.98)',
  },
});
