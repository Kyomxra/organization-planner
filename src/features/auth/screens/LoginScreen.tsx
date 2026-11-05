import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { BrandHeader } from '../components/Brand';
import { AuthTextField } from '../components/AuthTextField';
import { PrimaryButton } from '../components/PrimaryButton';

type LoginScreenProps = {
  email: string;
  password: string;
  rememberMe: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberChange: () => void;
  onSignIn: () => void;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
};

export function LoginScreen({
  email,
  password,
  rememberMe,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onSignIn,
  onForgotPassword,
  onCreateAccount,
}: LoginScreenProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <BrandHeader />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue to your organizations and team spaces.</Text>

        <View style={styles.card}>
          <AuthTextField
            label="Email address"
            value={email}
            onChangeText={onEmailChange}
            placeholder="Enter your email"
            icon="✉"
            keyboardType="email-address"
          />
          <AuthTextField
            label="Password"
            value={password}
            onChangeText={onPasswordChange}
            placeholder="Enter your password"
            icon="▣"
            secureTextEntry
          />

          <View style={styles.optionsRow}>
            <TouchableOpacity onPress={onRememberChange} style={styles.rememberButton} activeOpacity={0.7}>
              <View style={[styles.checkbox, rememberMe ? styles.checkboxChecked : null]}>
                {rememberMe ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onForgotPassword} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton title="Sign in  →" onPress={onSignIn} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to Orbit? </Text>
          <TouchableOpacity onPress={onCreateAccount}>
            <Text style={styles.footerLink}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 26 },
  container: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  title: { color: colors.text, fontSize: 23, fontWeight: '800', letterSpacing: -0.65 },
  subtitle: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 18, maxWidth: 300 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#24244A',
    shadowOpacity: 0.09,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -1, marginBottom: 16 },
  rememberButton: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#BFC1D0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', lineHeight: 12 },
  rememberText: { color: colors.muted, fontSize: 10 },
  forgotText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { color: colors.muted, fontSize: 10 },
  footerLink: { color: colors.primary, fontSize: 10, fontWeight: '800' },
});
