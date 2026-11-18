import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import {
  dismissToast,
  getActiveToast,
  subscribeToToasts,
  ToastMessage,
} from '../utils/feedback';

const toastColors = {
  success: colors.success500,
  error: colors.error500,
  info: colors.primary,
};

export function ToastHost() {
  const [toast, setToast] = useState<ToastMessage | null>(getActiveToast);

  useEffect(() => subscribeToToasts(setToast), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismissToast(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <View
        accessibilityLiveRegion="polite"
        style={[styles.toast, { borderLeftColor: toastColors[toast.type] }]}
      >
        <Text style={styles.title}>{toast.title}</Text>
        <Text style={styles.message}>{toast.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 54,
    zIndex: 1000,
  },
  toast: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  message: { color: colors.muted, fontSize: 12, marginTop: 3 },
});
