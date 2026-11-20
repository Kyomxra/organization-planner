import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { showMessage, showToast } from '../utils/feedback';
import { isValidEmail, isValidPassword } from '../utils/validation';

type MainScreen = 'login' | 'signup';
type PasswordSheet = 'none' | 'email' | 'verify' | 'reset' | 'success';

/** Seconds a user must wait before requesting another reset code. */
const RESEND_COOLDOWN_SECONDS = 60;

export function useAuthFlow() {
  const [splashDone, setSplashDone] = useState(false);
  const [mainScreen, setMainScreen] = useState<MainScreen>('login');
  const [passwordSheet, setPasswordSheet] = useState<PasswordSheet>('none');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('Alex');
  const [userEmail, setUserEmail] = useState('');

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
  const [isRecovering, setIsRecovering] = useState(false);
  const [isSendingResetCode, setIsSendingResetCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const applySession = (session: Session | null) => {
      setIsAuthenticated(Boolean(session));
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? '');
      const name = session?.user.user_metadata?.full_name
        || session?.user.email?.split('@')[0]
        || '';
      setUserName(name ? name.charAt(0).toUpperCase() + name.slice(1) : '');
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) applySession(session);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        showMessage('Session error', error.message);
      } else {
        applySession(data.session);
      }
      setSplashDone(true);
    }).catch((error: unknown) => {
      if (!isMounted) return;
      showMessage(
        'Session error',
        error instanceof Error ? error.message : 'Could not restore your sign-in session.',
      );
      setSplashDone(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    const timer = setTimeout(() => {
      setResendSecondsLeft((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendSecondsLeft]);

  const openForgotPassword = () => {
    setResetEmail(loginEmail.trim());
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordSheet('email');
  };

  const closePasswordSheet = () => {
    setPasswordSheet('none');
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResendSecondsLeft(0);
    if (isRecovering) {
      setIsRecovering(false);
      void supabase.auth.signOut();
    }
  };

  const handleSendResetCode = async () => {
    if (isSendingResetCode) return;
    const email = resetEmail.trim();
    if (!isValidEmail(email)) {
      showMessage('Check your email', 'Please enter a valid email address.');
      return;
    }

    setIsSendingResetCode(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        showMessage('Could not send reset code', error.message);
        return;
      }
      setResetEmail(email);
      setVerificationCode('');
      setIsRecovering(true);
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setPasswordSheet('verify');
      showToast('info', 'Code sent', `We sent a 6-digit code to ${email}.`);
    } catch (error: unknown) {
      showMessage(
        'Could not send reset code',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
    } finally {
      setIsSendingResetCode(false);
    }
  };

  const handleSignIn = async () => {
    if (!isValidEmail(loginEmail)) {
      showMessage('Check your email', 'Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      showMessage('Password required', 'Enter your password to sign in.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      if (error) {
        showToast('error', 'Sign in failed', error.message);
      } else {
        showToast('success', 'Signed in', 'Welcome back.');
      }
    } catch (error: unknown) {
      showToast(
        'error',
        'Sign in failed',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
    }
  };

  const handleSignOut = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showToast('error', 'Sign out failed', error.message);
        return false;
      }
      setIsAuthenticated(false);
      setLoginPassword('');
      showToast('success', 'Signed out', 'You have been logged out.');
      return true;
    } catch (error: unknown) {
      showToast(
        'error',
        'Sign out failed',
        error instanceof Error ? error.message : 'Could not sign out.',
      );
      return false;
    }
  };

  const handleCreateAccount = async () => {
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

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          data: { full_name: fullName.trim() },
        },
      });
      if (error) {
        showToast('error', 'Account creation failed', error.message);
        return;
      }

      setLoginEmail(signupEmail.trim());
      setLoginPassword('');
      setUserEmail(data.user?.email ?? signupEmail.trim());
      setMainScreen('login');
      showToast(
        data.session ? 'success' : 'info',
        data.session ? 'Account created' : 'Check your email',
        data.session
          ? 'Your account is ready. You are now signed in.'
          : 'Confirm your email using the link we sent, then sign in.',
      );
    } catch (error: unknown) {
      showToast(
        'error',
        'Account creation failed',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
    }
  };

  const handleResendCode = async () => {
    if (resendSecondsLeft > 0) return;
    const email = resetEmail.trim();
    if (!isValidEmail(email)) {
      showMessage('Check your email', 'Please enter a valid email address.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        showMessage('Could not resend code', error.message);
        return;
      }
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      showToast('info', 'Code resent', `A new 6-digit code was sent to ${email}.`);
    } catch (error: unknown) {
      showMessage(
        'Could not resend code',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
    }
  };

  const handleVerifyCode = async () => {
    if (isVerifyingCode) return;
    if (!/^\d{6}$/.test(verificationCode)) {
      showMessage('Incomplete code', 'Enter all six digits to continue.');
      return;
    }

    setIsVerifyingCode(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: resetEmail.trim(),
        token: verificationCode,
        type: 'recovery',
      });
      if (error) {
        showMessage('Could not verify code', error.message);
        return;
      }

      setPasswordSheet('reset');
    } catch (error: unknown) {
      showMessage(
        'Could not verify code',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleFinishReset = async () => {
    if (isUpdatingPassword) return;
    if (!isValidPassword(newPassword)) {
      showMessage('Password is too short', 'Your new password should be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showMessage('Passwords do not match', 'Please check your password confirmation.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        showToast('error', 'Password update failed', error.message);
        return;
      }

      setVerificationCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setResendSecondsLeft(0);
      setPasswordSheet('success');
    } catch (error: unknown) {
      showToast(
        'error',
        'Password update failed',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleReturnToLogin = async () => {
    setPasswordSheet('none');
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResendSecondsLeft(0);
    setLoginPassword('');
    try {
      await supabase.auth.signOut();
    } finally {
      setIsRecovering(false);
    }
    showToast('success', 'Password updated', 'Sign in with your new password.');
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
    setResetEmail,
    verificationCode,
    setVerificationCode,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    isRecovering,
    isSendingResetCode,
    isVerifyingCode,
    isUpdatingPassword,
    resendSecondsLeft,
    isAuthenticated,
    setIsAuthenticated,
    userId,
    userName,
    userEmail,
    openForgotPassword,
    closePasswordSheet,
    handleSendResetCode,
    handleSignIn,
    handleSignOut,
    handleCreateAccount,
    handleVerifyCode,
    handleResendCode,
    handleFinishReset,
    handleReturnToLogin,
  };
}
