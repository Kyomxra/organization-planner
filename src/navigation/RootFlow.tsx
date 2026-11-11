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
import { EditRundownScreen } from '../features/rundown/screens/EditRundownScreen';
import { showMessage } from '../features/auth/utils/feedback';

type ActiveView = 'org-list' | 'create-org' | 'dashboard' | 'calendar' | 'budgeting' | 'rundown';

export function RootFlow() {
  const auth = useAuthFlow();
  const org = useOrganizationFlow();
  const [activeView, setActiveView] = useState<ActiveView>('org-list');
  const [isInvitesModalVisible, setIsInvitesModalVisible] = useState(false);
  const [previousView, setPreviousView] = useState<ActiveView>('dashboard');

  const navigateTo = (view: ActiveView) => {
    setPreviousView(activeView);
    setActiveView(view);
  };

  // Splash screen timeout
  if (!auth.splashDone) {
    return <SplashScreen />;
  }

  // 1. Unauthenticated Auth Flow (Login, SignUp, Password Reset)
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
            onRememberChange={() => auth.setRememberMe((current) => !current)}
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

  // 2. Authenticated Flow (POV BPH)
  return (
    <View style={styles.root}>
      {/* 2A. Organizations List Screen */}
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
          onOpenProfile={() => {
            showMessage(
              `Signed in as ${auth.userName}`,
              'Would you like to switch accounts or sign out?',
              () => auth.handleSignOut()
            );
          }}
        />
      )}

      {/* 2B. Create Organization Screen */}
      {activeView === 'create-org' && (
        <CreateOrganizationScreen
          onBack={() => setActiveView('org-list')}
          onCreateSuccess={(formData) => {
            org.handleCreateOrganization(formData);
          }}
        />
      )}

      {/* 2C. Dashboard Home Screen (POV BPH) */}
      {activeView === 'dashboard' && (
        <DashboardHomeScreen
          organizationName={org.selectedOrg.name}
          onBackToOrgList={() => setActiveView('org-list')}
          onOpenCalendar={() => setActiveView('calendar')}
          onOpenBudgeting={() => setActiveView('budgeting')}
          onOpenRundown={() => navigateTo('rundown')}
          onOpenInvites={() => setIsInvitesModalVisible(true)}
          onOpenDivisions={() => showMessage('Divisions', 'Divisions management is coming next.')}
          onOpenProfile={() => {
            showMessage(
              `Signed in as ${auth.userName}`,
              'Would you like to switch accounts or sign out?',
              () => {
                auth.handleSignOut();
                setActiveView('org-list');
              }
            );
          }}
        />
      )}

      {/* 2D. Calendar Screen */}
      {activeView === 'calendar' && (
        <CalendarScreen
          onSwitchTab={(tab) => {
            if (tab === 'home') setActiveView('dashboard');
            else if (tab === 'profile') {
              showMessage(`Profile`, `Signed in as ${auth.userName}`);
            } else if (tab === 'divisions') {
              showMessage('Divisions', 'Divisions management is coming next.');
            }
          }}
          onOpenRundown={() => navigateTo('rundown')}
        />
      )}

      {/* 2E. Budgeting Screen */}
      {activeView === 'budgeting' && (
        <BudgetingScreen onBack={() => setActiveView('dashboard')} />
      )}

      {/* 2F. Edit Rundown Screen */}
      {activeView === 'rundown' && (
        <EditRundownScreen
          onBack={() => setActiveView(previousView)}
          onSave={() => setActiveView(previousView)}
        />
      )}

      {/* Modals */}
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
