import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SIDEBAR_WIDTH } from '../hooks/useResponsive';

interface NavItem {
  name: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const navItems: NavItem[] = [
  { name: 'feed', path: '/(tabs)/feed', icon: 'home', label: 'Feed' },
  { name: 'challenges', path: '/(tabs)/challenges', icon: 'flash', label: 'Challenges' },
  { name: 'camera', path: '/(tabs)/camera', icon: 'camera', label: 'Camera' },
  { name: 'leaderboard', path: '/(tabs)/leaderboard', icon: 'trophy', label: 'Ranking' },
  { name: 'profile', path: '/(tabs)/profile', icon: 'person', label: 'Profile' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (path: string) => pathname.includes(path.split('/').pop() || '');

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Ionicons name="camera" size={28} color="#fff" />
        </View>
        <Text style={styles.logoText}>Foto Fight</Text>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          const hovered = hoveredItem === item.name;
          const isCamera = item.name === 'camera';

          return (
            <Pressable
              key={item.name}
              style={[
                styles.navItem,
                active && styles.navItemActive,
                hovered && !active && styles.navItemHovered,
                isCamera && styles.cameraNavItem,
              ]}
              onPress={() => router.push(item.path as any)}
              onHoverIn={() => setHoveredItem(item.name)}
              onHoverOut={() => setHoveredItem(null)}
            >
              <View style={[
                styles.iconContainer,
                isCamera && styles.cameraIconContainer,
              ]}>
                <Ionicons
                  name={item.icon}
                  size={isCamera ? 24 : 22}
                  color={isCamera ? '#fff' : active ? '#000' : hovered ? '#000' : '#666'}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  active && styles.navLabelActive,
                  hovered && !active && styles.navLabelHovered,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Foto Fight</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    paddingVertical: 20,
    height: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#262626',
  },
  nav: {
    flex: 1,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: '#f0f0f0',
  },
  navItemHovered: {
    backgroundColor: '#f5f5f5',
  },
  cameraNavItem: {
    marginTop: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cameraIconContainer: {
    backgroundColor: '#000',
    borderRadius: 20,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  navLabelActive: {
    color: '#000',
    fontWeight: '600',
  },
  navLabelHovered: {
    color: '#000',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
