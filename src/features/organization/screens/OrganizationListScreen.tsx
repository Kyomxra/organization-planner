import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { OrganizationItem, OrgStatus } from '../types';

interface OrganizationListScreenProps {
  organizations: OrganizationItem[];
  userName?: string;
  showJoinedToast?: boolean;
  onDismissToast?: () => void;
  onSelectOrganization: (org: OrganizationItem) => void;
  onOpenCreateOrg: () => void;
  onOpenJoinOrg: () => void;
  onOpenStatusModal: (org: OrganizationItem) => void;
  onOpenProfile?: () => void;
}

export function OrganizationListScreen({
  organizations,
  userName = 'Alex',
  showJoinedToast = false,
  onDismissToast,
  onSelectOrganization,
  onOpenCreateOrg,
  onOpenJoinOrg,
  onOpenStatusModal,
  onOpenProfile,
}: OrganizationListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Text style={styles.welcomeText}>Welcome, {userName}!</Text>
          <TouchableOpacity
            style={styles.profileAvatar}
            onPress={onOpenProfile}
            accessibilityRole="button"
            accessibilityLabel="User profile"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Circle cx="12" cy="8" r="4" fill="none" stroke="#2D3142" strokeWidth={1.8} />
              <Path
                d="M5 19 C5 15.5, 8 13.5, 12 13.5 C16 13.5, 19 15.5, 19 19"
                fill="none"
                stroke="#2D3142"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Successfully Joined Toast Banner */}
        {showJoinedToast && (
          <View style={styles.toastBanner}>
            <View style={styles.toastLeft}>
              <View style={styles.toastCheckCircle}>
                <Svg width={14} height={14} viewBox="0 0 20 20">
                  <Path
                    d="M4 10.5L8 14.5L16 6.5"
                    stroke="#FFFFFF"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </View>
              <Text style={styles.toastTitle}>Successfully joined!</Text>
            </View>
            <TouchableOpacity onPress={onDismissToast} style={styles.toastCloseBtn} hitSlop={8}>
              <Text style={styles.toastCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Your Organization</Text>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Svg width={16} height={16} viewBox="0 0 20 20" style={styles.searchIcon}>
            <Circle cx="8.5" cy="8.5" r="5.5" stroke="#9A9DB2" strokeWidth={1.8} fill="none" />
            <Path d="M12.8 12.8L17 17" stroke="#9A9DB2" strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#A1A4B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Organizations List */}
        <View style={styles.listContainer}>
          {filteredOrgs.map((org) => (
            <TouchableOpacity
              key={org.id}
              style={styles.card}
              onPress={() => onSelectOrganization(org)}
              activeOpacity={0.88}
            >
              <View style={styles.cardMain}>
                {/* Org Avatar Letter */}
                <View style={[styles.avatarBox, { backgroundColor: org.avatarBg }]}>
                  <Text style={[styles.avatarLetter, { color: org.avatarTextColor }]}>
                    {org.letter}
                  </Text>
                </View>

                {/* Card Info */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{org.name}</Text>
                  <Text style={styles.cardRole}>{org.roleTitle}</Text>
                  <View style={styles.metaRow}>
                    <Svg width={12} height={12} viewBox="0 0 20 20" style={styles.memberIcon}>
                      <Circle cx="8" cy="6" r="3" fill="none" stroke={colors.muted} strokeWidth={1.6} />
                      <Path
                        d="M3 16 C3 13, 5 11, 8 11 C11 11, 13 13, 13 16"
                        fill="none"
                        stroke={colors.muted}
                        strokeWidth={1.6}
                      />
                      <Circle cx="15" cy="7" r="2.2" fill="none" stroke={colors.muted} strokeWidth={1.4} />
                      <Path d="M14 12 C15.5 12.5, 17 13.5, 17 15" fill="none" stroke={colors.muted} strokeWidth={1.4} />
                    </Svg>
                    <Text style={styles.memberCount}>{org.memberCount} anggota</Text>
                  </View>

                  {/* Status Badge */}
                  <TouchableOpacity
                    style={[styles.statusBadge, { backgroundColor: org.badgeBg }]}
                    onPress={() => onOpenStatusModal(org)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusText, { color: org.badgeTextColor }]}>
                      {org.status} &gt;
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Right Arrow Chevron Circle */}
                <View style={[styles.arrowCircle, { borderColor: org.avatarTextColor }]}>
                  <Svg width={12} height={12} viewBox="0 0 20 20">
                    <Path
                      d="M7 4L13 10L7 16"
                      fill="none"
                      stroke={org.avatarTextColor}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={onOpenCreateOrg}
          activeOpacity={0.85}
        >
          <Text style={styles.createBtnText}>+ Create Organization</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.joinBtn}
          onPress={onOpenJoinOrg}
          activeOpacity={0.8}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.joinIcon}>
            <Path
              d="M14 4H19C20.1 4 21 4.9 21 6V18C21 19.1 20.1 20 19 20H14"
              stroke="#5145E8"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M10 16L14 12L10 8"
              stroke="#5145E8"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d="M3 12H14"
              stroke="#5145E8"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
          <Text style={styles.joinBtnText}>Join an Organization</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 140,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E8E9F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4FE',
    borderWidth: 1.2,
    borderColor: '#D7DAFB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  toastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  toastCloseBtn: {
    padding: 4,
  },
  toastCloseIcon: {
    fontSize: 13,
    color: colors.muted,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8C9F',
    marginBottom: 10,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDEEF7',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 18,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  clearSearchIcon: {
    fontSize: 13,
    color: colors.muted,
    paddingHorizontal: 6,
  },
  listContainer: {
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    shadowColor: '#24244A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLetter: {
    fontSize: 19,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  cardRole: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberIcon: {
    marginRight: 5,
  },
  memberCount: {
    fontSize: 11,
    color: colors.muted,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
    gap: 10,
  },
  createBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  joinBtn: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.3,
    borderColor: '#DFE2F2',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinIcon: {
    marginRight: 8,
  },
  joinBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
