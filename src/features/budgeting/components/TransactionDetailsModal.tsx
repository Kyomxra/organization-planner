import React from 'react';
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
import { showMessage } from '../../auth/utils/feedback';
import { ExpenseItem } from '../types';

interface TransactionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  expense: ExpenseItem | null;
  onApprove: () => void;
  onReject: () => void;
  canReview?: boolean;
}

export function TransactionDetailsModal({
  visible,
  onClose,
  expense,
  onApprove,
  onReject,
  canReview = true,
}: TransactionDetailsModalProps) {
  const handleViewFull = () => {
    showMessage(
      'Receipt Preview',
      `Viewing receipt: ${expense?.typeOfCost ?? 'Transaction'}\nTotal: Rp${expense?.total ?? '0'}\nDate: ${expense?.date ?? ''} 2026`
    );
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Review Transaction</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusLeft}>
                <View style={styles.clockIconBox}>
                  <Svg width={18} height={18} viewBox="0 0 24 24">
                    <Circle cx="12" cy="12" r="9" stroke={colors.primary} strokeWidth={2} fill="none" />
                    <Path d="M12 7V12L15 14" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </View>
                <View>
                  <Text style={styles.statusTitle}>
                    {expense?.status === 'PENDING'
                      ? 'Waiting for review'
                      : `Transaction ${expense?.status === 'APPROVED' ? 'approved' : 'rejected'}`}
                  </Text>
                  <Text style={styles.statusSub}>Submitted {expense?.date ?? ''} 2026</Text>
                </View>
              </View>
              <View
                style={[
                  styles.pendingBadge,
                  expense?.status === 'APPROVED' && styles.approvedBadge,
                  expense?.status === 'REJECTED' && styles.rejectedBadge,
                ]}
              >
                <Text
                  style={[
                    styles.pendingBadgeText,
                    expense?.status === 'APPROVED' && styles.approvedBadgeText,
                    expense?.status === 'REJECTED' && styles.rejectedBadgeText,
                  ]}
                >
                  {expense?.status ?? 'PENDING'}
                </Text>
              </View>
            </View>

            {/* Details Form Card */}
            <View style={styles.card}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expense Type</Text>
                <View style={styles.expenseChip}>
                  <Text style={styles.expenseChipText}>{expense?.typeOfCost ?? 'Expense'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <View style={styles.dateRow}>
                  <Text style={styles.detailValue}>{expense?.date ?? ''} 2026</Text>
                  <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.calIcon}>
                    <Rect x="3" y="4" width="18" height="18" rx="3" stroke={colors.primary} strokeWidth={2} fill="none" />
                    <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total (Rp)</Text>
                <Text style={styles.detailValueBold}>{expense?.total ?? '0'}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailDesc}>
                  {expense?.description || 'No description provided.'}
                </Text>
              </View>
            </View>

            {/* Receipt Section */}
            <View style={styles.receiptSection}>
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptSectionTitle}>Receipt</Text>
                <TouchableOpacity onPress={handleViewFull} style={styles.viewFullBtn}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" style={styles.expandIcon}>
                    <Path d="M15 3H21V9M9 21H3V15M21 3L14 10M3 21L10 14" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Svg>
                  <Text style={styles.viewFullText}>View full</Text>
                </TouchableOpacity>
              </View>

              {/* Realistic Paper Receipt Graphic Preview */}
              <TouchableOpacity onPress={handleViewFull} activeOpacity={0.9} style={styles.receiptCard}>
                <View style={styles.receiptPaper}>
                  <Text style={styles.receiptShopName}>{expense?.typeOfCost ?? 'Expense Receipt'}</Text>
                  <Text style={styles.receiptShopAddress}>Organization expense receipt</Text>
                  <Text style={styles.receiptDashedLine}>--------------------------------</Text>
                  <View style={styles.receiptItemRow}>
                    <Text style={styles.receiptItemText}>{expense?.description || expense?.typeOfCost}</Text>
                    <Text style={styles.receiptItemPrice}>Rp{expense?.total ?? '0'}</Text>
                  </View>
                  <Text style={styles.receiptDashedLine}>--------------------------------</Text>
                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptTotalLabel}>TOTAL (Rp)</Text>
                    <Text style={styles.receiptTotalPrice}>{expense?.total ?? '0'}</Text>
                  </View>
                  <Text style={styles.receiptFooter}>TRANSACTION RECEIPT</Text>
                </View>
              </TouchableOpacity>
            </View>

            {canReview && expense?.status === 'PENDING' && (
              <View style={styles.reviewActions}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={onReject}
                  activeOpacity={0.85}
                >
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={onApprove}
                  activeOpacity={0.85}
                >
                  <Text style={styles.approveBtnText}>Approve Transaction</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
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
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  saveCheckBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    paddingBottom: 20,
    gap: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warning100,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIconBox: {
    marginRight: 10,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  statusSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  approvedBadge: {
    backgroundColor: colors.success100,
    borderColor: colors.success100,
  },
  approvedBadgeText: {
    color: colors.success500,
  },
  rejectedBadge: {
    backgroundColor: colors.error100,
    borderColor: colors.error100,
  },
  rejectedBadgeText: {
    color: colors.error500,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  expenseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  expenseChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 6,
  },
  chipClose: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginRight: 6,
  },
  calIcon: {
    marginLeft: 2,
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  detailDesc: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: colors.muted,
    marginLeft: 14,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 12,
  },
  receiptSection: {
    marginTop: 4,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  viewFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandIcon: {
    marginRight: 4,
  },
  viewFullText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  receiptCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.border,
    padding: 12,
    alignItems: 'center',
  },
  receiptPaper: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    shadowColor: colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  receiptShopName: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    letterSpacing: 0.5,
  },
  receiptShopAddress: {
    fontSize: 9,
    textAlign: 'center',
    color: colors.muted,
    marginTop: 2,
  },
  receiptDashedLine: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
    marginVertical: 4,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  receiptItemText: {
    fontSize: 10,
    color: colors.text,
  },
  receiptItemPrice: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 6,
  },
  receiptTotalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  receiptTotalPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  receiptFooter: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.muted,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  rejectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.error500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    color: colors.error500,
    fontSize: 13,
    fontWeight: '800',
  },
  approveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '800',
  },
});
