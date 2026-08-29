import { StyleSheet, Text, View } from 'react-native';
import { useKidsStore } from '../store/kidsStore';
import { colors, fonts } from '../theme/theme';

export function TopBar() {
  const resources = useKidsStore((s) => s.resources);
  const name = useKidsStore((s) => s.playerName);

  return (
    <View style={styles.wrap}>
      <Text style={styles.hello}>Hi, {name}!</Text>
      <View style={styles.row}>
        <Text style={styles.pill}>🍎 {Math.floor(resources.food)}</Text>
        <Text style={styles.pill}>🪵 {Math.floor(resources.wood)}</Text>
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
