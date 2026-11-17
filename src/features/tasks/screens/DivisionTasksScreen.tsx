import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { supabase } from '../../../lib/supabase';
import { showMessage } from '../../auth/utils/feedback';
import { DivisionTask, TaskStatus } from '../types';

interface DivisionTasksScreenProps {
  organizationId: string;
  divisionId: string | null;
  assignedToUserId?: string;
  canCreateTask?: boolean;
  screenTitle?: string;
  onCreateTask?: () => void;
  onOpenTask: (task: DivisionTask) => void;
}

const filters: Array<TaskStatus | 'all'> = ['all', 'pending', 'ongoing', 'completed'];
const priorities: Array<DivisionTask['priority'] | 'all'> = ['all', 'low', 'medium', 'high', 'urgent'];

export function DivisionTasksScreen({
  organizationId,
  divisionId,
  assignedToUserId,
  canCreateTask = assignedToUserId === undefined,
  screenTitle,
  onCreateTask,
  onOpenTask,
}: DivisionTasksScreenProps) {
  const [tasks, setTasks] = useState<DivisionTask[]>([]);
  const [activeFilter, setActiveFilter] = useState<TaskStatus | 'all'>('all');
  const [activePriority, setActivePriority] = useState<DivisionTask['priority'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('tasks')
      .select('id, organization_id, division_id, title, description, instructions, due_at, priority, status, progress_update, assignee_user_id, updated_at')
      .eq('organization_id', organizationId)
      .order('due_at', { ascending: true, nullsFirst: false });
    if (assignedToUserId !== undefined) {
      query = query.eq('assignee_user_id', assignedToUserId);
    } else if (divisionId) {
      query = query.eq('division_id', divisionId);
    }
    const { data, error } = await query;
    if (error) {
      showMessage(assignedToUserId ? 'Could not load your tasks' : 'Could not load division tasks', error.message);
      setIsLoading(false);
      return;
    }

    const userIds = [...new Set((data ?? [])
      .map((task) => task.assignee_user_id)
      .filter((id): id is string => Boolean(id)))];
    const divisionIds = [...new Set((data ?? []).map((task) => task.division_id))];
    const [profileResult, divisionResult] = await Promise.all([
      userIds.length
        ? supabase.from('profiles').select('id, full_name, email').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      divisionIds.length
        ? supabase.from('divisions').select('id, name').in('id', divisionIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (profileResult.error || divisionResult.error) {
      showMessage(
        'Could not load task details',
        profileResult.error?.message ?? divisionResult.error?.message ?? 'Could not load task details.',
      );
      setIsLoading(false);
      return;
    }
    const profileNames = new Map((profileResult.data ?? []).map((profile) => [
      profile.id,
      profile.full_name || profile.email || 'Member',
    ]));
    const divisionNames = new Map((divisionResult.data ?? []).map((division) => [
      division.id,
      division.name,
    ]));
    setTasks((data ?? []).map((task) => ({
      ...task,
      priority: task.priority as DivisionTask['priority'],
      status: task.status as TaskStatus,
      division_name: divisionNames.get(task.division_id) ?? 'Division',
      assignee_name: task.assignee_user_id
        ? profileNames.get(task.assignee_user_id) ?? 'Member'
        : 'Unassigned',
    })));
    setIsLoading(false);
  }, [assignedToUserId, divisionId, organizationId]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const visibleTasks = tasks.filter((task) =>
    (activeFilter === 'all' || task.status === activeFilter)
    && (activePriority === 'all' || task.priority === activePriority)
  );
  const memberView = assignedToUserId !== undefined;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{screenTitle ?? (memberView ? 'My Tasks' : 'Division Tasks')}</Text>
        <Text style={styles.subtitle}>{tasks.length} tasks</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter === 'all' ? 'All' : filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {priorities.map((priority) => (
          <TouchableOpacity
            key={priority}
            style={[styles.filterChip, activePriority === priority && styles.filterChipActive]}
            onPress={() => setActivePriority(priority)}
          >
            <Text style={[styles.filterText, activePriority === priority && styles.filterTextActive]}>
              {priority === 'all' ? 'Any priority' : priority}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.list}>
        {isLoading ? <Text style={styles.empty}>Loading tasks…</Text> : null}
        {!isLoading && !visibleTasks.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{memberView ? 'No assigned tasks' : 'No tasks here yet'}</Text>
            <Text style={styles.empty}>{memberView ? 'Tasks assigned to you will appear here.' : 'Create a task to get your division started.'}</Text>
          </View>
        ) : null}
        {visibleTasks.map((task) => (
          <TouchableOpacity key={task.id} style={styles.card} onPress={() => onOpenTask(task)}>
            <View style={styles.cardHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={[styles.priority, task.priority === 'urgent' && styles.urgent]}>
                {task.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.description} numberOfLines={2}>{task.description || 'No description'}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{task.status.toUpperCase()}</Text>
              <Text style={styles.meta}>{task.due_at ? `Due ${task.due_at}` : 'No deadline'}</Text>
            </View>
            <Text style={styles.assignee}>{task.division_name}</Text>
            {!memberView && <Text style={styles.assignee}>Assigned to {task.assignee_name}</Text>}
            {task.progress_update ? <Text style={styles.progress} numberOfLines={2}>{task.progress_update}</Text> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
      {canCreateTask && onCreateTask ? (
        <TouchableOpacity style={styles.addButton} onPress={onCreateTask}>
          <Text style={styles.addButtonText}>+ Create task</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFBFD' },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  filters: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  filterChip: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, paddingVertical: 7, paddingHorizontal: 13, borderRadius: 16 },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.muted, fontWeight: '700', fontSize: 11, textTransform: 'capitalize' },
  filterTextActive: { color: '#FFFFFF' },
  list: { padding: 20, paddingBottom: 24, gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  taskTitle: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '800' },
  priority: { color: colors.primary, fontSize: 9, fontWeight: '800' },
  urgent: { color: colors.danger },
  description: { color: '#5A5D75', fontSize: 12, marginTop: 7, lineHeight: 18 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  meta: { color: colors.muted, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  assignee: { color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 8 },
  progress: { color: colors.muted, fontSize: 11, marginTop: 6 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 14 },
  empty: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 7 },
  addButton: { backgroundColor: colors.primary, margin: 20, marginTop: 0, borderRadius: 14, padding: 14, alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
