import React from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/ThemeContext';
import { AuthBottomSheet } from '../components/AuthBottomSheet';
import { PrimaryButton } from '../components/PrimaryButton';
import { VerificationCodeInput } from '../components/VerificationCodeInput';
import { maskEmail } from '../utils/validation';

type ForgotPasswordScreenProps = {
  visible: boolean;
  email: string;
  code: string;
  onCodeChange: (value: string) => void;
  onClose: () => void;
  onContinue: () => void;
  onResend: () => void;
  onChangeEmail?: () => void;
  resendSecondsLeft?: number;
  loading?: boolean;
};

/** Step 2 of password recovery: verify the 6-digit code sent to the user's email. */
export function ForgotPasswordScreen({
  visible,
  email,
  code,
  onCodeChange,
  onClose,
  onContinue,
  onResend,
  onChangeEmail,
  resendSecondsLeft = 0,
  loading = false,
}: ForgotPasswordScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const canResend = resendSecondsLeft <= 0;
  const countdown = `${Math.floor(resendSecondsLeft / 60).toString().padStart(2, '0')}:${(resendSecondsLeft % 60).toString().padStart(2, '0')}`;

  return (
    <AuthBottomSheet visible={visible} title="Reset Password" onClose={onClose}>
      <Text style={styles.heading}>Check your Email</Text>
      <Text style={styles.description}>
        Enter the 6-digit code we sent to {maskEmail(email) || 'your email'} to continue
      </Text>
      <VerificationCodeInput value={code} onChange={onCodeChange} />
      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn't receive a code? </Text>
        <TouchableOpacity
          onPress={onResend}
          disabled={!canResend}
          accessibilityRole="button"
          accessibilityLabel="Resend verification code"
        >
          <Text style={[styles.link, canResend ? null : styles.linkDisabled]}>Resend</Text>
        </TouchableOpacity>
      </View>
      {canResend ? (
        onChangeEmail ? (
          <TouchableOpacity onPress={onChangeEmail} style={styles.changeEmailButton} accessibilityRole="button">
            <Text style={styles.link}>Use a different email</Text>
          </TouchableOpacity>
        ) : null
      ) : (
        <Text style={styles.timerCountdown}>Resend in <Text style={styles.timerHighlight}>{countdown}</Text></Text>
      )}
      <PrimaryButton
        title="Continue"
        onPress={onContinue}
        disabled={code.length !== 6}
        loading={loading}
        style={styles.action}
      />
    </AuthBottomSheet>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  heading: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 7 },
  description: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  resendText: { color: colors.muted, fontSize: 10 },
  link: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  linkDisabled: { color: colors.muted },
  changeEmailButton: { alignItems: 'center', marginBottom: 16 },
  timerCountdown: { textAlign: 'center', color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 16 },
  timerHighlight: { color: colors.primary, fontWeight: '800' },
  action: { marginTop: 2 },
});
