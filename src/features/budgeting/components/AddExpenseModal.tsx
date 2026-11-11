import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import { ExpenseItem } from '../types';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: Partial<ExpenseItem>) => void;
}

export function AddExpenseModal({ visible, onClose, onAdd }: AddExpenseModalProps) {
  const [expenseType, setExpenseType] = useState('Meeting Consum');
  const [date, setDate] = useState('10 Oct 2026');
  const [total, setTotal] = useState('');
  const [description, setDescription] = useState('');
  const [hasReceipt, setHasReceipt] = useState(false);

  const handleSave = () => {
    if (!expenseType.trim()) {
      showMessage('Expense Type Required', 'Please choose or enter the expense type.');
      return;
    }
    const num = parseInt(total.replace(/\D/g, ''), 10) || 0;
    onAdd({
      typeOfCost: expenseType.trim(),
      date: '10 Oct',
      total: num > 0 ? num.toLocaleString('id-ID') : '0',
      numericTotal: num,
      hasReceipt: hasReceipt,
      status: 'PENDING',
    });
    setTotal('');
    setDescription('');
    setHasReceipt(false);
    onClose();
  };

  const handlePickReceipt = () => {
    setHasReceipt(true);
    showMessage('Receipt Uploaded', 'Receipt image has been attached.');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardWrap}>
          <View style={styles.sheet}>
            {/* Grab handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Expense</Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveCheckBtn} hitSlop={10}>
                <Svg width={14} height={14} viewBox="0 0 20 20">
                  <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {/* Form Card */}
              <View style={styles.formCard}>
                {/* Expense Type */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Expense Type</Text>
                  <TouchableOpacity
                    style={styles.dashedAddBtn}
                    onPress={() => {
                      const types = ['Meeting Consum', 'Print Banner', 'Rent equipment', 'Logistics', 'Snacks'];
                      const next = types[(types.indexOf(expenseType) + 1) % types.length];
                      setExpenseType(next);
                    }}
                  >
                    <Text style={styles.dashedAddBtnText}>+ {expenseType ? expenseType : 'Add Other'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Date */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <View style={styles.datePickerRow}>
                    <Text style={styles.dateValueText}>{date}</Text>
                    <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.calIcon}>
                      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={colors.primary} strokeWidth={2} fill="none" />
                      <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Total */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Total (Rp)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={total}
                    onChangeText={setTotal}
                    placeholder="0"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.divider} />

                {/* Description */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add revenue notes"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              </View>

              {/* Receipt Card */}
              <View style={styles.receiptCard}>
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptTitle}>Receipt</Text>
                  <Text style={styles.receiptSubtext}>JPG, PNG • maks. 5 MB</Text>
                </View>

                <TouchableOpacity style={styles.dropzone} onPress={handlePickReceipt} activeOpacity={0.8}>
                  <View style={styles.imageIconWrapper}>
                    <Svg width={24} height={24} viewBox="0 0 24 24">
                      <Rect x="3" y="3" width="18" height="18" rx="4" stroke={colors.primary} strokeWidth={1.8} fill="none" />
                      <Circle cx="8.5" cy="8.5" r="1.5" fill={colors.primary} />
                      <Path d="M21 15L16 10L5 21" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <Text style={styles.dropzoneMainText}>
                    {hasReceipt ? '✓ Receipt attached' : 'Take photo or upload'}
                  </Text>
                  <Text style={styles.dropzoneSubText}>Ensure transaction details are readable.</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  keyboardWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#FAFAFD',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
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
    paddingBottom: 16,
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
  saveCheckBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECEFF5',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    width: 100,
  },
  fieldInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    textAlign: 'left',
    paddingVertical: 0,
    outlineWidth: 0,
  },
  dashedAddBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  dashedAddBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateValueText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  calIcon: {
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F4F9',
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECEFF5',
    padding: 16,
    marginBottom: 14,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  receiptSubtext: {
    fontSize: 11,
    color: '#8A92A6',
    fontWeight: '500',
  },
  dropzone: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#F8F9FE',
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dropzoneMainText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  dropzoneSubText: {
    fontSize: 11,
    color: '#8A92A6',
  },
});
