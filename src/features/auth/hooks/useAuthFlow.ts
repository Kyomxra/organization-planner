import { useEffect, useState } from 'react';
import { showMessage } from '../utils/feedback';
import { isValidEmail } from '../utils/validation';

type MainScreen = 'login' | 'signup';
type PasswordSheet = 'none' | 'verify' | 'reset';

export function useAuthFlow() {
  const [splashDone, setSplashDone] = useState(false);
  const [mainScreen, setMainScreen] = useState<MainScreen>('login');
  const [passwordSheet, setPasswordSheet] = useState<PasswordSheet>('none');

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
      showMessage('Email required', 'Enter your email address first, then tap Forgot password? again.');
      return;
    }

    setResetEmail(loginEmail.trim());
    setVerificationCode('');
    setPasswordSheet('verify');
  };

  const handleSignIn = () => {
    if (!isValidEmail(loginEmail)) {
      showMessage('Check your email', 'Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      showMessage('Password required', 'Please enter your password.');
      return;
    }

    showMessage(
      'Login UI ready',
      'This is currently a UI prototype. Connect an authentication backend before using real accounts.',
    );
  };

  const handleCreateAccount = () => {
    if (!fullName.trim()) {
      showMessage('Name required', 'Please enter your full name.');
      return;
    }
    if (!isValidEmail(signupEmail)) {
      showMessage('Check your email', 'Please enter a valid email address.');
      return;
    }
    if (signupPassword.length < 8) {
      showMessage('Password is too short', 'Your password should be at least 8 characters.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      showMessage('Passwords do not match', 'Please check your password confirmation.');
      return;
    }

    showMessage(
      'Account form completed',
      'The sign-up screen is ready. Account creation will work after the team connects an authentication backend.',
      () => setMainScreen('login'),
    );
  };

  const handleResendCode = () => {
    showMessage('Code requested', 'A real resend action will be connected with the authentication backend.');
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      showMessage('Incomplete code', 'Enter all six digits to continue.');
      return;
    }

    // Demo only: any six-digit code advances the UI. A backend must validate a real OTP.
    setPasswordSheet('reset');
  };

  const handleFinishReset = () => {
    if (newPassword.length < 8) {
      showMessage('Password is too short', 'Your new password should be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showMessage('Passwords do not match', 'Please check your password confirmation.');
      return;
    }

    showMessage(
      'Reset flow completed',
      'The reset-password UI is ready. A real password update requires an authentication backend.',
      () => {
        setPasswordSheet('none');
        setLoginPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      },
    );
  };

  return {
    splashDone,
    mainScreen,
    setMainScreen,
    passwordSheet,
    setPasswordSheet,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    rememberMe,
    setRememberMe,
    fullName,
    setFullName,
    signupEmail,
    setSignupEmail,
    signupPassword,
    setSignupPassword,
    confirmPassword,
    setConfirmPassword,
    resetEmail,
    verificationCode,
    setVerificationCode,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    openForgotPassword,
    handleSignIn,
    handleCreateAccount,
    handleVerifyCode,
    handleResendCode,
    handleFinishReset,
  };
}
