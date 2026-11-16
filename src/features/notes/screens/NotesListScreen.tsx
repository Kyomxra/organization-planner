import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
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
import { NoteAudience, NoteItem } from '../types';
import { supabase } from '../../../lib/supabase';

interface NotesListScreenProps {
  organizationId: string;
  organizationName: string;
  onBack: () => void;
  onOpenNewNote: () => void;
}

const filterTabs: NoteAudience[] = [
  'All',
  'Private',
  'Division',
  'Executive',
  'Coordinators',
  'Members',
];

const roleBadges = {
  executive: { label: 'Executive', type: 'executive' as const, bgColor: '#E6F4FF', textColor: '#2B88E8' },
  coordinator: { label: 'Coordinators', type: 'coordinators' as const, bgColor: '#FFF1E6', textColor: '#E87A35' },
  member: { label: 'Members', type: 'members' as const, bgColor: '#E8F8F2', textColor: '#2C9B76' },
};

export function NotesListScreen({
  organizationId,
  organizationName,
  onBack,
  onOpenNewNote,
}: NotesListScreenProps) {
  const [activeFilter, setActiveFilter] = useState<NoteAudience>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showMessage('Could not load notes', userError?.message ?? 'Sign in again and retry.');
      setIsLoading(false);
      return;
    }
    setCurrentUserId(user.id);
    const { data: noteRows, error } = await supabase
      .from('notes')
      .select('id, author_id, title, content, share_with_all_members, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      showMessage('Could not load notes', error.message);
      setIsLoading(false);
      return;
    }

    const noteIds = (noteRows ?? []).map((note) => note.id);
    const [roleResult, divisionResult] = noteIds.length
      ? await Promise.all([
          supabase.from('note_audience_roles').select('note_id, role').in('note_id', noteIds),
          supabase.from('note_audience_divisions').select('note_id, division_id').in('note_id', noteIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];

    if (roleResult.error || divisionResult.error) {
      showMessage('Could not load note audiences', roleResult.error?.message ?? divisionResult.error?.message ?? 'Could not load note audiences.');
      setIsLoading(false);
      return;
    }

    const divisionIds = [...new Set((divisionResult.data ?? []).map((row) => row.division_id))];
    const { data: divisionRows, error: divisionsError } = divisionIds.length
      ? await supabase.from('divisions').select('id, name').in('id', divisionIds)
      : { data: [], error: null };
    if (divisionsError) {
      showMessage('Could not load note divisions', divisionsError.message);
      setIsLoading(false);
      return;
    }

    const divisionNames = new Map((divisionRows ?? []).map((division) => [division.id, division.name]));
    setNotes((noteRows ?? []).map((note) => {
      const roles = (roleResult.data ?? []).filter((row) => row.note_id === note.id);
      const noteDivisions = (divisionResult.data ?? []).filter((row) => row.note_id === note.id);
      const badges: NoteItem['badges'] = [
        ...roles.flatMap((row) => row.role in roleBadges ? [roleBadges[row.role as keyof typeof roleBadges]] : []),
        ...noteDivisions.flatMap((row) => {
          const name = divisionNames.get(row.division_id);
          return name ? [{
            label: name,
            type: 'division' as const,
            bgColor: '#EEECFF',
            textColor: '#5145E8',
          }] : [];
        }),
        ...(note.share_with_all_members ? [{
          label: 'All Members',
          type: 'members' as const,
          bgColor: '#E8F8F2',
          textColor: '#2C9B76',
        }] : []),
      ];
      const audienceCategory: NoteAudience[] = ['All'];
      if (note.share_with_all_members) audienceCategory.push('Members');
      if (roles.some((row) => row.role === 'executive')) audienceCategory.push('Executive');
      if (roles.some((row) => row.role === 'coordinator')) audienceCategory.push('Coordinators');
      if (noteDivisions.length) audienceCategory.push('Division');
      if (!badges.length) {
        audienceCategory.push('Private');
        badges.push({ label: 'Private', type: 'private', bgColor: '#F0F1F7', textColor: '#5A5D75' });
      }

      return {
        id: note.id,
        authorId: note.author_id,
        title: note.title,
        content: note.content,
        dateLabel: new Date(note.created_at).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        badges,
        audienceCategory,
      };
    }));
    setIsLoading(false);
  }, [organizationId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const filteredNotes = notes.filter((note) => {
    const matchesFilter =
      activeFilter === 'All' ? true : note.audienceCategory.includes(activeFilter);
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('organization_id', organizationId);
    if (error) {
      showMessage('Could not delete note', error.message);
      return;
    }
    setNotes((current) => current.filter((note) => note.id !== noteId));
  };

  const confirmDeleteNote = (note: NoteItem) => {
    const onConfirm = () => { void deleteNote(note.id); };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Delete "${note.title}"? This cannot be undone.`)) onConfirm();
      return;
    }
    Alert.alert('Delete note?', `Delete "${note.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
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
          <View>
            <Text style={styles.headerTitle}>Notes</Text>
            <Text style={styles.headerSub}>{organizationName} · {notes.length} notes</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => setIsSearching((prev) => !prev)}
          hitSlop={8}
        >
          <Svg width={18} height={18} viewBox="0 0 20 20">
            <Circle cx="8.5" cy="8.5" r="5.5" stroke="#2D3142" strokeWidth={1.8} fill="none" />
            <Path d="M12.8 12.8L17 17" stroke="#2D3142" strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Inline Search Bar */}
      {isSearching && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Horizontal Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveFilter(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notes List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.notesList}>
          {!isLoading && filteredNotes.length === 0 && (
            <View style={styles.noteCard}>
              <Text style={styles.noteTitle}>No notes found</Text>
              <Text style={styles.noteBody}>
                {searchQuery || activeFilter !== 'All'
                  ? 'Try another search or audience filter.'
                  : 'Create a note to start sharing information with your organization.'}
              </Text>
            </View>
          )}
          {filteredNotes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteTopRow}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                {note.authorId === currentUserId && (
                  <TouchableOpacity
                    onPress={() => confirmDeleteNote(note)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${note.title}`}
                  >
                    <Svg width={16} height={16} viewBox="0 0 24 24">
                      <Path
                        d="M3 6H5H21M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6H19Z"
                        fill="none"
                        stroke="#85879A"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.noteBody}>{note.content}</Text>

              {/* Bottom Meta & Badges */}
              <View style={styles.noteBottomRow}>
                <View style={styles.dateMeta}>
                  <Svg width={12} height={12} viewBox="0 0 24 24" style={styles.calIcon}>
                    <Rect x="3" y="4" width="18" height="18" rx="3" stroke={colors.muted} strokeWidth={1.8} fill="none" />
                    <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.muted} strokeWidth={1.8} strokeLinecap="round" />
                  </Svg>
                  <Text style={styles.dateText}>{note.dateLabel}</Text>
                </View>

                <View style={styles.badgesWrap}>
                  {note.badges.map((b, idx) => (
                    <View key={idx} style={[styles.badgePill, { backgroundColor: b.bgColor }]}>
                      {b.type === 'executive' && (
                        <Svg width={10} height={10} viewBox="0 0 20 20" style={styles.badgeIcon}>
                          <Path d="M10 2L3 5V10C3 14.5 6 18 10 19C14 18 17 14.5 17 10V5L10 2Z" fill="none" stroke={b.textColor} strokeWidth={1.8} />
                          <Path d="M7 10L9 12L13 8" stroke={b.textColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </Svg>
                      )}
                      {b.type === 'coordinators' && (
                        <Svg width={10} height={10} viewBox="0 0 20 20" style={styles.badgeIcon}>
                          <Circle cx="8" cy="6" r="3" fill="none" stroke={b.textColor} strokeWidth={1.8} />
                          <Path d="M3 16 C3 13, 5 11, 8 11 C11 11, 13 13, 13 16" fill="none" stroke={b.textColor} strokeWidth={1.8} />
                          <Circle cx="15" cy="7" r="2.2" fill="none" stroke={b.textColor} strokeWidth={1.4} />
                        </Svg>
                      )}
                      {b.type === 'members' && (
                        <Svg width={10} height={10} viewBox="0 0 20 20" style={styles.badgeIcon}>
                          <Circle cx="10" cy="7" r="3.5" fill="none" stroke={b.textColor} strokeWidth={1.8} />
                          <Path d="M4 17 C4 13.5, 6.5 12, 10 12 C13.5 12, 16 13.5, 16 17" fill="none" stroke={b.textColor} strokeWidth={1.8} />
                        </Svg>
                      )}
                      {b.type === 'private' && (
                        <Svg width={10} height={10} viewBox="0 0 20 20" style={styles.badgeIcon}>
                          <Path d="M5 8V6A5 5 0 0 1 15 6V8" stroke={b.textColor} strokeWidth={1.8} fill="none" />
                          <Rect x="4" y="8" width="12" height="9" rx="2" stroke={b.textColor} strokeWidth={1.8} fill="none" />
                        </Svg>
                      )}
                      {b.type === 'division' && (
                        <Svg width={10} height={10} viewBox="0 0 20 20" style={styles.badgeIcon}>
                          <Path d="M4 3H16V17L10 13L4 17V3Z" stroke={b.textColor} strokeWidth={1.8} fill="none" />
                        </Svg>
                      )}
                      <Text style={[styles.badgeText, { color: b.textColor }]}>{b.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onOpenNewNote}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Create note"
      >
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path d="M12 5V19M5 12H19" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#FAFBFD',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#ECEEF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#ECEEF7',
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  clearSearch: {
    fontSize: 13,
    color: colors.muted,
    paddingHorizontal: 6,
  },
  tabsContainer: {
    paddingVertical: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E8F3',
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A5D75',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 90,
  },
  notesList: {
    gap: 12,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    shadowColor: '#24244A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  noteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  noteBody: {
    fontSize: 12,
    color: '#5A5D75',
    lineHeight: 18,
    marginBottom: 12,
  },
  noteBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calIcon: {
    marginRight: 5,
  },
  dateText: {
    fontSize: 11,
    color: colors.muted,
  },
  badgesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
