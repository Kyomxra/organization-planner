import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { showMessage } from '../utils/feedback';
import { isValidEmail } from '../utils/validation';

type MainScreen = 'login' | 'signup';
type PasswordSheet = 'none' | 'verify' | 'reset';

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

  const openForgotPassword = async () => {
    if (!isValidEmail(loginEmail)) {
      showMessage('Email required', 'Enter your email address first, then tap Forgot password? again.');
      return;
    }

    const email = loginEmail.trim();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        showMessage('Could not send reset email', error.message);
        return;
      }

      setResetEmail(email);
      setVerificationCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordSheet('verify');
    } catch (error: unknown) {
      showMessage(
        'Could not send reset email',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
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
        showMessage('Sign in failed', error.message);
      }
    } catch (error: unknown) {
      showMessage(
        'Sign in failed',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
    }
  };

  const handleSignOut = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showMessage('Sign out failed', error.message);
        return false;
      }
      setIsAuthenticated(false);
      setLoginPassword('');
      return true;
    } catch (error: unknown) {
      showMessage(
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
        showMessage('Account creation failed', error.message);
        return;
      }

      setLoginEmail(signupEmail.trim());
      setLoginPassword('');
      setUserEmail(data.user?.email ?? signupEmail.trim());
      setMainScreen('login');
      showMessage(
        data.session ? 'Account created' : 'Check your email',
        data.session
          ? 'Your account is ready. You are now signed in.'
          : 'Confirm your email using the link we sent, then sign in.',
      );
    } catch (error: unknown) {
      showMessage(
        'Account creation failed',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
    }
  };

  const handleResendCode = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      if (error) {
        showMessage('Could not resend reset email', error.message);
        return;
      }
      showMessage('Email sent', 'A new password-reset email has been sent.');
    } catch (error: unknown) {
      showMessage(
        'Could not resend reset email',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
    }
  };

  const handleVerifyCode = async () => {
    if (!/^\d{6}$/.test(verificationCode)) {
      showMessage('Incomplete code', 'Enter all six digits to continue.');
      return;
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: resetEmail,
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
    }
  };

  const handleFinishReset = async () => {
    if (newPassword.length < 8) {
      showMessage('Password is too short', 'Your new password should be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showMessage('Passwords do not match', 'Please check your password confirmation.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        showMessage('Password update failed', error.message);
        return;
      }

      showMessage('Password updated', 'Your password has been changed.', () => {
        setPasswordSheet('none');
        setLoginPassword('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmNewPassword('');
      });
    } catch (error: unknown) {
      showMessage(
        'Password update failed',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
    }
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
    isAuthenticated,
    setIsAuthenticated,
    userId,
    userName,
    userEmail,
    openForgotPassword,
    handleSignIn,
    handleSignOut,
    handleCreateAccount,
    handleVerifyCode,
    handleResendCode,
    handleFinishReset,
  };
}
