import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { confirmAction, showMessage, showToast } from '../../auth/utils/feedback';

interface ProfileScreenProps {
  userName: string;
  userEmail: string;
  onBack: () => void;
  onSaveName: (name: string) => Promise<boolean>;
  onSignOut: () => void;
}

export function ProfileScreen({
  userName,
  userEmail,
  onBack,
  onSaveName,
  onSignOut,
}: ProfileScreenProps) {
  const [displayName, setDisplayName] = useState(userName);
  const [isSavingName, setIsSavingName] = useState(false);

  const handleSaveName = async () => {
    const name = displayName.trim();
    if (!name) {
      showMessage('Name required', 'Enter a name before saving.');
      return;
    }
    setIsSavingName(true);
    const saved = await onSaveName(name);
    setIsSavingName(false);
    if (saved) showToast('success', 'Profile updated', 'Your account name has been saved.');
  };

  const handleLogoutPress = () => {
    confirmAction('Log out?', 'Are you sure you want to log out?', onSignOut, 'Log out');
  };

  return (
    <View style={styles.root}>
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
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {userName.split(/\s+/).map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Account Info Heading */}
        <Text style={styles.sectionHeading}>Account info</Text>

        <View style={styles.formGroup}>
          {/* Account name */}
          <View style={styles.fieldBoxWhite}>
            <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.fieldIcon}>
              <Circle cx="12" cy="8" r="4" fill="none" stroke={colors.text} strokeWidth={1.8} />
              <Path d="M4 20C4 16 7.5 14 12 14C16.5 14 20 16 20 20" stroke={colors.text} strokeWidth={1.8} fill="none" strokeLinecap="round" />
            </Svg>
            <TextInput
              style={styles.fieldValueText}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              accessibilityLabel="Account name"
            />
          </View>

          <TouchableOpacity
            style={styles.saveProfileBtn}
            onPress={() => { void handleSaveName(); }}
            disabled={isSavingName}
          >
            <Text style={styles.saveProfileText}>{isSavingName ? 'Saving…' : 'Save name'}</Text>
          </TouchableOpacity>

          {/* Email Address */}
          <View style={styles.fieldBoxWhite}>
            <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.fieldIcon}>
              <Path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke={colors.text} strokeWidth={1.8} fill="none" />
              <Path d="M22 6L12 13L2 6" stroke={colors.text} strokeWidth={1.8} strokeLinecap="round" fill="none" />
            </Svg>
            <Text style={styles.fieldValueText}>{userEmail}</Text>
          </View>

          {/* 5. Log Out Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogoutPress}
            activeOpacity={0.88}
          >
            <View style={styles.logoutLeft}>
              <Svg width={20} height={20} viewBox="0 0 24 24" style={styles.logoutIcon}>
                <Path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke={colors.surface} strokeWidth={2} strokeLinecap="round" fill="none" />
                <Path d="M16 17L21 12L16 7" stroke={colors.surface} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d="M21 12H9" stroke={colors.surface} strokeWidth={2} strokeLinecap="round" fill="none" />
              </Svg>
              <Text style={styles.logoutText}>Log out</Text>
            </View>
            <Svg width={16} height={16} viewBox="0 0 20 20">
              <Path d="M7 4L13 10L7 16" fill="none" stroke={colors.surface} strokeWidth={2.4} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
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
    paddingBottom: 40,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarInitials: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
  },
  formGroup: {
    gap: 12,
  },
  fieldBoxGrey: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 52,
  },
  fieldBoxWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 52,
  },
  fieldIcon: {
    marginRight: 12,
  },
  fieldValueText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  saveProfileBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  saveProfileText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.error500,
    borderRadius: 18,
    paddingHorizontal: 18,
    height: 54,
    marginTop: 6,
    shadowColor: colors.error500,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
});
