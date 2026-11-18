import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';

type AuthBottomSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Shared modal sheet used by the password recovery screens. */
export function AuthBottomSheet({ visible, title, onClose, children }: AuthBottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close dialog" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoider}>
          <View style={styles.sheet}>
            {/* Drag Handle */}
            <View style={styles.handle} />
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.headerSpacer} />
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  keyboardAvoider: { width: '100%', justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  handle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 34, marginBottom: 20 },
  closeButton: { width: 30, height: 30, alignItems: 'flex-start', justifyContent: 'center' },
  closeText: { color: colors.text, fontSize: 22, lineHeight: 26 },
  title: { color: colors.text, fontSize: 12, fontWeight: '800' },
  headerSpacer: { width: 30 },
  content: { paddingBottom: 5 },
});
