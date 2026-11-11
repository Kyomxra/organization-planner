import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { AuthBottomSheet } from '../components/AuthBottomSheet';
import { PrimaryButton } from '../components/PrimaryButton';
import { VerificationCodeInput } from '../components/VerificationCodeInput';

type ForgotPasswordScreenProps = {
  visible: boolean;
  email: string;
  code: string;
  onCodeChange: (value: string) => void;
  onClose: () => void;
  onContinue: () => void;
  onResend: () => void;
};

/** Email verification sheet shown after the user taps Forgot password? */
export function ForgotPasswordScreen({
  visible,
  email,
  code,
  onCodeChange,
  onClose,
  onContinue,
  onResend,
}: ForgotPasswordScreenProps) {
  return (
    <AuthBottomSheet visible={visible} title="Reset Password" onClose={onClose}>
      <Text style={styles.heading}>Check your Email</Text>
      <Text style={styles.description}>
        Enter the code we sent to {email || 'alex@organization.com'} to continue
      </Text>
      <VerificationCodeInput value={code} onChange={onCodeChange} />
      <View style={styles.resendRow}>
        <Text style={styles.resendText}>Didn't receive a code? </Text>
        <TouchableOpacity onPress={onResend} accessibilityRole="button" accessibilityLabel="Resend verification code">
          <Text style={styles.link}>Resend</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.timerCountdown}>Resend <Text style={styles.timerHighlight}>00:59s</Text></Text>
      <PrimaryButton
        title="Continue"
        onPress={onContinue}
        disabled={code.length !== 6}
        style={styles.action}
      />
    </AuthBottomSheet>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 7 },
  description: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  resendText: { color: colors.muted, fontSize: 10 },
  link: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  timerCountdown: { textAlign: 'center', color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 16 },
  timerHighlight: { color: colors.primary, fontWeight: '800' },
  action: { marginTop: 2 },
});
