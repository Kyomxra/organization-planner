import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';

interface JoinOrganizationModalProps {
  visible: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
}

export function JoinOrganizationModal({ visible, onClose, onJoin }: JoinOrganizationModalProps) {
  const [code, setCode] = useState('');

  const handleJoinPress = () => {
    if (!code.trim()) return;
    onJoin(code.trim().toUpperCase());
    setCode('');
    onClose();
  };

  const handleClose = () => {
    setCode('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardContainer}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={10}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Join an Organization</Text>
              <View style={styles.spacer} />
            </View>

            {/* Input Field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="Enter invite code"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            {/* Join Action Button */}
            <TouchableOpacity
              style={[styles.joinBtn, !code.trim() && styles.joinBtnDisabled]}
              onPress={handleJoinPress}
              disabled={!code.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.joinBtnText}>JOIN</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(23, 24, 43, 0.45)',
  },
  keyboardContainer: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: '#85879A',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  spacer: {
    width: 32,
  },
  inputContainer: {
    marginBottom: 18,
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E4EF',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  joinBtn: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  joinBtnDisabled: {
    opacity: 0.5,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
