import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../../theme/colors';

export type AudienceSelection = {
  isOnlyMe: boolean;
  isDivision: boolean;
  selectedDivisions: string[];
  isExecutive: boolean;
  isCoordinators: boolean;
  isAllMembers: boolean;
};

interface NoteAudienceModalProps {
  visible: boolean;
  onClose: () => void;
  selection: AudienceSelection;
  onSave: (selection: AudienceSelection) => void;
}

export function NoteAudienceModal({
  visible,
  onClose,
  selection: initialSelection,
  onSave,
}: NoteAudienceModalProps) {
  const [selection, setSelection] = useState<AudienceSelection>(initialSelection);

  // Sync state if modal reopens
  React.useEffect(() => {
    setSelection(initialSelection);
  }, [initialSelection, visible]);

  const toggleOnlyMe = () => {
    if (!selection.isOnlyMe) {
      setSelection({
        isOnlyMe: true,
        isDivision: false,
        selectedDivisions: [],
        isExecutive: false,
        isCoordinators: false,
        isAllMembers: false,
      });
    }
  };

  const toggleDivision = () => {
    setSelection((prev) => {
      const nextDiv = !prev.isDivision;
      return {
        ...prev,
        isOnlyMe: false,
        isDivision: nextDiv,
        selectedDivisions: nextDiv && prev.selectedDivisions.length === 0 ? ['Divisi A', 'Divisi C'] : prev.selectedDivisions,
      };
    });
  };

  const toggleDivisionChip = (divName: string) => {
    setSelection((prev) => {
      const exists = prev.selectedDivisions.includes(divName);
      const nextList = exists
        ? prev.selectedDivisions.filter((d) => d !== divName)
        : [...prev.selectedDivisions, divName];
      return {
        ...prev,
        isOnlyMe: false,
        isDivision: true,
        selectedDivisions: nextList,
      };
    });
  };

  const toggleExecutive = () => {
    setSelection((prev) => ({
      ...prev,
      isOnlyMe: false,
      isExecutive: !prev.isExecutive,
    }));
  };

  const toggleCoordinators = () => {
    setSelection((prev) => ({
      ...prev,
      isOnlyMe: false,
      isCoordinators: !prev.isCoordinators,
    }));
  };

  const toggleAllMembers = () => {
    setSelection((prev) => ({
      ...prev,
      isOnlyMe: false,
      isAllMembers: !prev.isAllMembers,
    }));
  };

  const handleDone = () => {
    onSave(selection);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Who can see this note?</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Top info alert */}
            <View style={styles.infoBanner}>
              <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.infoIcon}>
                <Circle cx="12" cy="12" r="10" stroke={colors.primary} strokeWidth={2} fill="none" />
                <Path d="M12 16V12M12 8H12.01" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <Text style={styles.infoText}>
                Only Me is the default. Group access can be combined after it is turned off.
              </Text>
            </View>

            {/* Option 1: Only Me */}
            <TouchableOpacity
              style={[styles.audienceCard, selection.isOnlyMe && styles.audienceCardSelected]}
              onPress={toggleOnlyMe}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: '#F1EFFF' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Rect x="5" y="11" width="14" height="10" rx="2" stroke={colors.primary} strokeWidth={2} fill="none" />
                  <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={colors.primary} strokeWidth={2} fill="none" />
                </Svg>
              </View>
              <View style={styles.textCol}>
                <Text style={styles.optionTitle}>Only Me</Text>
                <Text style={styles.optionSub}>Private to your account</Text>
              </View>
              <View style={[styles.checkbox, selection.isOnlyMe && styles.checkboxActive]}>
                {selection.isOnlyMe && (
                  <Svg width={12} height={12} viewBox="0 0 20 20">
                    <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Svg>
                )}
              </View>
            </TouchableOpacity>

            {/* Option 2: Division */}
            <TouchableOpacity
              style={[styles.audienceCard, selection.isDivision && styles.audienceCardBorder]}
              onPress={toggleDivision}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: '#ECEBFF' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Rect x="4" y="3" width="16" height="18" rx="2" stroke={colors.primary} strokeWidth={2} fill="none" />
                  <Path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M11 21v-3h2v3" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
              <View style={styles.textCol}>
                <Text style={styles.optionTitle}>Division</Text>
                <Text style={styles.optionSub}>Share with selected divisions</Text>
              </View>
              <View style={[styles.checkbox, selection.isDivision && styles.checkboxActive]}>
                {selection.isDivision && (
                  <Svg width={12} height={12} viewBox="0 0 20 20">
                    <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Svg>
                )}
              </View>
            </TouchableOpacity>

            {/* Division Sub-selector */}
            {(selection.isDivision || true) && (
              <View style={styles.divisionSelectorCard}>
                <View style={styles.divisionHeaderRow}>
                  <Text style={styles.divisionSelectorTitle}>EXAMPLE AFTER CHOOSING DIVISION</Text>
                  <Text style={styles.divisionSelectorType}>Multi-select</Text>
                </View>
                <View style={styles.chipsRow}>
                  {['Divisi A', 'Divisi B', 'Divisi C'].map((div) => {
                    const isSelected = selection.selectedDivisions.includes(div);
                    return (
                      <TouchableOpacity
                        key={div}
                        style={[styles.divChip, isSelected && styles.divChipSelected]}
                        onPress={() => toggleDivisionChip(div)}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <Svg width={12} height={12} viewBox="0 0 20 20" style={{ marginRight: 5 }}>
                            <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </Svg>
                        )}
                        <Text style={[styles.divChipText, isSelected && styles.divChipTextSelected]}>
                          {div}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Option 3: Executive */}
            <TouchableOpacity
              style={styles.audienceCard}
              onPress={toggleExecutive}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path d="M12 2L4 5v6.5C4 16.5 7.5 21 12 22c4.5-1 8-5.5 8-10.5V5l-8-3z" stroke="#1E88E5" strokeWidth={2} fill="none" />
                  <Path d="M9 12l2 2 4-4" stroke="#1E88E5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </View>
              <View style={styles.textCol}>
                <Text style={styles.optionTitle}>Executive</Text>
                <Text style={styles.optionSub}>Share with the executive board</Text>
              </View>
              <View style={[styles.checkbox, selection.isExecutive && styles.checkboxActive]}>
                {selection.isExecutive && (
                  <Svg width={12} height={12} viewBox="0 0 20 20">
                    <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Svg>
                )}
              </View>
            </TouchableOpacity>

            {/* Option 4: Coordinators */}
            <TouchableOpacity
              style={styles.audienceCard}
              onPress={toggleCoordinators}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FFF0E5' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="#E66723" strokeWidth={2} fill="none" />
                  <Circle cx="9" cy="7" r="4" stroke="#E66723" strokeWidth={2} fill="none" />
                  <Path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#E66723" strokeWidth={2} strokeLinecap="round" fill="none" />
                </Svg>
              </View>
              <View style={styles.textCol}>
                <Text style={styles.optionTitle}>Coordinators</Text>
                <Text style={styles.optionSub}>Share with all coordinators</Text>
              </View>
              <View style={[styles.checkbox, selection.isCoordinators && styles.checkboxActive]}>
                {selection.isCoordinators && (
                  <Svg width={12} height={12} viewBox="0 0 20 20">
                    <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Svg>
                )}
              </View>
            </TouchableOpacity>

            {/* Option 5: All Members */}
            <TouchableOpacity
              style={styles.audienceCard}
              onPress={toggleAllMembers}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: '#E6F9F2' }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Rect x="3" y="4" width="18" height="16" rx="3" stroke="#25A27A" strokeWidth={2} fill="none" />
                  <Circle cx="12" cy="10" r="3" stroke="#25A27A" strokeWidth={2} fill="none" />
                  <Path d="M7 17a5 5 0 0 1 10 0" stroke="#25A27A" strokeWidth={2} strokeLinecap="round" fill="none" />
                </Svg>
              </View>
              <View style={styles.textCol}>
                <Text style={styles.optionTitle}>All Members</Text>
                <Text style={styles.optionSub}>Everyone in Organization A</Text>
              </View>
              <View style={[styles.checkbox, selection.isAllMembers && styles.checkboxActive]}>
                {selection.isAllMembers && (
                  <Svg width={12} height={12} viewBox="0 0 20 20">
                    <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Svg>
                )}
              </View>
            </TouchableOpacity>

            {/* Warning banner */}
            <View style={styles.warningBanner}>
              <View style={styles.warningCircle}>
                <Text style={styles.warningExclamation}>!</Text>
              </View>
              <Text style={styles.warningText}>Division, BPH, and Coordinators can be combined.</Text>
            </View>

            {/* Done button */}
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Done</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FAFAFD',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 2,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
    fontWeight: '500',
  },
  audienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEFF5',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  audienceCardSelected: {
    borderColor: colors.primary,
    borderWidth: 1.6,
  },
  audienceCardBorder: {
    borderColor: colors.primary,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  optionSub: {
    fontSize: 11,
    color: colors.muted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D2D6E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  divisionSelectorCard: {
    backgroundColor: '#F3F4FE',
    borderRadius: 14,
    padding: 12,
    marginTop: -4,
    marginBottom: 4,
  },
  divisionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  divisionSelectorTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  divisionSelectorType: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  divChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE0EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  divChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  divChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  divChipTextSelected: {
    color: '#FFFFFF',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  warningCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FB923C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  warningExclamation: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: '#C25E1A',
    fontWeight: '600',
  },
  doneBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
