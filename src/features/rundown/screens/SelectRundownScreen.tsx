import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { Rundown } from '../types';
import { mockRundowns } from '../data/mockRundowns';

interface SelectRundownScreenProps {
  /** Name of the event we are attaching to */
  eventTitle?: string;
  onBack: () => void;
  onAttach: (selected: Rundown[]) => void;
}

function RundownIcon({ accentColor = '#6C63FF' }: { accentColor?: string }) {
  return (
    <View style={[styles.rdIcon, { backgroundColor: accentColor + '1A' }]}>
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Rect x="3" y="3" width="18" height="18" rx="4" stroke={accentColor} strokeWidth={2} fill="none" />
        <Path
          d="M7 8h3M7 12h3M7 16h3M13 8h4M13 12h4M13 16h4"
          stroke={accentColor}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

export function SelectRundownScreen({
  eventTitle = 'Volunteer Appreciation Night',
  onBack,
  onAttach,
}: SelectRundownScreenProps) {
  const [rundowns] = useState<Rundown[]>(mockRundowns);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([mockRundowns[0].id]);

  const filtered = rundowns.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedRundowns = rundowns.filter((r) => selectedIds.includes(r.id));

  // Estimate total duration (mock: 2h30m for first selected, else proportional)
  const totalDuration = selectedIds.length > 0 ? '2 hr 30 min' : '—';

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={10}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M15 18L9 12L15 6"
              fill="none"
              stroke={colors.text}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Select Rundown</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            Attach one to {eventTitle}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.searchIcon}>
            <Path
              d="M21 21L16.5 16.5M19 11A8 8 0 1 1 3 11a8 8 0 0 1 16 0Z"
              stroke={colors.muted}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search saved rundowns"
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterSmallBtn} hitSlop={8}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d="M4 6h16M7 12h10M10 18h4"
              stroke={colors.primary}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Create New shortcut */}
      <View style={styles.createRow}>
        <TouchableOpacity style={styles.createNewBtn} activeOpacity={0.85}>
          <Text style={styles.createNewBtnText}>+ Create New Rundown</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved rundowns</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{rundowns.length} AVAILABLE</Text>
          </View>
        </View>

        {filtered.map((rundown) => {
          const isSelected = selectedIds.includes(rundown.id);
          return (
            <TouchableOpacity
              key={rundown.id}
              style={[styles.rundownCard, isSelected && styles.rundownCardSelected]}
              onPress={() => toggleSelect(rundown.id)}
              activeOpacity={0.8}
            >
              <RundownIcon accentColor={rundown.accentColor} />

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{rundown.title}</Text>
                <View style={styles.cardMeta}>
                  <Svg width={12} height={12} viewBox="0 0 24 24" style={{ marginRight: 4 }}>
                    <Rect x="3" y="4" width="18" height="18" rx="3" stroke={colors.muted} strokeWidth={2} fill="none" />
                    <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                  <Text style={styles.cardDate}>{rundown.eventDate}</Text>
                </View>
                <Text style={styles.cardUpdated}>
                  Updated {rundown.updatedLabel}
                  {'  ·  '}
                  <Text style={styles.cardItemCount}>{rundown.itemCount} items</Text>
                </Text>
              </View>

              {/* Radio / Checkmark */}
              {isSelected ? (
                <View style={styles.radioActive}>
                  <Svg width={14} height={14} viewBox="0 0 20 20">
                    <Path
                      d="M4 10.5L8 14.5L16 6.5"
                      stroke="#FFFFFF"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </Svg>
                </View>
              ) : (
                <View style={styles.radioInactive} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer Bar */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerCount}>
            {selectedIds.length} rundown{selectedIds.length !== 1 ? 's' : ''} selected
          </Text>
          <Text style={styles.footerDuration}>{totalDuration}</Text>
        </View>
        <TouchableOpacity
          style={[styles.attachBtn, selectedIds.length === 0 && styles.attachBtnDisabled]}
          onPress={() => selectedIds.length > 0 && onAttach(selectedRundowns)}
          activeOpacity={0.85}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" style={{ marginRight: 8 }}>
            <Path
              d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
          <Text style={styles.attachBtnText}>Attach Rundown</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F5FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#F4F5FB',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#ECEEF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 0,
    outlineWidth: 0,
  },
  filterSmallBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  createNewBtn: {
    backgroundColor: '#EEEAFF',
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createNewBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  countBadge: {
    backgroundColor: '#FFF0E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E97C2B',
    letterSpacing: 0.5,
  },
  rundownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#ECEEF7',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rundownCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  rdIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  cardDate: {
    fontSize: 11,
    color: colors.muted,
  },
  cardUpdated: {
    fontSize: 11,
    color: colors.muted,
  },
  cardItemCount: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  radioActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D2D6E2',
    backgroundColor: 'transparent',
  },

  /* ── FOOTER ── */
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEFF5',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 12,
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCount: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  footerDuration: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  attachBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  attachBtnDisabled: {
    opacity: 0.4,
  },
  attachBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
