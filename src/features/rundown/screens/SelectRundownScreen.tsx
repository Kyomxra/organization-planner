import React, { useEffect, useState } from 'react';
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
import { showMessage } from '../../auth/utils/feedback';
import { supabase } from '../../../lib/supabase';

interface SelectRundownScreenProps {
  organizationId: string;
  eventId: string;
  eventTitle: string;
  onBack: () => void;
  onAttach: (selected: Rundown[]) => void;
}

function RundownIcon({ accentColor = colors.primary }: { accentColor?: string }) {
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
  organizationId,
  eventId,
  eventTitle,
  onBack,
  onAttach,
}: SelectRundownScreenProps) {
  const [rundowns, setRundowns] = useState<Rundown[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadRundowns = async () => {
      const { data: rows, error } = await supabase
        .from('rundowns')
        .select('id, title, event_id, updated_at')
        .eq('organization_id', organizationId)
        .or(`event_id.is.null,event_id.eq.${eventId}`)
        .order('updated_at', { ascending: false });
      if (!active) return;
      if (error) {
        showMessage('Could not load rundowns', error.message);
        setIsLoading(false);
        return;
      }

      const ids = (rows ?? []).map((row) => row.id);
      const { data: itemRows, error: itemsError } = ids.length
        ? await supabase.from('rundown_items').select('rundown_id').in('rundown_id', ids)
        : { data: [], error: null };
      if (!active) return;
      if (itemsError) {
        showMessage('Could not load rundown items', itemsError.message);
        setIsLoading(false);
        return;
      }

      const counts = new Map<string, number>();
      for (const item of itemRows ?? []) {
        counts.set(item.rundown_id, (counts.get(item.rundown_id) ?? 0) + 1);
      }
      setRundowns((rows ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        eventDate: row.event_id === eventId ? 'Already linked to this event' : 'Not linked',
        updatedLabel: new Date(row.updated_at).toLocaleDateString(),
        itemCount: counts.get(row.id) ?? 0,
      })));
      setSelectedId((rows ?? []).find((row) => row.event_id === eventId)?.id ?? null);
      setIsLoading(false);
    };
    void loadRundowns().catch((error: unknown) => {
      if (!active) return;
      showMessage(
        'Could not load rundowns',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [eventId, organizationId]);

  const filtered = rundowns.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedRundown = rundowns.find((rundown) => rundown.id === selectedId);

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

        {isLoading ? <Text style={styles.cardDate}>Loading rundowns…</Text> : filtered.length === 0 ? (
          <Text style={styles.cardDate}>No available rundowns. Create one first from Rundown Maker.</Text>
        ) : filtered.map((rundown) => {
          const isSelected = selectedId === rundown.id;
          return (
            <TouchableOpacity
              key={rundown.id}
              style={[styles.rundownCard, isSelected && styles.rundownCardSelected]}
              onPress={() => setSelectedId(isSelected ? null : rundown.id)}
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
                      stroke={colors.surface}
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
            {selectedRundown ? '1 rundown selected' : 'No rundown selected'}
          </Text>
          <Text style={styles.footerDuration}>
            {selectedRundown ? `${selectedRundown.itemCount} agenda items` : '—'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.attachBtn, !selectedRundown && styles.attachBtnDisabled]}
          onPress={() => selectedRundown && onAttach([selectedRundown])}
          disabled={!selectedRundown}
          activeOpacity={0.85}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" style={{ marginRight: 8 }}>
            <Path
              d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
              stroke={colors.surface}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              stroke={colors.surface}
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
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
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  createNewBtn: {
    backgroundColor: colors.primarySoft,
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
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  rundownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
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
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },

  /* ── FOOTER ── */
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
});
