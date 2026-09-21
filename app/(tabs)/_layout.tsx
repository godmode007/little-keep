import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { colors, fonts } from '../../src/theme/theme';

const TINT = {
  home: colors.skyDeep,
  build: colors.goldDeep,
  friends: colors.meadowDeep,
  quests: colors.coral,
} as const;

function TabMark({ tone, focused }: { tone: keyof typeof TINT; focused: boolean }) {
  return (
    <View
      style={[
        styles.mark,
        {
          backgroundColor: focused ? TINT[tone] : 'rgba(43, 58, 66, 0.18)',
          borderColor: focused ? colors.ink : colors.border,
        },
      ]}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabMark tone="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="build"
        options={{
          title: 'Build',
          tabBarIcon: ({ focused }) => <TabMark tone="build" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ focused }) => <TabMark tone="friends" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          title: 'Quests',
          tabBarIcon: ({ focused }) => <TabMark tone="quests" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.cream,
    borderTopColor: colors.border,
    borderTopWidth: 2,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 12 },
  mark: {
    width: 22,
    height: 10,
    borderRadius: 6,
    borderWidth: 2,
  },
});
