import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { supabase } from '../../../lib/supabase';
import { showMessage } from '../../auth/utils/feedback';
import { DivisionPerson } from '../../tasks/types';

interface DivisionMembersScreenProps {
  organizationId: string;
  divisionId: string;
  divisionName: string;
  showTaskProgress?: boolean;
  screenTitle?: string;
}

export function DivisionMembersScreen({
  organizationId,
  divisionId,
  divisionName,
  showTaskProgress = true,
  screenTitle = 'Division Members',
}: DivisionMembersScreenProps) {
  const [members, setMembers] = useState<DivisionPerson[]>([]);
  const [selectedMember, setSelectedMember] = useState<DivisionPerson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadMembers = async () => {
      const { data: membershipRows, error } = await supabase
        .from('organization_members')
        .select('id, user_id, role')
        .eq('organization_id', organizationId)
        .eq('division_id', divisionId)
        .eq('status', 'active');
      if (error) {
        showMessage('Could not load division members', error.message);
        setIsLoading(false);
        return;
      }

      const userIds = (membershipRows ?? []).map((member) => member.user_id);
      const [profileResult, taskResult] = await Promise.all([
        userIds.length
          ? supabase.from('profiles').select('id, full_name, email').in('id', userIds)
          : { data: [], error: null },
        showTaskProgress ? supabase
          .from('tasks')
          .select('assignee_user_id, status')
          .eq('organization_id', organizationId)
          .eq('division_id', divisionId) : Promise.resolve({ data: [], error: null }),
      ]);
      if (profileResult.error || taskResult.error) {
        showMessage(
          'Could not load division details',
          profileResult.error?.message ?? taskResult.error?.message ?? 'Could not load member data.',
        );
        setIsLoading(false);
        return;
      }
      if (!active) return;

      const profiles = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));
      const tasks = taskResult.data ?? [];
      const rows = (membershipRows ?? []).map((member) => {
        const profile = profiles.get(member.user_id);
        const assignedTasks = tasks.filter((task) => task.assignee_user_id === member.user_id);
        return {
          membershipId: member.id,
          userId: member.user_id,
          name: profile?.full_name || profile?.email || 'Member',
          email: profile?.email ?? '',
          role: member.role as DivisionPerson['role'],
          assignedTasks: assignedTasks.length,
          completedTasks: assignedTasks.filter((task) => task.status === 'completed').length,
        };
      }).sort((a, b) => {
        const roleOrder = Number(b.role === 'coordinator') - Number(a.role === 'coordinator');
        return roleOrder || a.name.localeCompare(b.name);
      });
      setMembers(rows);
      setIsLoading(false);
    };

    void loadMembers().catch((error: unknown) => {
      if (active) {
        showMessage(
          'Could not load division members',
          error instanceof Error ? error.message : 'Could not connect to Supabase.',
        );
        setIsLoading(false);
      }
    });
    return () => { active = false; };
  }, [divisionId, organizationId, showTaskProgress]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{screenTitle}</Text>
        <Text style={styles.subtitle}>{divisionName} · {members.length} active members</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {isLoading ? <Text style={styles.empty}>Loading division members…</Text> : null}
        {!isLoading && !members.length ? <Text style={styles.empty}>No active members are assigned to this division.</Text> : null}
        {members.map((member) => (
          <TouchableOpacity key={member.membershipId} style={styles.memberCard} onPress={() => setSelectedMember(member)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{member.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberEmail}>{member.email}</Text>
              <Text style={styles.memberMeta}>
                {member.role === 'coordinator' ? 'Coordinator' : member.role === 'executive' ? 'Executive' : 'Member'}
                {showTaskProgress ? ` · ${member.completedTasks}/${member.assignedTasks} tasks complete` : ''}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedMember && (
        <View style={styles.detailsBackdrop}>
          <View style={styles.detailsCard}>
            <TouchableOpacity style={styles.close} onPress={() => setSelectedMember(null)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{selectedMember.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text style={styles.detailName}>{selectedMember.name}</Text>
            <Text style={styles.detailEmail}>{selectedMember.email}</Text>
            <Text style={styles.detailRole}>{selectedMember.role === 'coordinator' ? 'Coordinator' : selectedMember.role === 'executive' ? 'Executive' : 'Member'} · {divisionName}</Text>
            {showTaskProgress && <View style={styles.taskSummary}>
              <Text style={styles.taskCount}>{selectedMember.assignedTasks}</Text>
              <Text style={styles.detailEmail}>assigned tasks</Text>
              <Text style={styles.taskCount}>{selectedMember.completedTasks}</Text>
              <Text style={styles.detailEmail}>completed</Text>
            </View>}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  list: { padding: 20, gap: 9, paddingBottom: 30 },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  memberInfo: { flex: 1 },
  memberName: { color: colors.text, fontSize: 13, fontWeight: '800' },
  memberEmail: { color: colors.muted, fontSize: 10, marginTop: 3 },
  memberMeta: { color: colors.primary, fontSize: 10, marginTop: 6 },
  chevron: { color: colors.muted, fontSize: 24 },
  empty: { color: colors.muted, textAlign: 'center', fontSize: 13, marginTop: 24 },
  detailsBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay, justifyContent: 'center', padding: 24 },
  detailsCard: { backgroundColor: colors.surface, borderRadius: 22, padding: 22, alignItems: 'center' },
  close: { alignSelf: 'flex-end' },
  closeText: { color: colors.muted, fontSize: 16, fontWeight: '700' },
  avatarLarge: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  avatarLargeText: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  detailName: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 12 },
  detailEmail: { color: colors.muted, fontSize: 12, marginTop: 4 },
  detailRole: { color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 8 },
  taskSummary: { width: '100%', borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center', marginTop: 18, paddingTop: 14 },
  taskCount: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 4 },
});
