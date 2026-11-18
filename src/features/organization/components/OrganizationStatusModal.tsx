import React, { useState, useEffect } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { OrgStatus, OrganizationItem } from '../types';

interface OrganizationStatusModalProps {
  visible: boolean;
  organization: OrganizationItem | null;
  onClose: () => void;
  onSaveStatus: (orgId: string, nextStatus: OrgStatus) => void;
}

export function OrganizationStatusModal({
  visible,
  organization,
  onClose,
  onSaveStatus,
}: OrganizationStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrgStatus>('Active');

  useEffect(() => {
    if (organization) {
      setSelectedStatus(organization.status);
    }
  }, [organization]);

  if (!organization) return null;

  const handleSave = () => {
    onSaveStatus(organization.id, selectedStatus);
    onClose();
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
          {/* Drag Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.iconButton} hitSlop={10}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Organization Status</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveCircleButton} hitSlop={10}>
              <Svg width={14} height={14} viewBox="0 0 20 20">
                <Path d="M4 10.5L8 14.5L16 6.5" stroke={colors.surface} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Graphic Icon: Person silhouette with X badge */}
          <View style={styles.graphicContainer}>
            <Svg width={80} height={80} viewBox="0 0 100 100">
              {/* Head */}
              <Circle cx="50" cy="30" r="16" fill="none" stroke={colors.text} strokeWidth={3} />
              {/* Shoulders */}
              <Path
                d="M22 80 C22 62, 34 54, 50 54 C58 54, 65 57, 70 62"
                fill="none"
                stroke={colors.text}
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* X Badge circle */}
              <Circle cx="76" cy="74" r="14" fill={colors.surface} stroke={colors.text} strokeWidth={3} />
              <Path
                d="M71 69 L81 79 M81 69 L71 79"
                stroke={colors.text}
                strokeWidth={2.8}
                strokeLinecap="round"
              />
            </Svg>
          </View>

          {/* Title */}
          <Text style={styles.statusQuestion}>Changes Organization Status</Text>

          {/* Status Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                styles.inactiveBtn,
                selectedStatus === 'Inactive' && styles.inactiveSelected,
              ]}
              onPress={() => setSelectedStatus('Inactive')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.inactiveText,
                  selectedStatus === 'Inactive' && styles.inactiveTextSelected,
                ]}
              >
                Inactive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusBtn,
                styles.activeBtn,
                selectedStatus === 'Active' && styles.activeSelected,
              ]}
              onPress={() => setSelectedStatus('Active')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.activeText,
                  selectedStatus === 'Active' && styles.activeTextSelected,
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>
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
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    alignItems: 'center',
    width: '100%',
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
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  saveCircleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphicContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusQuestion: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 14,
  },
  statusBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  inactiveBtn: {
    borderColor: colors.error100,
    backgroundColor: colors.surface,
  },
  inactiveSelected: {
    backgroundColor: colors.error100,
    borderColor: colors.error500,
  },
  inactiveText: {
    color: colors.error500,
    fontWeight: '700',
    fontSize: 14,
  },
  inactiveTextSelected: {
    color: colors.error500,
    fontWeight: '800',
  },
  activeBtn: {
    borderColor: colors.success100,
    backgroundColor: colors.surface,
  },
  activeSelected: {
    backgroundColor: colors.success100,
    borderColor: colors.success500,
  },
  activeText: {
    color: colors.success500,
    fontWeight: '700',
    fontSize: 14,
  },
  activeTextSelected: {
    color: colors.success500,
    fontWeight: '800',
  },
});
