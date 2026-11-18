import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/ThemeContext';
import { confirmAction, showMessage, showToast } from '../../auth/utils/feedback';
import { Rundown, RundownItem } from '../types';
import { supabase } from '../../../lib/supabase';
import { formatLocalDate } from '../../../lib/date';

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

interface EditRundownScreenProps {
  organizationId: string;
  rundown: Rundown | null;
  onBack: () => void;
  onSave: (rundown: Rundown) => void;
}

const toIsoDate = (value?: string): string => {
  if (!value) return '';
  const match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
};

const formatEventDate = (isoDate: string): string => {
  if (!isoDate) return 'No event linked';
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(year, month - 1, day));
};

const getCalendarDays = (year: number, month: number): Array<number | null> => {
  const mondayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days: Array<number | null> = Array(mondayOffset).fill(null);
  const count = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= count; day += 1) days.push(day);
  while (days.length % 7 !== 0) days.push(null);
  return days;
};

const parseTimeMinutes = (value: string): number | null => {
  const match = /^(\d{2})\.(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const formatTimeMinutes = (value: number): string => {
  const normalized = ((value % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}.${String(minutes).padStart(2, '0')}`;
};

const recalculateFollowingTimes = (
  items: RundownItemWithAssignee[],
  afterIndex: number,
): RundownItemWithAssignee[] => {
  const next = [...items];
  for (let index = Math.max(1, afterIndex + 1); index < next.length; index += 1) {
    const previousStartMinutes = parseTimeMinutes(next[index - 1].startTime);
    const previousDuration = next[index - 1].durationMinutes;
    if (previousStartMinutes === null || !Number.isInteger(previousDuration) || previousDuration < 1) break;
    next[index] = {
      ...next[index],
      startTime: formatTimeMinutes(previousStartMinutes + previousDuration),
    };
  }
  return next;
};

export function EditRundownScreen({ organizationId, rundown, onBack, onSave }: EditRundownScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [title, setTitle] = useState(rundown?.title ?? '');
  const [items, setItems] = useState<RundownItemWithAssignee[]>([]);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(rundown));
  const [isSaving, setIsSaving] = useState(false);
  const [eventDate, setEventDate] = useState(() => toIsoDate(rundown?.eventDate));
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const iso = toIsoDate(rundown?.eventDate);
    if (!iso) return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [year, month] = iso.split('-').map(Number);
    return new Date(year, month - 1, 1);
  });
  const itemLayoutsRef = useRef(new Map<string, { y: number; height: number }>());
  const dragStateRef = useRef<{
    itemId: string;
    startY: number;
    top: number;
    height: number;
    offsetY: number;
  } | null>(null);

  const calendarDays = useMemo(
    () => getCalendarDays(calendarMonth.getFullYear(), calendarMonth.getMonth()),
    [calendarMonth],
  );
  const calendarMonthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long', year: 'numeric',
  }).format(calendarMonth);
  const selectedDateParts = eventDate ? eventDate.split('-').map(Number) : [];
  const todayDate = formatLocalDate(new Date());
  const currentMonth = new Date();
  const isPreviousMonthDisabled = calendarMonth.getFullYear() < currentMonth.getFullYear()
    || (calendarMonth.getFullYear() === currentMonth.getFullYear()
      && calendarMonth.getMonth() <= currentMonth.getMonth());

  const openCalendar = () => {
    const dateToShow = eventDate && eventDate >= todayDate
      ? new Date(`${eventDate}T12:00:00`)
      : new Date();
    setCalendarMonth(new Date(dateToShow.getFullYear(), dateToShow.getMonth(), 1));
    setCalendarVisible(true);
  };

  useEffect(() => {
    let active = true;
    setTitle(rundown?.title ?? '');
    const initialDate = toIsoDate(rundown?.eventDate);
    setEventDate(initialDate);
    if (initialDate) {
      const [year, month] = initialDate.split('-').map(Number);
      setCalendarMonth(new Date(year, month - 1, 1));
    }

    if (!rundown) {
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
        .eq('rundown_id', rundown.id)
        .order('sort_order');
      if (!active) return;
      if (error) {
        showMessage('Could not load rundown items', error.message);
        setIsLoading(false);
        return;
      }

      const rows = (data ?? []) as unknown as RundownItemRow[];
      const assigneeIds = [...new Set(rows.map((row: RundownItemRow) => row.assignee_user_id).filter((id): id is string => Boolean(id)))];
      let profiles: ProfileRow[] = [];
      if (assigneeIds.length) {
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
        const assigneeName = row.assignee_user_id ? names.get(row.assignee_user_id) ?? '' : '';
        return {
          id: row.id,
          stepNumber: row.sort_order,
          title: row.title,
          startTime: row.start_time?.slice(0, 5).replace(':', '.') ?? '09.00',
          durationMinutes: row.duration_minutes,
          description: row.description ?? '',
          assigneeUserId: row.assignee_user_id,
          assigneeInitials: assigneeName.split(/\s+/).map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase(),
          assigneeName: assigneeName || 'Unassigned',
        };
      }));
      setIsLoading(false);
    };

    void loadItems().catch((error: unknown) => {
      if (!active) return;
      showMessage('Could not load rundown items', error instanceof Error ? error.message : 'Could not connect to Supabase.');
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [organizationId, rundown?.id]);

  const updateItem = (id: string, updates: Partial<RundownItemWithAssignee>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
  };

  const updateStartTime = (id: string, value: string) => {
    setItems((current) => {
      const itemIndex = current.findIndex((item) => item.id === id);
      if (itemIndex < 0) return current;

      const next = current.map((item) => item.id === id ? { ...item, startTime: value } : item);
      const newStartMinutes = parseTimeMinutes(value);
      if (newStartMinutes === null) return next;

      if (itemIndex > 0) {
        const previousStartMinutes = parseTimeMinutes(next[itemIndex - 1].startTime);
        if (previousStartMinutes !== null) {
          const previousDuration = (newStartMinutes - previousStartMinutes + 1440) % 1440;
          if (previousDuration > 0) {
            next[itemIndex - 1] = {
              ...next[itemIndex - 1],
              durationMinutes: previousDuration,
            };
          }
        }
      }

      return recalculateFollowingTimes(next, itemIndex);
    });
  };

  const updateDuration = (id: string, value: string) => {
    const durationMinutes = Number(value.replace(/\D/g, '')) || 0;
    setItems((current) => {
      const itemIndex = current.findIndex((item) => item.id === id);
      if (itemIndex < 0) return current;

      const next = current.map((item) => item.id === id ? { ...item, durationMinutes } : item);
      if (!Number.isInteger(durationMinutes) || durationMinutes < 1) return next;
      return recalculateFollowingTimes(next, itemIndex);
    });
  };

  const finishReorder = () => {
    const drag = dragStateRef.current;
    dragStateRef.current = null;
    setDraggingItemId(null);
    setDragOffsetY(0);
    if (!drag) return;

    const dropCenter = drag.top + drag.offsetY + drag.height / 2;
    setItems((current) => {
      const movedItem = current.find((item) => item.id === drag.itemId);
      if (!movedItem) return current;

      const remaining = current.filter((item) => item.id !== drag.itemId);
      const targetIndex = remaining.filter((item) => {
        const layout = itemLayoutsRef.current.get(item.id);
        return layout !== undefined && layout.y + layout.height / 2 < dropCenter;
      }).length;
      remaining.splice(targetIndex, 0, movedItem);
      const reordered = remaining.map((item, index) => ({ ...item, stepNumber: index + 1 }));
      return recalculateFollowingTimes(reordered, 0);
    });
  };

  const handleAddItem = () => {
    setItems((current) => {
      const lastItem = current[current.length - 1];
      const lastStartMinutes = lastItem ? parseTimeMinutes(lastItem.startTime) : null;
      const startTime = lastStartMinutes !== null && lastItem.durationMinutes >= 1
        ? formatTimeMinutes(lastStartMinutes + lastItem.durationMinutes)
        : '09.00';
      return [...current, {
        id: `new-${Date.now()}`,
        stepNumber: current.length + 1,
        title: '',
        startTime,
        durationMinutes: 15,
        description: '',
        assigneeInitials: '',
        assigneeName: 'Unassigned',
        assigneeUserId: null,
      }];
    });
  };

  const handleDeleteItem = (id: string) => {
    confirmAction(
      'Delete item?',
      'Are you sure you want to delete this rundown item?',
      () => {
        setItems((current) => {
          const remaining = current
            .filter((item) => item.id !== id)
            .map((item, index) => ({ ...item, stepNumber: index + 1 }));
          return recalculateFollowingTimes(remaining, 0);
        });
      },
      'Delete',
    );
  };

  const handleSaveRundown = async () => {
    if (!title.trim()) {
      showMessage('Title required', 'Enter a title for this rundown.');
      return;
    }
    const invalidItem = items.some((item) => {
      const time = /^(\d{2})\.(\d{2})$/.exec(item.startTime.trim());
      return !item.title.trim() || !time || Number(time[1]) > 23 || Number(time[2]) > 59
        || !Number.isInteger(item.durationMinutes) || item.durationMinutes < 1;
    });
    if (invalidItem) {
      showMessage('Check rundown items', 'Each item needs a title, a valid HH.MM time, and a duration of at least one minute.');
      return;
    }

    setIsSaving(true);
    try {
      const { data: authData, error: userError } = await supabase.auth.getUser();
      const user = authData.user;
      if (userError || !user) {
        showToast('error', 'Could not save rundown', userError?.message ?? 'Sign in again and retry.');
        return;
      }

      const rundownQuery = rundown
        ? supabase
            .from('rundowns')
            .update({
              title: title.trim(),
              event_date: eventDate || null,
            })
            .eq('organization_id', organizationId)
            .eq('id', rundown.id)
            .select('id, updated_at')
            .single()
        : supabase
            .from('rundowns')
            .insert({
              organization_id: organizationId,
              title: title.trim(),
              event_date: eventDate || null,
              created_by: user.id,
            })
            .select('id, updated_at')
            .single();

      const { data: savedRundown, error: rundownError } = await rundownQuery;
      if (rundownError) {
        showToast('error', 'Could not save rundown', rundownError.message);
        return;
      }

      const existingIds = items.filter((item) => !item.id.startsWith('new-')).map((item) => item.id);
      let removedIds: string[] = [];
      let originalItems: Array<{ id: string; sort_order: number }> = [];
      if (rundown) {
        const { data, error } = await supabase.from('rundown_items')
          .select('id, sort_order').eq('organization_id', organizationId).eq('rundown_id', savedRundown.id);
        if (error) {
          showToast('error', 'Could not load rundown items', error.message);
          return;
        }
        originalItems = (data ?? []) as Array<{ id: string; sort_order: number }>;
        removedIds = originalItems
          .map((item) => item.id)
          .filter((id) => !existingIds.includes(id));
      }
      if (removedIds.length) {
        const { error } = await supabase.from('rundown_items').delete()
          .eq('organization_id', organizationId).in('id', removedIds);
        if (error) {
          showToast('error', 'Could not delete rundown items', error.message);
          return;
        }
      }

      const desiredOrderById = new Map(
        items
          .filter((item) => !item.id.startsWith('new-'))
          .map((item, index) => [item.id, index + 1]),
      );
      const needsReordering = originalItems.some((item) =>
        desiredOrderById.has(item.id) && desiredOrderById.get(item.id) !== item.sort_order
      );
      const keptItems = originalItems.filter((item) => desiredOrderById.has(item.id));
      const restoreOriginalOrder = async (rows: Array<{ id: string; sort_order: number }>) => {
        let restoreError: string | null = null;
        for (const item of rows) {
          const { error } = await supabase.from('rundown_items')
            .update({ sort_order: item.sort_order })
            .eq('organization_id', organizationId)
            .eq('rundown_id', savedRundown.id)
            .eq('id', item.id);
          if (error && !restoreError) restoreError = error.message;
        }
        return restoreError;
      };
      if (needsReordering) {
        const temporaryOrderStart = Math.max(...originalItems.map((item) => item.sort_order)) + 1;
        const temporarilyMoved: Array<{ id: string; sort_order: number }> = [];
        for (const [index, item] of keptItems.entries()) {
          const { error } = await supabase.from('rundown_items')
            .update({ sort_order: temporaryOrderStart + index })
            .eq('organization_id', organizationId)
            .eq('rundown_id', savedRundown.id)
            .eq('id', item.id);
          if (error) {
            const restoreError = await restoreOriginalOrder(temporarilyMoved);
            const details = restoreError
              ? `${error.message} Previous order restoration failed: ${restoreError}`
              : error.message;
            showToast('error', 'Could not reorder rundown items', details);
            return;
          }
          temporarilyMoved.push(item);
        }
      }

      const itemRows = items.map((item, index) => ({
        id:
          typeof item.id === 'string' &&
          item.id.length > 0 &&
          !item.id.startsWith('new-')
            ? item.id
            : crypto.randomUUID(),
        organization_id: organizationId,
        rundown_id: savedRundown.id,
        sort_order: index + 1,
        title: item.title.trim(),
        start_time: `${item.startTime.trim().replace('.', ':')}:00`,
        duration_minutes: item.durationMinutes,
        description: item.description.trim(),
        assignee_user_id: item.assigneeUserId ?? null,
      }));
      if (itemRows.length) {
        const { error } = await supabase.from('rundown_items').upsert(itemRows, { onConflict: 'id' });
        if (error) {
          const restoreError = needsReordering ? await restoreOriginalOrder(keptItems) : null;
          const details = restoreError
            ? `${error.message} Previous order restoration failed: ${restoreError}`
            : error.message;
          showToast('error', 'Could not save rundown items', details);
          return;
        }
      }

      showToast('success', rundown ? 'Rundown updated' : 'Rundown created', 'Your rundown changes have been saved.');
      onSave({
        id: savedRundown.id,
        title: title.trim(),
        eventDate: formatEventDate(eventDate),
        updatedLabel: new Date(savedRundown.updated_at).toLocaleDateString(),
        itemCount: items.length,
        accentColor: rundown?.accentColor,
        items,
      });
    } catch (error) {
      showToast('error', 'Could not save rundown', error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={10} accessibilityLabel="Go back">
          <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M15 18L9 12L15 6" fill="none" stroke={colors.text} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Edit Rundown</Text>
          <Text style={styles.headerSub}>Keep times and responsibilities up to date</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.eventContextCard}>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Title</Text>
            <TextInput style={styles.contextTitleValue} value={title} onChangeText={setTitle} placeholder="Rundown title" accessibilityLabel="Rundown title" />
          </View>
          <View style={styles.divider} />
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Event</Text>
            <TouchableOpacity style={styles.eventDateButton} onPress={openCalendar} accessibilityRole="button" accessibilityLabel="Choose event date" activeOpacity={0.75}>
              <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" fill="none" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
              <View style={styles.eventDateCopy}>
                <Text style={styles.eventDateText}>{eventDate ? formatEventDate(eventDate) : 'Choose event date'}</Text>
                <Text style={styles.eventTimeContext}>Tap to change event date</Text>
              </View>
              <Text style={styles.dateChangeText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Rundown items</Text>
          <View style={styles.itemCountBadge}><Text style={styles.itemCountBadgeText}>{items.length} ITEMS</Text></View>
        </View>
        <View style={styles.itemsList}>
          {isLoading && <Text style={styles.itemDescription}>Loading rundown items…</Text>}
          {!isLoading && items.length === 0 && <Text style={styles.itemDescription}>No agenda items yet. Add one below.</Text>}
          {items.map((item) => (
            <View
              key={item.id}
              onLayout={({ nativeEvent }) => {
                itemLayoutsRef.current.set(item.id, {
                  y: nativeEvent.layout.y,
                  height: nativeEvent.layout.height,
                });
              }}
              style={[
                styles.itemCard,
                draggingItemId === item.id && styles.itemCardDragging,
                draggingItemId === item.id && { transform: [{ translateY: dragOffsetY }] },
              ]}
            >
              <View style={styles.itemTopRow}>
                <View
                  accessibilityRole="button"
                  accessibilityLabel={`Reorder ${item.title || 'rundown item'}`}
                  accessibilityHint="Drag to change the item order"
                  onStartShouldSetResponder={() => itemLayoutsRef.current.has(item.id)}
                  onResponderGrant={(event) => {
                    const layout = itemLayoutsRef.current.get(item.id);
                    if (!layout) return;
                    dragStateRef.current = {
                      itemId: item.id,
                      startY: event.nativeEvent.pageY,
                      top: layout.y,
                      height: layout.height,
                      offsetY: 0,
                    };
                    setDraggingItemId(item.id);
                  }}
                  onResponderMove={(event) => {
                    const drag = dragStateRef.current;
                    if (!drag || drag.itemId !== item.id) return;
                    drag.offsetY = event.nativeEvent.pageY - drag.startY;
                    setDragOffsetY(drag.offsetY);
                  }}
                  onResponderRelease={finishReorder}
                  onResponderTerminate={() => {
                    dragStateRef.current = null;
                    setDraggingItemId(null);
                    setDragOffsetY(0);
                  }}
                  onResponderTerminationRequest={() => false}
                  style={styles.dragHandle}
                >
                  <Svg width={14} height={14} viewBox="0 0 20 20"><Circle cx="6" cy="5" r="1.5" fill={colors.placeholder} /><Circle cx="14" cy="5" r="1.5" fill={colors.placeholder} /><Circle cx="6" cy="10" r="1.5" fill={colors.placeholder} /><Circle cx="14" cy="10" r="1.5" fill={colors.placeholder} /><Circle cx="6" cy="15" r="1.5" fill={colors.placeholder} /><Circle cx="14" cy="15" r="1.5" fill={colors.placeholder} /></Svg>
                </View>
                <View style={styles.stepCircle}><Text style={styles.stepNumber}>{item.stepNumber}</Text></View>
                <View style={styles.itemBody}>
                  <TextInput style={styles.itemTitle} value={item.title} onChangeText={(value) => updateItem(item.id, { title: value })} placeholder="Agenda item title" />
                  <View style={styles.timeBadgesRow}>
                    <View style={styles.timeBadgePurple}><TextInput style={styles.timeBadgePurpleText} value={item.startTime} onChangeText={(value) => updateStartTime(item.id, value)} placeholder="HH.MM" keyboardType="numbers-and-punctuation" /></View>
                    <View style={styles.timeBadgeGrey}><TextInput style={styles.timeBadgeGreyText} value={String(item.durationMinutes)} onChangeText={(value) => updateDuration(item.id, value)} placeholder="min" keyboardType="numeric" /></View>
                  </View>
                  <TextInput style={styles.itemDescription} value={item.description} onChangeText={(value) => updateItem(item.id, { description: value })} placeholder="Agenda notes" multiline />
                  <View style={styles.assigneeRow}>
                    {item.assigneeInitials ? <View style={styles.assigneeAvatar}><Text style={styles.assigneeInitials}>{item.assigneeInitials}</Text></View> : null}
                    <Text style={styles.assigneeName}>{item.assigneeName}</Text>
                  </View>
                </View>
                <View style={styles.actionCol}>
                  <TouchableOpacity style={styles.iconCircleBtn} onPress={() => handleDeleteItem(item.id)} accessibilityLabel={`Delete ${item.title}`}>
                    <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6h14ZM10 11v5M14 11v5" fill="none" stroke={colors.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem} activeOpacity={0.8}><Text style={styles.addItemBtnText}>＋ Add Rundown Item</Text></TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={onBack} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} onPress={() => { void handleSaveRundown(); }} disabled={isSaving || isLoading} activeOpacity={0.85}>
          <Svg width={14} height={14} viewBox="0 0 20 20" style={styles.saveCheckIcon}><Path d="M4 10.5L8 14.5L16 6.5" stroke={colors.surface} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save Rundown'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={calendarVisible} transparent animationType="fade" onRequestClose={() => setCalendarVisible(false)}>
        <View style={styles.calendarBackdrop}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <View><Text style={styles.calendarTitle}>Choose event date</Text><Text style={styles.calendarSubtitle}>Select the date for this rundown</Text></View>
              <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.closeButton} accessibilityLabel="Close calendar"><Text style={styles.closeText}>×</Text></TouchableOpacity>
            </View>
            <View style={styles.monthNavigation}>
              <TouchableOpacity style={[styles.monthArrow, isPreviousMonthDisabled && styles.monthArrowDisabled]} disabled={isPreviousMonthDisabled} onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} accessibilityLabel="Previous month"><Text style={styles.monthArrowText}>‹</Text></TouchableOpacity>
              <Text style={styles.monthLabel}>{calendarMonthLabel}</Text>
              <TouchableOpacity style={styles.monthArrow} onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} accessibilityLabel="Next month"><Text style={styles.monthArrowText}>›</Text></TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((weekday, index) => <View key={`${weekday}-${index}`} style={styles.calendarCell}><Text style={styles.weekdayText}>{weekday}</Text></View>)}
              {calendarDays.map((day, index) => {
                if (!day) return <View key={`day-${index}`} style={styles.calendarCell}><View style={styles.calendarEmptyDay} /></View>;
                const dateValue = formatLocalDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
                const isPast = dateValue < todayDate;
                const selected = selectedDateParts.length === 3
                  && calendarMonth.getFullYear() === selectedDateParts[0]
                  && calendarMonth.getMonth() + 1 === selectedDateParts[1]
                  && day === selectedDateParts[2];
                return (
                  <View key={dateValue} style={styles.calendarCell}>
                    <TouchableOpacity
                      disabled={isPast}
                      style={[
                        styles.calendarDay,
                        selected && styles.calendarDaySelected,
                        isPast && styles.calendarDayDisabled,
                      ]}
                      onPress={() => {
                        setEventDate(dateValue);
                        setCalendarVisible(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${day} ${calendarMonthLabel}`}
                      accessibilityState={{ selected, disabled: isPast }}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        selected && styles.calendarDayTextSelected,
                        isPast && styles.calendarDayTextDisabled,
                      ]}>{day}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity style={styles.calendarCancelButton} onPress={() => setCalendarVisible(false)}><Text style={styles.calendarCancelText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1.2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, gap: 16 },
  eventContextCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  contextRow: { flexDirection: 'row', alignItems: 'flex-start' },
  contextLabel: { width: 65, fontSize: 13, fontWeight: '700', color: colors.text, paddingTop: 1 },
  contextTitleValue: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text, paddingVertical: 0 },
  eventDateText: { fontSize: 13, fontWeight: '800', color: colors.primary, marginBottom: 2 },
  eventTimeContext: { fontSize: 11, color: colors.muted },
  eventDateButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 3 },
  eventDateCopy: { flex: 1 },
  dateChangeText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.background, marginVertical: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  itemCountBadge: { backgroundColor: colors.warning100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  itemCountBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  itemsList: { gap: 12 },
  itemCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.border },
  itemCardDragging: { zIndex: 5, elevation: 5 },
  itemTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dragHandle: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stepNumber: { fontSize: 12, fontWeight: '800', color: colors.primary },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 6, paddingVertical: 2 },
  timeBadgesRow: { flexDirection: 'row', gap: 6, marginBottom: 8, width: '100%',},
  timeBadgePurple: { flex: 1, minWidth: 0, backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  timeBadgePurpleText: { width: '100%', fontSize: 11, fontWeight: '800', color: colors.primary, paddingVertical: 0 },
  timeBadgeGrey: { width: 64, flexShrink: 0, backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  timeBadgeGreyText: { width: '100%', fontSize: 11, fontWeight: '700', color: colors.text, paddingVertical: 0 },
  itemDescription: { fontSize: 12, color: colors.muted, lineHeight: 17, marginBottom: 8, paddingVertical: 2 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center' },
  assigneeAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  assigneeInitials: { fontSize: 8, fontWeight: '800', color: colors.primary },
  assigneeName: { fontSize: 11, color: colors.text },
  actionCol: { gap: 8, marginLeft: 8 },
  iconCircleBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  addItemBtn: { backgroundColor: colors.primarySoft, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginBottom: 2 },
  addItemBtnText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 22 },
  cancelBtnText: { color: colors.muted, fontSize: 14, fontWeight: '800' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 19, paddingVertical: 14, minWidth: 165 },
  saveBtnDisabled: { opacity: 0.6 },
  saveCheckIcon: { marginRight: 7 },
  saveBtnText: { color: colors.surface, fontSize: 13, fontWeight: '800' },
  calendarBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.overlay },
  calendarCard: { width: '100%', maxWidth: 360, backgroundColor: colors.surface, borderRadius: 22, padding: 20 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  calendarTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  calendarSubtitle: { marginTop: 4, fontSize: 11, color: colors.muted },
  monthNavigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  monthArrow: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  monthArrowDisabled: { opacity: 0.4 },
  monthArrowText: { fontSize: 25, lineHeight: 28, color: colors.text },
  monthLabel: { fontSize: 14, fontWeight: '800', color: colors.text },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.2857%', height: 42, alignItems: 'center', justifyContent: 'center' },
  weekdayText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  calendarDay: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  calendarDaySelected: { backgroundColor: colors.primary },
  calendarDayDisabled: { backgroundColor: colors.surfaceSubtle },
  calendarDayText: { fontSize: 12, color: colors.text },
  calendarDayTextSelected: { color: colors.surface, fontWeight: '800' },
  calendarDayTextDisabled: { color: colors.muted },
  calendarEmptyDay: { width: 34, height: 34 },
  calendarCancelButton: { marginTop: 12, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: colors.primarySoft },
  calendarCancelText: { fontSize: 13, fontWeight: '800', color: colors.muted },
  closeButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 22, lineHeight: 24, color: colors.muted },
});
