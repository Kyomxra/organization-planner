
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/ThemeContext';
import type { InvitePreview } from '../hooks/useOrganizationFlow';

interface JoinOrganizationModalProps {
  visible: boolean;
  onClose: () => void;
  onPreview: (code: string) => Promise<InvitePreview | null>;
  onJoin: (code: string, divisionId: string | null) => Promise<boolean>;
}

export function JoinOrganizationModal({
  visible,
  onClose,
  onPreview,
  onJoin,
}: JoinOrganizationModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requiresDivision =
    (preview?.role_to_grant === 'member' || preview?.role_to_grant === 'coordinator')
    && (preview?.divisions.length ?? 0) > 0;

  const canJoin = !requiresDivision || selectedDivisionId !== null;

  const resetForm = () => {
    setCode('');
    setPreview(null);
    setSelectedDivisionId(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePreviewPress = async () => {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode || isLoading) return;

    setIsLoading(true);

    try {
      const result = await onPreview(normalizedCode);

      if (result) {
        setPreview(result);
        setSelectedDivisionId(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinPress = async () => {
    if (!preview || !canJoin || isLoading) return;

    setIsLoading(true);

    try {
      const joined = await onJoin(code.trim().toUpperCase(), selectedDivisionId);

      if (joined) {
        resetForm();
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeCode = (value: string) => {
    setCode(value);
    setPreview(null);
    setSelectedDivisionId(null);
  };

  const roleLabel = preview?.role_to_grant
    ? preview.role_to_grant.charAt(0).toUpperCase() + preview.role_to_grant.slice(1)
    : '';

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
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={10}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Join an Organization</Text>
              <View style={styles.spacer} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.description}>
                Enter the invite code provided by your organization.
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={handleChangeCode}
                  placeholder="Enter invite code"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {!preview ? (
                <TouchableOpacity
                  style={[styles.joinBtn, (!code.trim() || isLoading) && styles.joinBtnDisabled]}
                  onPress={() => { void handlePreviewPress(); }}
                  disabled={!code.trim() || isLoading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.joinBtnText}>
                    {isLoading ? 'CHECKING…' : 'CONTINUE'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <View style={styles.organizationCard}>
                    <Text style={styles.organizationLabel}>YOU ARE JOINING</Text>
                    <Text style={styles.organizationName}>{preview.organization_name}</Text>
                    <Text style={styles.roleText}>Role: {roleLabel}</Text>
                  </View>

                  {requiresDivision ? (
                    <View style={styles.divisionSection}>
                      <Text style={styles.sectionTitle}>Choose Your Division</Text>
                      <Text style={styles.sectionDescription}>
                        Select the division you want to join.
                      </Text>

                      {preview.divisions.map((division) => {
                        const isSelected = selectedDivisionId === division.id;

                        return (
                          <Pressable
                            key={division.id}
                            style={[
                              styles.divisionOption,
                              isSelected && styles.divisionOptionSelected,
                            ]}
                            onPress={() => setSelectedDivisionId(division.id)}
                          >
                            <View style={styles.divisionTextContainer}>
                              <Text
                                style={[
                                  styles.divisionName,
                                  isSelected && styles.divisionNameSelected,
                                ]}
                              >
                                {division.name}
                              </Text>
                            </View>

                            <View style={[
                              styles.radioOuter,
                              isSelected && styles.radioOuterSelected,
                            ]}>
                              {isSelected && <View style={styles.radioInner} />}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.noDivisionText}>
                      {preview.role_to_grant === 'executive'
                        ? 'This invitation grants the Executive role.'
                        : 'This organization does not have any divisions yet.'}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.joinBtn,
                      (!canJoin || isLoading) && styles.joinBtnDisabled,
                    ]}
                    onPress={() => { void handleJoinPress(); }}
                    disabled={!canJoin || isLoading}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.joinBtnText}>
                      {isLoading ? 'JOINING…' : 'JOIN ORGANIZATION'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.changeCodeBtn}
                    onPress={() => {
                      setPreview(null);
                      setSelectedDivisionId(null);
                    }}
                    disabled={isLoading}
                  >
                    <Text style={styles.changeCodeText}>Use another invite code</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  keyboardContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    maxHeight: '90%',
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
    width: '100%',
    maxHeight: '100%',
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  spacer: {
    width: 32,
  },
  description: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
    lineHeight: 19,
  },
  inputContainer: {
    marginBottom: 18,
  },
  input: {
    height: 50,
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  organizationCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  organizationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  organizationName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 5,
  },
  roleText: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  divisionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 12,
  },
  divisionOption: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divisionOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  divisionTextContainer: {
    flex: 1,
  },
  divisionName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divisionNameSelected: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  noDivisionText: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
    marginBottom: 18,
  },
  joinBtn: {
    minHeight: 50,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
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
    color: colors.surface,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  changeCodeBtn: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  changeCodeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
