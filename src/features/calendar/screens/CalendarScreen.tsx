import React, { useCallback, useEffect, useState } from 'react';
import { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/ThemeContext';
import { confirmAction, showMessage, showToast } from '../../auth/utils/feedback';
import { supabase } from '../../../lib/supabase';
import { formatLocalDate } from '../../../lib/date';
import { CalendarEvent, NewCalendarEvent } from '../types';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { NewEventModal } from '../components/NewEventModal';

interface CalendarScreenProps {
  organizationId: string;
  organizationName: string;
  role?: 'Executive' | 'Coordinator' | 'Member';
  divisionId?: string | null;
  onSwitchTab: (tab: 'home' | 'calendar' | 'divisions') => void;
  onAttachRundown?: (event: CalendarEvent) => void;
}

function formatEventTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
}

export function CalendarScreen({
  organizationId,
  organizationName,
  role = 'Executive',
  divisionId = null,
  onSwitchTab,
  onAttachRundown,
}: CalendarScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isNewEventModalVisible, setIsNewEventModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const monthYear = visibleMonth.getFullYear();
  const monthIndex = visibleMonth.getMonth();
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const startDayOffset = (monthStart.getDay() + 6) % 7;

  const loadEvents = useCallback(async () => {
    const rangeStart = new Date(monthYear, monthIndex, 1);
    const rangeEnd = new Date(monthYear, monthIndex + 1, 1);
    const { data: eventRows, error } = await supabase
      .from('events')
      .select('id, title, category, division_id, start_at, end_at, description, notes')
      .eq('organization_id', organizationId)
      .gte('start_at', rangeStart.toISOString())
      .lt('start_at', rangeEnd.toISOString())
      .order('start_at');

    if (error) {
      showMessage('Could not load events', error.message);
      return;
    }

    const divisionIds = [...new Set((eventRows ?? [])
      .map((event) => event.division_id)
      .filter((id): id is string => Boolean(id)))];
    const { data: divisionRows, error: divisionError } = divisionIds.length
      ? await supabase.from('divisions').select('id, name').in('id', divisionIds)
      : { data: [], error: null };

    if (divisionError) {
      showMessage('Could not load event divisions', divisionError.message);
      return;
    }

    const eventIds = (eventRows ?? []).map((event) => event.id);
    const { data: rundownRows, error: rundownError } = eventIds.length
      ? await supabase.from('rundowns').select('id, title, event_id').in('event_id', eventIds)
      : { data: [], error: null };
    if (rundownError) {
      showMessage('Could not load event rundowns', rundownError.message);
      return;
    }

    const divisionsById = new Map((divisionRows ?? []).map((division) => [division.id, division.name]));
    const rundownsByEventId = new Map((rundownRows ?? []).map((rundown) => [rundown.event_id, rundown]));
    setEvents((eventRows ?? []).map((row) => {
      const start = new Date(row.start_at);
      const end = new Date(row.end_at);
      const rundown = rundownsByEventId.get(row.id);
      const durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
      const duration = durationMinutes >= 60
        ? `${Math.floor(durationMinutes / 60)} hour${durationMinutes >= 120 ? 's' : ''}${durationMinutes % 60 ? ` ${durationMinutes % 60} min` : ''}`
        : `${durationMinutes} min`;

      return {
        id: row.id,
        startAt: row.start_at,
        endAt: row.end_at,
        divisionId: row.division_id,
        title: row.title,
        category: row.category.toUpperCase(),
        orgName: organizationName,
        divisionName: row.division_id ? divisionsById.get(row.division_id) ?? 'Organization' : 'Organization',
        dayOfMonth: start.getDate(),
        month: start.getMonth(),
        year: start.getFullYear(),
        dateLabel: start.toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        startTime: formatEventTime(start),
        endTime: formatEventTime(end),
        duration,
        description: row.description,
        notes: row.notes,
        linkedRundown: rundown ? {
          title: rundown.title,
          itemsCount: 0,
          timeRange: '',
        } : undefined,
      };
    }));
  }, [monthIndex, monthYear, organizationId, organizationName]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const eventDays = new Set(events.map((event) => event.dayOfMonth));
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const dayEvents = events.filter((event) => event.dayOfMonth === selectedDay);

  const handleSaveEvent = async (event: NewCalendarEvent): Promise<boolean> => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showToast('error', 'Could not save event', userError?.message ?? 'Sign in again and retry.');
      return false;
    }

    if (role === 'Coordinator' && !divisionId) {
      showMessage('No division assigned', 'Ask an executive to assign you to a division before managing events.');
      return false;
    }

    const eventData = {
      title: event.title,
      category: event.category.toLowerCase(),
      description: event.description,
      notes: event.notes,
      start_at: event.startAt,
      end_at: event.endAt,
      division_id: role === 'Coordinator' ? divisionId : editingEvent?.divisionId ?? null,
    };
    const result = editingEvent
      ? await supabase
          .from('events')
          .update(eventData)
          .eq('organization_id', organizationId)
          .eq('id', editingEvent.id)
          .select('id')
          .maybeSingle()
      : await supabase
          .from('events')
          .insert({ ...eventData, organization_id: organizationId, created_by: user.id })
          .select('id')
          .single();

    if (result.error || !result.data) {
      showToast('error', 'Could not save event', result.error?.message ?? 'You may not have permission to change this event.');
      return false;
    }

    await loadEvents();
    showToast('success', editingEvent ? 'Event updated' : 'Event created', 'Your event has been saved.');
    return true;
  };

  const deleteSelectedEvent = async () => {
    if (!selectedEvent) return;
    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', selectedEvent.id)
      .select('id')
      .maybeSingle();
    if (error || !data) {
      showToast('error', 'Could not delete event', error?.message ?? 'You may not have permission to delete this event.');
      return;
    }
    setSelectedEvent(null);
    await loadEvents();
    showToast('success', 'Event deleted', 'The event was deleted successfully.');
  };

  const confirmDeleteEvent = () => {
    confirmAction(
      'Delete event?',
      `Are you sure you want to delete "${selectedEvent?.title ?? 'this event'}"? This cannot be undone.`,
      () => { void deleteSelectedEvent(); },
      'Delete',
    );
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </Text>
          <Text style={styles.headerSubtitle}>
            {events.length} event{events.length === 1 ? '' : 's'} this month
          </Text>
        </View>
        <View style={styles.monthNav}>
          <TouchableOpacity
            style={styles.navCircle}
            hitSlop={8}
            onPress={() => {
              const previous = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
              setVisibleMonth(previous);
              setSelectedDay(1);
            }}
          >
            <Svg width={14} height={14} viewBox="0 0 20 20">
              <Path d="M12 4L6 10L12 16" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navCircle}
            hitSlop={8}
            onPress={() => {
              const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
              setVisibleMonth(next);
              setSelectedDay(1);
            }}
          >
            <Svg width={14} height={14} viewBox="0 0 20 20">
              <Path d="M8 4L14 10L8 16" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Days of week header */}
          <View style={styles.weekHeader}>
            {daysOfWeek.map((day, idx) => (
              <Text key={day} style={[styles.weekDayText, idx === 6 && styles.sundayText]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Dates Grid */}
          <View style={styles.datesGrid}>
            {/* Empty slots before day 1 */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dateSlot} />
            ))}

            {/* Days 1 to 31 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = selectedDay === dayNum;
              const hasEvent = eventDays.has(dayNum);

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={styles.dateSlot}
                  onPress={() => setSelectedDay(dayNum)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                      {dayNum}
                    </Text>
                  </View>
                  {hasEvent && <View style={styles.eventDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Organization meeting</Text>
          </View>
        </View>

        {/* Selected Date Section */}
        <View style={styles.dateEventsHeader}>
          <Text style={styles.selectedDateTitle}>
            {new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), selectedDay)
              .toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
          </Text>
          {dayEvents.length > 0 && (
            <View style={styles.eventCountBadge}>
              <Text style={styles.eventCountBadgeText}>
                {dayEvents.length} EVENT{dayEvents.length > 1 ? 'S' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Events List or Empty State */}
        {dayEvents.length > 0 ? (
          dayEvents.map((ev) => (
            <TouchableOpacity
              key={ev.id}
              style={styles.eventCard}
              onPress={() => setSelectedEvent(ev)}
              activeOpacity={0.88}
            >
              {/* Time Column */}
              <View style={styles.timeCol}>
                <Text style={styles.timeStart}>{ev.startTime}</Text>
                <Text style={styles.timeEnd}>{ev.endTime}</Text>
              </View>

              {/* Vertical Orange Accent Bar */}
              <View style={styles.accentBar} />

              {/* Event Info */}
              <View style={styles.eventInfoCol}>
                <Text style={styles.eventTitleText} numberOfLines={1}>
                  {ev.title}
                </Text>
                <View style={styles.divisionMeta}>
                  <Svg width={12} height={12} viewBox="0 0 20 20" style={styles.metaIcon}>
                    <Circle cx="8" cy="6" r="3" fill="none" stroke={colors.muted} strokeWidth={1.6} />
                    <Path d="M3 16 C3 13, 5 11, 8 11 C11 11, 13 13, 13 16" fill="none" stroke={colors.muted} strokeWidth={1.6} />
                    <Circle cx="15" cy="7" r="2.2" fill="none" stroke={colors.muted} strokeWidth={1.4} />
                    <Path d="M14 12 C15.5 12.5, 17 13.5, 17 15" fill="none" stroke={colors.muted} strokeWidth={1.4} />
                  </Svg>
                  <Text style={styles.divisionMetaText}>
                    {ev.divisionId ? `Division · ${ev.divisionName}` : 'Organization-wide'}
                  </Text>
                </View>
              </View>

              {/* Right Chevron */}
              <Svg width={14} height={14} viewBox="0 0 20 20">
                <Path d="M7 4L13 10L7 16" fill="none" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No Events yet</Text>
          </View>
        )}

        {/* Add Event Button */}
        {role === 'Executive' || (role === 'Coordinator' && divisionId) ? (
          <TouchableOpacity
            style={styles.addEventBtn}
            onPress={() => {
              setEditingEvent(null);
              setIsNewEventModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.addEventBtnText}>+ Add Event</Text>
          </TouchableOpacity>
        ) : role === 'Coordinator' ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>A division assignment is required to manage events.</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => onSwitchTab('home')}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="M3 10.5L12 3L21 10.5V20C21 20.6 20.6 21 20 21H4C3.4 21 3 20.6 3 20V10.5Z" fill="none" stroke={colors.muted} strokeWidth={1.8} strokeLinejoin="round" />
            <Path d="M9 21V12H15V21" fill="none" stroke={colors.muted} strokeWidth={1.8} />
          </Svg>
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, styles.tabItemActive]} onPress={() => onSwitchTab('calendar')}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Rect x="3" y="4" width="18" height="18" rx="3" stroke={colors.primary} strokeWidth={2} fill="none" />
            <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => onSwitchTab('divisions')}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Circle cx="9" cy="7" r="4" stroke={colors.muted} strokeWidth={1.8} fill="none" />
            <Path d="M2 19C2 15.5 5 13.5 9 13.5C13 13.5 16 15.5 16 19" stroke={colors.muted} strokeWidth={1.8} fill="none" strokeLinecap="round" />
            <Circle cx="18" cy="8" r="3" stroke={colors.muted} strokeWidth={1.6} fill="none" />
            <Path d="M17 14C19 14.5 21 15.5 21 18" stroke={colors.muted} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          </Svg>
          <Text style={styles.tabLabel}>Divisions</Text>
        </TouchableOpacity>

      </View>

      {/* Modals */}
      <EventDetailsModal
        visible={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        canManageEvent={role === 'Executive' || (
          role === 'Coordinator'
          && !!divisionId
          && selectedEvent?.divisionId === divisionId
        )}
        onEdit={() => {
          if (!selectedEvent) return;
          setEditingEvent(selectedEvent);
          setSelectedEvent(null);
          setIsNewEventModalVisible(true);
        }}
        onDelete={confirmDeleteEvent}
        onAttachRundown={role === 'Executive' && onAttachRundown ? () => {
          if (selectedEvent) onAttachRundown(selectedEvent);
          setSelectedEvent(null);
        } : undefined}
      />

      <NewEventModal
        visible={isNewEventModalVisible}
        initialEvent={editingEvent}
        fixedDivisionId={role === 'Coordinator' ? divisionId : null}
        initialDate={formatLocalDate(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), selectedDay))}
        onClose={() => {
          setIsNewEventModalVisible(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  monthNav: {
    flexDirection: 'row',
    gap: 8,
  },
  navCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    shadowColor: colors.text,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekDayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  sundayText: {
    color: colors.error500,
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateSlot: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  dayTextSelected: {
    color: colors.surface,
    fontWeight: '800',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.secondary,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  dateEventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedDateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  eventCountBadge: {
    backgroundColor: colors.warning100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eventCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  timeCol: {
    width: 45,
    marginRight: 10,
  },
  timeStart: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  timeEnd: {
    fontSize: 11,
    color: colors.muted,
  },
  accentBar: {
    width: 3,
    height: 36,
    borderRadius: 1.5,
    backgroundColor: colors.secondary,
    marginRight: 12,
  },
  eventInfoCol: {
    flex: 1,
  },
  eventTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  divisionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 5,
  },
  divisionMetaText: {
    fontSize: 11,
    color: colors.muted,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },
  addEventBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  addEventBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
