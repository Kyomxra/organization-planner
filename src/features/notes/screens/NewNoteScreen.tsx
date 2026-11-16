import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { showMessage } from '../../auth/utils/feedback';
import { AudienceSelection, NoteAudienceModal } from '../components/NoteAudienceModal';
import { supabase } from '../../../lib/supabase';

interface NewNoteScreenProps {
  organizationId: string;
  organizationName: string;
  onBack: () => void;
  onSaveSuccess?: () => void;
}

export function NewNoteScreen({
  organizationId,
  organizationName,
  onBack,
  onSaveSuccess,
}: NewNoteScreenProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audienceText, setAudienceText] = useState('Only Me');
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState(false);
  const [audienceSelection, setAudienceSelection] = useState<AudienceSelection>({
    isOnlyMe: true,
    isDivision: false,
    selectedDivisions: [],
    isExecutive: false,
    isCoordinators: false,
    isAllMembers: false,
  });
  const [divisions, setDivisions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
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
    return () => {
      active = false;
    };
  }, [organizationId]);

  const handleSave = async () => {
    if (!title.trim()) {
      showMessage('Title Required', 'Please enter a title for your note.');
      return;
    }
    if (audienceSelection.isDivision && audienceSelection.selectedDivisions.length === 0) {
      showMessage('Choose a division', 'Select at least one division or turn off division sharing.');
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showMessage('Could not save note', userError?.message ?? 'Sign in again and retry.');
      return;
    }

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        organization_id: organizationId,
        author_id: user.id,
        title: title.trim(),
        content: content.trim(),
        share_with_all_members: audienceSelection.isAllMembers,
      })
      .select('id')
      .single();

    if (error) {
      showMessage('Could not save note', error.message);
      return;
    }

    const roles = [
      ...(audienceSelection.isExecutive ? ['executive'] : []),
      ...(audienceSelection.isCoordinators ? ['coordinator'] : []),
    ];
    const audienceWrites = await Promise.all([
      roles.length
        ? supabase.from('note_audience_roles').insert(
            roles.map((role) => ({ organization_id: organizationId, note_id: note.id, role })),
          )
        : Promise.resolve({ error: null }),
      audienceSelection.selectedDivisions.length
        ? supabase.from('note_audience_divisions').insert(
            audienceSelection.selectedDivisions.map((divisionId) => ({
              organization_id: organizationId,
              note_id: note.id,
              division_id: divisionId,
            })),
          )
        : Promise.resolve({ error: null }),
    ]);

    const audienceError = audienceWrites.find((result) => result.error)?.error;
    if (audienceError) {
      const { error: rollbackError } = await supabase.from('notes').delete().eq('id', note.id);
      showMessage(
        'Could not save note audience',
        rollbackError
          ? `${audienceError.message} The note was created but could not be removed; review it in Notes. ${rollbackError.message}`
          : audienceError.message,
      );
      return;
    }

    showMessage('Note Saved', `Your note "${title.trim()}" is visible to ${audienceText}.`, () => {
      onSaveSuccess?.();
      onBack();
    });
  };

  const handleOpenAudienceModal = () => {
    setIsAudienceModalOpen(true);
  };

  const handleSaveAudience = (newSelection: AudienceSelection) => {
    setAudienceSelection(newSelection);
    if (newSelection.isOnlyMe) {
      setAudienceText('Only Me');
    } else {
      const parts: string[] = [];
      if (newSelection.isDivision) parts.push('Division');
      if (newSelection.isExecutive) parts.push('Executive');
      if (newSelection.isCoordinators) parts.push('Coordinators');
      if (newSelection.isAllMembers) parts.push('All Members');
      setAudienceText(parts.join(', ') || 'Only Me');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={10}>
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
        <Text style={styles.headerTitle}>New Note</Text>
        <TouchableOpacity style={styles.savePill} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.savePillText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Note Card */}
        <View style={styles.noteCard}>
          <View style={styles.titleRow}>
            <Text style={styles.titleLabel}>Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Add a note title"
              placeholderTextColor={colors.placeholder}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.divider} />

          <TextInput
            style={styles.contentInput}
            placeholder="Write your note..."
            placeholderTextColor={colors.placeholder}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Visible To / Audience Card */}
        <TouchableOpacity
          style={styles.visibleCard}
          onPress={handleOpenAudienceModal}
          activeOpacity={0.85}
        >
          <View style={styles.eyeIconBox}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M1 12S5 5 12 5S23 12 23 12S19 19 12 19S1 12 1 12Z"
                stroke={colors.primary}
                strokeWidth={2}
                fill="none"
              />
              <Circle cx="12" cy="12" r="3" stroke={colors.primary} strokeWidth={2} fill="none" />
            </Svg>
          </View>

          <View style={styles.visibleInfo}>
            <Text style={styles.visibleTitle}>Visible to</Text>
            <Text style={styles.visibleSub}>Choose who can access this note</Text>
          </View>

          <View style={styles.visiblePill}>
            <Svg width={12} height={12} viewBox="0 0 20 20" style={styles.lockIcon}>
              <Path d="M5 8V6A5 5 0 0 1 15 6V8" stroke="#5A5D75" strokeWidth={1.8} fill="none" />
              <Rect x="4" y="8" width="12" height="9" rx="2" stroke="#5A5D75" strokeWidth={1.8} fill="none" />
            </Svg>
            <Text style={styles.visiblePillText}>{audienceText}</Text>
          </View>

          <Svg width={14} height={14} viewBox="0 0 20 20" style={styles.chevronIcon}>
            <Path d="M7 4L13 10L7 16" fill="none" stroke="#8A8C9F" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </ScrollView>

      {/* Audience Modal */}
      <NoteAudienceModal
        visible={isAudienceModalOpen}
        onClose={() => setIsAudienceModalOpen(false)}
        selection={audienceSelection}
        divisions={divisions}
        organizationName={organizationName}
        onSave={handleSaveAudience}
      />
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FAFBFD',
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  savePill: {
    backgroundColor: '#EEECFF',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 16,
  },
  savePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    minHeight: 380,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleLabel: {
    width: 60,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  titleInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4FB',
    marginVertical: 14,
  },
  contentInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    padding: 0,
  },
  visibleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF7',
  },
  eyeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  visibleInfo: {
    flex: 1,
  },
  visibleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  visibleSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  visiblePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F1F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
  },
  lockIcon: {
    marginRight: 4,
  },
  visiblePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A5D75',
  },
  chevronIcon: {
    marginLeft: 2,
  },
});
