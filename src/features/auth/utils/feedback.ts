import { Alert, Platform } from 'react-native';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  title: string;
  message: string;
  type: ToastType;
}

export interface ConfirmationRequest {
  id: number;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

let activeToast: ToastMessage | null = null;
let nextToastId = 0;
const toastListeners = new Set<(toast: ToastMessage | null) => void>();
let activeConfirmation: ConfirmationRequest | null = null;
let nextConfirmationId = 0;
const confirmationListeners = new Set<(request: ConfirmationRequest | null) => void>();

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

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'Confirm',
) {
  requestConfirmation(title, message, onConfirm, confirmLabel);
}

export function requestConfirmation(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'Confirm',
) {
  activeConfirmation = {
    id: ++nextConfirmationId,
    title,
    message,
    confirmLabel,
    onConfirm,
  };
  confirmationListeners.forEach((listener) => listener(activeConfirmation));
}

export function getActiveConfirmation() {
  return activeConfirmation;
}

export function subscribeToConfirmations(listener: (request: ConfirmationRequest | null) => void) {
  confirmationListeners.add(listener);
  return () => {
    confirmationListeners.delete(listener);
  };
}

export function dismissConfirmation(id: number, confirmed = false) {
  if (activeConfirmation?.id !== id) return;
  const request = activeConfirmation;
  activeConfirmation = null;
  confirmationListeners.forEach((listener) => listener(null));
  if (confirmed) request.onConfirm();
}
