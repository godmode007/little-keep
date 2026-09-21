import { StyleSheet, Text, View } from 'react-native';
import { campaignComplete, currentLevel } from '../game/progress';
import { useKidsStore } from '../store/kidsStore';
import { colors, fonts } from '../theme/theme';

export function TopBar() {
  const resources = useKidsStore((s) => s.resources);
  const carryingWood = useKidsStore((s) => s.carryingWood);
  const carryingCoins = useKidsStore((s) => s.carryingCoins);
  const name = useKidsStore((s) => s.playerName);
  const questsDone = useKidsStore((s) => s.questsDone);
  const recruited = useKidsStore((s) => s.recruited);
  const buildingLevels = useKidsStore((s) => s.buildingLevels);
  const snap = { questsDone, recruited, buildingLevels };
  const level = currentLevel(snap);
  const done = campaignComplete(snap);

  return (
    <View style={styles.wrap}>
      <Text style={styles.hello}>Hi, {name}!</Text>
      <Text style={styles.chapter}>
        {done ? 'Star Fair is done. The keep is yours.' : `Level ${level.n} · ${level.name}`}
      </Text>
      <View style={styles.row}>
        <Text style={styles.pill}>🍎 {Math.floor(resources.food)}</Text>
        <Text style={styles.pill}>
          🪵 {Math.floor(resources.wood)}
          {carryingWood ? `+${carryingWood}` : ''}
        </Text>
        <Text style={styles.pill}>
          🪙 {Math.floor(resources.coins ?? 0)}
          {carryingCoins ? `+${carryingCoins}` : ''}
        </Text>
        <Text style={styles.pill}>⭐ {Math.floor(resources.stars)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  hello: {
    fontFamily: fonts.displaySemi,
    fontSize: 22,
    color: colors.ink,
    marginBottom: 2,
  },
  chapter: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    backgroundColor: colors.panel,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
    overflow: 'hidden',
  },
});
