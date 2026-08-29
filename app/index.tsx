import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BigButton } from '../src/components/BigButton';
import { useKidsStore } from '../src/store/kidsStore';
import { colors, fonts } from '../src/theme/theme';

export default function TitleScreen() {
  const insets = useSafeAreaInsets();
  const started = useKidsStore((s) => s.started);
  const startGame = useKidsStore((s) => s.startGame);
  const reset = useKidsStore((s) => s.reset);
  const [name, setName] = useState('');
  const [bounce] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  if (started) return <Redirect href="/(tabs)/home" />;

  const y = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#7EC8E3', '#A8E0B0', '#FFE29A']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
      >
        <Animated.Text style={[styles.castle, { transform: [{ translateY: y }] }]}>🏰</Animated.Text>
        <Text style={styles.brand}>Little Keep</Text>
        <Text style={styles.tag}>A cozy castle adventure for kids</Text>
        <Text style={styles.lead}>
          Collect food and wood, make hero friends, and finish fun quests to earn stars!
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>What is your ruler name?</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Sam"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            maxLength={16}
            autoCapitalize="words"
          />
          <BigButton
            label="Start Playing!"
            tone="gold"
            onPress={() => {
              startGame(name);
              router.replace('/(tabs)/home');
            }}
          />
          <BigButton label="Clear Save" tone="soft" onPress={reset} style={{ marginTop: 10 }} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  castle: { fontSize: 72, textAlign: 'center' },
  brand: {
    fontFamily: fonts.display,
    fontSize: 44,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 4,
  },
  tag: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 6,
  },
  lead: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 24,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 18,
  },
  form: { gap: 8 },
  label: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  input: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 8,
  },
});
