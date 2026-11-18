import React, { useCallback, useEffect, useState } from 'react';
import { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/ThemeContext';
import { formatLocalDate, isValidLocalDate } from '../../../lib/date';
import { supabase } from '../../../lib/supabase';
import { showMessage, showToast } from '../../auth/utils/feedback';
import { DivisionPerson, DivisionTask, TaskPriority, TaskStatus } from '../types';

interface TaskDetailsScreenProps {
  organizationId: string;
  divisionId: string | null;
  task: DivisionTask | null;
  readOnly?: boolean;
  canChooseDivision?: boolean;
  onBack: () => void;
  onSaved: () => void;
}

const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const statuses: TaskStatus[] = ['pending', 'ongoing', 'completed'];
const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getCalendarDays(year: number, month: number): Array<number | null> {
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Array<number | null> = Array(firstDayOffset).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) days.push(day);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function toLocalDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function BackButton({ onPress }: { onPress: () => void }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
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
  );
}

export function TaskDetailsScreen({
  organizationId,
  divisionId,
  task,
  readOnly = false,
  canChooseDivision = false,
  onBack,
  onSaved,
}: TaskDetailsScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [instructions, setInstructions] = useState(task?.instructions ?? '');
  const [dueDate, setDueDate] = useState(task?.due_at?.slice(0, 10) ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'pending');
  const [assigneeId, setAssigneeId] = useState(task?.assignee_user_id ?? '');
  const [taskDivisionId, setTaskDivisionId] = useState(task?.division_id ?? divisionId ?? '');
  const [divisions, setDivisions] = useState<Array<{ id: string; name: string }>>([]);
  const [members, setMembers] = useState<DivisionPerson[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const initialDate = task?.due_at ? new Date(`${task.due_at.slice(0, 10)}T12:00:00`) : new Date();
    return Number.isNaN(initialDate.getTime()) ? new Date() : initialDate;
  });
  const todayDate = formatLocalDate(new Date());
  const currentMonth = new Date();
  const isPreviousMonthDisabled = calendarMonth.getFullYear() < currentMonth.getFullYear()
    || (calendarMonth.getFullYear() === currentMonth.getFullYear()
      && calendarMonth.getMonth() <= currentMonth.getMonth());

  const openCalendar = () => {
    const initialDate = dueDate ? new Date(`${dueDate}T12:00:00`) : new Date();
    const dateToShow = !Number.isNaN(initialDate.getTime()) && dueDate >= todayDate
      ? initialDate
      : new Date();
    setCalendarMonth(new Date(dateToShow.getFullYear(), dateToShow.getMonth(), 1));
    setIsCalendarVisible(true);
  };

  const chooseDeadline = (day: number) => {
    const selectedDate = toLocalDateString(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    if (selectedDate < todayDate) return;
    setDueDate(selectedDate);
    setIsCalendarVisible(false);
  };

  const calendarDays = getCalendarDays(calendarMonth.getFullYear(), calendarMonth.getMonth());

  const loadMembers = useCallback(async () => {
    if (!taskDivisionId) {
      setMembers([]);
      return;
    }
    const { data: membershipRows, error } = await supabase
      .from('organization_members')
      .select('id, user_id, role')
      .eq('organization_id', organizationId)
      .eq('division_id', taskDivisionId)
      .eq('status', 'active')
      .eq('role', 'member');
    if (error) {
      showMessage('Could not load division members', error.message);
      return;
    }
    const userIds = (membershipRows ?? []).map((row) => row.user_id);
    const { data: profiles, error: profilesError } = userIds.length
      ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
      : { data: [], error: null };
    if (profilesError) {
      showMessage('Could not load division member profiles', profilesError.message);
      return;
    }
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    setMembers((membershipRows ?? []).map((row) => {
      const profile = profileById.get(row.user_id);
      return {
        membershipId: row.id,
        userId: row.user_id,
        name: profile?.full_name || profile?.email || 'Member',
        email: profile?.email ?? '',
        role: 'member' as const,
        assignedTasks: 0,
        completedTasks: 0,
      };
    }));
  }, [organizationId, taskDivisionId]);

  useEffect(() => {
    if (!readOnly) void loadMembers();
  }, [loadMembers, readOnly]);

  useEffect(() => {
    if (!canChooseDivision) return;
    let active = true;
    const loadDivisions = async () => {
      const { data, error } = await supabase
        .from('divisions')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name');
      if (!active) return;
      if (error) {
        showMessage('Could not load divisions', error.message);
        return;
      }
      setDivisions(data ?? []);
    };
    void loadDivisions();
    return () => { active = false; };
  }, [canChooseDivision, organizationId]);

  const save = async () => {
    if (readOnly) return;
    if (!title.trim()) {
      showMessage('Task title required', 'Enter a title for this task.');
      return;
    }
    if (dueDate && !isValidLocalDate(dueDate)) {
      showMessage('Invalid deadline', 'Use a valid YYYY-MM-DD date.');
      return;
    }
    const originalDueDate = task?.due_at?.slice(0, 10) ?? '';
    if (dueDate && dueDate < todayDate && dueDate !== originalDueDate) {
      showMessage('Past dates unavailable', 'Choose today or a future date for this task deadline.');
      return;
    }
    if (!taskDivisionId) {
      showMessage('Division required', 'Choose a division for this task.');
      return;
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showToast('error', 'Could not save task', userError?.message ?? 'Sign in again and retry.');
      return;
    }

    setIsSaving(true);
    const taskData = {
      organization_id: organizationId,
      division_id: taskDivisionId,
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      due_at: dueDate || null,
      priority,
      status,
      assignee_user_id: assigneeId || null,
    };
    const result = task
      ? await supabase.from('tasks').update(taskData).eq('id', task.id).select('id').maybeSingle()
      : await supabase.from('tasks').insert({ ...taskData, created_by: user.id }).select('id').single();
    setIsSaving(false);
    if (result.error) {
      showToast('error', 'Could not save task', result.error.message);
      return;
    }
    if (!result.data) {
      showToast('error', 'Could not save task', 'You may not have permission to change this task.');
      return;
    }
    showToast('success', task ? 'Task updated' : 'Task created', task ? 'Your changes have been saved.' : 'The task was created successfully.');
    onSaved();
  };

  if (readOnly && task) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <BackButton onPress={onBack} />
          <Text style={styles.headerTitle}>Task Details</Text>
          <View style={styles.spacer} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.readOnlyDescription}>{task.description || 'No description provided.'}</Text>
          <View style={styles.readOnlyCard}>
            <Text style={styles.label}>STATUS</Text>
            <Text style={styles.readOnlyValue}>{task.status}</Text>
            <Text style={styles.label}>PRIORITY</Text>
            <Text style={styles.readOnlyValue}>{task.priority}</Text>
            <Text style={styles.label}>DEADLINE</Text>
            <Text style={styles.readOnlyValue}>{task.due_at || 'No deadline'}</Text>
            <Text style={styles.label}>DIVISION</Text>
            <Text style={styles.readOnlyValue}>{task.division_name || 'Division'}</Text>
            <Text style={styles.label}>ASSIGNED TO</Text>
            <Text style={styles.readOnlyValue}>{task.assignee_name}</Text>
            <Text style={styles.label}>INSTRUCTIONS</Text>
            <Text style={styles.readOnlyDescription}>{task.instructions || 'No additional instructions.'}</Text>
            {task.progress_update ? (
              <>
                <Text style={styles.label}>LATEST PROGRESS UPDATE</Text>
                <Text style={styles.readOnlyDescription}>{task.progress_update}</Text>
              </>
            ) : null}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={styles.headerTitle}>{task ? 'Task Details' : 'New Task'}</Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>TASK TITLE</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="What needs to be done?" />
        <Text style={styles.label}>DESCRIPTION</Text>
        <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} multiline placeholder="Task summary" />
        <Text style={styles.label}>INSTRUCTIONS</Text>
        <TextInput style={[styles.input, styles.multiline]} value={instructions} onChangeText={setInstructions} multiline placeholder="Additional instructions" />
        <Text style={styles.label}>DIVISION</Text>
        {canChooseDivision ? (
          <View style={styles.chips}>
            {divisions.map((division) => (
              <TouchableOpacity
                key={division.id}
                style={[styles.chip, taskDivisionId === division.id && styles.chipActive]}
                onPress={() => setTaskDivisionId(division.id)}
              >
                <Text style={[styles.chipText, taskDivisionId === division.id && styles.chipTextActive]}>
                  {division.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.readOnlyValue}>
            {task?.division_id === taskDivisionId ? 'Assigned division' : 'Your assigned division'}
          </Text>
        )}
        <Text style={styles.label}>DEADLINE</Text>
        <TouchableOpacity
          style={styles.deadlineButton}
          onPress={openCalendar}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Choose task deadline"
        >
          <Text style={[styles.deadlineText, !dueDate && styles.deadlinePlaceholder]}>
            {dueDate || 'Select date'}
          </Text>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Rect x="3" y="4" width="18" height="18" rx="3" stroke={colors.primary} strokeWidth={2} fill="none" />
            <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.label}>PRIORITY</Text>
        <View style={styles.chips}>
          {priorities.map((value) => (
            <TouchableOpacity key={value} style={[styles.chip, priority === value && styles.chipActive]} onPress={() => setPriority(value)}>
              <Text style={[styles.chipText, priority === value && styles.chipTextActive]}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>ASSIGN TO DIVISION MEMBER</Text>
        <TouchableOpacity style={[styles.member, !assigneeId && styles.chipActive]} onPress={() => setAssigneeId('')}>
          <Text style={[styles.chipText, !assigneeId && styles.chipTextActive]}>Unassigned</Text>
        </TouchableOpacity>
        {members.map((member) => (
          <TouchableOpacity key={member.userId} style={[styles.member, assigneeId === member.userId && styles.chipActive]} onPress={() => setAssigneeId(member.userId)}>
            <Text style={[styles.chipText, assigneeId === member.userId && styles.chipTextActive]}>{member.name}</Text>
            <Text style={[styles.memberEmail, assigneeId === member.userId && styles.chipTextActive]}>{member.email}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.label}>STATUS</Text>
        <View style={styles.chips}>
          {statuses.map((value) => (
            <TouchableOpacity key={value} style={[styles.chip, status === value && styles.chipActive]} onPress={() => setStatus(value)}>
              <Text style={[styles.chipText, status === value && styles.chipTextActive]}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {task?.progress_update ? (
          <>
            <Text style={styles.label}>LATEST MEMBER UPDATE</Text>
            <View style={styles.progressCard}><Text style={styles.progressText}>{task.progress_update}</Text></View>
          </>
        ) : null}
        <TouchableOpacity style={styles.saveButton} disabled={isSaving} onPress={() => { void save(); }}>
          <Text style={styles.saveText}>{isSaving ? 'Saving…' : 'Save task'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isCalendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalendarVisible(false)}
      >
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarMonthRow}>
              <TouchableOpacity
                style={[styles.calendarArrow, isPreviousMonthDisabled && styles.calendarArrowDisabled]}
                disabled={isPreviousMonthDisabled}
                onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M15 18L9 12L15 6" stroke={colors.text} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                style={styles.calendarArrow}
                onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M9 18L15 12L9 6" stroke={colors.text} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekdays}>
              {weekdays.map((weekday, index) => (
                <Text key={`${weekday}-${index}`} style={styles.calendarWeekday}>{weekday}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                if (day === null) return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
                const dateValue = toLocalDateString(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                const isPast = dateValue < todayDate;
                const isSelected = dueDate === dateValue;
                return (
                  <TouchableOpacity
                    key={dateValue}
                    style={[
                      styles.calendarDayCell,
                      isPast && styles.calendarDayCellDisabled,
                    ]}
                    disabled={isPast}
                    onPress={() => chooseDeadline(day)}
                    accessibilityRole="button"
                    accessibilityLabel={dateValue}
                    accessibilityState={{ selected: isSelected, disabled: isPast }}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      isSelected && styles.calendarDayTextSelected,
                      isPast && styles.calendarDayTextDisabled,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarFooter}>
              <TouchableOpacity onPress={() => { setDueDate(''); setIsCalendarVisible(false); }} activeOpacity={0.7}>
                <Text style={styles.calendarClearText}>Clear date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarCloseButton}
                onPress={() => setIsCalendarVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.calendarCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  spacer: { width: 36, height: 36 },
  content: { padding: 20, paddingTop: 2, paddingBottom: 30 },
  label: { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: 15, marginBottom: 7 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, fontSize: 13 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  deadlineButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  deadlineText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  deadlinePlaceholder: { color: colors.muted, fontWeight: '400' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 14 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  chipTextActive: { color: colors.surface },
  member: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 11, marginBottom: 7 },
  memberEmail: { color: colors.muted, fontSize: 10, marginTop: 3 },
  progressCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
  progressText: { color: colors.text, fontSize: 12, lineHeight: 18 },
  title: { color: colors.text, fontSize: 21, fontWeight: '800', marginBottom: 8 },
  readOnlyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, marginTop: 16 },
  readOnlyValue: { color: colors.text, fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  readOnlyDescription: { color: colors.text, fontSize: 12, lineHeight: 18 },
  saveButton: { backgroundColor: colors.primary, padding: 14, borderRadius: 13, alignItems: 'center', marginTop: 22 },
  saveText: { color: colors.surface, fontWeight: '800', fontSize: 13 },
  calendarOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarArrowDisabled: { opacity: 0.4 },
  calendarMonthTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  calendarWeekdays: { flexDirection: 'row', marginBottom: 4 },
  calendarWeekday: {
    width: '14.2857%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    paddingVertical: 7,
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayCell: { width: '14.2857%', height: 38, alignItems: 'center', justifyContent: 'center' },
  calendarDayCellDisabled: { opacity: 0.45 },
  calendarDayText: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontSize: 12,
    color: colors.text,
  },
  calendarDayTextSelected: {
    backgroundColor: colors.primary,
    color: colors.surface,
    fontWeight: '800',
    lineHeight: 30,
  },
  calendarDayTextDisabled: {
    backgroundColor: colors.surfaceSubtle,
    color: colors.muted,
    fontWeight: '400',
  },
  calendarFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  calendarClearText: { fontSize: 12, fontWeight: '700', color: colors.primary, paddingVertical: 10, paddingHorizontal: 4 },
  calendarCloseButton: {
    minWidth: 92,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  calendarCloseText: { fontSize: 12, fontWeight: '800', color: colors.primary },
});