import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { supabase } from '../../../lib/supabase';
import { showMessage } from '../../auth/utils/feedback';
import { DivisionTask, TaskStatus } from '../../tasks/types';

interface CoordinatorDashboardScreenProps {
  organizationId: string;
  organizationName: string;
  divisionId: string;
  divisionName: string;
  userName: string;
  onBackToOrganizations: () => void;
  onOpenTasks: () => void;
  onOpenMembers: () => void;
  onCreateTask: () => void;
  onOpenCalendar: () => void;
  onOpenNotes: () => void;
  onOpenNotifications: () => void;
}

interface UpcomingActivity {
  id: string;
  title: string;
  start_at: string;
  division_id: string | null;
}

type DashboardTask = Pick<
  DivisionTask,
  'id' | 'title' | 'status' | 'updated_at' | 'due_at' | 'progress_update' | 'assignee_user_id'
> & { assignee_name: string };

export function CoordinatorDashboardScreen(props: CoordinatorDashboardScreenProps) {
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<UpcomingActivity[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      setIsLoading(true);
      if (!props.divisionId) {
        setTasks([]);
        setUpcomingActivities([]);
        setMemberCount(0);
        setIsLoading(false);
        return;
      }
      const now = new Date();
      const [taskResult, eventResult, memberResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, status, updated_at, due_at, progress_update, assignee_user_id')
          .eq('organization_id', props.organizationId)
          .eq('division_id', props.divisionId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('events')
          .select('id, title, start_at, division_id')
          .eq('organization_id', props.organizationId)
          .eq('division_id', props.divisionId)
          .gte('start_at', now.toISOString())
          .order('start_at')
          .limit(5),
        supabase
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', props.organizationId)
          .eq('division_id', props.divisionId)
          .eq('status', 'active'),
      ]);
      if (taskResult.error || eventResult.error || memberResult.error) {
        showMessage(
          'Could not load division dashboard',
          taskResult.error?.message ?? eventResult.error?.message ?? memberResult.error?.message ?? 'Could not load division data.',
        );
        return;
      }
      if (!active) return;
      const assigneeIds = [...new Set((taskResult.data ?? [])
        .map((task) => task.assignee_user_id)
        .filter((id): id is string => Boolean(id)))];
      const { data: profiles, error: profilesError } = assigneeIds.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', assigneeIds)
        : { data: [], error: null };
      if (profilesError) {
        showMessage('Could not load division task members', profilesError.message);
        return;
      }
      if (!active) return;
      const names = new Map((profiles ?? []).map((profile) => [
        profile.id,
        profile.full_name || profile.email || 'Member',
      ]));
      setTasks((taskResult.data ?? []).map((task) => ({
        ...task,
        assignee_name: task.assignee_user_id ? names.get(task.assignee_user_id) ?? 'Member' : 'Unassigned',
      })));
      setUpcomingActivities((eventResult.data ?? []) as UpcomingActivity[]);
      setMemberCount(memberResult.count ?? 0);
    };
    void loadDashboard().catch((error: unknown) => {
      if (active) showMessage('Could not load division dashboard', error instanceof Error ? error.message : 'Could not connect to Supabase.');
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [props.divisionId, props.organizationId]);

  const count = (status: TaskStatus) => tasks.filter((task) => task.status === status).length;
  const completion = tasks.length ? Math.round((count('completed') / tasks.length) * 100) : 0;
  const latestActivity = tasks.slice(0, 3);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={props.onBackToOrganizations} style={styles.organizationBack}>
        <Text style={styles.organizationBackText}>‹ All organizations</Text>
      </TouchableOpacity>
      <Text style={styles.eyebrow}>{props.organizationName}</Text>
      <Text style={styles.greeting}>Hi, {props.userName}</Text>
      <Text style={styles.subtitle}>Coordinator dashboard</Text>

      <View style={styles.divisionCard}>
        <Text style={styles.divisionLabel}>YOUR DIVISION</Text>
        <Text style={styles.divisionName}>{props.divisionName || 'No division assigned'}</Text>
        <Text style={styles.memberCount}>{memberCount} active members</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Task overview</Text>
        <TouchableOpacity onPress={props.onOpenTasks}><Text style={styles.link}>View all</Text></TouchableOpacity>
      </View>
      <View style={styles.statsGrid}>
        {([
          ['Total', tasks.length],
          ['Pending', count('pending')],
          ['Ongoing', count('ongoing')],
          ['Completed', count('completed')],
        ] as const).map(([label, amount]) => (
          <TouchableOpacity key={label} style={styles.statCard} onPress={props.onOpenTasks}>
            <Text style={styles.statNumber}>{isLoading ? '—' : amount}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Division progress</Text>
          <Text style={styles.progressPercent}>{completion}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completion}%` }]} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming division activities</Text>
        <TouchableOpacity onPress={props.onOpenCalendar}><Text style={styles.link}>Calendar</Text></TouchableOpacity>
      </View>
      {upcomingActivities.length ? upcomingActivities.map((activity) => (
        <View key={activity.id} style={styles.activityCard}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityMeta}>
            {new Date(activity.start_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
        </View>
      )) : <View style={styles.emptyCard}><Text style={styles.emptyText}>No upcoming division activities.</Text></View>}

      <Text style={styles.sectionTitle}>Recent member updates</Text>
      {latestActivity.length ? latestActivity.map((task) => (
        <TouchableOpacity key={task.id} style={styles.activityCard} onPress={props.onOpenTasks}>
          <Text style={styles.activityTitle}>{task.title}</Text>
          <Text style={styles.activityMeta}>
            {task.assignee_name} · {task.progress_update || `Task ${task.status} · updated ${new Date(task.updated_at).toLocaleDateString()}`}
          </Text>
        </TouchableOpacity>
      )) : <View style={styles.emptyCard}><Text style={styles.emptyText}>No recent task updates.</Text></View>}

      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryAction} onPress={props.onCreateTask}><Text style={styles.primaryActionText}>+ Create task</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={props.onOpenMembers}><Text style={styles.secondaryActionText}>View members</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={props.onOpenNotes}><Text style={styles.secondaryActionText}>Division notes</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={props.onOpenNotifications}><Text style={styles.secondaryActionText}>Shared updates</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 30 },
  organizationBack: { alignSelf: 'flex-start', marginBottom: 12 },
  organizationBackText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  greeting: { color: colors.text, fontSize: 25, fontWeight: '800', marginTop: 5 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 3, marginBottom: 16 },
  divisionCard: { backgroundColor: colors.primary, borderRadius: 18, padding: 18, marginBottom: 16 },
  divisionLabel: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  divisionName: { color: colors.surface, fontSize: 20, fontWeight: '800', marginTop: 6 },
  memberCount: { color: colors.primarySoft, fontSize: 12, marginTop: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 10 },
  link: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  statCard: { width: '48%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13 },
  statNumber: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
  progressCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, marginTop: 9 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: colors.text, fontSize: 12, fontWeight: '700' },
  progressPercent: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 7, backgroundColor: colors.primarySoft, borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 7, backgroundColor: colors.primary, borderRadius: 4 },
  activityCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 13, marginBottom: 8 },
  activityTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  activityMeta: { color: colors.muted, fontSize: 10, marginTop: 5 },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 15 },
  emptyText: { color: colors.muted, fontSize: 11 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primaryAction: { backgroundColor: colors.primary, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12 },
  primaryActionText: { color: colors.surface, fontSize: 11, fontWeight: '800' },
  secondaryAction: { backgroundColor: colors.primarySoft, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12 },
  secondaryActionText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
});
