import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

export type OrganizationTab = 'home' | 'calendar' | 'divisions';

interface OrganizationBottomTabBarProps {
  activeTab: OrganizationTab;
  onSelect: (tab: OrganizationTab) => void;
}

const tabs: Array<{ id: OrganizationTab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'divisions', label: 'Divisions' },
];

export function OrganizationBottomTabBar({
  activeTab,
  onSelect,
}: OrganizationBottomTabBarProps) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const stroke = isActive ? colors.primary : colors.muted;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onSelect(tab.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              {tab.id === 'calendar' && (
                <>
                  <Rect x="3" y="4" width="18" height="18" rx="3" stroke={stroke} strokeWidth={1.8} fill="none" />
                  <Path d="M16 2V6M8 2V6M3 10H21" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
                </>
              )}
              {tab.id === 'home' && (
                <>
                  <Path d="M3 10.5L12 3L21 10.5V20C21 20.6 20.6 21 20 21H4C3.4 21 3 20.6 3 20V10.5Z" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" />
                  <Path d="M9 21V12H15V21" fill="none" stroke={stroke} strokeWidth={1.8} />
                </>
              )}
              {tab.id === 'divisions' && (
                <>
                  <Circle cx="9" cy="7" r="4" stroke={stroke} strokeWidth={1.8} fill="none" />
                  <Path d="M2 19C2 15.5 5 13.5 9 13.5C13 13.5 16 15.5 16 19" stroke={stroke} strokeWidth={1.8} fill="none" strokeLinecap="round" />
                  <Circle cx="18" cy="8" r="3" stroke={stroke} strokeWidth={1.6} fill="none" />
                  <Path d="M17 14C19 14.5 21 15.5 21 18" stroke={stroke} strokeWidth={1.6} fill="none" strokeLinecap="round" />
                </>
              )}
            </Svg>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: colors.primarySoft,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    marginTop: 3,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
