import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeepField } from '../../src/components/KeepField';
import { Shell } from '../../src/components/Shell';
import { Toast } from '../../src/components/Toast';
import { TopBar } from '../../src/components/TopBar';
import { useKidsStore } from '../../src/store/kidsStore';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const lastMessage = useKidsStore((s) => s.lastMessage);

  return (
    <Shell>
      <View style={{ paddingTop: insets.top + 8 }}>
        <TopBar />
      </View>
      <KeepField />
      <Toast message={lastMessage} />
    </Shell>
  );
}
