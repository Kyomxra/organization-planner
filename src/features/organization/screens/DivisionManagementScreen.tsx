import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { Division, DivisionMember } from '../types/division';

interface DivisionManagementScreenProps {
  organizationName: string;
  divisions: Division[];
  members: DivisionMember[];
  onBack: () => void;
  onAssignMember: (memberId: string, divisionId: string | null) => void;
}

export function DivisionManagementScreen({
  organizationName,
  divisions,
  members,
  onBack,
  onAssignMember,
}: DivisionManagementScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState<DivisionMember | null>(null);

  const unassignedCount = members.filter((member) => !member.divisionId).length;
  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return members.filter((member) => {
      const matchesSearch = !query
        || member.name.toLowerCase().includes(query)
        || member.email.toLowerCase().includes(query);
      const matchesFilter = activeFilter === 'all'
        || (activeFilter === 'unassigned'
          ? !member.divisionId
          : member.divisionId === activeFilter);
      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, members, searchQuery]);

  const closeAssignment = () => setSelectedMember(null);

  const assignToDivision = (divisionId: string | null) => {
    if (!selectedMember) return;
    onAssignMember(selectedMember.id, divisionId);
    closeAssignment();
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="M15 18L9 12L15 6" fill="none" stroke={colors.text} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Division Management</Text>
          <Text style={styles.headerSubtitle}>{organizationName}</Text>
        </View>
        <View style={styles.executiveBadge}>
          <Text style={styles.executiveBadgeText}>EXECUTIVE</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Path d="M16 21V19C16 16.8 14.2 15 12 15H6C3.8 15 2 16.8 2 19V21M9 11C11.2 11 13 9.2 13 7S11.2 3 9 3 5 4.8 5 7 6.8 11 9 11ZM22 21V19C22 17.2 20.8 15.7 19 15.2M16 3.2C17.8 3.7 19 5.2 19 7S17.8 10.3 16 10.8" fill="none" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>Organize your team</Text>
            <Text style={styles.summarySubtitle}>Assign members to a division or move them anytime.</Text>
          </View>
          <View style={styles.summaryCount}>
            <Text style={styles.summaryCountValue}>{members.length}</Text>
            <Text style={styles.summaryCountLabel}>members</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Divisions</Text>
          <Text style={styles.sectionMeta}>{divisions.length} divisions</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.divisionCards}
        >
          {divisions.map((division) => {
            const count = members.filter((member) => member.divisionId === division.id).length;
            const isSelected = activeFilter === division.id;
            return (
              <TouchableOpacity
                key={division.id}
                style={[
                  styles.divisionCard,
                  isSelected && { borderColor: division.color },
                ]}
                onPress={() => setActiveFilter(isSelected ? 'all' : division.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.divisionDot, { backgroundColor: division.color }]} />
                <Text style={styles.divisionName} numberOfLines={1}>{division.name}</Text>
                <Text style={styles.divisionMemberCount}>
                  {count} {count === 1 ? 'member' : 'members'}
                </Text>
                <View style={styles.divisionProgressTrack}>
                  <View
                    style={[
                      styles.divisionProgress,
                      {
                        width: `${members.length ? Math.max((count / members.length) * 100, 8) : 0}%`,
                        backgroundColor: division.color,
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Members</Text>
            <Text style={styles.memberSectionSubtitle}>Manage division assignments</Text>
          </View>
          <TouchableOpacity
            style={[styles.unassignedFilter, activeFilter === 'unassigned' && styles.unassignedFilterActive]}
            onPress={() => setActiveFilter(activeFilter === 'unassigned' ? 'all' : 'unassigned')}
            activeOpacity={0.8}
          >
            <Text style={[styles.unassignedFilterText, activeFilter === 'unassigned' && styles.unassignedFilterTextActive]}>
              {unassignedCount} unassigned
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.searchIcon}>
            <Path d="M20 20L16.3 16.3M18 10.5A7.5 7.5 0 1 1 3 10.5A7.5 7.5 0 0 1 18 10.5Z" fill="none" stroke="#9698AA" strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search members"
            placeholderTextColor={colors.placeholder}
            style={styles.searchInput}
            accessibilityLabel="Search members"
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text style={styles.clearSearch}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.memberList}>
          {filteredMembers.map((member) => {
            const division = divisions.find((item) => item.id === member.divisionId);
            const initials = member.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
            return (
              <View key={member.id} style={styles.memberCard}>
                <View style={[styles.avatar, { backgroundColor: division?.backgroundColor ?? '#F0F1F7' }]}>
                  <Text style={[styles.avatarText, { color: division?.color ?? '#77798D' }]}>{initials}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                    {member.role === 'Coordinator' && (
                      <View style={styles.coordinatorBadge}>
                        <Text style={styles.coordinatorBadgeText}>COORDINATOR</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.memberEmail} numberOfLines={1}>{member.email}</Text>
                  <View style={styles.assignmentRow}>
                    <View style={[styles.assignmentDot, { backgroundColor: division?.color ?? '#B5B7C5' }]} />
                    <Text style={[styles.assignmentText, !division && styles.unassignedText]}>
                      {division?.name ?? 'Not assigned'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.assignButton, !division && styles.assignButtonPrimary]}
                  onPress={() => setSelectedMember(member)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${division ? 'Change division for' : 'Assign'} ${member.name}`}
                >
                  <Text style={[styles.assignButtonText, !division && styles.assignButtonTextPrimary]}>
                    {division ? 'Change' : 'Assign'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
          {filteredMembers.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No members found</Text>
              <Text style={styles.emptySubtitle}>Try another name or division filter.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedMember}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeAssignment}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAssignment} />
          <View style={styles.assignmentSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Assign to a division</Text>
                <Text style={styles.modalSubtitle}>{selectedMember?.name}</Text>
              </View>
              <TouchableOpacity onPress={closeAssignment} hitSlop={10} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>Choose where this member will contribute.</Text>
            <View style={styles.divisionOptions}>
              {divisions.map((division) => {
                const isCurrentDivision = selectedMember?.divisionId === division.id;
                return (
                  <TouchableOpacity
                    key={division.id}
                    style={[styles.divisionOption, isCurrentDivision && styles.divisionOptionSelected]}
                    onPress={() => assignToDivision(division.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: division.backgroundColor }]}>
                      <View style={[styles.optionDot, { backgroundColor: division.color }]} />
                    </View>
                    <Text style={styles.divisionOptionName}>{division.name}</Text>
                    {isCurrentDivision ? (
                      <Text style={[styles.currentLabel, { color: division.color }]}>CURRENT</Text>
                    ) : (
                      <Svg width={18} height={18} viewBox="0 0 24 24">
                        <Path d="M5 12H19M12 5L19 12L12 19" fill="none" stroke="#9698AA" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {!!selectedMember?.divisionId && (
              <TouchableOpacity style={styles.unassignButton} onPress={() => assignToDivision(null)} activeOpacity={0.8}>
                <Text style={styles.unassignButtonText}>Remove from current division</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FAFBFD',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  executiveBadge: {
    borderRadius: 8,
    backgroundColor: '#EEECFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginLeft: 8,
  },
  executiveBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 32,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    padding: 14,
    marginBottom: 24,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EEECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  summaryCopy: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 3,
  },
  summarySubtitle: {
    fontSize: 10,
    lineHeight: 15,
    color: colors.muted,
  },
  summaryCount: {
    alignItems: 'center',
    paddingLeft: 9,
  },
  summaryCountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  summaryCountLabel: {
    fontSize: 9,
    color: colors.muted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  sectionMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  divisionCards: {
    gap: 10,
    paddingBottom: 3,
    marginBottom: 22,
  },
  divisionCard: {
    width: 154,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    padding: 13,
  },
  divisionDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginBottom: 10,
  },
  divisionName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  divisionMemberCount: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: 11,
  },
  divisionProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F0F1F6',
    overflow: 'hidden',
  },
  divisionProgress: {
    height: '100%',
    borderRadius: 2,
  },
  memberSectionSubtitle: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
  },
  unassignedFilter: {
    borderRadius: 10,
    backgroundColor: '#FFF6EE',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  unassignedFilterActive: {
    backgroundColor: '#E87A35',
  },
  unassignedFilterText: {
    color: '#D87028',
    fontSize: 10,
    fontWeight: '800',
  },
  unassignedFilterTextActive: {
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    color: colors.text,
    fontSize: 12,
  },
  clearSearch: {
    fontSize: 20,
    color: colors.muted,
    paddingHorizontal: 3,
  },
  memberList: {
    gap: 9,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    paddingHorizontal: 11,
    paddingVertical: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  coordinatorBadge: {
    borderRadius: 5,
    backgroundColor: '#FFF1E6',
    paddingHorizontal: 5,
    paddingVertical: 3,
    marginLeft: 5,
  },
  coordinatorBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#D87028',
  },
  memberEmail: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 3,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  assignmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  assignmentText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text,
  },
  unassignedText: {
    color: colors.muted,
  },
  assignButton: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E3E4ED',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginLeft: 7,
  },
  assignButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  assignButtonText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  assignButtonTextPrimary: {
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 5,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(23, 24, 43, 0.45)',
  },
  assignmentSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E4ED',
    alignSelf: 'center',
    marginBottom: 17,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  modalClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F4F5F9',
  },
  modalCloseText: {
    color: colors.muted,
    fontSize: 21,
    lineHeight: 23,
  },
  modalHint: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 12,
    marginBottom: 12,
  },
  divisionOptions: {
    gap: 8,
  },
  divisionOption: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    paddingHorizontal: 11,
  },
  divisionOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FBFAFF',
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  divisionOptionName: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  currentLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  unassignButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 10,
  },
  unassignButtonText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },
});
