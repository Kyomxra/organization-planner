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
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';

type AuthFieldIcon = 'email' | 'lock' | 'user';

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: AuthFieldIcon;
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
        <FieldIcon name={icon} />
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
            <Svg width={16} height={16} viewBox="0 0 20 20">
              {visible ? (
                <>
                  <Path d="M2 10s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" fill="none" stroke={colors.muted} strokeWidth={1.5} />
                  <Circle cx={10} cy={10} r={2.2} fill="none" stroke={colors.muted} strokeWidth={1.5} />
                </>
              ) : (
                <>
                  <Path d="M2 10s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" fill="none" stroke={colors.muted} strokeWidth={1.5} />
                  <Circle cx={10} cy={10} r={2.2} fill="none" stroke={colors.muted} strokeWidth={1.5} />
                  <Path d="m3 17 14-14" fill="none" stroke={colors.muted} strokeWidth={1.5} />
                </>
              )}
            </Svg>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function FieldIcon({ name }: { name: AuthFieldIcon }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 20 20" style={styles.leadingIcon}>
      {name === 'email' ? (
        <Path d="M2.5 4.5h15v11h-15zM3 5l7 5.5L17 5" fill="none" stroke={colors.muted} strokeWidth={1.5} strokeLinejoin="round" />
      ) : name === 'lock' ? (
        <>
          <Path d="M5 9V6.5a5 5 0 0 1 10 0V9" fill="none" stroke={colors.muted} strokeWidth={1.5} />
          <Path d="M3.5 9h13v9h-13z" fill="none" stroke={colors.muted} strokeWidth={1.5} strokeLinejoin="round" />
          <Circle cx={10} cy={13} r={1} fill={colors.muted} />
        </>
      ) : (
        <>
          <Circle cx={10} cy={6.5} r={3.5} fill="none" stroke={colors.muted} strokeWidth={1.5} />
          <Path d="M3 18a7 7 0 0 1 14 0" fill="none" stroke={colors.muted} strokeWidth={1.5} strokeLinecap="round" />
        </>
      )}
    </Svg>
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
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputError: { borderColor: colors.danger },
  leadingIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderWidth: 0,
    outlineWidth: 0,
  },
  errorText: { color: colors.danger, fontSize: 10, marginTop: 4 },
});
