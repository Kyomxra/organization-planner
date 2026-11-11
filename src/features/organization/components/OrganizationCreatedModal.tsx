import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { showMessage } from '../../auth/utils/feedback';

interface OrganizationCreatedModalProps {
  visible: boolean;
  orgName: string;
  onEnterOrganization: () => void;
}

export function OrganizationCreatedModal({
  visible,
  orgName,
  onEnterOrganization,
}: OrganizationCreatedModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const inviteCodes = [
    { key: 'executive', label: 'Executive Invite Code', code: 'ORG-7P2F' },
    { key: 'coordinator', label: 'Coordinator Invite Code', code: 'ORG-8K2F' },
    { key: 'member', label: 'Member Invite Code', code: 'ORG-2C7F' },
  ];

  const handleCopy = (key: string, code: string) => {
    setCopiedKey(key);
    showMessage('Code Copied', `${code} has been copied to your clipboard.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShare = (label: string, code: string) => {
    showMessage('Share Invite Code', `Share ${label} (${code}) with your team.`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Green Checkmark Circle */}
            <View style={styles.successIconCircle}>
              <Svg width={28} height={28} viewBox="0 0 24 24">
                <Path
                  d="M5 13L9 17L19 7"
                  fill="none"
                  stroke="#2C9B76"
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>Organization Created</Text>
            <Text style={styles.orgName}>{orgName || 'Organisasi A'}</Text>
            <Text style={styles.description}>
              Your organization is ready. Invite your team using the code below.
            </Text>

            {/* Invite Codes */}
            {inviteCodes.map((item) => (
              <View key={item.key} style={styles.codeSection}>
                <View style={styles.codeHeader}>
                  <Text style={styles.codeRoleLabel}>{item.label}</Text>
                  <View style={styles.codePill}>
                    <Text style={styles.codePillText}>{item.code}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleCopy(item.key, item.code)}
                    activeOpacity={0.7}
                  >
                    <Svg width={14} height={14} viewBox="0 0 20 20" style={styles.btnIcon}>
                      <Path
                        d="M6 3H14C15.1 3 16 3.9 16 5V13M4 7H12C13.1 7 14 7.9 14 9V17C14 18.1 13.1 19 12 19H4C2.9 19 2 18.1 2 17V9C2 7.9 2.9 7 4 7Z"
                        fill="none"
                        stroke="#5145E8"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text style={styles.actionBtnText}>
                      {copiedKey === item.key ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleShare(item.label, item.code)}
                    activeOpacity={0.7}
                  >
                    <Svg width={14} height={14} viewBox="0 0 20 20" style={styles.btnIcon}>
                      <Circle cx="15" cy="5" r="2.5" fill="none" stroke="#5145E8" strokeWidth={1.8} />
                      <Circle cx="5" cy="10" r="2.5" fill="none" stroke="#5145E8" strokeWidth={1.8} />
                      <Circle cx="15" cy="15" r="2.5" fill="none" stroke="#5145E8" strokeWidth={1.8} />
                      <Path d="M7.2 8.9L12.8 6.1M7.2 11.1L12.8 13.9" stroke="#5145E8" strokeWidth={1.8} />
                    </Svg>
                    <Text style={styles.actionBtnText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Enter Organization Button */}
            <TouchableOpacity
              style={styles.enterBtn}
              onPress={onEnterOrganization}
              activeOpacity={0.85}
            >
              <Text style={styles.enterBtnText}>Enter Organization</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 24, 43, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
    shadowColor: '#17182B',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F8F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  codeSection: {
    width: '100%',
    backgroundColor: '#FAFBFD',
    borderWidth: 1,
    borderColor: '#EDEEF7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeRoleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  codePill: {
    backgroundColor: '#EEECFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codePillText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E4F0',
    borderRadius: 10,
  },
  btnIcon: {
    marginRight: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  enterBtn: {
    width: '100%',
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  enterBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
