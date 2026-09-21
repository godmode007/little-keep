import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { colors } from '../theme/theme';

const SIZE = 128;
const KNOB = 52;
const MAX = 38;

type Props = {
  onVector: (x: number, y: number) => void;
};

export function Joystick({ onVector }: Props) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const vecRef = useRef(onVector);
  vecRef.current = onVector;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setKnob({ x: 0, y: 0 });
        },
        onPanResponderMove: (_, g) => {
          const mag = Math.hypot(g.dx, g.dy) || 1;
          const scale = Math.min(1, MAX / mag);
          const x = g.dx * scale;
          const y = g.dy * scale;
          setKnob({ x, y });
          vecRef.current(x / MAX, y / MAX);
        },
        onPanResponderRelease: () => {
          setKnob({ x: 0, y: 0 });
          vecRef.current(0, 0);
        },
        onPanResponderTerminate: () => {
          setKnob({ x: 0, y: 0 });
          vecRef.current(0, 0);
        },
      }),
    []
  );

  return (
    <View style={styles.base} {...pan.panHandlers}>
      <View
        style={[
          styles.knob,
          { transform: [{ translateX: knob.x }, { translateY: knob.y }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: 'rgba(43, 58, 66, 0.28)',
    borderWidth: 3,
    borderColor: 'rgba(255, 248, 232, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.gold,
    borderWidth: 3,
    borderColor: colors.goldDeep,
  },
});
