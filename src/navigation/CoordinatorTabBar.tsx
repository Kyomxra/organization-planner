import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

export type CoordinatorTab = 'coordinator-home' | 'coordinator-tasks' | 'coordinator-members' | 'calendar' | 'notes-list' | 'notifications' | 'profile';

interface CoordinatorTabBarProps {
  active: CoordinatorTab;
  onSelect: (tab: CoordinatorTab) => void;
}

const tabs: Array<{ id: CoordinatorTab; label: string }> = [
  { id: 'coordinator-home', label: 'Home' },
  { id: 'coordinator-tasks', label: 'Tasks' },
  { id: 'coordinator-members', label: 'Members' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'notes-list', label: 'Notes' },
  { id: 'notifications', label: 'Updates' },
  { id: 'profile', label: 'Profile' },
];

export function CoordinatorTabBar({ active, onSelect }: CoordinatorTabBarProps) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => (
        <TouchableOpacity key={tab.id} style={styles.item} onPress={() => onSelect(tab.id)}>
          <View style={[styles.indicator, active === tab.id && styles.indicatorActive]} />
          <Text style={[styles.label, active === tab.id && styles.labelActive]} numberOfLines={1}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 8 },
  item: { flex: 1, alignItems: 'center', gap: 5, minWidth: 0 },
  indicator: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D5D6E0' },
  indicatorActive: { width: 18, backgroundColor: colors.primary },
  label: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  labelActive: { color: colors.primary },
});
