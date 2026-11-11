import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { Rundown } from '../types';
import { mockRundowns } from '../data/mockRundowns';

interface RundownListScreenProps {
  onBack: () => void;
  onOpenRundown: (rundown: Rundown) => void;
  onCreateRundown: () => void;
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
        <Path
          d="M9 7.5L7.5 9L7 8.5"
          stroke={accentColor}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 11.5L7.5 13L7 12.5"
          stroke={accentColor}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function RundownListScreen({
  onBack,
  onOpenRundown,
  onCreateRundown,
}: RundownListScreenProps) {
  const [rundowns] = useState<Rundown[]>(mockRundowns);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = rundowns.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isEmpty = rundowns.length === 0;

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
          <Text style={styles.headerTitle}>Rundown Maker</Text>
          <Text style={styles.headerSub}>
            {isEmpty
              ? 'Organization A'
              : `Organization A · ${rundowns.length} saved rundowns`}
          </Text>
        </View>
        <TouchableOpacity style={styles.filterBtn} hitSlop={10}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M4 6h16M7 12h10M10 18h4"
              stroke={colors.text}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
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
            placeholder="Search rundowns"
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

      {isEmpty ? (
        /* ── EMPTY STATE ── */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <View style={styles.emptyDocBg} />
            <View style={styles.emptyDoc}>
              <Svg width={44} height={44} viewBox="0 0 48 48">
                <Rect x="6" y="4" width="36" height="40" rx="5" fill="#EEEAFF" stroke={colors.primary} strokeWidth={2} />
                <Path d="M14 16h8M14 22h20M14 28h20M14 34h14" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
                <Path d="M22 12l2-2 2 2" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d="M22 12l2 3 2-3" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </View>
          </View>
          <Text style={styles.emptyTitle}>Plan the day, together</Text>
          <Text style={styles.emptySubtitle}>
            Create a clear, timed agenda so every{'\n'}committee member knows what happens next.
          </Text>
          <TouchableOpacity style={styles.createFirstBtn} onPress={onCreateRundown} activeOpacity={0.85}>
            <Text style={styles.createFirstBtnText}>+ Create Your First Rundown</Text>
          </TouchableOpacity>
          <Text style={styles.calendarHint}>You can also attach a rundown from Calendar.</Text>
        </View>
      ) : (
        /* ── LIST STATE ── */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Create New Button */}
          <TouchableOpacity style={styles.createNewBtn} onPress={onCreateRundown} activeOpacity={0.85}>
            <Text style={styles.createNewBtnText}>+ Create New Rundown</Text>
          </TouchableOpacity>

          {/* List Section */}
          <View style={styles.listSection}>
            <Text style={styles.listSectionTitle}>Your rundowns</Text>
            <TouchableOpacity hitSlop={8}>
              <Text style={styles.recentlyUpdated}>Recently updated</Text>
            </TouchableOpacity>
          </View>

          {filtered.map((rundown) => (
            <TouchableOpacity
              key={rundown.id}
              style={styles.rundownCard}
              onPress={() => onOpenRundown(rundown)}
              activeOpacity={0.85}
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

              {/* Three-dot menu */}
              <TouchableOpacity style={styles.dotMenu} hitSlop={10}>
                <Text style={styles.dotMenuText}>⋮</Text>
              </TouchableOpacity>

              <Svg width={14} height={14} viewBox="0 0 20 20">
                <Path d="M7 4L13 10L7 16" fill="none" stroke="#C0C3D4" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  headerCenter: {
    flex: 1,
  },
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
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#ECEEF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
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

  /* ── EMPTY ── */
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 40,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyDocBg: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EEEAFF',
    opacity: 0.4,
  },
  emptyDoc: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  createFirstBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  createFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  calendarHint: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },

  /* ── LIST ── */
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
  },
  createNewBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 4,
  },
  createNewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  listSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  recentlyUpdated: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  rundownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rdIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
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
  dotMenu: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  dotMenuText: {
    fontSize: 18,
    color: colors.muted,
    lineHeight: 20,
  },
});
