import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { showMessage } from '../../auth/utils/feedback';
import { Rundown, RundownItem } from '../types';

interface EditRundownScreenProps {
  rundown: Rundown | null;
  onBack: () => void;
  onSave: (rundown: Rundown) => void;
}

const makeInitialItems = (rundown: Rundown | null): RundownItem[] =>
  rundown?.items?.length
    ? rundown.items.map((item, index) => ({
        ...item,
        stepNumber: index + 1,
      }))
    : [
        {
          id: 'rd-1',
          stepNumber: 1,
          title: 'Guest arrival & registration',
          startTime: '18.30',
          durationMinutes: 20,
          description: 'Welcome desk opens; distribute name tags.',
          assigneeInitials: 'MC',
          assigneeName: 'Maya Chen',
        },
        {
          id: 'rd-2',
          stepNumber: 2,
          title: 'Opening remarks',
          startTime: '18.50',
          durationMinutes: 10,
          description: 'Host welcome, safety note, and event overview.',
          assigneeInitials: 'DK',
          assigneeName: 'Daniel Kim',
        },
        {
          id: 'rd-3',
          stepNumber: 3,
          title: 'Impact stories',
          startTime: '19.00',
          durationMinutes: 35,
          description: 'Three community partners share their stories.',
          assigneeInitials: 'PS',
          assigneeName: 'Priya Shah',
        },
        {
          id: 'rd-4',
          stepNumber: 4,
          title: 'Volunteer recognition',
          startTime: '19.35',
          durationMinutes: 25,
          description: 'Awards, photo moment, and thank-you presentation.',
          assigneeInitials: '',
          assigneeName: '',
        },
      ];

const toIsoDate = (value?: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // Supports the current display format, for example: Sat, 24 Oct 2026.
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  }
  return '';
};

const formatEventDate = (isoDate: string): string => {
  if (!isoDate) return 'Choose event date';
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getCalendarDays = (year: number, month: number): Array<number | null> => {
  const firstDay = new Date(year, month, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array(mondayOffset).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

export function EditRundownScreen({
  rundown,
  onBack,
  onSave,
}: EditRundownScreenProps) {
  const [items, setItems] = useState<RundownItem[]>(() =>
    makeInitialItems(rundown),
  );
  const [editingItem, setEditingItem] = useState<RundownItem | null>(null);
  const [eventDate, setEventDate] = useState(() =>
    toIsoDate(rundown?.eventDate) || '2026-10-24',
  );
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const initialDate = toIsoDate(rundown?.eventDate) || '2026-10-24';
    const [year, month] = initialDate.split('-').map(Number);
    return new Date(year, month - 1, 1);
  });

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');

  const calendarDays = useMemo(
    () => getCalendarDays(calendarMonth.getFullYear(), calendarMonth.getMonth()),
    [calendarMonth],
  );
  const calendarMonthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(calendarMonth);
  const selectedDateParts = eventDate.split('-').map(Number);

  useEffect(() => {
    setItems(makeInitialItems(rundown));
    const initialDate = toIsoDate(rundown?.eventDate) || '2026-10-24';
    setEventDate(initialDate);
    const [year, month] = initialDate.split('-').map(Number);
    setCalendarMonth(new Date(year, month - 1, 1));
  }, [rundown?.id]);

  const openItemEditor = (item?: RundownItem) => {
    const target: RundownItem = item ?? {
      id: `rd-${Date.now()}`,
      stepNumber: items.length + 1,
      title: '',
      startTime: '',
      durationMinutes: 0,
      description: '',
      assigneeInitials: '',
      assigneeName: '',
    };

    setEditingItem(target);
    setTitle(target.title);
    setStartTime(target.startTime);
    setDuration(target.durationMinutes ? String(target.durationMinutes) : '');
    setDescription(target.description);
    setAssignee(target.assigneeName);
  };

  const saveItem = () => {
    const cleanStartTime = startTime.trim();
    const cleanDuration = duration.trim();

    if (!title.trim()) {
      showMessage('Data belum lengkap', 'Judul item harus diisi.');
      return;
    }

    if (
      cleanStartTime &&
      !/^([01]?\d|2[0-3])[.:][0-5]\d$/.test(cleanStartTime)
    ) {
      showMessage(
        'Format waktu salah',
        'Gunakan format 18.30 atau 18:30, atau kosongkan kolomnya.',
      );
      return;
    }

    const numericDuration = cleanDuration ? Number(cleanDuration) : 0;

    if (
      cleanDuration &&
      (!Number.isFinite(numericDuration) || numericDuration <= 0)
    ) {
      showMessage(
        'Durasi tidak valid',
        'Masukkan angka durasi lebih dari 0, atau kosongkan kolomnya.',
      );
      return;
    }

    if (!editingItem) return;

    const initials = assignee
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const updatedItem: RundownItem = {
      ...editingItem,
      title: title.trim(),
      startTime: cleanStartTime.replace(':', '.'),
      durationMinutes: numericDuration,
      description: description.trim(),
      assigneeName: assignee.trim(),
      assigneeInitials: initials,
    };

    setItems((currentItems) => {
      const alreadyExists = currentItems.some(
        (item) => item.id === updatedItem.id,
      );

      const nextItems = alreadyExists
        ? currentItems.map((item) =>
            item.id === updatedItem.id ? updatedItem : item,
          )
        : [...currentItems, updatedItem];

      return nextItems.map((item, index) => ({
        ...item,
        stepNumber: index + 1,
      }));
    });

    setEditingItem(null);
  };

  const removeItem = (id: string) => {
    const deleteItem = () => {
      setItems((currentItems) =>
        currentItems
          .filter((item) => item.id !== id)
          .map((item, index) => ({
            ...item,
            stepNumber: index + 1,
          })),
      );
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Hapus item rundown ini?')) {
        deleteItem();
      }
      return;
    }

    Alert.alert('Hapus item?', 'Item rundown ini akan dihapus.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: deleteItem,
      },
    ]);
  };

  const saveRundown = () => {
    const savedRundown: Rundown = {
      ...(rundown ?? {
        id: `rd-${Date.now()}`,
        title: 'Untitled Rundown',
        eventDate: formatEventDate(eventDate),
        updatedLabel: 'Just now',
      }),
      eventDate: formatEventDate(eventDate),
      itemCount: items.length,
      updatedLabel: 'Just now',
      items,
    };

    onSave(savedRundown);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
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

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Edit Rundown</Text>
          <Text style={styles.headerSub}>
            Keep times and responsibilities up to date
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.eventContextCard}>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Title</Text>
            <Text style={styles.contextTitleValue}>
              {rundown?.title ?? 'Volunteer Appreciation Night'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Event</Text>
            <TouchableOpacity
              style={styles.eventDateButton}
              onPress={() => setCalendarVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Choose event date"
              activeOpacity={0.75}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path
                  d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.eventDateCopy}>
                <Text style={styles.eventDateText}>{formatEventDate(eventDate)}</Text>
                <Text style={styles.eventTimeContext}>Tap to change event date</Text>
              </View>
              <Text style={styles.dateChangeText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Rundown items</Text>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountBadgeText}>
              {items.length} ITEMS
            </Text>
          </View>
        </View>

        <View style={styles.itemsList}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
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

                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>{item.stepNumber}</Text>
                </View>

                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle}>{item.title}</Text>

                  <View style={styles.timeBadgesRow}>
                    {!!item.startTime && (
                      <View style={styles.timeBadgePurple}>
                        <Text style={styles.timeBadgePurpleText}>
                          {item.startTime}
                        </Text>
                      </View>
                    )}

                    {item.durationMinutes > 0 && (
                      <View style={styles.timeBadgeGrey}>
                        <Text style={styles.timeBadgeGreyText}>
                          {item.durationMinutes} min
                        </Text>
                      </View>
                    )}
                  </View>

                  {!!item.description && (
                    <Text style={styles.itemDescription}>
                      {item.description}
                    </Text>
                  )}

                  {!!item.assigneeName && (
                    <View style={styles.assigneeRow}>
                      <View style={styles.assigneeAvatar}>
                        <Text style={styles.assigneeInitials}>
                          {item.assigneeInitials}
                        </Text>
                      </View>
                      <Text style={styles.assigneeName}>
                        {item.assigneeName}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionCol}>
                  <TouchableOpacity
                    style={styles.iconCircleBtn}
                    onPress={() => openItemEditor(item)}
                    accessibilityLabel={`Edit ${item.title}`}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24">
                      <Path
                        d="M17 3A2.828 2.828 0 1 1 21 7L7.5 20.5 2 22l1.5-5.5L17 3z"
                        fill="none"
                        stroke="#2D3142"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconCircleBtn}
                    onPress={() => removeItem(item.id)}
                    accessibilityLabel={`Delete ${item.title}`}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24">
                      <Path
                        d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6h14ZM10 11v5M14 11v5"
                        fill="none"
                        stroke="#2D3142"
                        strokeWidth={1.8}
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

        <TouchableOpacity
          style={styles.addItemBtn}
          onPress={() => openItemEditor()}
          activeOpacity={0.8}
        >
          <Text style={styles.addItemBtnText}>＋ Add Rundown Item</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={onBack} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveRundown}
          activeOpacity={0.85}
        >
          <Svg
            width={14}
            height={14}
            viewBox="0 0 20 20"
            style={styles.saveCheckIcon}
          >
            <Path
              d="M4 10.5L8 14.5L16 6.5"
              stroke="#FFFFFF"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
          <Text style={styles.saveBtnText}>Save Rundown</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.calendarBackdrop}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <View>
                <Text style={styles.calendarTitle}>Choose event date</Text>
                <Text style={styles.calendarSubtitle}>Select the date for this rundown</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCalendarVisible(false)}
                style={styles.closeButton}
                accessibilityLabel="Close calendar"
              >
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.monthNavigation}>
              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                accessibilityLabel="Previous month"
              >
                <Text style={styles.monthArrowText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{calendarMonthLabel}</Text>
              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                accessibilityLabel="Next month"
              >
                <Text style={styles.monthArrowText}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((weekday, index) => (
                <View key={`${weekday}-${index}`} style={styles.calendarCell}>
                  <Text style={styles.weekdayText}>{weekday}</Text>
                </View>
              ))}
              {calendarDays.map((day, index) => {
                const isSelected = Boolean(
                  day && selectedDateParts.length === 3 &&
                  calendarMonth.getFullYear() === selectedDateParts[0] &&
                  calendarMonth.getMonth() + 1 === selectedDateParts[1] &&
                  day === selectedDateParts[2],
                );
                return (
                  <View key={`day-${index}`} style={styles.calendarCell}>
                    {day ? (
                      <TouchableOpacity
                        style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
                        onPress={() => {
                          const newDate = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          setEventDate(newDate);
                          setCalendarVisible(false);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${day} ${calendarMonthLabel}`}
                      >
                        <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>{day}</Text>
                      </TouchableOpacity>
                    ) : <View style={styles.calendarEmptyDay} />}
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.calendarCancelButton}
              onPress={() => setCalendarVisible(false)}
            >
              <Text style={styles.calendarCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!editingItem}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editorSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>
                  {items.some((item) => item.id === editingItem?.id)
                    ? 'Edit rundown item'
                    : 'Add rundown item'}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  Update agenda details and responsibility
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setEditingItem(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.inputLabel}>Item title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Opening remarks"
                style={styles.input}
              />

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.inputLabel}>Start time</Text>
                  <TextInput
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="Enter start time"
                    style={styles.input}
                  />
                </View>

                <View style={styles.formHalf}>
                  <Text style={styles.inputLabel}>Duration (minutes)</Text>
                  <TextInput
                    value={duration}
                    onChangeText={setDuration}
                    placeholder="Enter duration in minutes"
                    style={styles.input}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What will happen in this agenda item?"
                style={[styles.input, styles.multilineInput]}
                multiline
              />

              <Text style={styles.inputLabel}>Person responsible</Text>
              <TextInput
                value={assignee}
                onChangeText={setAssignee}
                placeholder="Name of committee member"
                style={styles.input}
              />

              <TouchableOpacity
                onPress={saveItem}
                style={styles.sheetSaveButton}
              >
                <Text style={styles.sheetSaveText}>Save Item</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 24,
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
  eventDateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 3,
  },
  eventDateCopy: {
    flex: 1,
  },
  dateChangeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
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
    fontSize: 8,
    fontWeight: '800',
    color: colors.primary,
  },
  assigneeName: {
    fontSize: 11,
    color: '#54566B',
  },
  actionCol: {
    gap: 8,
    marginLeft: 8,
  },
  iconCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  addItemBtn: {
    backgroundColor: '#EEECFF',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 2,
  },
  addItemBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECEEF7',
    backgroundColor: '#FAFBFD',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  cancelBtnText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 19,
    paddingVertical: 14,
    minWidth: 165,
  },
  saveCheckIcon: {
    marginRight: 7,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  calendarBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(19,20,42,0.48)',
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  calendarSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: colors.muted,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F8',
  },
  monthArrowText: {
    fontSize: 25,
    lineHeight: 28,
    color: colors.text,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.2857%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  calendarDay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDaySelected: {
    backgroundColor: colors.primary,
  },
  calendarDayText: {
    fontSize: 12,
    color: colors.text,
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calendarEmptyDay: {
    width: 34,
    height: 34,
  },
  calendarCancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F3F4F8',
  },
  calendarCancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(19,20,42,0.48)',
  },
  editorSheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9DBE8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sheetSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 22,
    lineHeight: 24,
    color: colors.muted,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 7,
    marginTop: 6,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    borderRadius: 11,
    paddingHorizontal: 12,
    color: colors.text,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    fontSize: 13,
  },
  multilineInput: {
    minHeight: 76,
    paddingTop: 11,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formHalf: {
    flex: 1,
  },
  sheetSaveButton: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  sheetSaveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});