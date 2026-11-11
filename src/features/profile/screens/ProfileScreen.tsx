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
import { showMessage } from '../../auth/utils/feedback';

interface ProfileScreenProps {
  userName?: string;
  userEmail?: string;
  onBack: () => void;
  onSignOut: () => void;
}

export function ProfileScreen({
  userName = 'Alex Morgan',
  userEmail = 'alex@organization.com',
  onBack,
  onSignOut,
}: ProfileScreenProps) {
  const [name, setName] = useState(userName);
  const [displayName, setDisplayName] = useState(userName);
  const [email] = useState(userEmail);
  const [address, setAddress] = useState('Cluster Alogio');

  const handleEditField = (field: string) => {
    showMessage(`Edit ${field}`, `Update your ${field.toLowerCase()} in your account settings.`);
  };

  const handleAvatarPress = () => {
    showMessage('Upload Photo', 'Choose a profile photo from your library or camera.');
  };

  const handleLogoutPress = () => {
    showMessage('Log Out', 'Are you sure you want to log out?', onSignOut);
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
        {/* Avatar Upload Circle */}
        <View style={styles.avatarWrap}>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={handleAvatarPress}
            activeOpacity={0.85}
          >
            <Svg width={30} height={30} viewBox="0 0 24 24">
              <Path d="M12 5V19M5 12H19" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Account Info Heading */}
        <Text style={styles.sectionHeading}>Account info</Text>

        <View style={styles.formGroup}>
          {/* 1. Name Readonly Box */}
          <View style={styles.fieldBoxGrey}>
            <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.fieldIcon}>
              <Circle cx="12" cy="8" r="4" fill="none" stroke="#2D3142" strokeWidth={1.8} />
              <Path d="M4 20C4 16 7.5 14 12 14C16.5 14 20 16 20 20" stroke="#2D3142" strokeWidth={1.8} fill="none" strokeLinecap="round" />
            </Svg>
            <Text style={styles.fieldValueText}>{name}</Text>
          </View>

          {/* 2. Display Name with Edit Icon */}
          <View style={styles.fieldBoxWhite}>
            <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.fieldIcon}>
              <Circle cx="12" cy="12" r="9" stroke="#2D3142" strokeWidth={1.8} fill="none" />
              <Path d="M9.09 9A3 3 0 0 1 15 10C15 12 12 13 12 13M12 17H12.01" stroke="#2D3142" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={styles.fieldValueText}>{displayName}</Text>
            <TouchableOpacity onPress={() => handleEditField('Display Name')} hitSlop={8}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M17 3A2.828 2.828 0 1 1 21 7L7.5 20.5 2 22l1.5-5.5L17 3z" fill="none" stroke="#2D3142" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* 3. Email Address */}
          <View style={styles.fieldBoxWhite}>
            <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.fieldIcon}>
              <Path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#2D3142" strokeWidth={1.8} fill="none" />
              <Path d="M22 6L12 13L2 6" stroke="#2D3142" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            </Svg>
            <Text style={styles.fieldValueText}>{email}</Text>
          </View>

          {/* 4. Student Address with Edit Icon */}
          <View style={styles.fieldBoxWhite}>
            <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.fieldIcon}>
              <Path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="#2D3142" strokeWidth={1.8} fill="none" />
              <Circle cx="12" cy="9" r="2.5" stroke="#2D3142" strokeWidth={1.8} fill="none" />
            </Svg>
            <Text style={styles.fieldValueText}>{address}</Text>
            <TouchableOpacity onPress={() => handleEditField('Address')} hitSlop={8}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M17 3A2.828 2.828 0 1 1 21 7L7.5 20.5 2 22l1.5-5.5L17 3z" fill="none" stroke="#2D3142" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* 5. Log Out Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogoutPress}
            activeOpacity={0.88}
          >
            <View style={styles.logoutLeft}>
              <Svg width={20} height={20} viewBox="0 0 24 24" style={styles.logoutIcon}>
                <Path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" fill="none" />
                <Path d="M16 17L21 12L16 7" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d="M21 12H9" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" fill="none" />
              </Svg>
              <Text style={styles.logoutText}>Log out</Text>
            </View>
            <Svg width={16} height={16} viewBox="0 0 20 20">
              <Path d="M7 4L13 10L7 16" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
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
    backgroundColor: '#FAFBFD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FAFBFD',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#ECEEF7',
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
    backgroundColor: '#4B3CEB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
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
    backgroundColor: '#EEF0F5',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 52,
  },
  fieldBoxWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#ECEEF7',
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
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#BC3838',
    borderRadius: 18,
    paddingHorizontal: 18,
    height: 54,
    marginTop: 6,
    shadowColor: '#BC3838',
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
