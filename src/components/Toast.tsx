import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/theme';

export function Toast({ message }: { message: string | null }) {
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    setShown(message);
    const t = setTimeout(() => setShown(null), 2500);
    return () => clearTimeout(t);
  }, [message]);

  if (!shown) return null;
  return (
    <View style={styles.toast}>
      <Text style={styles.text}>{shown}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
    zIndex: 40,
    backgroundColor: colors.ink,
    borderRadius: 16,
    padding: 14,
  },
  text: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    textAlign: 'center',
  },
});
