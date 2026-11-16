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
import { showMessage } from '../../auth/utils/feedback';
import { Rundown, RundownItem } from '../types';
import { supabase } from '../../../lib/supabase';

interface EditRundownScreenProps {
  organizationId: string;
  rundown: Rundown | null;
  onBack: () => void;
  onSave: (rundown: Rundown) => void;
}

export function EditRundownScreen({
  organizationId,
  rundown,
  onBack,
  onSave,
}: EditRundownScreenProps) {
  const [title, setTitle] = useState(rundown?.title ?? '');
  const [items, setItems] = useState<RundownItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(rundown));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setTitle(rundown?.title ?? '');
    if (!rundown) {
      setItems([]);
      setIsLoading(false);
      return () => { active = false; };
    }

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
          startTime: row.start_time?.slice(0, 5).replace(':', '.') ?? '09.00',
          durationMinutes: row.duration_minutes,
          description: row.description,
          assigneeUserId: row.assignee_user_id,
          assigneeInitials: assigneeName.split(/\s+/).map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase(),
          assigneeName: assigneeName || 'Unassigned',
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
  }, [organizationId, rundown]);

  const handleAddItem = () => {
    const nextStep = items.length + 1;
    const newItem: RundownItem = {
      id: `new-${Date.now()}`,
      stepNumber: nextStep,
      title: '',
      startTime: '09.00',
      durationMinutes: 15,
      description: '',
      assigneeInitials: '',
      assigneeName: 'Unassigned',
    };
    setItems((current) => [...current, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) =>
      prev
        .filter((item) => item.id !== id)
        .map((item, idx) => ({ ...item, stepNumber: idx + 1 }))
    );
  };

  const updateItem = (id: string, updates: Partial<RundownItem>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
  };

  const handleSaveRundown = async () => {
    if (!title.trim()) {
      showMessage('Title required', 'Enter a title for this rundown.');
      return;
    }
    if (items.some((item) => {
      const time = /^(\d{2})\.(\d{2})$/.exec(item.startTime);
      return !item.title.trim()
        || !time
        || Number(time[1]) > 23
        || Number(time[2]) > 59
        || !Number.isInteger(item.durationMinutes)
        || item.durationMinutes < 1;
    })) {
      showMessage('Check rundown items', 'Each item needs a title, a valid HH.MM time, and a duration of at least one minute.');
      return;
    }

    setIsSaving(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showMessage('Could not save rundown', userError?.message ?? 'Sign in again and retry.');
      setIsSaving(false);
      return;
    }

    const rundownQuery = rundown
      ? supabase
          .from('rundowns')
          .update({ title: title.trim() })
          .eq('organization_id', organizationId)
          .eq('id', rundown.id)
          .select('id, updated_at')
          .single()
      : supabase
          .from('rundowns')
          .insert({ organization_id: organizationId, title: title.trim(), created_by: user.id })
          .select('id, updated_at')
          .single();
    const { data: savedRundown, error: rundownError } = await rundownQuery;
    if (rundownError) {
      showMessage('Could not save rundown', rundownError.message);
      setIsSaving(false);
      return;
    }

    const existingIds = items.filter((item) => !item.id.startsWith('new-')).map((item) => item.id);
    let removedIds: string[] = [];
    if (rundown) {
      const { data: originalItems, error: originalItemsError } = await supabase
        .from('rundown_items')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('rundown_id', savedRundown.id);
      if (originalItemsError) {
        showMessage('Could not load rundown items', originalItemsError.message);
        setIsSaving(false);
        return;
      }
      removedIds = (originalItems ?? [])
        .map((item) => item.id)
        .filter((id) => !existingIds.includes(id));
    }
    if (removedIds.length) {
      const { error } = await supabase
        .from('rundown_items')
        .delete()
        .eq('organization_id', organizationId)
        .in('id', removedIds);
      if (error) {
        showMessage('Could not delete rundown items', error.message);
        setIsSaving(false);
        return;
      }
    }

    const itemRows = items.map((item, index) => ({
      ...(item.id.startsWith('new-') ? {} : { id: item.id }),
      organization_id: organizationId,
      rundown_id: savedRundown.id,
      sort_order: index + 1,
      title: item.title.trim(),
      start_time: `${item.startTime.replace('.', ':')}:00`,
      duration_minutes: item.durationMinutes,
      description: item.description.trim(),
      assignee_user_id: item.assigneeUserId ?? null,
    }));
    if (itemRows.length) {
      const { error } = await supabase.from('rundown_items').upsert(itemRows, { onConflict: 'id' });
      if (error) {
        if (!rundown) {
          const { error: rollbackError } = await supabase
            .from('rundowns')
            .delete()
            .eq('organization_id', organizationId)
            .eq('id', savedRundown.id);
          showMessage(
            'Could not save rundown items',
            rollbackError ? `${error.message} The empty rundown could not be removed: ${rollbackError.message}` : error.message,
          );
        } else {
          showMessage('Could not save rundown items', error.message);
        }
        setIsSaving(false);
        return;
      }
    }

    onSave({
      id: savedRundown.id,
      title: title.trim(),
      eventDate: rundown?.eventDate ?? 'No event linked',
      updatedLabel: new Date(savedRundown.updated_at).toLocaleDateString(),
      itemCount: items.length,
      accentColor: rundown?.accentColor,
    });
    setIsSaving(false);
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
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
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Edit Rundown</Text>
          <Text style={styles.headerSub}>Keep times and responsibilities up to date</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Context Card */}
        <View style={styles.eventContextCard}>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Title</Text>
            <TextInput
              style={styles.contextTitleValue}
              value={title}
              onChangeText={setTitle}
              placeholder="Rundown title"
              accessibilityLabel="Rundown title"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Event</Text>
            <View>
              <Text style={styles.eventDateText}>{rundown?.eventDate ?? 'No event linked'}</Text>
              <Text style={styles.eventTimeContext}>Link an event from Calendar when available.</Text>
            </View>
          </View>
        </View>

        {/* Rundown Items Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Rundown items</Text>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountBadgeText}>{items.length} ITEMS</Text>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.itemsList}>
          {isLoading && <Text style={styles.itemDescription}>Loading rundown items…</Text>}
          {!isLoading && items.length === 0 && (
            <Text style={styles.itemDescription}>No agenda items yet. Add one below.</Text>
          )}
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                {/* Drag Handle Icon */}
                <View style={styles.dragHandle}>
                  <Svg width={14} height={14} viewBox="0 0 20 20">
                    <Circle cx="6" cy="5" r="1.5" fill="#A5A7B7" />
                    <Circle cx="14" cy="5" r="1.5" fill="#A5A7B7" />
                    <Circle cx="6" cy="10" r="1.5" fill="#A5A7B7" />
                    <Circle cx="14" cy="10" r="1.5" fill="#A5A7B7" />
                    <Circle cx="6" cy="15" r="1.5" fill="#A5A7B7" />
                    <Circle cx="14" cy="15" r="1.5" fill="#A5A7B7" />
                  </Svg>
                </View>

                {/* Step Number Circle */}
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>{item.stepNumber}</Text>
                </View>

                {/* Content */}
                <View style={styles.itemBody}>
                  <TextInput
                    style={styles.itemTitle}
                    value={item.title}
                    onChangeText={(value) => updateItem(item.id, { title: value })}
                    placeholder="Agenda item title"
                  />

                  {/* Time badges */}
                  <View style={styles.timeBadgesRow}>
                    <View style={styles.timeBadgePurple}>
                      <TextInput
                        style={styles.timeBadgePurpleText}
                        value={item.startTime}
                        onChangeText={(value) => updateItem(item.id, { startTime: value })}
                        placeholder="HH.MM"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <View style={styles.timeBadgeGrey}>
                      <TextInput
                        style={styles.timeBadgeGreyText}
                        value={String(item.durationMinutes)}
                        onChangeText={(value) => updateItem(item.id, {
                          durationMinutes: Number(value.replace(/\D/g, '')) || 0,
                        })}
                        placeholder="min"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <TextInput
                    style={styles.itemDescription}
                    value={item.description}
                    onChangeText={(value) => updateItem(item.id, { description: value })}
                    placeholder="Agenda notes"
                    multiline
                  />

                  {/* Assignee */}
                  <View style={styles.assigneeRow}>
                    {item.assigneeInitials ? (
                      <View style={styles.assigneeAvatar}>
                        <Text style={styles.assigneeInitials}>{item.assigneeInitials}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.assigneeName}>{item.assigneeName}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionCol}>
                  <TouchableOpacity
                    style={styles.iconCircleBtn}
                    onPress={() => handleDeleteItem(item.id)}
                    hitSlop={6}
                  >
                    <Svg width={13} height={13} viewBox="0 0 24 24">
                      <Path
                        d="M3 6H5H21M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6H19Z"
                        fill="none"
                        stroke="#2D3142"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Add Rundown Item Button */}
        <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem} activeOpacity={0.8}>
          <Text style={styles.addItemBtnText}>+ Add Rundown Item</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={onBack} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={() => { void handleSaveRundown(); }}
          disabled={isSaving || isLoading}
          activeOpacity={0.85}
        >
          <Svg width={14} height={14} viewBox="0 0 20 20" style={styles.saveCheckIcon}>
            <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save Rundown'}</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FAFBFD',
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
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110,
    gap: 16,
  },
  eventContextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF7',
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contextLabel: {
    width: 65,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    paddingTop: 1,
  },
  contextTitleValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  eventDateText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  eventTimeContext: {
    fontSize: 11,
    color: colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4FB',
    marginVertical: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  itemCountBadge: {
    backgroundColor: '#FFF2E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E87A35',
    letterSpacing: 0.5,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF7',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dragHandle: {
    paddingTop: 6,
    marginRight: 6,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EEECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  timeBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  timeBadgePurple: {
    backgroundColor: '#EEECFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeBadgePurpleText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  timeBadgeGrey: {
    backgroundColor: '#F3F4F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeBadgeGreyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A5D75',
  },
  itemDescription: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
    marginBottom: 8,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  assigneeInitials: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  assigneeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A4D62',
  },
  actionCol: {
    gap: 8,
    marginLeft: 8,
  },
  iconCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EEECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addItemBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAFBFD',
    borderTopWidth: 1,
    borderTopColor: '#ECEEF7',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A5D75',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 22,
    height: 46,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveCheckIcon: {
    marginRight: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
