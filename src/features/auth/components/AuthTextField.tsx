import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  error?: string;
  textContentType?: TextInputProps['textContentType'];
};

export function AuthTextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  textContentType,
}: AuthTextFieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error ? styles.inputError : null]}>
        <Text style={styles.leadingIcon}>{icon}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isPassword && !visible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          textContentType={textContentType}
          accessibilityLabel={label}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setVisible((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            hitSlop={10}
          >
            <Text style={styles.trailingIcon}>{visible ? '◉' : '◎'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { color: colors.text, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  inputShell: {
    minHeight: 43,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputError: { borderColor: colors.danger },
  leadingIcon: { color: '#9B9DB0', fontSize: 13, width: 20 },
  input: { flex: 1, color: colors.text, fontSize: 12, paddingVertical: 10 },
  trailingIcon: { color: '#8D8FA2', fontSize: 16, paddingHorizontal: 3 },
  errorText: { color: colors.danger, fontSize: 10, marginTop: 4 },
});
