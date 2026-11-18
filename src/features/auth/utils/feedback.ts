import { Alert, Platform } from 'react-native';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  title: string;
  message: string;
  type: ToastType;
}

let activeToast: ToastMessage | null = null;
let nextToastId = 0;
const toastListeners = new Set<(toast: ToastMessage | null) => void>();

export function showMessage(title: string, message: string, onOk?: () => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    onOk?.();
    return;
  }
  Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
}

export function showToast(type: ToastType, title: string, message: string) {
  activeToast = { id: ++nextToastId, type, title, message };
  toastListeners.forEach((listener) => listener(activeToast));
}

export function getActiveToast() {
  return activeToast;
}

export function subscribeToToasts(listener: (toast: ToastMessage | null) => void) {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

export function dismissToast(id: number) {
  if (activeToast?.id !== id) return;
  activeToast = null;
  toastListeners.forEach((listener) => listener(null));
}

export function confirmAction(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', style: 'destructive', onPress: onConfirm },
  ]);
}
