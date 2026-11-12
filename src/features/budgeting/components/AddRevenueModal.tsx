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
import { IncomeItem } from '../types';

interface AddRevenueModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: Partial<IncomeItem>) => void;
}

export function AddRevenueModal({ visible, onClose, onAdd }: AddRevenueModalProps) {
  const [source, setSource] = useState('');
  const [date, setDate] = useState('10 Oct 2026');
  const [total, setTotal] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!source.trim()) {
      showMessage('Source Required', 'Please enter the name of the revenue source.');
      return;
    }
    const num = parseInt(total.replace(/\D/g, ''), 10) || 0;
    onAdd({
      from: source.trim(),
      date: '10 Oct',
      total: num > 0 ? num.toLocaleString('id-ID') : '0',
      numericTotal: num,
    });
    setSource('');
    setTotal('');
    setDescription('');
    onClose();
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardWrap}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Revenue</Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveCheckBtn} hitSlop={10}>
                <Svg width={14} height={14} viewBox="0 0 20 20">
                  <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {/* Form Card */}
              <View style={styles.formCard}>
                {/* Source */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Source</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={source}
                    onChangeText={setSource}
                    placeholder="Name of revenue source"
                    placeholderTextColor={colors.placeholder}
                  />
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

              {/* Disclaimer callout */}
              <View style={styles.disclaimerBox}>
                <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.infoIcon}>
                  <Circle cx="12" cy="12" r="10" stroke="#5145E8" strokeWidth={2} fill="none" />
                  <Path d="M9.09 9A3 3 0 0 1 15 10C15 12 12 13 12 13M12 17H12.01" stroke="#5145E8" strokeWidth={2} strokeLinecap="round" />
                </Svg>
                <Text style={styles.disclaimerText}>
                  Ensure that the amounts and sources of income match the organization's records.
                </Text>
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(23, 24, 43, 0.45)',
  },
  keyboardWrap: {
    width: '100%',
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
    gap: 14,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDEEF7',
    borderRadius: 18,
    padding: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    width: 95,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  fieldInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
    textAlign: 'left',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateValueText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginRight: 6,
  },
  calIcon: {
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4FB',
    marginVertical: 14,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F1FE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#494C66',
    lineHeight: 16,
  },
});
