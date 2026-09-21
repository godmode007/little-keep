import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { HERO_ACCENT, HERO_ART } from '../data/heroArt';
import type { HeroId } from '../data/types';
import { colors } from '../theme/theme';

type Props = {
  id: HeroId;
  size?: number;
  /** Soft meadow/sky wash behind the sprite so black PNG edges do not flash. */
  framed?: boolean;
  dimmed?: boolean;
  selected?: boolean;
  style?: ViewStyle;
};

export function HeroPortrait({
  id,
  size = 72,
  framed = true,
  dimmed = false,
  selected = false,
  style,
}: Props) {
  const accent = HERO_ACCENT[id];
  const radius = Math.round(size * 0.28);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: selected ? colors.gold : accent,
          borderWidth: selected ? 3 : 2,
          opacity: dimmed ? 0.4 : 1,
        },
        style,
      ]}
    >
      {framed ? (
        <View
          style={[
            styles.wash,
            {
              borderRadius: radius - 2,
/** Soft cream wash — avoids purple plate flash behind sprites. */
              backgroundColor: 'rgba(255, 248, 232, 0.55)',
            },
          ]}
        />
      ) : null}
      <Image source={HERO_ART[id]} style={{ width: size - 4, height: size - 4 }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wash: {
    ...StyleSheet.absoluteFill,
  },
});
