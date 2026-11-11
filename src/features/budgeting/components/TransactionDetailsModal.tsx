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

interface TransactionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export function TransactionDetailsModal({ visible, onClose, onEdit }: TransactionDetailsModalProps) {
  const handleViewFull = () => {
    showMessage('Receipt Preview', 'Viewing receipt: KEDAI KOPI SENJA\nTotal: Rp1.250.000\nDate: 10 Oct 2026');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Transaction Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.saveCheckBtn} hitSlop={10}>
              <Svg width={14} height={14} viewBox="0 0 20 20">
                <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusLeft}>
                <View style={styles.clockIconBox}>
                  <Svg width={18} height={18} viewBox="0 0 24 24">
                    <Circle cx="12" cy="12" r="9" stroke="#E87A35" strokeWidth={2} fill="none" />
                    <Path d="M12 7V12L15 14" stroke="#E87A35" strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </View>
                <View>
                  <Text style={styles.statusTitle}>Waiting for verifications</Text>
                  <Text style={styles.statusSub}>Sent 10 Oct 2026 · 14.32</Text>
                </View>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>PENDING</Text>
              </View>
            </View>

            {/* Details Form Card */}
            <View style={styles.card}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expense Type</Text>
                <View style={styles.expenseChip}>
                  <Text style={styles.expenseChipText}>Consumption</Text>
                  <Text style={styles.chipClose}>✕</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <View style={styles.dateRow}>
                  <Text style={styles.detailValue}>10 Oct 2026</Text>
                  <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.calIcon}>
                    <Rect x="3" y="4" width="18" height="18" rx="3" stroke={colors.primary} strokeWidth={2} fill="none" />
                    <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total (Rp)</Text>
                <Text style={styles.detailValueBold}>1.250.000</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailDesc}>
                  Konsumsi rapat persiapan Dies Natalis
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
                  <Text style={styles.receiptShopName}>KEDAI KOPI SENJA</Text>
                  <Text style={styles.receiptShopAddress}>Jl. Melati No. 12, Jakarta Selatan</Text>
                  <Text style={styles.receiptDashedLine}>--------------------------------</Text>
                  <View style={styles.receiptItemRow}>
                    <Text style={styles.receiptItemText}>Paket Espresso Blend (25x)</Text>
                    <Text style={styles.receiptItemPrice}>Rp625.000</Text>
                  </View>
                  <View style={styles.receiptItemRow}>
                    <Text style={styles.receiptItemText}>Snack Box Tradisional (25x)</Text>
                    <Text style={styles.receiptItemPrice}>Rp450.000</Text>
                  </View>
                  <View style={styles.receiptItemRow}>
                    <Text style={styles.receiptItemText}>Air Mineral Botol (30x)</Text>
                    <Text style={styles.receiptItemPrice}>Rp175.000</Text>
                  </View>
                  <Text style={styles.receiptDashedLine}>--------------------------------</Text>
                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptTotalLabel}>TOTAL (Rp)</Text>
                    <Text style={styles.receiptTotalPrice}>1.250.000</Text>
                  </View>
                  <Text style={styles.receiptFooter}>PAID VIA QRIS • THANK YOU!</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Edit Transaction Button */}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                onEdit?.();
                showMessage('Edit Transaction', 'Transaction editing form is ready.');
              }}
              activeOpacity={0.85}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" style={styles.editIcon}>
                <Path
                  d="M17 3A2.828 2.828 0 1 1 21 7L7.5 20.5 2 22l1.5-5.5L17 3z"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.editBtnText}>Edit Transaction</Text>
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(23, 24, 43, 0.45)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 40 : 26,
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
    color: '#85879A',
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
  content: {
    paddingBottom: 20,
    gap: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF6EE',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F8D8C0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E87A35',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDEEF7',
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
    backgroundColor: '#EEECFF',
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
    backgroundColor: '#F3F4FB',
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
    backgroundColor: '#D9D9D9',
    padding: 12,
    alignItems: 'center',
  },
  receiptPaper: {
    width: '100%',
    backgroundColor: '#FDFCFA',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  receiptShopName: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    color: '#242424',
    letterSpacing: 0.5,
  },
  receiptShopAddress: {
    fontSize: 9,
    textAlign: 'center',
    color: '#777777',
    marginTop: 2,
  },
  receiptDashedLine: {
    fontSize: 10,
    color: '#CCCCCC',
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
    color: '#444444',
  },
  receiptItemPrice: {
    fontSize: 10,
    fontWeight: '700',
    color: '#222222',
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
    color: '#111111',
  },
  receiptTotalPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111111',
  },
  receiptFooter: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    color: '#888888',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  editBtn: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  editIcon: {
    marginRight: 8,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
