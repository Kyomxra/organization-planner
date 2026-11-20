import React from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/ThemeContext';
import { AuthBottomSheet } from '../components/AuthBottomSheet';
import { AuthTextField } from '../components/AuthTextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { maskEmail } from '../utils/validation';

type ResetPasswordScreenProps = {
  visible: boolean;
  email: string;
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onClose: () => void;
  onFinish: () => void;
  loading?: boolean;
};

/** Step 3 of password recovery: choose a new password after the code is verified. */
export function ResetPasswordScreen({
  visible,
  email,
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onClose,
  onFinish,
  loading = false,
}: ResetPasswordScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Inline validation — only surface errors once the user has typed something.
  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <AuthBottomSheet visible={visible} title="Reset Password" onClose={onClose}>
      <Text style={styles.heading}>Change Password</Text>
      <Text style={styles.email}>{maskEmail(email) || 'your email'}</Text>
      <AuthTextField
        label="New password"
        value={password}
        onChangeText={onPasswordChange}
        placeholder="Enter your new password"
        icon="lock"
        secureTextEntry
        error={passwordTooShort ? 'Password should be at least 8 characters' : undefined}
      />
      <AuthTextField
        label="Password confirmation"
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        placeholder="Re-enter your password"
        icon="lock"
        secureTextEntry
        error={passwordMismatch ? 'Password does not match' : undefined}
      />
      <PrimaryButton title="Finish" onPress={onFinish} loading={loading} style={styles.action} />
    </AuthBottomSheet>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  heading: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  email: { color: colors.muted, fontSize: 11, marginBottom: 16 },
  action: { marginTop: 3 },
});
