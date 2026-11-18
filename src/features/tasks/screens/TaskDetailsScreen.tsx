import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { isValidLocalDate } from '../../../lib/date';
import { supabase } from '../../../lib/supabase';
import { showMessage } from '../../auth/utils/feedback';
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

export function TaskDetailsScreen({
  organizationId,
  divisionId,
  task,
  readOnly = false,
  canChooseDivision = false,
  onBack,
  onSaved,
}: TaskDetailsScreenProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [instructions, setInstructions] = useState(task?.instructions ?? '');
  const [dueDate, setDueDate] = useState(task?.due_at ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'pending');
  const [assigneeId, setAssigneeId] = useState(task?.assignee_user_id ?? '');
  const [taskDivisionId, setTaskDivisionId] = useState(task?.division_id ?? divisionId ?? '');
  const [divisions, setDivisions] = useState<Array<{ id: string; name: string }>>([]);
  const [members, setMembers] = useState<DivisionPerson[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
    if (!taskDivisionId) {
      showMessage('Division required', 'Choose a division for this task.');
      return;
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showMessage('Could not save task', userError?.message ?? 'Sign in again and retry.');
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
      showMessage('Could not save task', result.error.message);
      return;
    }
    if (!result.data) {
      showMessage('Could not save task', 'You may not have permission to change this task.');
      return;
    }
    onSaved();
  };

  if (readOnly && task) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}><Text style={styles.back}>‹ Tasks</Text></TouchableOpacity>
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
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
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
        <Text style={styles.label}>DEADLINE (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="Optional" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  back: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  spacer: { width: 42 },
  content: { padding: 20, paddingTop: 2, paddingBottom: 30 },
  label: { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: 15, marginBottom: 7 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, fontSize: 13 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
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
});
