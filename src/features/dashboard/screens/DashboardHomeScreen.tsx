import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { showMessage } from '../../auth/utils/feedback';

interface DashboardHomeScreenProps {
  organizationName?: string;
  onBackToOrgList: () => void;
  onOpenCalendar?: () => void;
  onOpenDivisions?: () => void;
  onOpenProfile?: () => void;
  onOpenInvites?: () => void;
  onOpenRundown?: () => void;
  onOpenBudgeting?: () => void;
  onOpenAddExpense?: () => void;
  onOpenNotes?: () => void;
  onOpenNotifications?: () => void;
}

export function DashboardHomeScreen({
  organizationName = 'Organization A',
  onBackToOrgList,
  onOpenCalendar,
  onOpenDivisions,
  onOpenProfile,
  onOpenInvites,
  onOpenRundown,
  onOpenBudgeting,
  onOpenAddExpense,
  onOpenNotes,
  onOpenNotifications,
}: DashboardHomeScreenProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'divisions' | 'profile'>('home');

  const handleQuickAccess = (name: string) => {
    if (name === 'Rundown') {
      onOpenRundown?.();
      return;
    }
    if (name === 'Notes') {
      onOpenNotes?.();
      return;
    }
    if (name === 'Divisions') {
      onOpenDivisions?.();
      return;
    }
    if (name === 'Budgeting') {
      onOpenBudgeting?.();
      return;
    }
    showMessage(name, `${name} feature for ${organizationName} is ready for integration.`);
  };

  const handleBudgetAction = (action: string) => {
    if (action === 'Add Expense') {
      if (onOpenAddExpense) {
        onOpenAddExpense();
      } else {
        onOpenBudgeting?.();
      }
      return;
    }
    if (action === 'View Details' || action === 'Pending Transactions') {
      onOpenBudgeting?.();
      return;
    }
    showMessage(action, `${action} triggered. Connect financial module to manage transactions.`);
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBackToOrgList} style={styles.backBtn} hitSlop={10}>
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
          <View>
            <Text style={styles.welcomeSub}>Welcome to</Text>
            <Text style={styles.orgTitle}>{organizationName}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => onOpenInvites ? onOpenInvites() : handleQuickAccess('Share Organization')}
            hitSlop={8}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Circle cx="18" cy="5" r="3" fill="none" stroke="#2D3142" strokeWidth={1.8} />
              <Circle cx="6" cy="12" r="3" fill="none" stroke="#2D3142" strokeWidth={1.8} />
              <Circle cx="18" cy="19" r="3" fill="none" stroke="#2D3142" strokeWidth={1.8} />
              <Path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="#2D3142" strokeWidth={1.8} />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => onOpenNotifications ? onOpenNotifications() : handleQuickAccess('Notifications')}
            hitSlop={8}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8"
                stroke="#2D3142"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d="M13.73 21A2 2 0 0 1 10.27 21"
                stroke="#2D3142"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            {/* Unread Notification Badge */}
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Reminder Next Activity Card */}
        <View style={styles.reminderCard}>
          <Defs>
            <LinearGradient id="reminderGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#3C30D4" />
              <Stop offset="1" stopColor="#5547ED" />
            </LinearGradient>
          </Defs>
          <View style={styles.reminderContent}>
            {/* Tag */}
            <View style={styles.reminderTagRow}>
              <Svg width={14} height={14} viewBox="0 0 24 24" style={styles.alarmIcon}>
                <Circle cx="12" cy="13" r="8" stroke="#FFFFFF" strokeWidth={2} fill="none" />
                <Path d="M12 9V13L15 15" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
                <Path d="M5 3L2 6M19 3L22 6" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <Text style={styles.reminderTagText}>Reminder Next Activity</Text>
            </View>

            {/* Title & Date */}
            <Text style={styles.reminderTitle}>Meeting for Pleno 1</Text>
            <Text style={styles.reminderDate}>5 Oct 2026 - 21.00</Text>
          </View>

          {/* Decorative Background Circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
        </View>

        {/* Quick Access */}
        <Text style={styles.sectionHeading}>Quick Access</Text>
        <View style={styles.quickAccessGrid}>
          {/* 1. Rundown */}
          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={() => handleQuickAccess('Rundown')}
            activeOpacity={0.75}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#EEECFF' }]}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path
                  d="M9 6H20M9 12H20M9 18H20M4 6V6.01M4 12V12.01M4 18V18.01"
                  stroke="#5145E8"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.quickAccessLabel}>Rundown</Text>
          </TouchableOpacity>

          {/* 2. Notes */}
          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={() => handleQuickAccess('Notes')}
            activeOpacity={0.75}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FFF1E6' }]}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path
                  d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                  fill="none"
                  stroke="#E87A35"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <Path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="#E87A35" strokeWidth={1.8} strokeLinecap="round" />
              </Svg>
            </View>
            <Text style={styles.quickAccessLabel}>Notes</Text>
          </TouchableOpacity>

          {/* 3. Divisions */}
          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={() => handleQuickAccess('Divisions')}
            activeOpacity={0.75}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E6F4FF' }]}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path
                  d="M3 7V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V9C21 7.9 20.1 7 19 7H13L11 5H5C3.9 5 3 5.9 3 7Z"
                  fill="none"
                  stroke="#2B88E8"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.quickAccessLabel}>Divisions</Text>
          </TouchableOpacity>

          {/* 4. Budgeting */}
          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={() => handleQuickAccess('Budgeting')}
            activeOpacity={0.75}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FFEFEA' }]}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Rect x="3" y="3" width="7" height="7" rx="2" stroke="#E85845" strokeWidth={1.8} fill="none" />
                <Rect x="14" y="3" width="7" height="7" rx="2" stroke="#E85845" strokeWidth={1.8} fill="none" />
                <Rect x="14" y="14" width="7" height="7" rx="2" stroke="#E85845" strokeWidth={1.8} fill="none" />
                <Rect x="3" y="14" width="7" height="7" rx="2" stroke="#E85845" strokeWidth={1.8} fill="none" />
              </Svg>
            </View>
            <Text style={styles.quickAccessLabel}>Budgeting</Text>
          </TouchableOpacity>
        </View>

        {/* Budgeting Card */}
        <View style={styles.budgetCard}>
          {/* Header Row */}
          <View style={styles.budgetHeader}>
            <View style={styles.budgetHeaderLeft}>
              <View style={styles.walletIconCircle}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path
                    d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z"
                    fill="none"
                    stroke="#E87A35"
                    strokeWidth={1.8}
                  />
                  <Path d="M16 3H8C6.9 3 6 3.9 6 5V7H18V5C18 3.9 17.1 3 16 3Z" stroke="#E87A35" strokeWidth={1.8} fill="none" />
                  <Circle cx="17" cy="14" r="1.5" fill="#E87A35" />
                </Svg>
              </View>
              <Text style={styles.budgetTitle}>Budgeting</Text>
            </View>
            <View style={styles.octBadge}>
              <Text style={styles.octBadgeText}>OCT 2026</Text>
            </View>
          </View>

          {/* Amount */}
          <Text style={styles.budgetSubLabel}>Total Budget Available</Text>
          <Text style={styles.budgetAmount}>Rp8.750.000</Text>

          {/* Revenue & Expenditures Row */}
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.revenueText}>+ Rp12,5 jt</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Expenditures</Text>
              <Text style={styles.expenditureText}>- Rp3,75 jt</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Budget Spent</Text>
            <Text style={styles.progressPercentage}>30%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '30%' }]} />
          </View>

          {/* Action Buttons Row */}
          <View style={styles.budgetBtnRow}>
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => handleBudgetAction('View Details')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewDetailsBtnText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addReceiptBtn}
              onPress={() => handleBudgetAction('Add Expense')}
              activeOpacity={0.85}
            >
              <Svg width={14} height={14} viewBox="0 0 20 20" style={styles.receiptIcon}>
                <Path d="M10 4V16M4 10H16" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
              </Svg>
              <Text style={styles.addReceiptBtnText}>Add Expense</Text>
            </TouchableOpacity>
          </View>

          {/* Pending Verification Notice */}
          <TouchableOpacity
            style={styles.pendingNotice}
            onPress={() => handleBudgetAction('Pending Transactions')}
            activeOpacity={0.75}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" style={styles.warningIcon}>
              <Circle cx="12" cy="12" r="10" stroke="#E87A35" strokeWidth={2} fill="none" />
              <Path d="M12 8V12M12 16H12.01" stroke="#E87A35" strokeWidth={2.4} strokeLinecap="round" />
            </Svg>
            <Text style={styles.pendingText}>
              Pending transactions require review
            </Text>
            <Text style={styles.pendingChevron}>&gt;</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {/* Calendar Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab('calendar');
            onOpenCalendar?.();
          }}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Rect x="3" y="4" width="18" height="18" rx="3" stroke="#8A8C9F" strokeWidth={1.8} fill="none" />
            <Path d="M16 2V6M8 2V6M3 10H21" stroke="#8A8C9F" strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
          <Text style={styles.tabLabel}>Calendar</Text>
        </TouchableOpacity>

        {/* Home Tab (Active) */}
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M3 10.5L12 3L21 10.5V20C21 20.6 20.6 21 20 21H4C3.4 21 3 20.6 3 20V10.5Z"
              fill={activeTab === 'home' ? colors.primary : 'none'}
              stroke={colors.primary}
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
            <Path d="M9 21V12H15V21" fill="#FFFFFF" stroke={colors.primary} strokeWidth={1.8} />
          </Svg>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        {/* Divisions Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab('divisions');
            onOpenDivisions?.();
          }}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Circle cx="9" cy="7" r="4" stroke="#8A8C9F" strokeWidth={1.8} fill="none" />
            <Path d="M2 19C2 15.5 5 13.5 9 13.5C13 13.5 16 15.5 16 19" stroke="#8A8C9F" strokeWidth={1.8} fill="none" strokeLinecap="round" />
            <Circle cx="18" cy="8" r="3" stroke="#8A8C9F" strokeWidth={1.6} fill="none" />
            <Path d="M17 14C19 14.5 21 15.5 21 18" stroke="#8A8C9F" strokeWidth={1.6} fill="none" strokeLinecap="round" />
          </Svg>
          <Text style={styles.tabLabel}>Divisions</Text>
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab('profile');
            onOpenProfile?.();
          }}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Circle cx="12" cy="8" r="4" stroke="#8A8C9F" strokeWidth={1.8} fill="none" />
            <Path d="M4 20C4 16 7.5 14 12 14C16.5 14 20 16 20 20" stroke="#8A8C9F" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          </Svg>
          <Text style={styles.tabLabel}>Profile</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FAFBFD',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#ECEEF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  welcomeSub: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  orgTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#ECEEF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E85845',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  reminderCard: {
    backgroundColor: '#4436DF',
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 22,
    shadowColor: '#3C30D4',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  reminderContent: {
    zIndex: 2,
  },
  reminderTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alarmIcon: {
    marginRight: 6,
  },
  reminderTagText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  reminderTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  reminderDate: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '500',
  },
  decorCircle1: {
    position: 'absolute',
    right: -25,
    bottom: -35,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
  },
  decorCircle2: {
    position: 'absolute',
    right: 35,
    top: -45,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAccessItem: {
    alignItems: 'center',
    width: '22%',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickAccessLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C5F74',
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    shadowColor: '#24244A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  budgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF2E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  budgetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  octBadge: {
    backgroundColor: '#EEECFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  octBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  budgetSubLabel: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2,
  },
  budgetAmount: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4FB',
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2,
  },
  revenueText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2C9B76',
  },
  expenditureText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E45B66',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  progressPercentage: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  progressBarTrack: {
    width: '100%',
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EEECFF',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  budgetBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  viewDetailsBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  addReceiptBtn: {
    flex: 1.2,
    flexDirection: 'row',
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  receiptIcon: {
    marginRight: 6,
  },
  addReceiptBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6EE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warningIcon: {
    marginRight: 8,
  },
  pendingText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#D87028',
  },
  pendingChevron: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D87028',
    marginLeft: 4,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEEF7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: '#F3F2FF',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8A8C9F',
    marginTop: 3,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
