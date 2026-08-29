import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BigButton } from '../../src/components/BigButton';
import { Bubble } from '../../src/components/Bubble';
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

  return (
    <Shell>
      <View style={{ paddingTop: insets.top + 8 }}>
        <TopBar />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Hero Friends</Text>
        <Text style={styles.sub}>Party power: {partyPower(recruited)}</Text>

        {HEROES.map((h) => {
          const inParty = recruited.includes(h.id);
          const cost = Object.entries(h.recruitCost)
            .map(([k, v]) => `${v} ${k}`)
            .join(' · ');
          return (
            <Bubble key={h.id}>
              <Text style={styles.emoji}>{h.emoji}</Text>
              <Text style={styles.name}>
                {h.name} {h.title}
              </Text>
              <Text style={styles.blurb}>{h.blurb}</Text>
              <Text style={styles.meta}>Power {h.power}</Text>
              {inParty ? (
                <Text style={styles.joined}>In your party!</Text>
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
    marginBottom: 12,
  },
  emoji: { fontSize: 40, marginBottom: 4 },
  name: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.ink },
  blurb: { fontFamily: fonts.body, fontSize: 15, color: colors.ink, marginTop: 4 },
  meta: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.lilac, marginTop: 6 },
  cost: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.inkSoft, marginTop: 6 },
  joined: {
    marginTop: 10,
    fontFamily: fonts.displayMed,
    fontSize: 16,
    color: colors.meadowDeep,
  },
});
