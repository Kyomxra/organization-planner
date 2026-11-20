
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/ThemeContext';
import { OrgStatus, OrganizationItem } from '../types';

type OrganizationStatusAction = 'archive' | 'restore' | 'delete';

interface OrganizationStatusModalProps {
  visible: boolean;
  organization: OrganizationItem | null;
  onClose: () => void;
  onSaveStatus: (
    orgId: string,
    nextStatus: OrgStatus,
    action?: OrganizationStatusAction,
  ) => Promise<boolean>;
}

export function OrganizationStatusModal({
  visible,
  organization,
  onClose,
  onSaveStatus,
}: OrganizationStatusModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isSaving, setIsSaving] = useState(false);
  const [confirmationAction, setConfirmationAction] =
    useState<OrganizationStatusAction | null>(null);
  const [actionError, setActionError] = useState('');

  if (!organization || organization.role !== 'Executive') {
    return null;
  }

  const isInactive = organization.status === 'Inactive';

  const runAction = async (action: OrganizationStatusAction) => {
    if (isSaving) return;

    setIsSaving(true);
    setActionError('');

    try {
      const nextStatus: OrgStatus =
        action === 'restore' ? 'Active' : 'Inactive';

      const success = await onSaveStatus(
        organization.id,
        nextStatus,
        action,
      );

      if (success) {
        setConfirmationAction(null);
        onClose();
      } else {
        setActionError('The action could not be completed. Please try again.');
      }
    } catch (error) {
      console.error('Organization status action failed:', error);
      setActionError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getConfirmationContent = () => {
    switch (confirmationAction) {
      case 'archive':
        return {
          title: 'Archive Organization?',
          description:
            'This organization will move to Inactive. Members will no longer be able to open it until it is restored.',
          buttonText: 'Archive',
          destructive: true,
        };

      case 'restore':
        return {
          title: 'Restore Organization?',
          description:
            'This organization will become Active again and its members can access it.',
          buttonText: 'Restore',
          destructive: false,
        };

      case 'delete':
        return {
          title: 'Delete Organization Permanently?',
          description:
            'This action cannot be undone. The organization and its divisions, members, events, rundowns, notes, transactions, and invitations will be permanently deleted.',
          buttonText: 'Delete Permanently',
          destructive: true,
        };

      default:
        return null;
    }
  };

  const confirmation = getConfirmationContent();

  const handleClose = () => {
    if (isSaving) return;

    if (confirmationAction) {
      setConfirmationAction(null);
      setActionError('');
      return;
    }

    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          disabled={isSaving}
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.iconButton}
              hitSlop={10}
              disabled={isSaving}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Organization Management
            </Text>

            <View style={styles.headerSpacer} />
          </View>

          {confirmation ? (
            <View style={styles.confirmationContainer}>
              <View
                style={[
                  styles.confirmationIcon,
                  {
                    backgroundColor: confirmation.destructive
                      ? colors.error100
                      : colors.success100,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.confirmationIconText,
                    {
                      color: confirmation.destructive
                        ? colors.error500
                        : colors.success500,
                    },
                  ]}
                >
                  {confirmationAction === 'restore' ? '✓' : '!'}
                </Text>
              </View>

              <Text style={styles.confirmationTitle}>
                {confirmation.title}
              </Text>

              <Text style={styles.confirmationDescription}>
                {confirmation.description}
              </Text>

              {actionError ? (
                <Text style={styles.errorText}>
                  {actionError}
                </Text>
              ) : null}

              {isSaving ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                  />
                  <Text style={styles.loadingText}>
                    Processing...
                  </Text>
                </View>
              ) : (
                <View style={styles.confirmationActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      {
                        backgroundColor: confirmation.destructive
                          ? colors.error500
                          : colors.primary,
                      },
                    ]}
                    onPress={() => {
                      if (confirmationAction) {
                        void runAction(confirmationAction);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmButtonText}>
                      {confirmation.buttonText}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <>
              <View style={styles.graphicContainer}>
                <Svg width={80} height={80} viewBox="0 0 100 100">
                  <Circle
                    cx="50"
                    cy="30"
                    r="16"
                    fill="none"
                    stroke={colors.text}
                    strokeWidth={3}
                  />

                  <Path
                    d="M22 80 C22 62, 34 54, 50 54 C58 54, 65 57, 70 62"
                    fill="none"
                    stroke={colors.text}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />

                  <Circle
                    cx="76"
                    cy="74"
                    r="14"
                    fill={colors.surface}
                    stroke={colors.text}
                    strokeWidth={3}
                  />

                  {isInactive ? (
                    <Path
                      d="M69 74 L74 79 L83 68"
                      stroke={colors.success500}
                      strokeWidth={2.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  ) : (
                    <Path
                      d="M71 69 L81 79 M81 69 L71 79"
                      stroke={colors.text}
                      strokeWidth={2.8}
                      strokeLinecap="round"
                    />
                  )}
                </Svg>
              </View>

              <Text style={styles.organizationName}>
                {organization.name}
              </Text>

              <View
                style={[
                  styles.currentStatus,
                  {
                    backgroundColor: isInactive
                      ? colors.error100
                      : colors.success100,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.currentStatusText,
                    {
                      color: isInactive
                        ? colors.error500
                        : colors.success500,
                    },
                  ]}
                >
                  {organization.status}
                </Text>
              </View>

              <Text style={styles.statusQuestion}>
                {isInactive
                  ? 'What would you like to do?'
                  : 'Manage this organization'}
              </Text>

              <View style={styles.actionColumn}>
                {isInactive ? (
                  <>
                    <TouchableOpacity
                      style={styles.restoreButton}
                      onPress={() => {
                        setActionError('');
                        setConfirmationAction('restore');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.restoreButtonText}>
                        Restore Organization
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        setActionError('');
                        setConfirmationAction('delete');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.deleteButtonText}>
                        Delete Permanently
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.archiveButton}
                    onPress={() => {
                      setActionError('');
                      setConfirmationAction('archive');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.archiveButtonText}>
                      Archive Organization
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.helperText}>
                {isInactive
                  ? 'Restoring makes this organization available again. Permanent deletion cannot be undone.'
                  : 'Archiving keeps the organization data and allows it to be restored later.'}
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      backgroundColor: colors.border,
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
    headerSpacer: {
      width: 32,
    },
    graphicContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    organizationName: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 10,
    },
    currentStatus: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 10,
      marginBottom: 20,
    },
    currentStatusText: {
      fontSize: 12,
      fontWeight: '800',
    },
    statusQuestion: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    actionColumn: {
      width: '100%',
      gap: 12,
    },
    archiveButton: {
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.error100,
      borderWidth: 1,
      borderColor: colors.error500,
    },
    archiveButtonText: {
      color: colors.error500,
      fontWeight: '800',
      fontSize: 14,
    },
    restoreButton: {
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    restoreButtonText: {
      color: colors.surface,
      fontWeight: '800',
      fontSize: 14,
    },
    deleteButton: {
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.error500,
    },
    deleteButtonText: {
      color: colors.error500,
      fontWeight: '800',
      fontSize: 14,
    },
    loadingContainer: {
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    loadingText: {
      fontSize: 13,
      color: colors.muted,
      fontWeight: '600',
    },
    helperText: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 17,
      textAlign: 'center',
      marginTop: 18,
    },
    confirmationContainer: {
      width: '100%',
      alignItems: 'center',
      paddingTop: 12,
    },
    confirmationIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    confirmationIconText: {
      fontSize: 30,
      fontWeight: '800',
    },
    confirmationTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    confirmationDescription: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.muted,
      textAlign: 'center',
      marginBottom: 24,
    },
    confirmationActions: {
      width: '100%',
      gap: 10,
    },
    cancelButton: {
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    cancelButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 14,
    },
    confirmButton: {
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 14,
    },
    errorText: {
      color: colors.error500,
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 16,
    },
  });
