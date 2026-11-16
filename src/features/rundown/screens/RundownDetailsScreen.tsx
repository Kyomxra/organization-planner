import React, { useEffect, useState } from 'react';
import {
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

interface RundownDetailsScreenProps {
  organizationId: string;
  rundown: Rundown | null;
  items: RundownItem[];
  onBack: () => void;
  onEdit: () => void;
}

export function RundownDetailsScreen({
  organizationId,
  rundown,
  onBack,
  onEdit,
}: RundownDetailsScreenProps) {
  const [items, setItems] = useState<RundownItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadItems = async () => {
      const { data: rows, error } = await supabase
        .from('rundown_items')
        .select('id, sort_order, title, start_time, duration_minutes, description, assignee_user_id')
        .eq('organization_id', organizationId)
        .eq('rundown_id', rundown.id)
        .order('sort_order');
      if (!active) return;
      if (error) {
        showMessage('Could not load rundown items', error.message);
        setIsLoading(false);
        return;
      }

      const assigneeIds = [...new Set((rows ?? [])
        .map((row) => row.assignee_user_id)
        .filter((id): id is string => Boolean(id)))];
      const { data: profiles, error: profilesError } = assigneeIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', assigneeIds)
        : { data: [], error: null };
      if (!active) return;
      if (profilesError) {
        showMessage('Could not load rundown assignees', profilesError.message);
        setIsLoading(false);
        return;
      }
      const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
      setItems((rows ?? []).map((row) => {
        const assigneeName: string = row.assignee_user_id ? names.get(row.assignee_user_id) ?? '' : '';
        return {
          id: row.id,
          stepNumber: row.sort_order,
          title: row.title,
          startTime: row.start_time?.slice(0, 5).replace(':', '.') ?? '—',
          durationMinutes: row.duration_minutes,
          description: row.description,
          assigneeUserId: row.assignee_user_id,
          assigneeInitials: assigneeName.split(/\s+/).map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase(),
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
  }, [organizationId, rundown.id]);

  const totalMinutes = items.reduce((sum, item) => sum + item.durationMinutes, 0);
  const handleStepPress = (item: RundownItem) => {
    showMessage(item.title, `${item.startTime} (${item.durationMinutes} min)\n${item.description}`);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={10}
          >
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

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {rundown?.title ?? 'Untitled Rundown'}
            </Text>
            <Text style={styles.headerSub}>Rundown details</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEdit}
            activeOpacity={0.8}
          >
            <Svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              style={styles.editIcon}
            >
              <Path
                d="M17 3A2.828 2.828 0 1 1 21 7L7.5 20.5 2 22l1.5-5.5L17 3z"
                fill="none"
                stroke={colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCircleBtn}
            onPress={handleMenuOptions}
            hitSlop={8}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Circle cx="5" cy="12" r="2" fill="#2D3142" />
              <Circle cx="12" cy="12" r="2" fill="#2D3142" />
              <Circle cx="19" cy="12" r="2" fill="#2D3142" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerCard}>
          <View style={styles.bannerDateBadge}>
            <Text style={styles.bannerMonthText}>RUNDOWN</Text>
            <Text style={styles.bannerDayText}>{items.length}</Text>
          </View>

          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle} numberOfLines={2}>
              {rundown?.title ?? 'Untitled Rundown'}
            </Text>
            <Text style={styles.bannerTimePlace}>
              {rundown?.eventDate ?? 'No event selected'}
            </Text>
            <Text style={styles.bannerMeta}>
              {items.length} {items.length === 1 ? 'activity' : 'activities'}
            </Text>
          </View>
        </View>

        <View style={styles.timelineHeader}>
          <Text style={styles.timelineHeading}>Agenda timeline</Text>
          <Text style={styles.readyText}>Saved</Text>
        </View>

        {/* Connected Vertical Timeline */}
        <View style={styles.timelineContainer}>
          {isLoading ? (
            <Text style={styles.readyText}>Loading agenda…</Text>
          ) : items.length === 0 ? (
            <Text style={styles.readyText}>No agenda items yet. Edit this rundown to add items.</Text>
          ) : items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isStepOne = index === 0;

            return (
              <View key={item.id} style={styles.timelineItemRow}>
                {/* Left Node Column (Number Circle + Vertical Line) */}
                <View style={styles.nodeColumn}>
                  <View
                    style={[
                      styles.nodeCircle,
                      isStepOne ? styles.nodeCircleActive : styles.nodeCircleInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.nodeNumber,
                        isStepOne ? styles.nodeNumberActive : styles.nodeNumberInactive,
                      ]}
                    >
                      {item.stepNumber}
                    </Text>
                  </View>

                    {!isLast && (
                      <View
                        style={[
                          styles.verticalLine,
                          isFirst ? styles.lineOrange : styles.lineLight,
                        ]}
                      />
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.timelineCard,
                      isFirst && styles.timelineCardActive,
                    ]}
                    onPress={() => handleStepPress(item)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Svg width={14} height={14} viewBox="0 0 20 20">
                        <Path
                          d="M7 4L13 10L7 16"
                          fill="none"
                          stroke="#8A8C9F"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      </Svg>
                    </View>

                    <View style={styles.timePillRow}>
                      <Text style={styles.timeText}>{item.startTime}</Text>
                      <Text style={styles.durationText}>
                        {item.durationMinutes} min
                      </Text>
                    </View>

                    {!!item.description && (
                      <Text style={styles.cardDescription}>
                        {item.description}
                      </Text>
                    )}

                    {!!item.assigneeName && (
                      <View style={styles.responsibleRow}>
                        <View style={styles.responsibleAvatar}>
                          <Text style={styles.responsibleInitials}>
                            {item.assigneeInitials}
                          </Text>
                        </View>
                        <Text style={styles.responsibleName}>
                          Responsible: {item.assigneeName}
                        </Text>
                      </View>
                      <Text style={styles.responsibleName}>Responsible: {item.assigneeName}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FAFBFD',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#ECEEF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 22,
  },
  headerSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEECFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editIcon: {
    marginRight: 6,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  menuCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#ECEEF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C2FCF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#3C2FCF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerDateBadge: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bannerMonthText: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  bannerDayText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: -2,
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerTimePlace: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  bannerMeta: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2C9B76',
  },
  timelineContainer: {
    marginTop: 4,
  },
  timelineItemRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  nodeColumn: {
    width: 36,
    alignItems: 'center',
    marginRight: 10,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCircleActive: {
    backgroundColor: colors.primary,
  },
  nodeCircleInactive: {
    backgroundColor: '#EEECFF',
  },
  nodeNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  nodeNumberActive: {
    color: '#FFFFFF',
  },
  nodeNumberInactive: {
    color: colors.primary,
  },
  verticalLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
  },
  lineOrange: {
    backgroundColor: '#E87A35',
  },
  lineLight: {
    backgroundColor: '#E4E6F2',
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#ECEEF7',
  },
  timelineCardActive: {
    borderColor: colors.primary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  timePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  durationText: {
    fontSize: 11,
    color: colors.muted,
  },
  cardDescription: {
    fontSize: 11,
    color: '#5A5D75',
    lineHeight: 16,
    marginBottom: 10,
  },
  responsibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responsibleAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  responsibleInitials: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  responsibleName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A4D62',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF7',
    borderRadius: 18,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});