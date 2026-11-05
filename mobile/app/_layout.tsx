import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../constants/theme';
import { ElioConnectionProvider } from '../context/ElioConnection';
import { LanguageProvider, useLanguage } from '../context/Language';

type Page =
  | '/'
  | '/robot'
  | '/monitor'
  | '/code'
  | '/assistant'
  | '/learn'
  | '/emotions'
  | '/projects'
  | '/settings';

type MenuItem = {
  path: Page;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  ro: string;
  en: string;
  descriptionRo: string;
  descriptionEn: string;
};

const groups: { ro: string; en: string; items: MenuItem[] }[] = [
  {
    ro: 'ACASĂ', en: 'HOME',
    items: [
      { path: '/', icon: 'home-outline', ro: 'Acasă', en: 'Home', descriptionRo: 'Prezentare ELIO', descriptionEn: 'ELIO overview' },
    ],
  },
  {
    ro: 'ROBOT', en: 'ROBOT',
    items: [
      { path: '/robot', icon: 'game-controller-outline', ro: 'Controler', en: 'Controller', descriptionRo: 'Direcție și oprire', descriptionEn: 'Steering and stop' },
      { path: '/monitor', icon: 'speedometer-outline', ro: 'Viteză și senzori', en: 'Speed & sensors', descriptionRo: 'Viteză, distanță și stare', descriptionEn: 'Speed, distance and status' },
      { path: '/code', icon: 'code-slash-outline', ro: 'Blocuri de cod', en: 'Code blocks', descriptionRo: 'Programează-l pe ELIO', descriptionEn: 'Program ELIO' },
    ],
  },
  {
    ro: 'DESCOPERĂ', en: 'EXPLORE',
    items: [
      { path: '/assistant', icon: 'chatbubble-ellipses-outline', ro: 'Asistent', en: 'Assistant', descriptionRo: 'Discută cu ELIO', descriptionEn: 'Chat with ELIO' },
      { path: '/learn', icon: 'school-outline', ro: 'Învață', en: 'Learn', descriptionRo: 'Activități educative', descriptionEn: 'Learning activities' },
      { path: '/emotions', icon: 'happy-outline', ro: 'Emoții', en: 'Emotions', descriptionRo: 'Expresiile robotului', descriptionEn: 'Robot expressions' },
      { path: '/projects', icon: 'folder-open-outline', ro: 'Proiecte', en: 'Projects', descriptionRo: 'Idei și proiecte', descriptionEn: 'Ideas and projects' },
    ],
  },
  {
    ro: 'APLICAȚIE', en: 'APP',
    items: [
      { path: '/settings', icon: 'settings-outline', ro: 'Setări', en: 'Settings', descriptionRo: 'Limbă și preferințe', descriptionEn: 'Language and preferences' },
    ],
  },
];

function Navigation() {
  const { language } = useLanguage();
  const [menuVisible, setMenuVisible] = useState(false);
  const pathname = usePathname();
  const romanian = language === 'ro';

  const navigate = (path: Page) => {
    setMenuVisible(false);
    if (pathname !== path) router.navigate(path);
  };

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="robot" />
        <Tabs.Screen name="monitor" />
        <Tabs.Screen name="code" />
        <Tabs.Screen name="assistant" />
        <Tabs.Screen name="learn" />
        <Tabs.Screen name="emotions" />
        <Tabs.Screen name="projects" />
        <Tabs.Screen name="settings" />
      </Tabs>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={romanian ? 'Deschide meniul' : 'Open menu'}
        onPress={() => setMenuVisible(true)}
        style={[styles.menuButton, { top: (StatusBar.currentHeight ?? 26) + 10 }]}
      >
        <Ionicons name="menu" color="#FFFFFF" size={24} />
        <Text style={styles.menuButtonText}>{romanian ? 'Meniu' : 'Menu'}</Text>
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setMenuVisible(false)}
            accessibilityLabel={romanian ? 'Închide meniul' : 'Close menu'}
          />
          <View style={styles.panel}>
            <View style={styles.heading}>
              <View>
                <Text style={styles.brand}>ELIO</Text>
                <Text style={styles.subtitle}>
                  {romanian ? 'Unde vrei să mergi?' : 'Where would you like to go?'}
                </Text>
              </View>
              <Pressable
                onPress={() => setMenuVisible(false)}
                accessibilityRole="button"
                accessibilityLabel={romanian ? 'Închide meniul' : 'Close menu'}
                style={styles.closeButton}
              >
                <Ionicons name="close" color={C.text} size={23} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {groups.map((group) => (
                <View key={group.en} style={styles.group}>
                  <Text style={styles.groupTitle}>{romanian ? group.ro : group.en}</Text>
                  {group.items.map((item) => {
                    const selected = pathname === item.path;
                    return (
                      <Pressable
                        key={item.path}
                        accessibilityRole="button"
                        onPress={() => navigate(item.path)}
                        style={[styles.item, selected && styles.itemActive]}
                      >
                        <View style={[styles.iconBox, selected && styles.iconBoxActive]}>
                          <Ionicons name={item.icon} size={22} color={selected ? C.accent : C.text} />
                        </View>
                        <View style={styles.itemText}>
                          <Text style={[styles.itemTitle, selected && styles.itemTitleActive]}>
                            {romanian ? item.ro : item.en}
                          </Text>
                          <Text style={styles.itemDescription}>
                            {romanian ? item.descriptionRo : item.descriptionEn}
                          </Text>
                        </View>
                        {selected && <Ionicons name="checkmark-circle" size={20} color={C.accent} />}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function Layout() {
  return (
    <LanguageProvider>
      <ElioConnectionProvider>
        <Navigation />
      </ElioConnectionProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  menuButton: {
    position: 'absolute', right: 14, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#172840', paddingHorizontal: 15, paddingVertical: 11,
    borderRadius: 18, borderWidth: 1, borderColor: C.line,
    elevation: 6,
  },
  menuButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  modalRoot: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  panel: {
    width: '88%', maxWidth: 400, height: '100%',
    backgroundColor: '#101A2D', borderLeftWidth: 1, borderLeftColor: C.line,
    paddingTop: (StatusBar.currentHeight ?? 26) + 17,
    paddingHorizontal: 18,
  },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  brand: { color: C.accent, fontSize: 27, fontWeight: '900', letterSpacing: 2 },
  subtitle: { color: C.muted, fontSize: 13, marginTop: 3 },
  closeButton: { padding: 9, backgroundColor: '#1D2C43', borderRadius: 14 },
  scrollContent: { paddingBottom: 40, gap: 19 },
  group: { gap: 6 },
  groupTitle: { color: C.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.3, marginBottom: 5 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 10, borderRadius: 16,
    minHeight: 66,
  },
  itemActive: { backgroundColor: '#1D3045', borderWidth: 1, borderColor: C.accent },
  iconBox: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1D2C43' },
  iconBoxActive: { backgroundColor: '#163E47' },
  itemText: { flex: 1 },
  itemTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  itemTitleActive: { color: C.accent },
  itemDescription: { color: C.muted, fontSize: 12, marginTop: 3 },
});
