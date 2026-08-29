import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme/theme';

export function Shell({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#8ED2EA', '#B8E0A8', '#FFE9A8']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.inner, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sky },
  inner: { flex: 1 },
});
