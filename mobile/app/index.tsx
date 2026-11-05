import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { C } from '../constants/theme';
import { useLanguage } from '../context/Language';

type Destination = '/' | '/robot' | '/monitor' | '/code' |
  '/assistant' | '/learn' | '/emotions' | '/projects' | '/settings';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Tile = { path: Destination; icon: IconName; ro: string; en: string };

const pages: Tile[] = [
  { path: '/robot', icon: 'game-controller-outline', ro: 'Control', en: 'Control' },
  { path: '/monitor', icon: 'speedometer-outline', ro: 'Senzori', en: 'Sensors' },
  { path: '/code', icon: 'code-slash-outline', ro: 'Blocuri', en: 'Blocks' },
  { path: '/assistant', icon: 'chatbubble-ellipses-outline', ro: 'Asistent', en: 'Assistant' },
  { path: '/learn', icon: 'school-outline', ro: 'Învață', en: 'Learn' },
  { path: '/emotions', icon: 'happy-outline', ro: 'Emoții', en: 'Emotions' },
  { path: '/projects', icon: 'folder-open-outline', ro: 'Proiecte', en: 'Projects' },
  { path: '/settings', icon: 'settings-outline', ro: 'Setări', en: 'Settings' },
];

export default function Home() {
  const { language } = useLanguage();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ro = language === 'ro';

  const availableHeight = height - insets.top - insets.bottom;
  const compact = availableHeight < 700;
  const veryCompact = availableHeight < 575;
  const narrow = width < 350;
  const gap = veryCompact ? 7 : compact ? 9 : 12;
  const iconSize = veryCompact ? 22 : 26;
  const labelSize = narrow ? 12 : 14;

  return (
    <View style={[s.root, {
      paddingTop: insets.top + 5,
      paddingBottom: insets.bottom + 9,
      paddingHorizontal: narrow ? 13 : 18,
    }]}>
      {/* Leave free space on the right for the global Menu button in _layout.tsx */}
      <View style={[s.header, { height: veryCompact ? 42 : 52 }]}>
        <Image
          source={require('../assets/tales-tech-logo.png')}
          resizeMode="contain"
          style={{ width: narrow ? 105 : 122, height: veryCompact ? 35 : 43 }}
        />
      </View>

      <View style={[s.greeting, {
        marginTop: gap,
        padding: veryCompact ? 11 : 15,
      }]}>
        <View style={s.greetingCopy}>
          <Text
            style={[s.hello, { fontSize: veryCompact ? 19 : compact ? 22 : 25 }]}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {ro ? 'Salut, sunt ELIO!' : "Hi, I'm ELIO!"}
          </Text>
          <Text style={[s.tagline, { fontSize: veryCompact ? 11 : 13 }]}>
            {ro ? 'Robotul tău pentru învățare' : 'Your learning robot'}
          </Text>
        </View>
        <View style={[s.face, { width: veryCompact ? 55 : 65, height: veryCompact ? 55 : 65, borderRadius: 40 }]}>
          <View style={s.eyes}>
            <View style={s.eye} />
            <View style={s.eye} />
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ro ? 'Deschide senzorii și starea robotului' : 'Open sensors and robot status'}
        onPress={() => router.push('/monitor')}
        style={[s.status, { marginTop: gap, minHeight: veryCompact ? 47 : 56 }]}
      >
        <View style={s.statusLeft}>
          <Ionicons name="radio-outline" color={C.accent} size={veryCompact ? 19 : 22} />
          <Text style={[s.statusText, { fontSize: veryCompact ? 12 : 14 }]}
            numberOfLines={2}>
            {ro ? 'Starea robotului' : 'Robot status'}
          </Text>
        </View>
        <View style={s.statusRight}>
          <Text style={[s.statusHint, { fontSize: veryCompact ? 11 : 12 }]}>
            {ro ? 'Vezi senzori' : 'View sensors'}
          </Text>
          <Ionicons name="chevron-forward" size={17} color={C.accent} />
        </View>
      </Pressable>

      <View style={[s.grid, { marginTop: gap, gap }]}>
        {[0, 1, 2, 3].map(rowIndex => (
          <View key={rowIndex} style={[s.gridRow, { gap }]}>
            {pages.slice(rowIndex * 2, rowIndex * 2 + 2).map(item => (
              <Pressable
                key={item.path}
                accessibilityRole="button"
                accessibilityLabel={ro ? item.ro : item.en}
                onPress={() => router.push(item.path)}
                style={({ pressed }) => [s.tile, pressed && s.tilePressed]}
              >
                <Ionicons name={item.icon} size={iconSize} color={C.accent} />
                <Text
                  style={[s.tileLabel, { fontSize: labelSize }]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {ro ? item.ro : item.en}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 120,
  },
  greeting: {
    backgroundColor: C.card2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 84,
  },
  greetingCopy: {
    flex: 1,
    paddingRight: 10,
  },
  hello: {
    color: C.text,
    fontWeight: '800',
  },
  tagline: {
    color: C.muted,
    marginTop: 5,
    lineHeight: 18,
  },
  face: {
    flexShrink: 0,
    backgroundColor: '#07101E',
    borderWidth: 3,
    borderColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyes: {
    flexDirection: 'row',
    gap: 13,
  },
  eye: {
    backgroundColor: C.accent,
    height: 9,
    width: 9,
    borderRadius: 9,
  },
  status: {
    backgroundColor: C.card,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  statusRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statusText: { color: C.text, fontWeight: '700', flexShrink: 1 },
  statusHint: { color: C.accent, fontWeight: '700' },
  grid: { flex: 1, minHeight: 0 },
  gridRow: { flex: 1, flexDirection: 'row', minHeight: 0 },
  tile: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 5,
    gap: 7,
  },
  tilePressed: { backgroundColor: '#243653' },
  tileLabel: {
    textAlign: 'center',
    color: C.text,
    fontWeight: '700',
    lineHeight: 17,
  },
});
