import React, { useState } from 'react';
import {
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
import { showMessage } from '../../auth/utils/feedback';
import { supabase } from '../../../lib/supabase';
import * as Clipboard from 'expo-clipboard';

interface InvitesModalProps {
  visible: boolean;
  organizationId: string;
  onClose: () => void;
}

export function InvitesModal({ visible, organizationId, onClose }: InvitesModalProps) {
  const [executiveCode, setExecutiveCode] = useState('');
  const [coordinatorCode, setCoordinatorCode] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCodes = async () => {
    setIsGenerating(true);
    const { data, error } = await supabase.rpc('create_organization_invites', {
      p_organization_id: organizationId,
    });
    setIsGenerating(false);
    if (error) {
      showMessage('Could not generate invite codes', error.message);
      return;
    }
    setExecutiveCode(data.executive);
    setCoordinatorCode(data.coordinator);
    setMemberCode(data.member);
  };

  const handleCopyCode = async (role: string, code: string) => {
    if (!code) {
      showMessage('Generate First', 'Please tap "Generate codes" first to create invite codes.');
      return;
    }
    try {
      await Clipboard.setStringAsync(code);
      showMessage('Copied', `${role} invite code copied to the clipboard.`);
    } catch (error: unknown) {
      showMessage(
        'Could not copy invite code',
        error instanceof Error ? error.message : 'Select and copy the code manually.',
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Invites</Text>
            <View style={styles.spacer} />
          </View>

          {/* Generate Codes Button */}
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={() => { void handleGenerateCodes(); }}
            disabled={isGenerating}
            activeOpacity={0.85}
          >
            <Text style={styles.generateBtnText}>{isGenerating ? 'Generating…' : 'Generate codes'}</Text>
          </TouchableOpacity>

          {/* Executives Invite */}
          <View style={styles.section}>
            <Text style={styles.roleLabel}>Executives</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.codeField}
                value={executiveCode}
                placeholder="Invite code will appear here"
                placeholderTextColor={colors.placeholder}
                editable={false}
              />
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => handleCopyCode('Executive', executiveCode)}
                activeOpacity={0.85}
              >
                <Text style={styles.copyBtnText}>Copy code</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Coordinators Invite */}
          <View style={styles.section}>
            <Text style={styles.roleLabel}>Coordinators</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.codeField}
                value={coordinatorCode}
                placeholder="Invite code will appear here"
                placeholderTextColor={colors.placeholder}
                editable={false}
              />
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => handleCopyCode('Coordinator', coordinatorCode)}
                activeOpacity={0.85}
              >
                <Text style={styles.copyBtnText}>Copy code</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Members Invite */}
          <View style={styles.section}>
            <Text style={styles.roleLabel}>Members</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.codeField}
                value={memberCode}
                placeholder="Invite code will appear here"
                placeholderTextColor={colors.placeholder}
                editable={false}
              />
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => handleCopyCode('Member', memberCode)}
                activeOpacity={0.85}
              >
                <Text style={styles.copyBtnText}>Copy code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
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
    color: colors.muted,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  spacer: {
    width: 32,
  },
  generateBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  generateBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  section: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeField: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13,
    color: colors.text,
  },
  copyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtnText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '800',
  },
});
