import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts } from '../theme/theme';

export function Bubble({
  title,
  children,
  style,
}: PropsWithChildren<{ title?: string; style?: ViewStyle }>) {
  return (
    <View style={[styles.box, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.panel,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  title: {
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 6,
  },
});
