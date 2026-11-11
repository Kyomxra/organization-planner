import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { showMessage } from '../../auth/utils/feedback';
import { CreateOrgFormData } from '../types';

interface CreateOrganizationScreenProps {
  onBack: () => void;
  onCreateSuccess: (data: CreateOrgFormData) => void;
}

export function CreateOrganizationScreen({
  onBack,
  onCreateSuccess,
}: CreateOrganizationScreenProps) {
  const [orgName, setOrgName] = useState('Organisasi A');
  const [description, setDescription] = useState('Testing');
  const [divisions, setDivisions] = useState<string[]>(['Equipment', 'Event']);
  const [newDivisionText, setNewDivisionText] = useState('');
  const [isAddingDivision, setIsAddingDivision] = useState(false);

  const handleAddDivision = () => {
    if (!newDivisionText.trim()) {
      setIsAddingDivision(false);
      return;
    }
    const trimmed = newDivisionText.trim();
    if (!divisions.includes(trimmed)) {
      setDivisions([...divisions, trimmed]);
    }
    setNewDivisionText('');
    setIsAddingDivision(false);
  };

  const handleRemoveDivision = (divToRemove: string) => {
    setDivisions(divisions.filter((d) => d !== divToRemove));
  };

  const handleUploadLogoPress = () => {
    showMessage('Upload Logo', 'Logo selection is ready. Connect media picker when integrating device storage.');
  };

  const handleCreate = () => {
    if (!orgName.trim()) {
      showMessage('Name Required', 'Please enter your organization name.');
      return;
    }

    onCreateSuccess({
      name: orgName.trim(),
      description: description.trim(),
      divisions,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={10}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M15 18L9 12L15 6"
              fill="none"
              stroke={colors.text}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Organization</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Upload Logo Circle */}
        <View style={styles.logoSection}>
          <TouchableOpacity
            style={styles.logoCircle}
            onPress={handleUploadLogoPress}
            activeOpacity={0.8}
          >
            <Svg width={26} height={26} viewBox="0 0 24 24">
              <Path
                d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
                fill="none"
                stroke={colors.primary}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle cx="12" cy="13" r="4" fill="none" stroke={colors.primary} strokeWidth={1.8} />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.uploadLogoText}>Upload Logo</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Organization Name */}
          <Text style={styles.inputLabel}>Organization Name</Text>
          <TextInput
            style={styles.textInput}
            value={orgName}
            onChangeText={setOrgName}
            placeholder="e.g. Organisasi A"
            placeholderTextColor={colors.placeholder}
          />

          {/* Description */}
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your organization"
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Divisions */}
          <Text style={styles.inputLabel}>Divisions</Text>
          <View style={styles.divisionsWrap}>
            {divisions.map((div) => (
              <View key={div} style={styles.divisionChip}>
                <Text style={styles.divisionChipText}>{div}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveDivision(div)}
                  style={styles.chipRemoveBtn}
                  hitSlop={6}
                >
                  <Text style={styles.chipRemoveIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {isAddingDivision ? (
              <View style={styles.addDivisionInputRow}>
                <TextInput
                  style={styles.inlineDivInput}
                  placeholder="Division name"
                  placeholderTextColor={colors.placeholder}
                  value={newDivisionText}
                  onChangeText={setNewDivisionText}
                  autoFocus
                  onSubmitEditing={handleAddDivision}
                />
                <TouchableOpacity onPress={handleAddDivision} style={styles.inlineAddBtn}>
                  <Text style={styles.inlineAddBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addDivisionBtn}
                onPress={() => setIsAddingDivision(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.addDivisionBtnText}>+ Add Division</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Admin Callout */}
        <View style={styles.adminCallout}>
          <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.calloutIcon}>
            <Circle cx="12" cy="12" r="10" stroke="#5145E8" strokeWidth={2} fill="none" />
            <Path d="M12 16V12M12 8H12.01" stroke="#5145E8" strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
          <Text style={styles.adminCalloutText}>
            You will become the admin of this organization.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.createSubmitBtn}
          onPress={handleCreate}
          activeOpacity={0.85}
        >
          <Text style={styles.createSubmitBtnText}>Create Organization</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEEF7',
    backgroundColor: '#FAFBFD',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  spacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#F2F1FE',
    borderWidth: 1.5,
    borderColor: '#DFDCFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadLogoText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    shadowColor: '#24244A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    height: 46,
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: '#E4E6F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.text,
  },
  multilineInput: {
    height: 80,
    paddingTop: 12,
  },
  divisionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  divisionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEECFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  divisionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 6,
  },
  chipRemoveBtn: {
    padding: 2,
  },
  chipRemoveIcon: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  addDivisionBtn: {
    borderWidth: 1.2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#FAFBFD',
  },
  addDivisionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  addDivisionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineDivInput: {
    height: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 12,
    color: colors.text,
    minWidth: 110,
  },
  inlineAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineAddBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  adminCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F1FE',
    borderWidth: 1,
    borderColor: '#DFDCFA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  calloutIcon: {
    marginRight: 10,
  },
  adminCalloutText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 17,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAFBFD',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: '#ECEEF7',
  },
  createSubmitBtn: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  createSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
