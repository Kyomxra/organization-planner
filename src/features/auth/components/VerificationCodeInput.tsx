import React, { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../../../theme/colors';

type VerificationCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  digits?: number;
};

export function VerificationCodeInput({ value, onChange, digits = 6 }: VerificationCodeInputProps) {
  const refs = useRef<Array<TextInput | null>>([]);

  const changeDigit = (index: number, input: string) => {
    const digit = input.replace(/\D/g, '').slice(-1);
    const next = Array.from({ length: digits }, (_, digitIndex) => value[digitIndex] || '');
    next[index] = digit;
    onChange(next.join('').slice(0, digits));
    if (digit && index < digits - 1) refs.current[index + 1]?.focus();
  };

  return (
    <View style={styles.row}>
      {Array.from({ length: digits }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => { refs.current[index] = ref; }}
          value={value[index] || ''}
          onChangeText={(input) => changeDigit(index, input)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          style={styles.box}
          textAlign="center"
          accessibilityLabel={`Verification digit ${index + 1}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 20, marginBottom: 13 },
  box: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
});
