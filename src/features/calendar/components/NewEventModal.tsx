import React, { useEffect, useState } from 'react';
import {
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
import { colors } from '../../../theme/colors';
import { showMessage } from '../../auth/utils/feedback';
import { CalendarEvent, NewCalendarEvent } from '../types';
import { formatLocalDate } from '../../../lib/date';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(initialDate);
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visible) return;
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
    setTitle('');
    setDescription('');
    setStartDate(initialDate);
    setStartTime('09:00');
    setEndDate(initialDate);
    setEndTime('10:00');
    setNotes('');
  }, [initialDate, initialEvent, visible]);

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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{initialEvent ? 'Edit Event' : 'New Event'}</Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveCheckBtn} hitSlop={10}>
                <Svg width={14} height={14} viewBox="0 0 20 20">
                  <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
                    <TextInput
                      style={[styles.datePill, styles.datePillText]}
                      value={startDate}
                      onChangeText={setStartDate}
                      placeholder="YYYY-MM-DD"
                      autoCapitalize="none"
                      keyboardType="numbers-and-punctuation"
                    />
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
                    <TextInput
                      style={[styles.datePill, styles.datePillText]}
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="YYYY-MM-DD"
                      autoCapitalize="none"
                      keyboardType="numbers-and-punctuation"
                    />
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(23, 24, 43, 0.45)',
  },
  keyboardWrap: {
    width: '100%',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 40 : 26,
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
    color: '#85879A',
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
    backgroundColor: '#F7F6FF',
    borderWidth: 1,
    borderColor: '#E4E1FF',
    borderRadius: 14,
    padding: 12,
  },
  scopeTitle: { color: colors.primary, fontSize: 10, fontWeight: '800', marginBottom: 5 },
  scopeText: { color: colors.text, fontSize: 11 },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDEEF7',
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
    backgroundColor: '#F3F4FB',
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
    backgroundColor: '#EEECFF',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#EEECFF',
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
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEEF7',
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
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orangeAddText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E87A35',
    lineHeight: 16,
  },
  notesInput: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    padding: 0,
  },
});
