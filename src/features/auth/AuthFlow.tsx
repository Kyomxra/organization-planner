import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { AuthTextField } from './components/AuthTextField';
import { PrimaryButton } from './components/PrimaryButton';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { SplashScreen } from './screens/SplashScreen';

type MainScreen = 'login' | 'signup';
type SheetScreen = 'none' | 'verify' | 'reset';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View style={styles.sheetHeader}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
      <Text style={styles.sheetTitle}>{title}</Text>
      <View style={styles.closeButtonPlaceholder} />
    </View>
  );
}

function CodeInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const refs = useRef<Array<TextInput | null>>([]);

  const changeDigit = (index: number, digit: string) => {
    const nextDigit = digit.replace(/\D/g, '').slice(-1);
    const next = value.split('');
    while (next.length < 6) next.push('');
    next[index] = nextDigit;
    onChange(next.join('').slice(0, 6));
    if (nextDigit && index < 5) refs.current[index + 1]?.focus();
  };

  return (
    <View style={styles.codeRow}>
      {Array.from({ length: 6 }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => { refs.current[index] = ref; }}
          value={value[index] || ''}
          onChangeText={(digit) => changeDigit(index, digit)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          style={styles.codeBox}
          textAlign="center"
          accessibilityLabel={`Verification digit ${index + 1}`}
        />
      ))}
    </View>
  );
}

export function AuthFlow() {
  const [splashDone, setSplashDone] = useState(false);
  const [mainScreen, setMainScreen] = useState<MainScreen>('login');
  const [sheetScreen, setSheetScreen] = useState<SheetScreen>('none');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [resetEmail, setResetEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 1450);
    return () => clearTimeout(timer);
  }, []);

  const openForgotPassword = () => {
    if (!isValidEmail(loginEmail)) {
      Alert.alert('Email required', 'Enter your email address first, then tap Forgot password? again.');
      return;
    }
    setResetEmail(loginEmail.trim());
    setVerificationCode('');
    setSheetScreen('verify');
  };

  const handleSignIn = () => {
    if (!isValidEmail(loginEmail)) {
      Alert.alert('Check your email', 'Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      Alert.alert('Password required', 'Please enter your password.');
      return;
    }
    Alert.alert(
      'Login UI ready',
      'This is currently a UI prototype. Connect an authentication backend before using real accounts.',
    );
  };

  const handleCreateAccount = () => {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    if (!isValidEmail(signupEmail)) {
      Alert.alert('Check your email', 'Please enter a valid email address.');
      return;
    }
    if (signupPassword.length < 8) {
      Alert.alert('Password is too short', 'Your password should be at least 8 characters.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please check your password confirmation.');
      return;
    }
    Alert.alert(
      'Account form completed',
      'The sign-up screen is ready. Account creation will work after the team connects an authentication backend.',
      [{ text: 'OK', onPress: () => setMainScreen('login') }],
    );
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Incomplete code', 'Enter all six digits to continue.');
      return;
    }
    // Demo only: any six-digit code advances the UI. A real backend must validate the OTP.
    setSheetScreen('reset');
  };

  const handleFinishReset = () => {
    if (newPassword.length < 8) {
      Alert.alert('Password is too short', 'Your new password should be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Passwords do not match', 'Please check your password confirmation.');
      return;
    }
    Alert.alert(
      'Reset flow completed',
      'The reset-password UI is ready. A real password update requires an authentication backend.',
      [{ text: 'Back to sign in', onPress: () => {
        setSheetScreen('none');
        setLoginPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } }],
    );
  };

  if (!splashDone) return <SplashScreen />;

  return (
    <View style={styles.root}>
      {mainScreen === 'login' ? (
        <LoginScreen
          email={loginEmail}
          password={loginPassword}
          rememberMe={rememberMe}
          onEmailChange={setLoginEmail}
          onPasswordChange={setLoginPassword}
          onRememberChange={() => setRememberMe((current) => !current)}
          onSignIn={handleSignIn}
          onForgotPassword={openForgotPassword}
          onCreateAccount={() => setMainScreen('signup')}
        />
      ) : (
        <SignUpScreen
          fullName={fullName}
          email={signupEmail}
          password={signupPassword}
          confirmPassword={confirmPassword}
          onFullNameChange={setFullName}
          onEmailChange={setSignupEmail}
          onPasswordChange={setSignupPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onCreateAccount={handleCreateAccount}
          onSignIn={() => setMainScreen('login')}
        />
      )}

      <Modal
        visible={sheetScreen !== 'none'}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSheetScreen('none')}
      >
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setSheetScreen('none')} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoider}>
            <View style={styles.sheet}>
              {sheetScreen === 'verify' ? (
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <SheetHeader title="Reset Password" onClose={() => setSheetScreen('none')} />
                  <Text style={styles.verifyTitle}>Check your Email</Text>
                  <Text style={styles.sheetBody}>Enter the code sent to {resetEmail} to continue.</Text>
                  <CodeInput value={verificationCode} onChange={setVerificationCode} />
                  <Text style={styles.resendText}>
                    Didn't receive a code?{' '}
                    <Text
                      style={styles.inlineLink}
                      onPress={() => Alert.alert('Code requested', 'A real resend action will be connected with the authentication backend.')}
                    >
                      Resend
                    </Text>
                  </Text>
                  <PrimaryButton title="Continue" onPress={handleVerifyCode} style={styles.sheetAction} />
                </ScrollView>
              ) : null}

              {sheetScreen === 'reset' ? (
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <SheetHeader title="Reset Password" onClose={() => setSheetScreen('none')} />
                  <Text style={styles.sheetEmail}>{resetEmail}</Text>
                  <AuthTextField
                    label="New password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter your new password"
                    icon="▣"
                    secureTextEntry
                  />
                  <AuthTextField
                    label="Password confirmation"
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    placeholder="Re-enter your password"
                    icon="▣"
                    secureTextEntry
                  />
                  <PrimaryButton title="Finish" onPress={handleFinishReset} style={styles.sheetAction} />
                </ScrollView>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  keyboardAvoider: { width: '100%', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 22,
    maxHeight: '88%',
    shadowColor: '#11112A',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -5 },
    elevation: 18,
  },
  sheetHeader: { height: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  closeButton: { width: 28, height: 28, alignItems: 'flex-start', justifyContent: 'center' },
  closeText: { color: colors.text, fontSize: 24, fontWeight: '400', lineHeight: 27 },
  sheetTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  closeButtonPlaceholder: { width: 28 },
  verifyTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 1, marginBottom: 5 },
  sheetBody: { color: colors.text, fontSize: 12, lineHeight: 18, marginBottom: 18 },
  sheetEmail: { color: colors.muted, fontSize: 11, marginBottom: 18 },
  sheetAction: { marginTop: 4 },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginBottom: 16, gap: 7 },
  codeBox: {
    flex: 1,
    minWidth: 0,
    height: 48,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  resendText: { color: colors.muted, fontSize: 10, textAlign: 'center', marginBottom: 16 },
  inlineLink: { color: colors.primary, fontWeight: '800' },
});
