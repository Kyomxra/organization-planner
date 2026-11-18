import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { supabase } from '../../../lib/supabase';
import { showToast } from '../../auth/utils/feedback';
import { DivisionTask, TaskStatus } from '../types';

interface MemberTaskDetailsScreenProps {
  organizationId: string;
  userId: string;
  task: DivisionTask;
  onBack: () => void;
  onSaved: () => void;
}

const statuses: TaskStatus[] = ['pending', 'ongoing', 'completed'];

export function MemberTaskDetailsScreen({
  organizationId,
  userId,
  task,
  onBack,
  onSaved,
}: MemberTaskDetailsScreenProps) {
  const [status, setStatus] = useState(task.status);
  const [progressUpdate, setProgressUpdate] = useState(task.progress_update);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    const { data, error } = await supabase
      .from('tasks')
      .update({ status, progress_update: progressUpdate.trim() })
      .eq('organization_id', organizationId)
      .eq('id', task.id)
      .eq('assignee_user_id', userId)
      .select('id')
      .maybeSingle();
    setIsSaving(false);
    if (error || !data) {
      showToast('error', 'Could not update task', error?.message ?? 'This task is not assigned to your account.');
      return;
    }
    showToast('success', 'Task updated', 'Your task progress has been saved.');
    onSaved();
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>‹ My Tasks</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.description}>{task.description || 'No description provided.'}</Text>
        <View style={styles.infoCard}>
          <Text style={styles.label}>DEADLINE</Text>
          <Text style={styles.value}>{task.due_at || 'No deadline'}</Text>
          <Text style={styles.label}>PRIORITY</Text>
          <Text style={[styles.value, task.priority === 'urgent' && styles.urgent]}>
            {task.priority.toUpperCase()}
          </Text>
          <Text style={styles.label}>ASSIGNED TO</Text>
          <Text style={styles.value}>You</Text>
        </View>
        <Text style={styles.label}>INSTRUCTIONS</Text>
        <View style={styles.infoCard}>
          <Text style={styles.description}>{task.instructions || 'No additional instructions.'}</Text>
        </View>
        <Text style={styles.label}>UPDATE STATUS</Text>
        <View style={styles.statusRow}>
          {statuses.map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.statusChip, value === status && styles.statusChipActive]}
              onPress={() => setStatus(value)}
            >
              <Text style={[styles.statusText, value === status && styles.statusTextActive]}>
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>PROGRESS UPDATE</Text>
        <TextInput
          style={[styles.infoCard, styles.progressInput]}
          value={progressUpdate}
          onChangeText={setProgressUpdate}
          placeholder="Share a progress update"
          placeholderTextColor={colors.placeholder}
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.saveButton} disabled={isSaving} onPress={() => { void save(); }}>
          <Text style={styles.saveText}>{isSaving ? 'Saving…' : 'Save update'}</Text>
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
  spacer: { width: 54 },
  content: { padding: 20, paddingTop: 4, paddingBottom: 30 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  description: { color: colors.text, fontSize: 12, lineHeight: 18 },
  infoCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, marginTop: 8 },
  label: { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: 16, marginBottom: 4 },
  value: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  urgent: { color: colors.error500 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  statusChip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 14 },
  statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusText: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  statusTextActive: { color: colors.surface },
  progressInput: { minHeight: 90, color: colors.text, fontSize: 12, lineHeight: 18 },
  saveButton: { backgroundColor: colors.primary, padding: 14, borderRadius: 13, alignItems: 'center', marginTop: 20 },
  saveText: { color: colors.surface, fontWeight: '800', fontSize: 13 },
});
