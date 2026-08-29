import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts } from '../theme/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'gold' | 'green' | 'coral' | 'soft';
  style?: ViewStyle;
};

export function BigButton({ label, onPress, disabled, tone = 'gold', style }: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        tone === 'gold' && styles.gold,
        tone === 'green' && styles.green,
        tone === 'coral' && styles.coral,
        tone === 'soft' && styles.soft,
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 3,
  },
  gold: { backgroundColor: colors.gold, borderColor: colors.goldDeep },
  green: { backgroundColor: colors.meadow, borderColor: colors.meadowDeep },
  coral: { backgroundColor: colors.coral, borderColor: '#D45A3C' },
  soft: { backgroundColor: colors.white, borderColor: colors.border },
  label: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    color: colors.ink,
  },
});
