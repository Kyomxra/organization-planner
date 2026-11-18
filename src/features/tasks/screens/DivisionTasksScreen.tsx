import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { supabase } from '../../../lib/supabase';
import { confirmAction, showMessage, showToast } from '../../auth/utils/feedback';
import { DivisionTask, TaskStatus } from '../types';

interface DivisionTasksScreenProps {
  organizationId: string;
  divisionId: string | null;
  assignedToUserId?: string;
  canCreateTask?: boolean;
  canDeleteTask?: (task: DivisionTask) => boolean;
  screenTitle?: string;
  onBack?: () => void;
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
  canDeleteTask,
  screenTitle,
  onBack,
  onCreateTask,
  onOpenTask,
}: DivisionTasksScreenProps) {
  const [tasks, setTasks] = useState<DivisionTask[]>([]);
  const [activeFilter, setActiveFilter] = useState<TaskStatus | 'all'>('all');
  const [activePriority, setActivePriority] = useState<DivisionTask['priority'] | 'all'>('all');
  const [isPriorityFilterVisible, setIsPriorityFilterVisible] = useState(false);
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
  const taskCountLabel = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;

  const deleteTask = async (task: DivisionTask) => {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id)
      .eq('organization_id', organizationId)
      .select('id')
      .maybeSingle();
    if (error) {
      showToast('error', 'Could not delete task', error.message);
      return;
    }
    if (!data) {
      showToast('error', 'Could not delete task', 'You may not have permission to delete this task.');
      return;
    }
    setTasks((current) => current.filter((item) => item.id !== task.id));
    showToast('success', 'Task deleted', 'The task was deleted successfully.');
  };

  const confirmDeleteTask = (task: DivisionTask) => {
    confirmAction(
      'Delete task?',
      `Are you sure you want to delete "${task.title}"? This cannot be undone.`,
      () => { void deleteTask(task); },
      'Delete',
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
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
        ) : null}
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{screenTitle ?? (memberView ? 'My Tasks' : 'Division Tasks')}</Text>
          <Text style={styles.subtitle}>{taskCountLabel}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.statusTabs}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={styles.statusTab}
            onPress={() => setActiveFilter(filter)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeFilter === filter }}
          >
            <View style={styles.statusTabContent}>
              <Text style={[styles.statusTabText, activeFilter === filter && styles.statusTabTextActive]}>
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
              {activeFilter === filter && <View style={styles.statusTabIndicator} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Filter by priority</Text>
        <TouchableOpacity
          style={[styles.priorityFilterButton, activePriority !== 'all' && styles.priorityFilterButtonActive]}
          onPress={() => setIsPriorityFilterVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Filter by priority, currently ${activePriority === 'all' ? 'any priority' : activePriority}`}
        >
          <Text style={[styles.priorityFilterText, activePriority !== 'all' && styles.priorityFilterTextActive]}>
            {activePriority === 'all' ? 'Any priority' : activePriority.charAt(0).toUpperCase() + activePriority.slice(1)}
          </Text>
          <Svg width={14} height={14} viewBox="0 0 24 24" style={styles.priorityFilterChevron}>
            <Path
              d="M6 9L12 15L18 9"
              fill="none"
              stroke={activePriority !== 'all' ? colors.primary : colors.muted}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.taskScroll} contentContainerStyle={styles.list}>
        {isLoading ? <Text style={styles.empty}>Loading tasks…</Text> : null}
        {!isLoading && !visibleTasks.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{memberView ? 'No assigned tasks' : 'No tasks here yet'}</Text>
            <Text style={styles.empty}>{memberView ? 'Tasks assigned to you will appear here.' : 'Create a task to get your division started.'}</Text>
          </View>
        ) : null}
        {visibleTasks.map((task) => (
          <View key={task.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <TouchableOpacity
                style={styles.taskMain}
                onPress={() => onOpenTask(task)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Open task ${task.title}`}
              >
                <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
                <Text style={[styles.priority, task.priority === 'urgent' && styles.urgent]}>
                  {task.priority.toUpperCase()}
                </Text>
              </TouchableOpacity>
              {canDeleteTask?.(task) ? (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => confirmDeleteTask(task)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${task.title}`}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24">
                    <Path
                      d="M3 6H5H21M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6H19Z"
                      fill="none"
                      stroke={colors.muted}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => onOpenTask(task)} activeOpacity={0.75}>
              <Text style={styles.description} numberOfLines={2}>{task.description || 'No description'}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{task.status.toUpperCase()}</Text>
                <Text style={styles.meta}>{task.due_at ? `Due ${task.due_at}` : 'No deadline'}</Text>
              </View>
              <Text style={styles.assignee}>{task.division_name}</Text>
              {!memberView && <Text style={styles.assignee}>Assigned to {task.assignee_name}</Text>}
              {task.progress_update ? <Text style={styles.progress} numberOfLines={2}>{task.progress_update}</Text> : null}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      {canCreateTask && onCreateTask ? (
        <TouchableOpacity style={styles.addButton} onPress={onCreateTask}>
          <Text style={styles.addButtonText}>+ Create task</Text>
        </TouchableOpacity>
      ) : null}
      <Modal
        visible={isPriorityFilterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPriorityFilterVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsPriorityFilterVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close priority filter"
          />
          <View style={styles.priorityFilterSheet}>
            {/* Drag Handle */}
            <View style={styles.handle} />
            <Text style={styles.priorityFilterTitle}>Filter by priority</Text>
            {priorities.map((priority) => (
              <TouchableOpacity
                key={priority}
                style={styles.priorityOption}
                onPress={() => {
                  setActivePriority(priority);
                  setIsPriorityFilterVisible(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: activePriority === priority }}
              >
                <View style={styles.priorityOptionLabel}>
                  {priority !== 'all' ? (
                    <View
                      style={[
                        styles.priorityDot,
                        priority === 'low' && styles.priorityDotLow,
                        priority === 'medium' && styles.priorityDotMedium,
                        priority === 'high' && styles.priorityDotHigh,
                        priority === 'urgent' && styles.priorityDotUrgent,
                      ]}
                    />
                  ) : null}
                  <Text style={[styles.priorityOptionText, activePriority === priority && styles.priorityOptionTextActive]}>
                    {priority === 'all' ? 'Any priority' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </View>
                {activePriority === priority ? <Text style={styles.prioritySelectedMark}>✓</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerCopy: { flex: 1 },
  headerSpacer: { width: 36 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  statusTabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusTab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  statusTabContent: {
    flex: 1,
    width: '100%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statusTabText: { color: colors.muted, fontWeight: '600', fontSize: 12, textTransform: 'capitalize' },
  statusTabTextActive: { color: colors.primary, fontWeight: '700' },
  statusTabIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  priorityFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  priorityFilterButtonActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  priorityFilterText: { color: colors.text, fontWeight: '700', fontSize: 11 },
  priorityFilterTextActive: { color: colors.primary },
  priorityFilterChevron: { marginLeft: 8 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  priorityFilterSheet: {
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
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  priorityFilterTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  priorityOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  priorityOptionLabel: { flexDirection: 'row', alignItems: 'center' },
  priorityOptionText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  priorityOptionTextActive: { color: colors.primary, fontWeight: '800' },
  prioritySelectedMark: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  priorityDot: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  priorityDotLow: { backgroundColor: colors.success500 },
  priorityDotMedium: { backgroundColor: colors.warning500 },
  priorityDotHigh: { backgroundColor: colors.warning400 },
  priorityDotUrgent: { backgroundColor: colors.error500 },
  taskScroll: { flex: 1 },
  list: { padding: 20, paddingBottom: 24, gap: 10 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskMain: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  taskTitle: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '800' },
  deleteButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  priority: { color: colors.primary, fontSize: 9, fontWeight: '800' },
  urgent: { color: colors.error500 },
  description: { color: colors.text, fontSize: 12, marginTop: 7, lineHeight: 18 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  meta: { color: colors.muted, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  assignee: { color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 8 },
  progress: { color: colors.muted, fontSize: 11, marginTop: 6 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 14 },
  empty: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 7 },
  addButton: { backgroundColor: colors.primary, margin: 20, marginTop: 0, borderRadius: 14, padding: 14, alignItems: 'center' },
  addButtonText: { color: colors.surface, fontSize: 13, fontWeight: '800' },
});