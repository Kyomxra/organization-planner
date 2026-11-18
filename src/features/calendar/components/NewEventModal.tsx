import React, { useEffect, useState } from 'react';
import { useMemo } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/ThemeContext';
import { showMessage } from '../../auth/utils/feedback';
import { CalendarEvent, NewCalendarEvent } from '../types';
import { formatLocalDate, isValidLocalDate } from '../../../lib/date';

type DatePickerTarget = 'start' | 'end';

const getCalendarDays = (year: number, month: number): Array<number | null> => {
  const mondayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days: Array<number | null> = Array(mondayOffset).fill(null);
  const count = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= count; day += 1) days.push(day);
  while (days.length % 7 !== 0) days.push(null);
  return days;
};

interface NewEventModalProps {
  visible: boolean;
  initialDate: string;
  initialEvent?: CalendarEvent | null;
  fixedDivisionId?: string | null;
  onClose: () => void;
  onSave: (newEvent: NewCalendarEvent) => Promise<boolean>;
}

export function NewEventModal({
  visible,
  initialDate,
  initialEvent,
  fixedDivisionId = null,
  onClose,
  onSave,
}: NewEventModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(initialDate);
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const todayDate = formatLocalDate(new Date());
  const calendarDays = getCalendarDays(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const calendarMonthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(calendarMonth);
  const currentMonth = new Date();
  const isPreviousMonthDisabled = calendarMonth.getFullYear() < currentMonth.getFullYear()
    || (calendarMonth.getFullYear() === currentMonth.getFullYear()
      && calendarMonth.getMonth() <= currentMonth.getMonth());

  useEffect(() => {
    if (!visible) {
      setDatePickerTarget(null);
      return;
    }
    setDatePickerTarget(null);
    if (initialEvent) {
      const start = new Date(initialEvent.startAt);
      const end = new Date(initialEvent.endAt);
      setTitle(initialEvent.title);
      setDescription(initialEvent.description);
      setStartDate(formatLocalDate(start));
      setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
      setEndDate(formatLocalDate(end));
      setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);
      setNotes(initialEvent.notes ?? '');
      return;
    }
    const defaultDate = isValidLocalDate(initialDate) && initialDate >= formatLocalDate(new Date())
      ? initialDate
      : formatLocalDate(new Date());
    setTitle('');
    setDescription('');
    setStartDate(defaultDate);
    setStartTime('09:00');
    setEndDate(defaultDate);
    setEndTime('10:00');
    setNotes('');
  }, [initialDate, initialEvent, visible]);

  const openDatePicker = (target: DatePickerTarget) => {
    Keyboard.dismiss();
    const selectedDate = target === 'start' ? startDate : endDate;
    const dateToShow = isValidLocalDate(selectedDate) && selectedDate >= todayDate
      ? new Date(`${selectedDate}T12:00:00`)
      : new Date();
    setCalendarMonth(new Date(dateToShow.getFullYear(), dateToShow.getMonth(), 1));
    setDatePickerTarget(target);
  };

  const chooseDate = (day: number) => {
    const selectedDate = formatLocalDate(new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day,
    ));
    if (selectedDate < todayDate) return;
    if (datePickerTarget === 'start') setStartDate(selectedDate);
    if (datePickerTarget === 'end') setEndDate(selectedDate);
    setDatePickerTarget(null);
  };

  const handleSave = async () => {
    const startAt = new Date(`${startDate}T${startTime}:00`);
    const endAt = new Date(`${endDate}T${endTime}:00`);
    if (!title.trim()) {
      showMessage('Title required', 'Enter a title for this event.');
      return;
    }
    const isValidDateTime = (date: string, time: string, parsed: Date) =>
      /^\d{4}-\d{2}-\d{2}$/.test(date)
      && /^\d{2}:\d{2}$/.test(time)
      && !Number.isNaN(parsed.getTime())
      && parsed.getFullYear() === Number(date.slice(0, 4))
      && parsed.getMonth() + 1 === Number(date.slice(5, 7))
      && parsed.getDate() === Number(date.slice(8, 10))
      && parsed.getHours() === Number(time.slice(0, 2))
      && parsed.getMinutes() === Number(time.slice(3, 5));

    if (!isValidDateTime(startDate, startTime, startAt) || !isValidDateTime(endDate, endTime, endAt)) {
      showMessage('Check date and time', 'Use YYYY-MM-DD for dates and HH:MM for times.');
      return;
    }
    const originalStartDate = initialEvent ? formatLocalDate(new Date(initialEvent.startAt)) : '';
    const originalEndDate = initialEvent ? formatLocalDate(new Date(initialEvent.endAt)) : '';
    if (
      (startDate < todayDate && startDate !== originalStartDate)
      || (endDate < todayDate && endDate !== originalEndDate)
    ) {
      showMessage('Past dates unavailable', 'Events must be scheduled for today or a future date.');
      return;
    }
    if (endAt <= startAt) {
      showMessage('Check event time', 'The end date and time must be after the start.');
      return;
    }

    const saved = await onSave({
      title: title.trim(),
      category: initialEvent?.category.toLowerCase() ?? 'organization meeting',
      description,
      notes,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    });
    if (saved) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardWrap}>
          <View style={styles.sheet}>
            {/* Drag Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{initialEvent ? 'Edit Event' : 'New Event'}</Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveCheckBtn} hitSlop={10}>
                <Svg width={14} height={14} viewBox="0 0 20 20">
                  <Path d="M4 10.5L8 14.5L16 6.5" stroke={colors.surface} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {fixedDivisionId ? (
                <View style={styles.scopeCard}>
                  <Text style={styles.scopeTitle}>DIVISION EVENT</Text>
                  <Text style={styles.scopeText}>This event will be added to your assigned division.</Text>
                </View>
              ) : null}
              {/* Card 1: Title & Description */}
              <View style={styles.card}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Title</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Event title"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.fieldInputMulti]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Event description"
                    placeholderTextColor={colors.placeholder}
                    multiline
                  />
                </View>
              </View>

              {/* Card 2: Date & Time */}
              <View style={styles.card}>
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Start</Text>
                  <View style={styles.timePills}>
                    <TouchableOpacity
                      style={[styles.datePill, styles.datePickerButton]}
                      onPress={() => openDatePicker('start')}
                      accessibilityRole="button"
                      accessibilityLabel="Choose event start date"
                    >
                      <Text style={styles.datePillText}>{startDate}</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.timeText, styles.timeInput]}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="HH:MM"
                      autoCapitalize="none"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>End</Text>
                  <View style={styles.timePills}>
                    <TouchableOpacity
                      style={[styles.datePill, styles.datePickerButton]}
                      onPress={() => openDatePicker('end')}
                      accessibilityRole="button"
                      accessibilityLabel="Choose event end date"
                    >
                      <Text style={styles.datePillText}>{endDate}</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.timeText, styles.timeInput]}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="HH:MM"
                      autoCapitalize="none"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.card}>
                <View style={styles.notesHeader}>
                  <View style={styles.notesHeaderLeft}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.noteIcon}>
                      <Path
                        d="M11 4H4C2.9 4 2 4.9 2 6V20C2 21.1 2.9 22 4 22H18C19.1 22 20 21.1 20 20V13"
                        stroke={colors.primary}
                        strokeWidth={2}
                        strokeLinecap="round"
                        fill="none"
                      />
                      <Path
                        d="M18.5 2.5C19.3 1.7 20.7 1.7 21.5 2.5C22.3 3.3 22.3 4.7 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
                        stroke={colors.primary}
                        strokeWidth={2}
                        fill="none"
                      />
                    </Svg>
                    <Text style={styles.notesTitle}>Notes</Text>
                  </View>
                  <TouchableOpacity style={styles.orangeAddBtn} hitSlop={8}>
                    <Text style={styles.orangeAddText}>+</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Write the notes for participants."
                  placeholderTextColor={colors.placeholder}
                  multiline
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
        {datePickerTarget && (
          <View style={styles.datePickerOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setDatePickerTarget(null)}
              accessibilityLabel="Close date picker"
            />
            <View style={styles.datePickerCard}>
              <View style={styles.datePickerHeader}>
                <View>
                  <Text style={styles.datePickerTitle}>
                    Choose {datePickerTarget === 'start' ? 'start' : 'end'} date
                  </Text>
                  <Text style={styles.datePickerSubtitle}>Past dates are unavailable</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setDatePickerTarget(null)}
                  style={styles.datePickerCloseButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close date picker"
                >
                  <Text style={styles.datePickerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerMonthNavigation}>
                <TouchableOpacity
                  style={[styles.datePickerMonthArrow, isPreviousMonthDisabled && styles.datePickerMonthArrowDisabled]}
                  disabled={isPreviousMonthDisabled}
                  onPress={() => setCalendarMonth((month) =>
                    new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                >
                  <Text style={styles.datePickerMonthArrowText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerMonthLabel}>{calendarMonthLabel}</Text>
                <TouchableOpacity
                  style={styles.datePickerMonthArrow}
                  onPress={() => setCalendarMonth((month) =>
                    new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                >
                  <Text style={styles.datePickerMonthArrowText}>›</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerGrid}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((weekday, index) => (
                  <View key={`${weekday}-${index}`} style={styles.datePickerCell}>
                    <Text style={styles.datePickerWeekday}>{weekday}</Text>
                  </View>
                ))}
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <View key={`empty-${index}`} style={styles.datePickerCell} />;
                  }
                  const dateValue = formatLocalDate(new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth(),
                    day,
                  ));
                  const isPast = dateValue < todayDate;
                  const selectedDate = datePickerTarget === 'start' ? startDate : endDate;
                  const isSelected = selectedDate === dateValue;
                  return (
                    <View key={dateValue} style={styles.datePickerCell}>
                      <TouchableOpacity
                        disabled={isPast}
                        style={[
                          styles.datePickerDay,
                          isSelected && styles.datePickerDaySelected,
                          isPast && styles.datePickerDayDisabled,
                        ]}
                        onPress={() => chooseDate(day)}
                        accessibilityRole="button"
                        accessibilityLabel={dateValue}
                        accessibilityState={{ selected: isSelected, disabled: isPast }}
                      >
                        <Text
                          style={[
                            styles.datePickerDayText,
                            isSelected && styles.datePickerDayTextSelected,
                            isPast && styles.datePickerDayTextDisabled,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  keyboardWrap: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  handle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  saveCheckBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 20,
    gap: 12,
  },
  scopeCard: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: 14,
    padding: 12,
  },
  scopeTitle: { color: colors.primary, fontSize: 10, fontWeight: '800', marginBottom: 5 },
  scopeText: { color: colors.text, fontSize: 11 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fieldLabel: {
    width: 85,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    paddingTop: 2,
  },
  fieldInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    padding: 0,
  },
  fieldInputMulti: {
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  timePills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  datePill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    width: 100,
    textAlign: 'center',
  },
  datePickerButton: {
    width: 100,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  timeInput: {
    width: 52,
    textAlign: 'center',
  },
  rundownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 12,
  },
  rundownLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rundownIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rundownTextCol: {
    flex: 1,
  },
  rundownTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  rundownMeta: {
    fontSize: 11,
    color: colors.muted,
  },
  rundownActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  syncBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '700',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteIcon: {
    marginRight: 6,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  orangeAddBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orangeAddText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    lineHeight: 16,
  },
  notesInput: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    padding: 0,
  },
  datePickerOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.overlay,
  },
  datePickerCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    padding: 20,
    backgroundColor: colors.surface,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  datePickerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  datePickerSubtitle: { marginTop: 4, fontSize: 11, color: colors.muted },
  datePickerCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerCloseText: { fontSize: 22, lineHeight: 24, color: colors.muted },
  datePickerMonthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  datePickerMonthArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  datePickerMonthArrowDisabled: { opacity: 0.4 },
  datePickerMonthArrowText: { fontSize: 25, lineHeight: 28, color: colors.text },
  datePickerMonthLabel: { fontSize: 14, fontWeight: '800', color: colors.text },
  datePickerGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  datePickerCell: {
    width: '14.2857%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerWeekday: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  datePickerDay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerDaySelected: { backgroundColor: colors.primary },
  datePickerDayDisabled: { backgroundColor: colors.surfaceSubtle },
  datePickerDayText: { fontSize: 12, color: colors.text },
  datePickerDayTextSelected: { color: colors.surface, fontWeight: '800' },
  datePickerDayTextDisabled: { color: colors.muted },
});
