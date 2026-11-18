import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useAuthFlow } from '../features/auth/hooks/useAuthFlow';
import { SplashScreen } from '../features/auth/screens/SplashScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../features/auth/screens/ResetPasswordScreen';
import { ToastHost } from '../features/auth/components/ToastHost';
import { ConfirmationHost } from '../features/auth/components/ConfirmationHost';

import { useOrganizationFlow } from '../features/organization/hooks/useOrganizationFlow';
import { OrganizationListScreen } from '../features/organization/screens/OrganizationListScreen';
import { CreateOrganizationScreen } from '../features/organization/screens/CreateOrganizationScreen';
import { OrganizationStatusModal } from '../features/organization/components/OrganizationStatusModal';
import { JoinOrganizationModal } from '../features/organization/components/JoinOrganizationModal';
import { OrganizationCreatedModal } from '../features/organization/components/OrganizationCreatedModal';
import { InvitesModal } from '../features/organization/components/InvitesModal';
import { DivisionManagementScreen } from '../features/organization/screens/DivisionManagementScreen';
import { Division, DivisionMember } from '../features/organization/types/division';

import { DashboardHomeScreen } from '../features/dashboard/screens/DashboardHomeScreen';
import { CalendarScreen } from '../features/calendar/screens/CalendarScreen';
import { CalendarEvent } from '../features/calendar/types';
import { DivisionMembersScreen } from '../features/organization/screens/DivisionMembersScreen';
import { BudgetingScreen } from '../features/budgeting/screens/BudgetingScreen';
import { RundownListScreen } from '../features/rundown/screens/RundownListScreen';
import { RundownDetailsScreen } from '../features/rundown/screens/RundownDetailsScreen';
import { EditRundownScreen } from '../features/rundown/screens/EditRundownScreen';
import { SelectRundownScreen } from '../features/rundown/screens/SelectRundownScreen';
import { NotesListScreen } from '../features/notes/screens/NotesListScreen';
import { NewNoteScreen } from '../features/notes/screens/NewNoteScreen';
import { NoteItem } from '../features/notes/types';
import { NotificationScreen } from '../features/notifications/screens/NotificationScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { DivisionTasksScreen } from '../features/tasks/screens/DivisionTasksScreen';
import { TaskDetailsScreen } from '../features/tasks/screens/TaskDetailsScreen';
import { DivisionTask } from '../features/tasks/types';
import { showMessage, showToast } from '../features/auth/utils/feedback';
import { Rundown } from '../features/rundown/types';
import { supabase } from '../lib/supabase';

type DivisionRow = {
  id: string;
  name: string;
};

type OrganizationMemberRow = {
  id: string;
  user_id: string;
  division_id: string | null;
  role: string;
};

type ProfileRow = { id: string; full_name: string | null; email: string | null };

type ActiveView =
  | 'org-list'
  | 'create-org'
  | 'dashboard'
  | 'coordinator-home'
  | 'coordinator-tasks'
  | 'coordinator-members'
  | 'coordinator-task-edit'
  | 'member-home'
  | 'member-tasks'
  | 'member-task-details'
  | 'member-division'
  | 'organization-tasks'
  | 'task-details'
  | 'divisions'
  | 'calendar'
  | 'budgeting'
  | 'budgeting-add-expense'
  | 'rundown-list'
  | 'rundown-details'
  | 'rundown-edit'
  | 'rundown-select'
  | 'notes-list'
  | 'notes-new'
  | 'notifications'
  | 'profile';

export function RootFlow() {
  const auth = useAuthFlow();
  const org = useOrganizationFlow();
  const [activeView, setActiveView] = useState<ActiveView>('org-list');
  const [isInvitesModalVisible, setIsInvitesModalVisible] = useState(false);
  const [selectedRundown, setSelectedRundown] = useState<Rundown | null>(null);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<CalendarEvent | null>(null);
  const [selectedTask, setSelectedTask] = useState<DivisionTask | null>(null);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [assignedDivisionName, setAssignedDivisionName] = useState('');
  const selectedOrg = org.selectedOrg;
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [divisionMembers, setDivisionMembers] = useState<DivisionMember[]>([]);

  const navigateTo = (view: ActiveView) => {
    setActiveView(view);
  };
  const isCoordinator = selectedOrg?.role === 'Coordinator';
  const isMember = selectedOrg?.role === 'Participant';
  const isExecutive = selectedOrg?.role === 'Executive';
  const noteRole = selectedOrg?.role === 'Coordinator'
    ? 'coordinator'
    : selectedOrg?.role === 'Participant'
      ? 'member'
      : 'executive';

  useEffect(() => {
    if (!selectedOrg?.divisionId) {
      setAssignedDivisionName('');
      return;
    }

    let active = true;
    const loadAssignedDivision = async () => {
      const { data, error } = await supabase
        .from('divisions')
        .select('name')
        .eq('id', selectedOrg.divisionId)
        .maybeSingle();
      if (!active) return;
      if (error) {
        showMessage('Could not load assigned division', error.message);
        return;
      }
      setAssignedDivisionName(data?.name ?? '');
    };
    void loadAssignedDivision();
    return () => { active = false; };
  }, [selectedOrg?.divisionId]);

  useEffect(() => {
    if (activeView === 'coordinator-home' || activeView === 'member-home') {
      setActiveView('dashboard');
      return;
    }
    if (activeView === 'coordinator-members' || activeView === 'member-division') {
      setActiveView('divisions');
      return;
    }
    if (activeView === 'coordinator-tasks' || activeView === 'member-tasks') {
      setActiveView('organization-tasks');
      return;
    }
    if (activeView === 'coordinator-task-edit' && !isCoordinator && !isExecutive) {
      setActiveView('dashboard');
      return;
    }
    if (activeView === 'member-task-details' && !isMember && !isCoordinator) {
      setActiveView('dashboard');
      return;
    }
    if (activeView === 'budgeting-add-expense' && isMember) {
      setActiveView('budgeting');
      return;
    }
    if (activeView === 'rundown-select' && !isExecutive) {
      setActiveView('calendar');
      return;
    }
    if (activeView === 'rundown-edit' && (isMember || (isCoordinator && selectedRundown))) {
      setActiveView(isCoordinator && selectedRundown ? 'rundown-details' : 'rundown-list');
      return;
    }
    if (activeView === 'notes-new' && isMember) {
      setActiveView('notes-list');
    }
  }, [activeView, isCoordinator, isExecutive, isMember, selectedRundown]);

  useEffect(() => {
    if (activeView !== 'divisions' || !selectedOrg) return;

    let active = true;
    const loadDivisionData = async () => {
      const [divisionResult, memberResult] = await Promise.all([
        supabase
          .from('divisions')
          .select('id, name')
          .eq('organization_id', selectedOrg.id)
          .order('name'),
        supabase
          .from('organization_members')
          .select('id, user_id, division_id, role')
          .eq('organization_id', selectedOrg.id)
          .eq('status', 'active'),
      ]);

      if (!active) return;
      if (divisionResult.error || memberResult.error) {
        const error = divisionResult.error ?? memberResult.error;
        showMessage('Could not load divisions', error?.message ?? 'Could not load organization data.');
        return;
      }

      const memberRows = (memberResult.data ?? []) as unknown as OrganizationMemberRow[];
      const divisionRows = (divisionResult.data ?? []) as unknown as DivisionRow[];
      const memberIds = memberRows.map((member: OrganizationMemberRow) => member.user_id);
      const { data: profiles, error: profilesError } = memberIds.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', memberIds)
        : { data: [], error: null };

      if (!active) return;
      if (profilesError) {
        showMessage('Could not load members', profilesError.message);
        return;
      }

      const profileRows = (profiles ?? []) as unknown as ProfileRow[];
      const profilesById = new Map<string, ProfileRow>(
        profileRows.map((profile: ProfileRow): [string, ProfileRow] => [profile.id, profile]),
      );
      const divisionPalette = [colors.primary, colors.primaryDark];
      setDivisions(divisionRows.map((division: DivisionRow, index: number) => ({
        id: division.id,
        name: division.name,
        color: divisionPalette[index % divisionPalette.length],
        backgroundColor: index % 2 === 0 ? colors.primarySoft : colors.secondarySoft,
      })));
      setDivisionMembers(memberRows.map((member: OrganizationMemberRow) => {
        const profile = profilesById.get(member.user_id);
        return {
          id: member.id,
          name: profile?.full_name || profile?.email || 'Member',
          email: profile?.email ?? '',
          role: member.role === 'coordinator'
            ? 'Coordinator'
            : member.role === 'executive'
              ? 'Executive'
              : 'Member',
          divisionId: member.division_id,
        };
      }));
    };

    void loadDivisionData().catch((error: unknown) => {
      if (!active) return;
      showMessage(
        'Could not load divisions',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
    });

    return () => {
      active = false;
    };
  }, [activeView, selectedOrg?.id]);

  if (!auth.splashDone) {
    return <SplashScreen />;
  }

  if (!auth.isAuthenticated) {
    return (
      <View style={styles.root}>
        {auth.mainScreen === 'login' ? (
          <LoginScreen
            email={auth.loginEmail}
            password={auth.loginPassword}
            rememberMe={auth.rememberMe}
            onEmailChange={auth.setLoginEmail}
            onPasswordChange={auth.setLoginPassword}
            onRememberChange={() =>
              auth.setRememberMe((current) => !current)
            }
            onSignIn={auth.handleSignIn}
            onForgotPassword={auth.openForgotPassword}
            onCreateAccount={() => auth.setMainScreen('signup')}
          />
        ) : (
          <SignUpScreen
            fullName={auth.fullName}
            email={auth.signupEmail}
            password={auth.signupPassword}
            confirmPassword={auth.confirmPassword}
            onFullNameChange={auth.setFullName}
            onEmailChange={auth.setSignupEmail}
            onPasswordChange={auth.setSignupPassword}
            onConfirmPasswordChange={auth.setConfirmPassword}
            onCreateAccount={auth.handleCreateAccount}
            onSignIn={() => auth.setMainScreen('login')}
          />
        )}

        <ForgotPasswordScreen
          visible={auth.passwordSheet === 'verify'}
          email={auth.resetEmail}
          code={auth.verificationCode}
          onCodeChange={auth.setVerificationCode}
          onClose={() => auth.setPasswordSheet('none')}
          onContinue={auth.handleVerifyCode}
          onResend={auth.handleResendCode}
        />

        <ResetPasswordScreen
          visible={auth.passwordSheet === 'reset'}
          email={auth.resetEmail}
          password={auth.newPassword}
          confirmPassword={auth.confirmNewPassword}
          onPasswordChange={auth.setNewPassword}
          onConfirmPasswordChange={auth.setConfirmNewPassword}
          onClose={() => auth.setPasswordSheet('none')}
          onFinish={auth.handleFinishReset}
        />
        <ToastHost />
        <ConfirmationHost />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {activeView === 'org-list' && (
        <OrganizationListScreen
          organizations={org.organizations}
          userName={auth.userName}
          isLoading={org.isLoadingOrganizations}
          loadError={org.organizationLoadError}
          onRetry={() => { void org.reloadOrganizations(); }}
          showJoinedToast={org.showJoinedToast}
          onDismissToast={() => org.setShowJoinedToast(false)}
          onSelectOrganization={(selected) => {
            org.setSelectedOrg(selected);
            setIsInvitesModalVisible(false);
            setActiveView('dashboard');
          }}
          onOpenCreateOrg={() => setActiveView('create-org')}
          onOpenJoinOrg={() => org.setIsJoinModalVisible(true)}
          onOpenStatusModal={(item) => org.setStatusModalOrg(item)}
          onOpenProfile={() => setActiveView('profile')}
        />
      )}

      {activeView === 'create-org' && (
        <CreateOrganizationScreen
          onBack={() => setActiveView('org-list')}
          onCreateSuccess={(formData) => {
            org.handleCreateOrganization(formData);
          }}
        />
      )}

      {activeView === 'dashboard' && selectedOrg && (
        <DashboardHomeScreen
          organizationId={selectedOrg.id}
          organizationName={selectedOrg.name}
          role={selectedOrg.role}
          onBackToOrgList={() => setActiveView('org-list')}
          onOpenCalendar={() => setActiveView('calendar')}
          onOpenBudgeting={() => setActiveView('budgeting')}
          onOpenAddExpense={() => setActiveView('budgeting-add-expense')}
          onOpenRundown={() => navigateTo('rundown-list')}
          onOpenNotes={() => navigateTo('notes-list')}
          onOpenNotifications={() => navigateTo('notifications')}
          onOpenInvites={() => setIsInvitesModalVisible(true)}
          onOpenDivisions={() => setActiveView('divisions')}
          onOpenTasks={() => setActiveView('organization-tasks')}
        />
      )}

      {activeView === 'organization-tasks' && selectedOrg && (
        <DivisionTasksScreen
          organizationId={selectedOrg.id}
          divisionId={null}
          canCreateTask={isCoordinator || isExecutive}
          canDeleteTask={(task) => isExecutive || (isCoordinator && task.division_id === selectedOrg.divisionId)}
          screenTitle="Tasks"
          onBack={() => setActiveView('dashboard')}
          onCreateTask={isCoordinator || isExecutive ? () => {
            if (isCoordinator && !selectedOrg.divisionId) {
              showMessage('No division assigned', 'Ask an executive to assign you to a division first.');
              return;
            }
            setSelectedTask(null);
            setActiveView('coordinator-task-edit');
          } : undefined}
          onOpenTask={(task) => {
            setSelectedTask(task);
            setActiveView(
              isExecutive || (isCoordinator && task.division_id === selectedOrg.divisionId)
                ? 'coordinator-task-edit'
                : 'member-task-details',
            );
          }}
        />
      )}

      {activeView === 'coordinator-task-edit' && selectedOrg && (isExecutive || (isCoordinator && selectedOrg.divisionId)) && (
        <TaskDetailsScreen
          organizationId={selectedOrg.id}
          divisionId={isExecutive ? selectedTask?.division_id ?? null : selectedOrg.divisionId ?? null}
          task={selectedTask}
          canChooseDivision={isExecutive}
          readOnly={Boolean(isCoordinator && selectedTask && selectedTask.division_id !== selectedOrg.divisionId)}
          onBack={() => setActiveView('organization-tasks')}
          onSaved={() => setActiveView('organization-tasks')}
        />
      )}

      {activeView === 'member-task-details' && selectedOrg && selectedTask && (
        <TaskDetailsScreen
          organizationId={selectedOrg.id}
          divisionId={selectedTask.division_id}
          task={selectedTask}
          readOnly
          onBack={() => setActiveView('organization-tasks')}
          onSaved={() => setActiveView('organization-tasks')}
        />
      )}

      {activeView === 'divisions' && selectedOrg && (
        <DivisionManagementScreen
          organizationName={selectedOrg.name}
          divisions={divisions}
          members={divisionMembers}
          readOnly={!isExecutive}
          onBack={() => setActiveView('dashboard')}
          onSwitchTab={(tab) => {
            if (tab === 'home') setActiveView('dashboard');
            else if (tab === 'calendar') setActiveView('calendar');
          }}
          onAssignMember={async (memberId, divisionId) => {
            const { data, error } = await supabase
              .from('organization_members')
              .update({ division_id: divisionId })
              .eq('id', memberId)
              .eq('organization_id', selectedOrg.id)
              .select('id')
              .maybeSingle();
            if (error) {
              showToast('error', 'Could not update division', error.message);
              return;
            }
            if (!data) {
              showToast('error', 'Could not update division', 'You may not have permission to change this member.');
              return;
            }
            showToast('success', 'Division updated', 'The member was reassigned successfully.');
            setDivisionMembers((current) => current.map((member) =>
              member.id === memberId ? { ...member, divisionId } : member
            ));
          }}
        />
      )}

      {/* 2D. Calendar Screen */}
      {activeView === 'calendar' && selectedOrg && (
        <CalendarScreen
          organizationId={selectedOrg.id}
          organizationName={selectedOrg.name}
          role={isCoordinator ? 'Coordinator' : isMember ? 'Member' : 'Executive'}
          divisionId={selectedOrg.divisionId}
          onSwitchTab={(tab) => {
            if (tab === 'home') setActiveView('dashboard');
            else if (tab === 'divisions') setActiveView('divisions');
          }}
          onAttachRundown={isExecutive ? (event) => {
            setSelectedCalendarEvent(event);
            setActiveView('rundown-select');
          } : undefined}
        />
      )}

      {/* 2E. Budgeting Screen */}
      {(activeView === 'budgeting' || activeView === 'budgeting-add-expense') && selectedOrg && (
        <BudgetingScreen
          organizationId={selectedOrg.id}
          onBack={() => setActiveView('dashboard')}
          openAddExpense={activeView === 'budgeting-add-expense'}
          canAddRevenue={isExecutive}
          canAddExpense={isExecutive || isCoordinator}
          canReviewTransactions={isExecutive}
        />
      )}

      {activeView === 'rundown-list' && selectedOrg && (
        <RundownListScreen
          organizationId={selectedOrg?.id ?? ''}
          organizationName={selectedOrg?.name ?? ''}
          canCreate={!isMember}
          canAttach={isExecutive}
          onBack={() => setActiveView('dashboard')}
          onOpenRundown={(rundown) => {
            setSelectedRundown(rundown);
            navigateTo('rundown-details');
          }}
          onCreateRundown={() => {
            setSelectedRundown(null);
            navigateTo('rundown-edit');
          }}
        />
      )}

      {/* 2G. Rundown Details Screen */}
      {activeView === 'rundown-details' && selectedOrg && selectedRundown && (
        <RundownDetailsScreen
          organizationId={selectedOrg.id}
          rundown={selectedRundown}
          canEdit={isExecutive}
          onBack={() => setActiveView('rundown-list')}
          onEdit={() => navigateTo('rundown-edit')}
        />
      )}

      {/* 2H. Edit Rundown Screen */}
      {activeView === 'rundown-edit' && selectedOrg && (isExecutive || (isCoordinator && !selectedRundown)) && (
        <EditRundownScreen
          organizationId={selectedOrg.id}
          rundown={selectedRundown}
          onBack={() => setActiveView(selectedRundown ? 'rundown-details' : 'rundown-list')}
          onSave={(rundown) => {
            setSelectedRundown(rundown);
            setActiveView('rundown-details');
          }}
        />
      )}

      {/* 2I. Select Rundown Screen (attach to Calendar event) */}
      {activeView === 'rundown-select' && selectedOrg && isExecutive && selectedCalendarEvent && (
        <SelectRundownScreen
          organizationId={selectedOrg.id}
          eventId={selectedCalendarEvent.id}
          eventTitle={selectedCalendarEvent.title}
          onBack={() => setActiveView('calendar')}
          onAttach={async (selected) => {
            const rundown = selected[0];
            const organizationId = selectedOrg?.id;
            const eventId = selectedCalendarEvent?.id;
            if (!rundown || !organizationId || !eventId) return;
            const { data, error } = await supabase
              .from('rundowns')
              .update({ event_id: eventId })
              .eq('organization_id', organizationId)
              .eq('id', rundown.id)
              .select('id')
              .maybeSingle();
            if (error || !data) {
              showMessage(
                'Could not attach rundown',
                error?.message ?? 'You may not have permission to change this rundown.',
              );
              return;
            }
            setActiveView('calendar');
          }}
        />
      )}

      {activeView === 'notes-list' && (
        <NotesListScreen
          organizationId={selectedOrg?.id ?? ''}
          organizationName={selectedOrg?.name ?? ''}
          role={noteRole}
          divisionId={selectedOrg?.divisionId}
          onBack={() => setActiveView('dashboard')}
          onOpenNewNote={() => {
            setEditingNote(null);
            navigateTo('notes-new');
          }}
          onOpenEditNote={(note) => {
            setEditingNote(note);
            navigateTo('notes-new');
          }}
        />
      )}

      {activeView === 'notes-new' && (
        <NewNoteScreen
          organizationId={selectedOrg?.id ?? ''}
          organizationName={selectedOrg?.name ?? ''}
          role={noteRole}
          divisionId={selectedOrg?.divisionId}
          divisionName={assignedDivisionName}
          note={editingNote}
          onBack={() => {
            setEditingNote(null);
            setActiveView('notes-list');
          }}
          onSaveSuccess={() => {
            setEditingNote(null);
            setActiveView('notes-list');
          }}
        />
      )}

      {/* 2J. Notifications Screen */}
      {activeView === 'notifications' && selectedOrg && (
        <NotificationScreen
          organizationId={selectedOrg.id}
          onBack={() => setActiveView('dashboard')}
        />
      )}

      {activeView === 'profile' && (
        <ProfileScreen
          userName={auth.userName || 'User'}
          userEmail={auth.userEmail || auth.loginEmail}
          onBack={() => setActiveView('org-list')}
          onSaveName={async (name) => {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
              showToast('error', 'Could not update profile', userError?.message ?? 'Sign in again and retry.');
              return false;
            }
            const { data, error } = await supabase
              .from('profiles')
              .update({ full_name: name })
              .eq('id', user.id)
              .select('id')
              .maybeSingle();
            if (error || !data) {
              showToast('error', 'Could not update profile', error?.message ?? 'Your profile could not be found.');
              return false;
            }
            const { error: metadataError } = await supabase.auth.updateUser({
              data: { full_name: name },
            });
            if (metadataError) {
              const { error: rollbackError } = await supabase
                .from('profiles')
                .update({ full_name: auth.userName })
                .eq('id', user.id);
              showToast(
                'error',
                'Profile update incomplete',
                rollbackError
                  ? `${metadataError.message} The profile row could not be restored: ${rollbackError.message}`
                  : metadataError.message,
              );
              return false;
            }
            return true;
          }}
          onSignOut={() => {
            void auth.handleSignOut().then((signedOut) => {
              if (signedOut) setActiveView('org-list');
            });
          }}
        />
      )}

      {isCoordinator
        && !selectedOrg?.divisionId
        && activeView === 'coordinator-task-edit'
        && (
          <View style={styles.missingDivision}>
            <Text style={styles.missingDivisionTitle}>No division assigned</Text>
            <Text style={styles.missingDivisionText}>
              Ask an executive to assign you to a division before managing members and tasks.
            </Text>
          </View>
        )}

      <OrganizationStatusModal
        visible={!!org.statusModalOrg}
        organization={org.statusModalOrg}
        onClose={() => org.setStatusModalOrg(null)}
        onSaveStatus={org.handleSaveStatus}
      />

      <JoinOrganizationModal
        visible={org.isJoinModalVisible}
        onClose={() => org.setIsJoinModalVisible(false)}
        onJoin={org.handleJoinOrganization}
      />

      <OrganizationCreatedModal
        visible={org.isCreatedModalVisible}
        orgName={org.createdOrgName}
        onEnterOrganization={() => {
          org.setIsCreatedModalVisible(false);
          setActiveView('dashboard');
        }}
      />

      <InvitesModal
        visible={isInvitesModalVisible && isExecutive}
        organizationId={selectedOrg?.id ?? ''}
        onClose={() => setIsInvitesModalVisible(false)}
      />
      <ToastHost />
      <ConfirmationHost />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  missingDivision: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.background,
  },
  missingDivisionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  missingDivisionText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
});