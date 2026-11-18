import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { showMessage } from '../../auth/utils/feedback';
import { Rundown, RundownItem } from '../types';
import { supabase } from '../../../lib/supabase';

type RundownItemWithAssignee = RundownItem & { assigneeUserId?: string | null };

type RundownItemRow = {
  id: string;
  sort_order: number;
  title: string;
  start_time: string | null;
  duration_minutes: number;
  description: string | null;
  assignee_user_id: string | null;
};

type ProfileRow = { id: string; full_name: string | null };

interface RundownDetailsScreenProps {
  organizationId: string;
  rundown: Rundown | null;
  canEdit?: boolean;
  onBack: () => void;
  onEdit: () => void;
}

export function RundownDetailsScreen({
  organizationId,
  rundown,
  canEdit = true,
  onBack,
  onEdit,
}: RundownDetailsScreenProps) {
  const [items, setItems] = useState<RundownItemWithAssignee[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(rundown));
  const rundownId = rundown?.id;

  useEffect(() => {
    let active = true;
    if (!rundownId) {
      setItems([]);
      setIsLoading(false);
      return () => { active = false; };
    }

    setIsLoading(true);
    const loadItems = async () => {
      const { data, error } = await supabase
        .from('rundown_items')
        .select('id, sort_order, title, start_time, duration_minutes, description, assignee_user_id')
        .eq('organization_id', organizationId)
        .eq('rundown_id', rundownId)
        .order('sort_order');
      if (!active) return;
      if (error) {
        showMessage('Could not load rundown items', error.message);
        setIsLoading(false);
        return;
      }

      const rows = (data ?? []) as unknown as RundownItemRow[];
      const assigneeIds = [...new Set(
        rows.map((row: RundownItemRow) => row.assignee_user_id)
          .filter((id): id is string => Boolean(id)),
      )];

      let profiles: ProfileRow[] = [];
      if (assigneeIds.length > 0) {
        const profileResult = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', assigneeIds);
        if (!active) return;
        if (profileResult.error) {
          showMessage('Could not load rundown assignees', profileResult.error.message);
          setIsLoading(false);
          return;
        }
        profiles = (profileResult.data ?? []) as unknown as ProfileRow[];
      }

      const names = new Map<string, string>(
        profiles.map((profile: ProfileRow): [string, string] => [profile.id, profile.full_name ?? '']),
      );
      setItems(rows.map((row: RundownItemRow) => {
        const assigneeName = row.assignee_user_id
          ? names.get(row.assignee_user_id) ?? ''
          : '';
        return {
          id: row.id,
          stepNumber: row.sort_order,
          title: row.title,
          startTime: row.start_time?.slice(0, 5).replace(':', '.') ?? '—',
          durationMinutes: row.duration_minutes,
          description: row.description ?? '',
          assigneeUserId: row.assignee_user_id,
          assigneeInitials: assigneeName.split(/\s+/)
            .map((part) => part[0] ?? '')
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          assigneeName,
        };
      }));
      setIsLoading(false);
    };

    void loadItems().catch((error: unknown) => {
      if (!active) return;
      showMessage(
        'Could not load rundown items',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [organizationId, rundownId]);

  const totalMinutes = items.reduce((sum, item) => sum + item.durationMinutes, 0);

  const handleStepPress = (item: RundownItem) => {
    showMessage(
      item.title,
      `${item.startTime} (${item.durationMinutes} min)${item.description ? `\n${item.description}` : ''}`,
    );
  };

  const handleMenuOptions = () => {
    if (!canEdit) return;
    Alert.alert('Rundown options', undefined, [
      { text: 'Edit rundown', onPress: onEdit },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={10} accessibilityLabel="Go back">
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path d="M15 18L9 12L15 6" fill="none" stroke={colors.text} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={2}>{rundown?.title ?? 'Untitled Rundown'}</Text>
            <Text style={styles.headerSub}>Rundown details</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {canEdit && <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.8}>
            <Svg width={14} height={14} viewBox="0 0 24 24" style={styles.editIcon}>
              <Path d="M17 3A2.828 2.828 0 1 1 21 7L7.5 20.5 2 22l1.5-5.5L17 3z" fill="none" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>}
          {canEdit && <TouchableOpacity style={styles.menuCircleBtn} onPress={handleMenuOptions} hitSlop={8} accessibilityLabel="Rundown options">
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Circle cx="5" cy="12" r="2" fill={colors.text} />
              <Circle cx="12" cy="12" r="2" fill={colors.text} />
              <Circle cx="19" cy="12" r="2" fill={colors.text} />
            </Svg>
          </TouchableOpacity>}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerCard}>
          <View style={styles.bannerDateBadge}>
            <Text style={styles.bannerMonthText}>RUNDOWN</Text>
            <Text style={styles.bannerDayText}>{items.length}</Text>
          </View>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle} numberOfLines={2}>{rundown?.title ?? 'Untitled Rundown'}</Text>
            <Text style={styles.bannerTimePlace}>{rundown?.eventDate ?? 'No event selected'}</Text>
            <Text style={styles.bannerMeta}>{items.length} {items.length === 1 ? 'activity' : 'activities'} · {totalMinutes} min</Text>
          </View>
        </View>

        <View style={styles.timelineHeader}>
          <Text style={styles.timelineHeading}>Agenda timeline</Text>
          <Text style={styles.readyText}>{isLoading ? 'Loading…' : 'Saved'}</Text>
        </View>

        <View style={styles.timelineContainer}>
          {isLoading ? (
            <Text style={styles.readyText}>Loading agenda…</Text>
          ) : items.length === 0 ? (
            <Text style={styles.readyText}>No agenda items yet. Edit this rundown to add items.</Text>
          ) : (
            items.map((item, index) => {
              const isLast = index === items.length - 1;
              const isFirst = index === 0;
              return (
                <View key={item.id} style={styles.timelineItemRow}>
                  <View style={styles.nodeColumn}>
                    <View style={[styles.nodeCircle, isFirst ? styles.nodeCircleActive : styles.nodeCircleInactive]}>
                      <Text style={[styles.nodeNumber, isFirst ? styles.nodeNumberActive : styles.nodeNumberInactive]}>{item.stepNumber}</Text>
                    </View>
                    {!isLast && <View style={[styles.verticalLine, isFirst ? styles.lineOrange : styles.lineLight]} />}
                  </View>

                  <TouchableOpacity style={[styles.timelineCard, isFirst && styles.timelineCardActive]} onPress={() => handleStepPress(item)} activeOpacity={0.88}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Svg width={14} height={14} viewBox="0 0 20 20">
                        <Path d="M7 4L13 10L7 16" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" />
                      </Svg>
                    </View>
                    <View style={styles.timePillRow}>
                      <Text style={styles.timeText}>{item.startTime}</Text>
                      <Text style={styles.durationText}>{item.durationMinutes} min</Text>
                    </View>
                    {!!item.description && <Text style={styles.cardDescription}>{item.description}</Text>}
                    {!!item.assigneeName && (
                      <View style={styles.responsibleRow}>
                        <View style={styles.responsibleAvatar}><Text style={styles.responsibleInitials}>{item.assigneeInitials}</Text></View>
                        <Text style={styles.responsibleName}>Responsible: {item.assigneeName}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: colors.background },
  headerLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: 8 },
  titleContainer: { flex: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1.2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text, lineHeight: 22 },
  headerSub: { fontSize: 11, color: colors.muted, marginTop: 3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
  editIcon: { marginRight: 6 },
  editBtnText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  menuCircleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1.2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, gap: 18 },
  bannerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border },
  bannerDateBadge: { width: 60, height: 62, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  bannerMonthText: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  bannerDayText: { color: colors.primary, fontSize: 22, fontWeight: '800', marginTop: 2 },
  bannerInfo: { flex: 1 },
  bannerTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  bannerTimePlace: { color: colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  bannerMeta: { color: colors.muted, fontSize: 11 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineHeading: { color: colors.text, fontSize: 15, fontWeight: '800' },
  readyText: { color: colors.muted, fontSize: 12 },
  timelineContainer: { gap: 0 },
  timelineItemRow: { flexDirection: 'row', alignItems: 'stretch' },
  nodeColumn: { width: 42, alignItems: 'center' },
  nodeCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  nodeCircleActive: { backgroundColor: colors.primary },
  nodeCircleInactive: { backgroundColor: colors.primarySoft },
  nodeNumber: { fontSize: 12, fontWeight: '800' },
  nodeNumberActive: { color: colors.surface },
  nodeNumberInactive: { color: colors.primary },
  verticalLine: { width: 2, flex: 1, minHeight: 18 },
  lineOrange: { backgroundColor: colors.primary },
  lineLight: { backgroundColor: colors.primarySoft },
  timelineCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  timelineCardActive: { borderColor: colors.primary },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '800' },
  timePillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
  timeText: { color: colors.primary, fontSize: 11, fontWeight: '800', backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  durationText: { color: colors.text, fontSize: 11, fontWeight: '700', backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  cardDescription: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 9 },
  responsibleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  responsibleAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  responsibleInitials: { color: colors.primary, fontSize: 8, fontWeight: '800' },
  responsibleName: { color: colors.text, fontSize: 11 },
});