import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { useAuthFlow } from '../features/auth/hooks/useAuthFlow';
import { SplashScreen } from '../features/auth/screens/SplashScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../features/auth/screens/ResetPasswordScreen';

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
import { BudgetingScreen } from '../features/budgeting/screens/BudgetingScreen';
import { RundownListScreen } from '../features/rundown/screens/RundownListScreen';
import { RundownDetailsScreen } from '../features/rundown/screens/RundownDetailsScreen';
import { EditRundownScreen } from '../features/rundown/screens/EditRundownScreen';
import { SelectRundownScreen } from '../features/rundown/screens/SelectRundownScreen';
import { NotesListScreen } from '../features/notes/screens/NotesListScreen';
import { NewNoteScreen } from '../features/notes/screens/NewNoteScreen';
import { NotificationScreen } from '../features/notifications/screens/NotificationScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { showMessage } from '../features/auth/utils/feedback';
import { Rundown, RundownItem } from '../features/rundown/types';
import { supabase } from '../lib/supabase';
import { mockRundowns } from '../features/rundown/data/mockRundowns';

type ActiveView =
  | 'org-list'
  | 'create-org'
  | 'dashboard'
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
  const [previousView, setPreviousView] = useState<ActiveView>('dashboard');
  const [selectedRundown, setSelectedRundown] = useState<Rundown | null>(null);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<CalendarEvent | null>(null);
  const selectedOrg = org.selectedOrg;
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [divisionMembers, setDivisionMembers] = useState<DivisionMember[]>([]);

  const navigateTo = (view: ActiveView) => {
    setPreviousView(activeView);
    setActiveView(view);
  };

  useEffect(() => {
    if (activeView !== 'divisions' || !selectedOrg) return;

    let active = true;
    const loadDivisionData = async () => {
      const [divisionResult, memberResult] = await Promise.all([
        supabase
          .from('divisions')
          .select('id, name, color, background_color')
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

      const memberIds = (memberResult.data ?? []).map((member) => member.user_id);
      const { data: profiles, error: profilesError } = memberIds.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', memberIds)
        : { data: [], error: null };

      if (!active) return;
      if (profilesError) {
        showMessage('Could not load members', profilesError.message);
        return;
      }

      const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      setDivisions((divisionResult.data ?? []).map((division) => ({
        id: division.id,
        name: division.name,
        color: division.color ?? '#5145E8',
        backgroundColor: division.background_color ?? '#EEECFF',
      })));
      setDivisionMembers((memberResult.data ?? []).map((member) => {
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

  useEffect(() => {
    if (activeView !== 'divisions' || !selectedOrg) return;

    let active = true;
    const loadDivisionData = async () => {
      const [divisionResult, memberResult] = await Promise.all([
        supabase
          .from('divisions')
          .select('id, name, color, background_color')
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

      const memberIds = (memberResult.data ?? []).map((member) => member.user_id);
      const { data: profiles, error: profilesError } = memberIds.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', memberIds)
        : { data: [], error: null };

      if (!active) return;
      if (profilesError) {
        showMessage('Could not load members', profilesError.message);
        return;
      }

      const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      setDivisions((divisionResult.data ?? []).map((division) => ({
        id: division.id,
        name: division.name,
        color: division.color ?? '#5145E8',
        backgroundColor: division.background_color ?? '#EEECFF',
      })));
      setDivisionMembers((memberResult.data ?? []).map((member) => {
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

      {activeView === 'dashboard' && (
        <DashboardHomeScreen
          organizationId={selectedOrg.id}
          organizationName={selectedOrg.name}
          onBackToOrgList={() => setActiveView('org-list')}
          onOpenCalendar={() => setActiveView('calendar')}
          onOpenBudgeting={() => setActiveView('budgeting')}
          onOpenAddExpense={() => setActiveView('budgeting-add-expense')}
          onOpenRundown={() => navigateTo('rundown-list')}
          onOpenNotes={() => navigateTo('notes-list')}
          onOpenNotifications={() => navigateTo('notifications')}
          onOpenInvites={() => setIsInvitesModalVisible(true)}
          onOpenDivisions={() => setActiveView('divisions')}
          onOpenProfile={() => setActiveView('profile')}
        />
      )}

      {activeView === 'divisions' && selectedOrg && (
        <DivisionManagementScreen
          organizationName={selectedOrg.name}
          divisions={divisions}
          members={divisionMembers}
          onBack={() => setActiveView('dashboard')}
          onAssignMember={async (memberId, divisionId) => {
            const { data, error } = await supabase
              .from('organization_members')
              .update({ division_id: divisionId })
              .eq('id', memberId)
              .eq('organization_id', selectedOrg.id)
              .select('id')
              .maybeSingle();
            if (error) {
              showMessage('Could not update division', error.message);
              return;
            }
            if (!data) {
              showMessage('Could not update division', 'You may not have permission to change this member.');
              return;
            }
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
          onSwitchTab={(tab) => {
            if (tab === 'home') setActiveView('dashboard');
            else if (tab === 'profile') setActiveView('profile');
            else if (tab === 'divisions') setActiveView('divisions');
          }}
          onAttachRundown={(event) => {
            setSelectedCalendarEvent(event);
            setActiveView('rundown-select');
          }}
        />
      )}

      {/* 2E. Budgeting Screen */}
      {(activeView === 'budgeting' || activeView === 'budgeting-add-expense') && (
        <BudgetingScreen
          organizationId={selectedOrg?.id ?? ''}
          onBack={() => setActiveView('dashboard')}
          openAddExpense={activeView === 'budgeting-add-expense'}
        />
      )}

      {activeView === 'rundown-list' && (
        <RundownListScreen
          organizationId={selectedOrg?.id ?? ''}
          organizationName={selectedOrg?.name ?? ''}
          onBack={() => setActiveView('dashboard')}
          onOpenRundown={(rundown) => {
            const selected =
              rundowns.find((item) => item.id === rundown.id) ?? rundown;
            setSelectedRundown(selected);
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
          onBack={() => setActiveView('rundown-list')}
          onEdit={() => navigateTo('rundown-edit')}
        />
      )}

      {/* 2H. Edit Rundown Screen */}
      {activeView === 'rundown-edit' && selectedOrg && (
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
      {activeView === 'rundown-select' && selectedOrg && selectedCalendarEvent && (
        <SelectRundownScreen
          organizationId={selectedOrg.id}
          eventId={selectedCalendarEvent.id}
          eventTitle={selectedCalendarEvent.title}
          onBack={() => setActiveView('calendar')}
          onAttach={async (selected) => {
            const rundown = selected[0];
            if (!rundown) return;
            const { data, error } = await supabase
              .from('rundowns')
              .update({ event_id: selectedCalendarEvent.id })
              .eq('organization_id', selectedOrg.id)
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
          onBack={() => setActiveView('dashboard')}
          onOpenNewNote={() => navigateTo('notes-new')}
        />
      )}

      {activeView === 'notes-new' && (
        <NewNoteScreen
          organizationId={selectedOrg?.id ?? ''}
          organizationName={selectedOrg?.name ?? ''}
          onBack={() => setActiveView('notes-list')}
          onSaveSuccess={() => setActiveView('notes-list')}
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
          onBack={() => setActiveView(previousView)}
          onSaveName={async (name) => {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
              showMessage('Could not update profile', userError?.message ?? 'Sign in again and retry.');
              return false;
            }
            const { data, error } = await supabase
              .from('profiles')
              .update({ full_name: name })
              .eq('id', user.id)
              .select('id')
              .maybeSingle();
            if (error || !data) {
              showMessage('Could not update profile', error?.message ?? 'Your profile could not be found.');
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
              showMessage(
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
        visible={isInvitesModalVisible}
        organizationId={selectedOrg?.id ?? ''}
        onClose={() => setIsInvitesModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});