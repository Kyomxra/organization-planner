import React from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/ThemeContext';
import { AuthBottomSheet } from '../components/AuthBottomSheet';
import { AuthTextField } from '../components/AuthTextField';
import { PrimaryButton } from '../components/PrimaryButton';

type ForgotPasswordEmailScreenProps = {
  visible: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  onClose: () => void;
  onSendCode: () => void;
  loading?: boolean;
};

/** Step 1 of password recovery: collect the account email and request the OTP. */
export function ForgotPasswordEmailScreen({
  visible,
  email,
  onEmailChange,
  onClose,
  onSendCode,
  loading = false,
}: ForgotPasswordEmailScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <AuthBottomSheet visible={visible} title="Forgot Password" onClose={onClose}>
      <Text style={styles.heading}>Reset your password</Text>
      <Text style={styles.description}>
        Enter the email linked to your account and we will send you a 6-digit code.
      </Text>
      <AuthTextField
        label="Email address"
        value={email}
        onChangeText={onEmailChange}
        placeholder="Enter your email"
        icon="email"
        keyboardType="email-address"
      />
      <PrimaryButton
        title="Send code"
        onPress={onSendCode}
        loading={loading}
        disabled={loading || email.trim().length === 0}
        style={styles.action}
      />
    </AuthBottomSheet>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  heading: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 7 },
  description: { color: colors.muted, fontSize: 11, lineHeight: 17, marginBottom: 16 },
  action: { marginTop: 4 },
});
