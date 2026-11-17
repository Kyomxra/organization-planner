import React, { useCallback, useEffect, useState } from 'react';
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
import { ExpenseItem, IncomeItem } from '../types';
import { TransactionDetailsModal } from '../components/TransactionDetailsModal';
import { AddRevenueModal } from '../components/AddRevenueModal';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { supabase } from '../../../lib/supabase';
import { formatLocalDate, isValidLocalDate } from '../../../lib/date';

interface BudgetingScreenProps {
  organizationId: string;
  onBack: () => void;
  openAddExpense?: boolean;
  canAddRevenue?: boolean;
  canAddExpense?: boolean;
  canReviewTransactions?: boolean;
}

function displayDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('id-ID');
}

export function BudgetingScreen({
  organizationId,
  onBack,
  openAddExpense = false,
  canAddRevenue = true,
  canAddExpense = true,
  canReviewTransactions = true,
}: BudgetingScreenProps) {
  const today = new Date();
  const defaultFromDate = formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const defaultToDate = formatLocalDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [appliedFromDate, setAppliedFromDate] = useState(defaultFromDate);
  const [appliedToDate, setAppliedToDate] = useState(defaultToDate);
  const [isLoading, setIsLoading] = useState(true);
  const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false);
  const [isAddRevenueModalVisible, setIsAddRevenueModalVisible] = useState(false);
  const [isAddExpenseModalVisible, setIsAddExpenseModalVisible] = useState(openAddExpense && canAddExpense);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);

  useEffect(() => {
    setIsAddExpenseModalVisible(openAddExpense && canAddExpense);
  }, [canAddExpense, openAddExpense]);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('id, type, amount, occurred_on, source_or_category, description, status, receipt_path')
      .eq('organization_id', organizationId)
      .gte('occurred_on', appliedFromDate)
      .lte('occurred_on', appliedToDate)
      .order('occurred_on', { ascending: false });

    if (error) {
      showMessage('Could not load transactions', error.message);
      setIsLoading(false);
      return;
    }

    const incomeRows = (data ?? []).filter((row) => row.type === 'income');
    const expenseRows = (data ?? []).filter((row) => row.type === 'expense');
    setIncomes(incomeRows.map((row, index) => ({
      id: row.id,
      no: index + 1,
      date: displayDate(row.occurred_on),
      from: row.source_or_category,
      total: formatAmount(Number(row.amount)),
      numericTotal: Number(row.amount),
      description: row.description,
    })));
    setExpenses(expenseRows.map((row, index) => ({
      id: row.id,
      no: index + 1,
      date: displayDate(row.occurred_on),
      typeOfCost: row.source_or_category,
      description: row.description,
      total: formatAmount(Number(row.amount)),
      numericTotal: Number(row.amount),
      hasReceipt: Boolean(row.receipt_path),
      status: row.status.toUpperCase() as ExpenseItem['status'],
    })));
    setIsLoading(false);
  }, [appliedFromDate, appliedToDate, organizationId]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

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

  const reviewExpense = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedExpense) return;
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showMessage('Could not review transaction', userError?.message ?? 'Sign in again and retry.');
      return;
    }
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status: status.toLowerCase(),
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', selectedExpense.id)
      .eq('organization_id', organizationId)
      .select('id')
      .maybeSingle();
    if (error || !data) {
      showMessage(
        'Could not review transaction',
        error?.message ?? 'You may not have permission to review this transaction.',
      );
      return;
    }
    await loadTransactions();
    setIsReceiptModalVisible(false);
  };

  const handleAddIncome = () => {
    setIsAddRevenueModalVisible(true);
  };

  const handleAddExpense = () => {
    setIsAddExpenseModalVisible(true);
  };

  const handleSearchFilter = () => {
    if (!isValidLocalDate(fromDate) || !isValidLocalDate(toDate) || fromDate > toDate) {
      showMessage('Check date range', 'Enter dates as YYYY-MM-DD and make sure the start is not after the end.');
      return;
    }
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const saveIncome = async (income: Partial<IncomeItem>): Promise<boolean> => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showMessage('Could not save revenue', userError?.message ?? 'Sign in again and retry.');
      return false;
    }
    const { error } = await supabase.from('transactions').insert({
      organization_id: organizationId,
      type: 'income',
      amount: income.numericTotal,
      occurred_on: income.date,
      source_or_category: income.from,
      description: income.description ?? '',
      status: 'approved',
      submitted_by: user.id,
    });
    if (error) {
      showMessage('Could not save revenue', error.message);
      return false;
    }
    await loadTransactions();
    return true;
  };

  const saveExpense = async (expense: Partial<ExpenseItem>): Promise<boolean> => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      showMessage('Could not save expense', userError?.message ?? 'Sign in again and retry.');
      return false;
    }
    const { error } = await supabase.from('transactions').insert({
      organization_id: organizationId,
      type: 'expense',
      amount: expense.numericTotal,
      occurred_on: expense.date,
      source_or_category: expense.typeOfCost,
      description: expense.description ?? '',
      status: 'pending',
      submitted_by: user.id,
    });
    if (error) {
      showMessage('Could not save expense', error.message);
      return false;
    }
    await loadTransactions();
    return true;
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
          <Text style={styles.octBadgeText}>
            {new Date(`${appliedFromDate}T12:00:00`).toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
            }).toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && <Text style={styles.emptyTableText}>Loading transactions...</Text>}
        {/* Top Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summarySubLabel}>Total Budget Available</Text>
          <Text style={styles.summaryAmount}>Rp{formatAmount(Math.max(availableBudget, 0))}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.revenueText}>+ Rp{formatAmount(subtotalIncome)}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Expenditures</Text>
              <Text style={styles.expenditureText}>- Rp{formatAmount(subtotalExpense)}</Text>
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
                <TextInput
                  style={styles.filterDateInput}
                  value={fromDate}
                  onChangeText={setFromDate}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  accessibilityLabel="Filter start date"
                />
                <Svg width={14} height={14} viewBox="0 0 24 24">
                  <Rect x="3" y="4" width="18" height="18" rx="3" stroke={colors.primary} strokeWidth={2} fill="none" />
                  <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
            </View>

            <View style={styles.filterBox}>
              <Text style={styles.filterLabel}>To</Text>
              <View style={styles.filterValueRow}>
                <TextInput
                  style={styles.filterDateInput}
                  value={toDate}
                  onChangeText={setToDate}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  accessibilityLabel="Filter end date"
                />
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
            {!isLoading && incomes.length === 0 && (
              <Text style={styles.emptyTableText}>No revenue in this date range.</Text>
            )}
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

          {canAddRevenue && (
            <TouchableOpacity style={styles.addIncomeBtn} onPress={handleAddIncome} activeOpacity={0.8}>
              <Text style={styles.addIncomeBtnText}>+ Add Revenue</Text>
            </TouchableOpacity>
          )}
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
            {!isLoading && expenses.length === 0 && (
              <Text style={styles.emptyTableText}>No expenses in this date range.</Text>
            )}
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

          {canAddExpense && (
            <TouchableOpacity style={styles.addExpenseBtn} onPress={handleAddExpense} activeOpacity={0.85}>
              <Text style={styles.addExpenseBtnText}>+ Add Expense</Text>
            </TouchableOpacity>
          )}
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
        canReview={canReviewTransactions}
      />

      {/* Add Revenue Modal */}
      <AddRevenueModal
        visible={isAddRevenueModalVisible}
        onClose={() => setIsAddRevenueModalVisible(false)}
        onAdd={saveIncome}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        visible={isAddExpenseModalVisible}
        onClose={() => setIsAddExpenseModalVisible(false)}
        onAdd={saveExpense}
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
  filterDateInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    padding: 0,
  },
  emptyTableText: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
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
