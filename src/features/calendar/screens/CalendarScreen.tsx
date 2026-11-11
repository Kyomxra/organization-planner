import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { CalendarEvent } from '../types';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { NewEventModal } from '../components/NewEventModal';

interface CalendarScreenProps {
  onSwitchTab: (tab: 'home' | 'calendar' | 'divisions' | 'profile') => void;
  onOpenRundown?: () => void;
}

const defaultEvent: CalendarEvent = {
  id: 'ev-1',
  title: 'Meeting Preparation for Pleno 1',
  category: 'ORGANIZATION MEETING',
  orgName: 'Organization A',
  divisionName: 'Division A',
  dayOfMonth: 5,
  month: 9,
  year: 2026,
  dateLabel: 'Monday, 5 October 2026',
  startTime: '21.00',
  endTime: '22.00',
  duration: '1 hour',
  description:
    'Align the event layout, confirm committee roles, and review the final preparation checklist.',
  linkedRundown: {
    title: 'Volunteer Appreciation Night',
    itemsCount: 8,
    timeRange: '18.30–21.00',
  },
  notes: 'Write the notes for participants.',
};

export function CalendarScreen({ onSwitchTab, onOpenRundown }: CalendarScreenProps) {
  const [selectedDay, setSelectedDay] = useState(5);
  const [events, setEvents] = useState<CalendarEvent[]>([defaultEvent]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isNewEventModalVisible, setIsNewEventModalVisible] = useState(false);

  // October 2026 starts on Thursday (index 3 if Monday is 0)
  // Mon Tue Wed Thu Fri Sat Sun
  // 1 is Thursday
  const daysInMonth = 31;
  const startDayOffset = 3; // Thu
  const eventDays = [1, 5, 9, 15, 20, 24];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const dayEvents = events.filter((e) => e.dayOfMonth === selectedDay);

  const handleAddEvent = (newEventData: Partial<CalendarEvent>) => {
    const newEv: CalendarEvent = {
      ...defaultEvent,
      ...newEventData,
      id: `ev-${Date.now()}`,
      dayOfMonth: selectedDay,
    };
    setEvents((prev) => [...prev, newEv]);
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>October 2026</Text>
          <Text style={styles.headerSubtitle}>6 events this month</Text>
        </View>
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navCircle} hitSlop={8}>
            <Svg width={14} height={14} viewBox="0 0 20 20">
              <Path d="M12 4L6 10L12 16" fill="none" stroke="#2D3142" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navCircle} hitSlop={8}>
            <Svg width={14} height={14} viewBox="0 0 20 20">
              <Path d="M8 4L14 10L8 16" fill="none" stroke="#2D3142" strokeWidth={2} strokeLinecap="round" />
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
              const hasEvent = eventDays.includes(dayNum);

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
            Monday, {selectedDay} Oct
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
                    {ev.orgName} · {ev.divisionName}
                  </Text>
                </View>
              </View>

              {/* Right Chevron */}
              <Svg width={14} height={14} viewBox="0 0 20 20">
                <Path d="M7 4L13 10L7 16" fill="none" stroke="#8A8C9F" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No Events yet</Text>
          </View>
        )}

        {/* Add Event Button */}
        <TouchableOpacity
          style={styles.addEventBtn}
          onPress={() => setIsNewEventModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.addEventBtnText}>+ Add Event</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, styles.tabItemActive]} onPress={() => onSwitchTab('calendar')}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Rect x="3" y="4" width="18" height="18" rx="3" stroke={colors.primary} strokeWidth={2} fill="none" />
            <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => onSwitchTab('home')}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="M3 10.5L12 3L21 10.5V20C21 20.6 20.6 21 20 21H4C3.4 21 3 20.6 3 20V10.5Z" fill="none" stroke="#8A8C9F" strokeWidth={1.8} strokeLinejoin="round" />
            <Path d="M9 21V12H15V21" fill="none" stroke="#8A8C9F" strokeWidth={1.8} />
          </Svg>
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => onSwitchTab('divisions')}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Circle cx="9" cy="7" r="4" stroke="#8A8C9F" strokeWidth={1.8} fill="none" />
            <Path d="M2 19C2 15.5 5 13.5 9 13.5C13 13.5 16 15.5 16 19" stroke="#8A8C9F" strokeWidth={1.8} fill="none" strokeLinecap="round" />
            <Circle cx="18" cy="8" r="3" stroke="#8A8C9F" strokeWidth={1.6} fill="none" />
            <Path d="M17 14C19 14.5 21 15.5 21 18" stroke="#8A8C9F" strokeWidth={1.6} fill="none" strokeLinecap="round" />
          </Svg>
          <Text style={styles.tabLabel}>Divisions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => onSwitchTab('profile')}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Circle cx="12" cy="8" r="4" stroke="#8A8C9F" strokeWidth={1.8} fill="none" />
            <Path d="M4 20C4 16 7.5 14 12 14C16.5 14 20 16 20 20" stroke="#8A8C9F" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          </Svg>
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <EventDetailsModal
        visible={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <NewEventModal
        visible={isNewEventModalVisible}
        onClose={() => setIsNewEventModalVisible(false)}
        onSave={handleAddEvent}
        onOpenRundown={onOpenRundown}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#FAFBFD',
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
    paddingTop: 10,
    paddingBottom: 110,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    marginBottom: 20,
    shadowColor: '#24244A',
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
    color: '#5A5D75',
  },
  sundayText: {
    color: '#E45B66',
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
    backgroundColor: '#4436DF',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E87A35',
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4FB',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E87A35',
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
    backgroundColor: '#FFF2E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eventCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E87A35',
    letterSpacing: 0.4,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF7',
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
    backgroundColor: '#E87A35',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF7',
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEEF7',
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
    backgroundColor: '#F3F2FF',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8A8C9F',
    marginTop: 3,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
