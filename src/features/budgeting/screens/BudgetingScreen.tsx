import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { showMessage } from '../../auth/utils/feedback';
import { ExpenseItem, IncomeItem } from '../types';
import { TransactionDetailsModal } from '../components/TransactionDetailsModal';
import { AddRevenueModal } from '../components/AddRevenueModal';
import { AddExpenseModal } from '../components/AddExpenseModal';

interface BudgetingScreenProps {
  onBack: () => void;
  openAddExpense?: boolean;
}

const mockIncomes: IncomeItem[] = [
  { id: 'inc-1', no: 1, date: '1 Oct', from: 'Membership Dues', total: '5.000.000', numericTotal: 5000000 },
  { id: 'inc-2', no: 2, date: '3 Oct', from: 'Sponsor', total: '6.000.000', numericTotal: 6000000 },
  { id: 'inc-3', no: 3, date: '8 Oct', from: 'Merchandise', total: '1.500.000', numericTotal: 1500000 },
];

const mockExpenses: ExpenseItem[] = [
  { id: 'exp-1', no: 1, date: '2 Oct', typeOfCost: 'Meeting Refreshments', description: 'Refreshments for the event preparation meeting.', total: '1.250.000', numericTotal: 1250000, hasReceipt: true, status: 'PENDING' },
  { id: 'exp-2', no: 2, date: '5 Oct', typeOfCost: 'Print Banner', total: '1.000.000', numericTotal: 1000000, hasReceipt: true, status: 'PENDING' },
  { id: 'exp-3', no: 3, date: '9 Oct', typeOfCost: 'Equipment Rental', total: '1.500.000', numericTotal: 1500000, hasReceipt: true, status: 'APPROVED' },
];

export function BudgetingScreen({ onBack, openAddExpense = false }: BudgetingScreenProps) {
  const [incomes, setIncomes] = useState<IncomeItem[]>(mockIncomes);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(mockExpenses);
  const [fromDate, setFromDate] = useState('01 Oct 2026');
  const [toDate, setToDate] = useState('31 Oct 2026');
  const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false);
  const [isAddRevenueModalVisible, setIsAddRevenueModalVisible] = useState(false);
  const [isAddExpenseModalVisible, setIsAddExpenseModalVisible] = useState(openAddExpense);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);

  const subtotalIncome = incomes.reduce((acc, curr) => acc + curr.numericTotal, 0);
  const subtotalExpense = expenses
    .filter((item) => item.status !== 'REJECTED')
    .reduce((acc, curr) => acc + curr.numericTotal, 0);
  const pendingExpenses = expenses.filter((item) => item.status === 'PENDING');
  const availableBudget = subtotalIncome - subtotalExpense;
  const budgetSpentPercentage = subtotalIncome > 0
    ? Math.round((subtotalExpense / subtotalIncome) * 100)
    : 0;

  const openExpenseDetails = (expense: ExpenseItem) => {
    setSelectedExpense(expense);
    setIsReceiptModalVisible(true);
  };

  const reviewExpense = (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedExpense) return;
    setExpenses((prev) => prev.map((item) =>
      item.id === selectedExpense.id ? { ...item, status } : item
    ));
    showMessage(
      status === 'APPROVED' ? 'Transaction Approved' : 'Transaction Rejected',
      `${selectedExpense.typeOfCost} has been ${status.toLowerCase()}.`
    );
    setIsReceiptModalVisible(false);
  };

  const handleAddIncome = () => {
    setIsAddRevenueModalVisible(true);
  };

  const handleAddExpense = () => {
    setIsAddExpenseModalVisible(true);
  };

  const handleSearchFilter = () => {
    showMessage('Date Filter', `Filtering transactions from ${fromDate} to ${toDate}.`);
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
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
          <Text style={styles.headerTitle}>Budgeting</Text>
        </View>

        <View style={styles.octBadge}>
          <Text style={styles.octBadgeText}>OCT 2026</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summarySubLabel}>Total Budget Available</Text>
          <Text style={styles.summaryAmount}>Rp{Math.max(availableBudget, 0).toLocaleString('en-US')}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.revenueText}>+ Rp{subtotalIncome.toLocaleString('en-US')}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Expenditures</Text>
              <Text style={styles.expenditureText}>- Rp{subtotalExpense.toLocaleString('en-US')}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Budget Spent</Text>
            <Text style={styles.progressPercentage}>{budgetSpentPercentage}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.min(budgetSpentPercentage, 100)}%` }]} />
          </View>
        </View>

        {/* Date Filter Card */}
        <View style={styles.filterCard}>
          <View style={styles.filterRow}>
            <View style={styles.filterBox}>
              <Text style={styles.filterLabel}>From</Text>
              <View style={styles.filterValueRow}>
                <Text style={styles.filterDateText}>{fromDate}</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24">
                  <Rect x="3" y="4" width="18" height="18" rx="3" stroke={colors.primary} strokeWidth={2} fill="none" />
                  <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
            </View>

            <View style={styles.filterBox}>
              <Text style={styles.filterLabel}>To</Text>
              <View style={styles.filterValueRow}>
                <Text style={styles.filterDateText}>{toDate}</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24">
                  <Rect x="3" y="4" width="18" height="18" rx="3" stroke={colors.primary} strokeWidth={2} fill="none" />
                  <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.searchBtn} onPress={handleSearchFilter} activeOpacity={0.85}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Revenue Details Table */}
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>Revenue details</Text>
          <View style={styles.tableCard}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, { width: 30 }]}>No</Text>
              <Text style={[styles.thText, { width: 65 }]}>Date</Text>
              <Text style={[styles.thText, { flex: 1 }]}>From</Text>
              <Text style={[styles.thText, { width: 90, textAlign: 'right' }]}>Total (Rp)</Text>
            </View>

            {/* Rows */}
            {incomes.map((item, idx) => (
              <View key={item.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.tdText, { width: 30 }]}>{item.no}</Text>
                <Text style={[styles.tdText, { width: 65 }]}>{item.date}</Text>
                <Text style={[styles.tdText, { flex: 1, fontWeight: '700' }]}>{item.from}</Text>
                <Text style={[styles.tdText, { width: 90, textAlign: 'right', fontWeight: '700' }]}>
                  {item.total}
                </Text>
              </View>
            ))}

            {/* Subtotal Footer */}
            <View style={styles.tableFooterRow}>
              <Text style={styles.footerLabel}>Subtotal Revenue</Text>
              <Text style={styles.footerValue}>{subtotalIncome.toLocaleString('id-ID')}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.addIncomeBtn} onPress={handleAddIncome} activeOpacity={0.8}>
            <Text style={styles.addIncomeBtnText}>+ Add Revenue</Text>
          </TouchableOpacity>
        </View>

        {/* Expense Details Table */}
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>Expense details</Text>
          <View style={styles.tableCard}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, { width: 28 }]}>No</Text>
              <Text style={[styles.thText, { width: 60 }]}>Date</Text>
              <Text style={[styles.thText, { flex: 1 }]}>Type of cost</Text>
              <Text style={[styles.thText, { width: 85, textAlign: 'right' }]}>Total (Rp)</Text>
              <Text style={[styles.thText, { width: 44, textAlign: 'center' }]}>Receipt</Text>
            </View>

            {/* Rows */}
            {expenses.map((item, idx) => (
              <View key={item.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.tdText, { width: 28 }]}>{item.no}</Text>
                <Text style={[styles.tdText, { width: 60 }]}>{item.date}</Text>
                <Text style={[styles.tdText, { flex: 1, fontWeight: '700' }]}>{item.typeOfCost}</Text>
                <Text style={[styles.tdText, { width: 85, textAlign: 'right', fontWeight: '700' }]}>
                  {item.total}
                </Text>
                <TouchableOpacity
                  style={styles.proveCell}
                  onPress={() => openExpenseDetails(item)}
                  hitSlop={6}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24">
                    <Path
                      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                      fill="none"
                      stroke={colors.primary}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                    />
                    <Path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" />
                  </Svg>
                </TouchableOpacity>
              </View>
            ))}

            {/* Subtotal Footer */}
            <View style={styles.tableFooterRow}>
              <Text style={styles.footerLabel}>Subtotal Expenses</Text>
              <Text style={styles.footerValue}>{subtotalExpense.toLocaleString('id-ID')}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.addExpenseBtn} onPress={handleAddExpense} activeOpacity={0.85}>
            <Text style={styles.addExpenseBtnText}>+ Add Expense</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Verification Banner */}
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => {
            if (pendingExpenses[0]) openExpenseDetails(pendingExpenses[0]);
          }}
          activeOpacity={0.8}
          disabled={pendingExpenses.length === 0}
        >
          <View style={styles.pendingLeft}>
            <View style={styles.checkIconBox}>
              <Svg width={12} height={12} viewBox="0 0 20 20">
                <Path d="M4 10.5L8 14.5L16 6.5" stroke="#E87A35" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </View>
            <Text style={styles.pendingBannerText}>
              {pendingExpenses.length > 0
                ? `${pendingExpenses.length} transaction${pendingExpenses.length === 1 ? '' : 's'} pending review`
                : 'All transactions reviewed'}
            </Text>
          </View>
          <Text style={styles.pendingChevron}>&gt;</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        visible={isReceiptModalVisible}
        onClose={() => setIsReceiptModalVisible(false)}
        expense={selectedExpense}
        onApprove={() => reviewExpense('APPROVED')}
        onReject={() => reviewExpense('REJECTED')}
      />

      {/* Add Revenue Modal */}
      <AddRevenueModal
        visible={isAddRevenueModalVisible}
        onClose={() => setIsAddRevenueModalVisible(false)}
        onAdd={(newInc) => {
          setIncomes((prev) => [
            ...prev,
            {
              id: `inc-${Date.now()}`,
              no: prev.length + 1,
              date: newInc.date || '10 Oct',
              from: newInc.from || 'Revenue',
              total: newInc.total || '0',
              numericTotal: newInc.numericTotal || 0,
            },
          ]);
        }}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        visible={isAddExpenseModalVisible}
        onClose={() => setIsAddExpenseModalVisible(false)}
        onAdd={(newExp) => {
          setExpenses((prev) => [
            ...prev,
            {
              id: `exp-${Date.now()}`,
              no: prev.length + 1,
              date: newExp.date || '10 Oct',
              typeOfCost: newExp.typeOfCost || 'Expense',
              description: newExp.description,
              total: newExp.total || '0',
              numericTotal: newExp.numericTotal || 0,
              hasReceipt: !!newExp.hasReceipt,
              status: 'PENDING',
            },
          ]);
        }}
      />
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  octBadge: {
    backgroundColor: '#EEECFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  octBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 18,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    shadowColor: '#24244A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  summarySubLabel: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2,
  },
  summaryAmount: {
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
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF7',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  filterBox: {
    flex: 1,
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: '#EDEEF7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterLabel: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: 2,
  },
  filterValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  searchBtn: {
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  tableSection: {
    gap: 10,
  },
  tableTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECEEF7',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A3CEB',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  thText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4FB',
  },
  tableRowAlt: {
    backgroundColor: '#FAFBFE',
  },
  tdText: {
    fontSize: 11,
    color: colors.text,
  },
  proveCell: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F3F2FE',
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  footerValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  addIncomeBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIncomeBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  addExpenseBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  addExpenseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF6EE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkIconBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#E87A35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pendingBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D87028',
  },
  pendingChevron: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D87028',
  },
});
