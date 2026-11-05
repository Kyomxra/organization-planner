import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { BrandHeader } from '../components/Brand';
import { AuthTextField } from '../components/AuthTextField';
import { PrimaryButton } from '../components/PrimaryButton';

type SignUpScreenProps = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onCreateAccount: () => void;
  onSignIn: () => void;
};

export function SignUpScreen({
  fullName,
  email,
  password,
  confirmPassword,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onCreateAccount,
  onSignIn,
}: SignUpScreenProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <BrandHeader />
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join your team and keep every plan, update, and conversation in one place.</Text>

        <View style={styles.card}>
          <AuthTextField
            label="Full name"
            value={fullName}
            onChangeText={onFullNameChange}
            placeholder="Enter your name"
            icon="♙"
            autoCapitalize="words"
            textContentType="name"
          />
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
          <AuthTextField
            label="Password confirmation"
            value={confirmPassword}
            onChangeText={onConfirmPasswordChange}
            placeholder="Re-enter your password"
            icon="▣"
            secureTextEntry
          />
          <PrimaryButton title="Create account" onPress={onCreateAccount} style={styles.submit} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onSignIn}>
            <Text style={styles.footerLink}>Sign in</Text>
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
  title: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.65 },
  subtitle: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 17, maxWidth: 315 },
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
  submit: { marginTop: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { color: colors.muted, fontSize: 10 },
  footerLink: { color: colors.primary, fontSize: 10, fontWeight: '800' },
});
