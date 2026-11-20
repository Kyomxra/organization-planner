import React from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/ThemeContext';
import { AuthBottomSheet } from '../components/AuthBottomSheet';
import { PrimaryButton } from '../components/PrimaryButton';

type PasswordResetSuccessScreenProps = {
  visible: boolean;
  onClose: () => void;
  onReturnToLogin: () => void;
};

/** Step 4 of password recovery: confirm the password was changed. */
export function PasswordResetSuccessScreen({
  visible,
  onClose,
  onReturnToLogin,
}: PasswordResetSuccessScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <AuthBottomSheet visible={visible} title="Reset Password" onClose={onClose}>
      <View style={styles.badge}>
        <Svg width={34} height={34} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={11} fill="none" stroke={colors.success} strokeWidth={1.8} />
          <Path d="m7.5 12.5 3 3 6-6.5" fill="none" stroke={colors.success} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <Text style={styles.heading}>Password updated</Text>
      <Text style={styles.description}>
        Your password has been changed. Sign in again with your new password.
      </Text>
      <PrimaryButton title="Back to login" onPress={onReturnToLogin} style={styles.action} />
    </AuthBottomSheet>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  badge: { alignItems: 'center', marginTop: 4, marginBottom: 14 },
  heading: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 7, textAlign: 'center' },
  description: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginBottom: 18 },
  action: { marginTop: 2 },
});
