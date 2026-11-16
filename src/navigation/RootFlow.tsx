import React, { useState } from 'react';
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

import { DashboardHomeScreen } from '../features/dashboard/screens/DashboardHomeScreen';
import { CalendarScreen } from '../features/calendar/screens/CalendarScreen';
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
import { mockRundowns } from '../features/rundown/data/mockRundowns';

type ActiveView =
  | 'org-list'
  | 'create-org'
  | 'dashboard'
  | 'calendar'
  | 'budgeting'
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
  const [rundowns, setRundowns] = useState<Rundown[]>(mockRundowns);

  const getRundownItems = (rundown: Rundown | null): RundownItem[] =>
    rundown?.items ?? [
      {
        id: 'rd-1',
        stepNumber: 1,
        title: 'Guest arrival & registration',
        startTime: '18.30',
        durationMinutes: 20,
        description: 'Welcome desk opens; distribute name tags and seating cards.',
        assigneeInitials: 'MC',
        assigneeName: 'Maya Chen',
      },
      {
        id: 'rd-2',
        stepNumber: 2,
        title: 'Opening remarks',
        startTime: '18.50',
        durationMinutes: 10,
        description: 'Host welcome, safety note, and overview of the evening.',
        assigneeInitials: 'DK',
        assigneeName: 'Daniel Kim',
      },
      {
        id: 'rd-3',
        stepNumber: 3,
        title: 'Impact stories',
        startTime: '19.00',
        durationMinutes: 35,
        description: 'Three community partners share five-minute stories.',
        assigneeInitials: 'PS',
        assigneeName: 'Priya Shah',
      },
      {
        id: 'rd-4',
        stepNumber: 4,
        title: 'Volunteer recognition',
        startTime: '19.35',
        durationMinutes: 25,
        description: 'Awards, photo moment, and thank-you presentation.',
        assigneeInitials: '',
        assigneeName: '',
      },
    ];

  const saveRundown = (updated: Rundown) => {
    setRundowns((current) =>
      current.some((item) => item.id === updated.id)
        ? current.map((item) => (item.id === updated.id ? updated : item))
        : [updated, ...current],
    );
    setSelectedRundown(updated);
    setActiveView('rundown-details');
  };

  const navigateTo = (view: ActiveView) => {
    setPreviousView(activeView);
    setActiveView(view);
  };

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
          organizationName={org.selectedOrg.name}
          onBackToOrgList={() => setActiveView('org-list')}
          onOpenCalendar={() => setActiveView('calendar')}
          onOpenBudgeting={() => setActiveView('budgeting')}
          onOpenRundown={() => navigateTo('rundown-list')}
          onOpenNotes={() => navigateTo('notes-list')}
          onOpenNotifications={() => navigateTo('notifications')}
          onOpenInvites={() => setIsInvitesModalVisible(true)}
          onOpenDivisions={() =>
            showMessage(
              'Divisions',
              'Divisions management is coming in the next update.',
            )
          }
          onOpenProfile={() => setActiveView('profile')}
        />
      )}

      {activeView === 'calendar' && (
        <CalendarScreen
          onSwitchTab={(tab) => {
            if (tab === 'home') setActiveView('dashboard');
            else if (tab === 'profile') setActiveView('profile');
            else if (tab === 'divisions') {
              showMessage(
                'Divisions',
                'Divisions management is coming in the next update.',
              );
            }
          }}
          onOpenRundown={() => navigateTo('rundown-list')}
        />
      )}

      {activeView === 'budgeting' && (
        <BudgetingScreen onBack={() => setActiveView('dashboard')} />
      )}

      {activeView === 'rundown-list' && (
        <RundownListScreen
          rundowns={rundowns}
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

      {activeView === 'rundown-details' && (
        <RundownDetailsScreen
          rundown={selectedRundown}
          items={getRundownItems(selectedRundown)}
          onBack={() => setActiveView('rundown-list')}
          onEdit={() => navigateTo('rundown-edit')}
        />
      )}

      {activeView === 'rundown-edit' && (
        <EditRundownScreen
          rundown={selectedRundown}
          onBack={() => setActiveView('rundown-details')}
          onSave={saveRundown}
        />
      )}

      {activeView === 'rundown-select' && (
        <SelectRundownScreen
          eventTitle={selectedRundown?.title ?? 'this event'}
          onBack={() => setActiveView('calendar')}
          onAttach={(_selected) => {
            showMessage(
              'Rundown Attached',
              'The rundown has been linked to the event.',
            );
            setActiveView('calendar');
          }}
        />
      )}

      {activeView === 'notes-list' && (
        <NotesListScreen
          onBack={() => setActiveView('dashboard')}
          onOpenNewNote={() => navigateTo('notes-new')}
        />
      )}

      {activeView === 'notes-new' && (
        <NewNoteScreen
          onBack={() => setActiveView('notes-list')}
          onSaveSuccess={() => setActiveView('notes-list')}
        />
      )}

      {activeView === 'notifications' && (
        <NotificationScreen onBack={() => setActiveView('dashboard')} />
      )}

      {activeView === 'profile' && (
        <ProfileScreen
          userName={auth.userName ? `${auth.userName} Morgan` : 'Alex Morgan'}
          userEmail={auth.loginEmail || 'alex@organization.com'}
          onBack={() => setActiveView(previousView)}
          onSignOut={() => {
            auth.handleSignOut();
            setActiveView('org-list');
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