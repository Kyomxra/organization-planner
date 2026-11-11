import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../../../theme/colors';
import { AuthBottomSheet } from '../components/AuthBottomSheet';
import { AuthTextField } from '../components/AuthTextField';
import { PrimaryButton } from '../components/PrimaryButton';

type ResetPasswordScreenProps = {
  visible: boolean;
  email: string;
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onClose: () => void;
  onFinish: () => void;
};

/** New-password sheet displayed after the verification-code step. */
export function ResetPasswordScreen({
  visible,
  email,
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onClose,
  onFinish,
}: ResetPasswordScreenProps) {
  return (
    <AuthBottomSheet visible={visible} title="Reset Password" onClose={onClose}>
      <Text style={styles.heading}>Change Password</Text>
      <Text style={styles.email}>{email || 'alex@organization.com'}</Text>
      <AuthTextField
        label="New password"
        value={password}
        onChangeText={onPasswordChange}
        placeholder="Enter your new password"
        icon="lock"
        secureTextEntry
      />
      <AuthTextField
        label="Password confirmation"
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        placeholder="Re-enter your password"
        icon="lock"
        secureTextEntry
      />
      <PrimaryButton title="Finish" onPress={onFinish} style={styles.action} />
    </AuthBottomSheet>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  email: { color: colors.muted, fontSize: 11, marginBottom: 16 },
  action: { marginTop: 3 },
});
