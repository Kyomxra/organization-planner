import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { supabase } from '../../../lib/supabase';
import { showMessage } from '../../auth/utils/feedback';
import { formatLocalDate } from '../../../lib/date';
import { TaskStatus } from '../../tasks/types';

interface MemberDashboardScreenProps {
  organizationId: string;
  organizationName: string;
  divisionId: string | null;
  divisionName: string;
  userId: string;
  userName: string;
  onBackToOrganizations: () => void;
  onOpenTasks: () => void;
  onOpenCalendar: () => void;
  onOpenNotes: () => void;
  onOpenDivision: () => void;
  onOpenNotifications: () => void;
}

interface MemberTaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
  due_at: string | null;
}

interface MemberEventSummary {
  id: string;
  title: string;
  start_at: string;
  division_id: string | null;
}

interface AnnouncementSummary {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export function MemberDashboardScreen(props: MemberDashboardScreenProps) {
  const [tasks, setTasks] = useState<MemberTaskSummary[]>([]);
  const [events, setEvents] = useState<MemberEventSummary[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      setIsLoading(true);
      const now = new Date();
      const [taskResult, eventResult, announcementResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, status, due_at')
          .eq('organization_id', props.organizationId)
          .eq('assignee_user_id', props.userId)
          .order('due_at', { ascending: true, nullsFirst: false }),
        supabase
          .from('events')
          .select('id, title, start_at, division_id')
          .eq('organization_id', props.organizationId)
          .gte('start_at', now.toISOString())
          .order('start_at')
          .limit(4),
        supabase
          .from('notifications')
          .select('id, title, body, created_at')
          .eq('organization_id', props.organizationId)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);
      if (!active) return;
      if (taskResult.error || eventResult.error || announcementResult.error) {
        showMessage(
          'Could not load member dashboard',
          taskResult.error?.message
            ?? eventResult.error?.message
            ?? announcementResult.error?.message
            ?? 'Could not load your organization data.',
        );
        return;
      }
      setTasks((taskResult.data ?? []) as MemberTaskSummary[]);
      setEvents((eventResult.data ?? []) as MemberEventSummary[]);
      setAnnouncements((announcementResult.data ?? []) as AnnouncementSummary[]);
    };
    void loadDashboard().catch((error: unknown) => {
      if (active) {
        showMessage(
          'Could not load member dashboard',
          error instanceof Error ? error.message : 'Could not connect to Supabase.',
        );
      }
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [props.organizationId, props.userId]);

  const count = (status: TaskStatus) => tasks.filter((task) => task.status === status).length;
  const upcomingDeadlines = tasks
    .filter((task) => task.due_at && task.due_at >= formatLocalDate(new Date()) && task.status !== 'completed')
    .slice(0, 3);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={props.onBackToOrganizations} style={styles.backLink}>
        <Text style={styles.backLinkText}>‹ All organizations</Text>
      </TouchableOpacity>
      <Text style={styles.eyebrow}>{props.organizationName}</Text>
      <Text style={styles.greeting}>Hi, {props.userName}</Text>
      <Text style={styles.subtitle}>Member dashboard</Text>

      <TouchableOpacity style={styles.divisionCard} onPress={props.onOpenDivision}>
        <Text style={styles.divisionLabel}>YOUR DIVISION</Text>
        <Text style={styles.divisionName}>{props.divisionName || 'No division assigned'}</Text>
        <Text style={styles.divisionAction}>{props.divisionId ? 'View division and members  ›' : 'Contact an executive for a division assignment'}</Text>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My task summary</Text>
        <TouchableOpacity onPress={props.onOpenTasks}><Text style={styles.link}>My Tasks</Text></TouchableOpacity>
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming deadlines</Text>
        <TouchableOpacity onPress={props.onOpenTasks}><Text style={styles.link}>Tasks</Text></TouchableOpacity>
      </View>
      {upcomingDeadlines.length ? upcomingDeadlines.map((task) => (
        <TouchableOpacity key={task.id} style={styles.listCard} onPress={props.onOpenTasks}>
          <Text style={styles.cardTitle}>{task.title}</Text>
          <Text style={styles.cardMeta}>Due {task.due_at}</Text>
        </TouchableOpacity>
      )) : <View style={styles.emptyCard}><Text style={styles.emptyText}>No upcoming task deadlines.</Text></View>}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming events</Text>
        <TouchableOpacity onPress={props.onOpenCalendar}><Text style={styles.link}>Calendar</Text></TouchableOpacity>
      </View>
      {events.length ? events.map((event) => (
        <View key={event.id} style={styles.listCard}>
          <Text style={styles.cardTitle}>{event.title}</Text>
          <Text style={styles.cardMeta}>
            {new Date(event.start_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            {' · '}{event.division_id ? props.divisionName || 'My Division' : 'Organization-wide'}
          </Text>
        </View>
      )) : <View style={styles.emptyCard}><Text style={styles.emptyText}>No upcoming events.</Text></View>}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent announcements</Text>
        <TouchableOpacity onPress={props.onOpenNotifications}><Text style={styles.link}>All updates</Text></TouchableOpacity>
      </View>
      {announcements.length ? announcements.map((item) => (
        <TouchableOpacity key={item.id} style={styles.listCard} onPress={props.onOpenNotifications}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta} numberOfLines={2}>{item.body}</Text>
        </TouchableOpacity>
      )) : <View style={styles.emptyCard}><Text style={styles.emptyText}>No recent announcements.</Text></View>}

      <Text style={styles.sectionTitle}>Quick access</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryAction} onPress={props.onOpenTasks}>
          <Text style={styles.primaryActionText}>My Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={props.onOpenNotes}>
          <Text style={styles.secondaryActionText}>Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={props.onOpenCalendar}>
          <Text style={styles.secondaryActionText}>Calendar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 30 },
  backLink: { alignSelf: 'flex-start', marginBottom: 12 },
  backLinkText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  greeting: { color: colors.text, fontSize: 25, fontWeight: '800', marginTop: 5 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 3, marginBottom: 16 },
  divisionCard: { backgroundColor: colors.primary, borderRadius: 18, padding: 18, marginBottom: 16 },
  divisionLabel: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  divisionName: { color: colors.surface, fontSize: 20, fontWeight: '800', marginTop: 6 },
  divisionAction: { color: colors.primarySoft, fontSize: 11, marginTop: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 10 },
  link: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  statCard: { width: '48%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13 },
  statNumber: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
  listCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 13, marginBottom: 8 },
  cardTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  cardMeta: { color: colors.muted, fontSize: 10, marginTop: 5 },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 15 },
  emptyText: { color: colors.muted, fontSize: 11 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primaryAction: { backgroundColor: colors.primary, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12 },
  primaryActionText: { color: colors.surface, fontSize: 11, fontWeight: '800' },
  secondaryAction: { backgroundColor: colors.primarySoft, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12 },
  secondaryActionText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
});
