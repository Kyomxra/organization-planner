import { Alert, Platform } from 'react-native';

/** Shows feedback in both native apps and the browser preview. */
export function showMessage(title: string, message: string, onOk?: () => void): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    onOk?.();
    return;
  }

  Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
}
