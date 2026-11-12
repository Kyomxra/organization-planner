import React, { useState } from 'react';
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { CalendarEvent } from '../types';

interface NewEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (newEvent: Partial<CalendarEvent>) => void;
  onOpenRundown?: () => void;
}

export function NewEventModal({ visible, onClose, onSave, onOpenRundown }: NewEventModalProps) {
  const [title, setTitle] = useState('Meeting Preparation for Pleno 1');
  const [description, setDescription] = useState(
    'Discuss the layout of the event and the division of committee tasks.'
  );
  const [startDate, setStartDate] = useState('5 Oct 2026');
  const [startTime, setStartTime] = useState('21.00');
  const [endDate, setEndDate] = useState('5 Oct 2026');
  const [endTime, setEndTime] = useState('22.00');
  const [hasLinkedRundown, setHasLinkedRundown] = useState(true);
  const [notes, setNotes] = useState('Write the notes for participants.');

  const handleSave = () => {
    onSave({
      title: title || 'New Event',
      description,
      startTime,
      endTime,
      dayOfMonth: 5,
      dateLabel: 'Monday, 5 October 2026',
      category: 'ORGANIZATION MEETING',
      orgName: 'Organization A',
      divisionName: 'Division A',
      duration: '1 hour',
      linkedRundown: hasLinkedRundown
        ? {
            title: 'Volunteer Appreciation Night',
            itemsCount: 8,
            timeRange: '18.30–21.00',
          }
        : undefined,
      notes,
    });
    onClose();
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
              <Text style={styles.headerTitle}>New Event</Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveCheckBtn} hitSlop={10}>
                <Svg width={14} height={14} viewBox="0 0 20 20">
                  <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
                    <View style={styles.datePill}>
                      <Text style={styles.datePillText}>{startDate}</Text>
                    </View>
                    <Text style={styles.timeText}>{startTime}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>End</Text>
                  <View style={styles.timePills}>
                    <View style={styles.datePill}>
                      <Text style={styles.datePillText}>{endDate}</Text>
                    </View>
                    <Text style={styles.timeText}>{endTime}</Text>
                  </View>
                </View>
              </View>

              {/* Card 3: Linked Rundown */}
              {hasLinkedRundown && (
                <View style={styles.rundownCard}>
                  <TouchableOpacity
                    style={styles.rundownLeft}
                    onPress={onOpenRundown}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rundownIconBox}>
                      <Svg width={18} height={18} viewBox="0 0 24 24">
                        <Path
                          d="M9 6H20M9 12H20M9 18H20M4 6V6.01M4 12V12.01M4 18V18.01"
                          stroke={colors.primary}
                          strokeWidth={2.4}
                          strokeLinecap="round"
                        />
                      </Svg>
                    </View>
                    <View style={styles.rundownTextCol}>
                      <Text style={styles.rundownTitle}>Volunteer Appreciation Night</Text>
                      <Text style={styles.rundownMeta}>8 items · 18.30–21.00</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.rundownActions}>
                    <TouchableOpacity
                      style={styles.syncBtn}
                      onPress={onOpenRundown}
                      hitSlop={8}
                    >
                      <Svg width={14} height={14} viewBox="0 0 24 24">
                        <Path
                          d="M23 4V10H17M1 20V14H7"
                          stroke="#E87A35"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                        <Path
                          d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15"
                          stroke="#E87A35"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      </Svg>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => setHasLinkedRundown(false)}
                      hitSlop={8}
                    >
                      <Text style={styles.removeIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Card 4: Notes */}
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
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
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
