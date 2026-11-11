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
import { RundownItem } from '../types';

interface EditRundownScreenProps {
  onBack: () => void;
  onSave?: () => void;
}

const initialItems: RundownItem[] = [
  {
    id: 'rd-1',
    stepNumber: 1,
    title: 'Guest arrival & registration',
    startTime: '18.30',
    durationMinutes: 20,
    description: 'Welcome desk opens; distribute name tags.',
    assigneeInitials: 'MC',
    assigneeName: 'Maya Chen',
  },
  {
    id: 'rd-2',
    stepNumber: 2,
    title: 'Opening remarks',
    startTime: '18.50',
    durationMinutes: 10,
    description: 'Host welcome, safety note, and event overview.',
    assigneeInitials: 'DK',
    assigneeName: 'Daniel Kim',
  },
  {
    id: 'rd-3',
    stepNumber: 3,
    title: 'Impact stories',
    startTime: '19.00',
    durationMinutes: 35,
    description: 'Three community partners share their stories.',
    assigneeInitials: 'PS',
    assigneeName: 'Priya Shah',
  },
];

export function EditRundownScreen({ onBack, onSave }: EditRundownScreenProps) {
  const [items, setItems] = useState<RundownItem[]>(initialItems);

  const handleAddItem = () => {
    const nextStep = items.length + 1;
    const newItem: RundownItem = {
      id: `rd-${Date.now()}`,
      stepNumber: nextStep,
      title: `Agenda Item ${nextStep}`,
      startTime: '19.45',
      durationMinutes: 15,
      description: 'Review updates and next action items.',
      assigneeInitials: 'AP',
      assigneeName: 'Alex Pratama',
    };
    setItems([...items, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) =>
      prev
        .filter((item) => item.id !== id)
        .map((item, idx) => ({ ...item, stepNumber: idx + 1 }))
    );
  };

  const handleEditItem = (item: RundownItem) => {
    showMessage('Edit Item', `Editing "${item.title}"`);
  };

  const handleSaveRundown = () => {
    showMessage('Rundown Saved', 'All rundown schedule items have been updated successfully.', () => {
      onSave?.();
      onBack();
    });
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
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Edit Rundown</Text>
          <Text style={styles.headerSub}>Keep times and responsibilities up to date</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Context Card */}
        <View style={styles.eventContextCard}>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Title</Text>
            <Text style={styles.contextTitleValue}>Volunteer Appreciation Night</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Event</Text>
            <View>
              <Text style={styles.eventDateText}>Sat, 24 Oct 2026</Text>
              <Text style={styles.eventTimeContext}>Optional calendar context · 18.30–21.00</Text>
            </View>
          </View>
        </View>

        {/* Rundown Items Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Rundown items</Text>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountBadgeText}>{items.length} ITEMS</Text>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.itemsList}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                {/* Drag Handle Icon */}
                <View style={styles.dragHandle}>
                  <Svg width={14} height={14} viewBox="0 0 20 20">
                    <Circle cx="6" cy="5" r="1.5" fill="#A5A7B7" />
                    <Circle cx="14" cy="5" r="1.5" fill="#A5A7B7" />
                    <Circle cx="6" cy="10" r="1.5" fill="#A5A7B7" />
                    <Circle cx="14" cy="10" r="1.5" fill="#A5A7B7" />
                    <Circle cx="6" cy="15" r="1.5" fill="#A5A7B7" />
                    <Circle cx="14" cy="15" r="1.5" fill="#A5A7B7" />
                  </Svg>
                </View>

                {/* Step Number Circle */}
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>{item.stepNumber}</Text>
                </View>

                {/* Content */}
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle}>{item.title}</Text>

                  {/* Time badges */}
                  <View style={styles.timeBadgesRow}>
                    <View style={styles.timeBadgePurple}>
                      <Text style={styles.timeBadgePurpleText}>{item.startTime}</Text>
                    </View>
                    <View style={styles.timeBadgeGrey}>
                      <Text style={styles.timeBadgeGreyText}>{item.durationMinutes} min</Text>
                    </View>
                  </View>

                  <Text style={styles.itemDescription}>{item.description}</Text>

                  {/* Assignee */}
                  <View style={styles.assigneeRow}>
                    <View style={styles.assigneeAvatar}>
                      <Text style={styles.assigneeInitials}>{item.assigneeInitials}</Text>
                    </View>
                    <Text style={styles.assigneeName}>{item.assigneeName}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionCol}>
                  <TouchableOpacity
                    style={styles.iconCircleBtn}
                    onPress={() => handleEditItem(item)}
                    hitSlop={6}
                  >
                    <Svg width={13} height={13} viewBox="0 0 24 24">
                      <Path
                        d="M17 3A2.828 2.828 0 1 1 21 7L7.5 20.5 2 22l1.5-5.5L17 3z"
                        fill="none"
                        stroke="#2D3142"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconCircleBtn}
                    onPress={() => handleDeleteItem(item.id)}
                    hitSlop={6}
                  >
                    <Svg width={13} height={13} viewBox="0 0 24 24">
                      <Path
                        d="M3 6H5H21M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6H19Z"
                        fill="none"
                        stroke="#2D3142"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Add Rundown Item Button */}
        <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem} activeOpacity={0.8}>
          <Text style={styles.addItemBtnText}>+ Add Rundown Item</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={onBack} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRundown} activeOpacity={0.85}>
          <Svg width={14} height={14} viewBox="0 0 20 20" style={styles.saveCheckIcon}>
            <Path d="M4 10.5L8 14.5L16 6.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
          <Text style={styles.saveBtnText}>Save Rundown</Text>
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
    alignItems: 'center',
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
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110,
    gap: 16,
  },
  eventContextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF7',
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contextLabel: {
    width: 65,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    paddingTop: 1,
  },
  contextTitleValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  eventDateText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  eventTimeContext: {
    fontSize: 11,
    color: colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4FB',
    marginVertical: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  itemCountBadge: {
    backgroundColor: '#FFF2E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E87A35',
    letterSpacing: 0.5,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF7',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dragHandle: {
    paddingTop: 6,
    marginRight: 6,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EEECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  timeBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  timeBadgePurple: {
    backgroundColor: '#EEECFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeBadgePurpleText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  timeBadgeGrey: {
    backgroundColor: '#F3F4F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeBadgeGreyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A5D75',
  },
  itemDescription: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
    marginBottom: 8,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  assigneeInitials: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  assigneeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A4D62',
  },
  actionCol: {
    gap: 8,
    marginLeft: 8,
  },
  iconCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEEF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EEECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addItemBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAFBFD',
    borderTopWidth: 1,
    borderTopColor: '#ECEEF7',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A5D75',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 22,
    height: 46,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  saveCheckIcon: {
    marginRight: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
