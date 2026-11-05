import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { useAuthFlow } from './hooks/useAuthFlow';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ResetPasswordScreen } from './screens/ResetPasswordScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { SplashScreen } from './screens/SplashScreen';

/** Composes authentication screens. State and form actions live in useAuthFlow. */
export function AuthFlow() {
  const auth = useAuthFlow();

  if (!auth.splashDone) return <SplashScreen />;

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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
