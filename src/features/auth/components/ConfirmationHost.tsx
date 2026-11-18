import React, { useEffect, useState } from 'react';
import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/ThemeContext';
import {
  ConfirmationRequest,
  dismissConfirmation,
  getActiveConfirmation,
  subscribeToConfirmations,
} from '../utils/feedback';

export function ConfirmationHost() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [request, setRequest] = useState<ConfirmationRequest | null>(getActiveConfirmation);

  useEffect(() => subscribeToConfirmations(setRequest), []);

  const cancel = () => {
    if (request) dismissConfirmation(request.id);
  };

  const confirm = () => {
    if (request) dismissConfirmation(request.id, true);
  };

  return (
    <Modal
      visible={Boolean(request)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={cancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cancel} />
        <View accessibilityRole="alert" style={styles.dialog}>
          <Text style={styles.title}>{request?.title}</Text>
          <Text style={styles.message}>{request?.message}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={cancel}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={confirm}
              style={[styles.button, styles.confirmButton]}
            >
              <Text style={styles.confirmText}>{request?.confirmLabel ?? 'Confirm'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.overlay,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    padding: 22,
    borderRadius: 18,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  message: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 9,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 24,
  },
  button: {
    minWidth: 92,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 11,
  },
  cancelButton: {
    backgroundColor: colors.surfaceSubtle,
  },
  confirmButton: {
    backgroundColor: colors.error500,
  },
  cancelText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  confirmText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});
