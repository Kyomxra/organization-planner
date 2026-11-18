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
import { CalendarEvent } from '../types';

interface EventDetailsModalProps {
  visible: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onAttachRundown?: () => void;
  canManageEvent?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EventDetailsModal({
  visible,
  event,
  onClose,
  onAttachRundown,
  canManageEvent = false,
  onEdit,
  onDelete,
}: EventDetailsModalProps) {
  if (!event) return null;

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
            <Text style={styles.headerTitle}>Event Details</Text>
            <View style={styles.spacer} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Category Tag */}
            <View style={styles.categoryRow}>
              <View style={styles.categoryDot} />
              <Text style={styles.categoryText}>{event.category || 'ORGANIZATION MEETING'}</Text>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventSub}>
              {event.orgName} · {event.divisionId ? `Division · ${event.divisionName}` : 'Organization-wide'}
            </Text>

            {/* Date & Time Card */}
            <View style={styles.card}>
              {/* Date Row */}
              <View style={styles.infoRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                  <Svg width={18} height={18} viewBox="0 0 24 24">
                    <Rect x="3" y="4" width="18" height="18" rx="3" stroke={colors.primary} strokeWidth={2} fill="none" />
                    <Path d="M16 2V6M8 2V6M3 10H21" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </View>
                <View>
                  <Text style={styles.label}>Date</Text>
                  <Text style={styles.value}>{event.dateLabel}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Time Row */}
              <View style={styles.infoRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.warning100 }]}>
                  <Svg width={18} height={18} viewBox="0 0 24 24">
                    <Circle cx="12" cy="12" r="9" stroke={colors.primary} strokeWidth={2} fill="none" />
                    <Path d="M12 7V12L15 14" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </View>
                <View>
                  <Text style={styles.label}>Time</Text>
                  <Text style={styles.value}>{event.startTime}–{event.endTime} · {event.duration}</Text>
                </View>
              </View>
            </View>

            {/* Description Card */}
            <View style={styles.card}>
              <Text style={styles.descHeading}>DESCRIPTION</Text>
              <Text style={styles.descBody}>{event.description}</Text>
            </View>
            {event.notes ? (
              <View style={styles.card}>
                <Text style={styles.descHeading}>NOTES</Text>
                <Text style={styles.descBody}>{event.notes}</Text>
              </View>
            ) : null}
            {canManageEvent && (
              <View style={styles.manageRow}>
                <TouchableOpacity style={styles.editButton} onPress={onEdit}>
                  <Text style={styles.editButtonText}>Edit event</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
            {onAttachRundown ? <View style={styles.rundownCard}>
              <Text style={styles.rundownText}>
                {event.linkedRundown
                  ? `Linked rundown: ${event.linkedRundown.title}`
                  : 'No rundown is linked to this event.'}
              </Text>
              <TouchableOpacity onPress={onAttachRundown} style={styles.rundownButton}>
                <Text style={styles.rundownButtonText}>
                  {event.linkedRundown ? 'Change rundown' : 'Attach rundown'}
                </Text>
              </TouchableOpacity>
            </View> : null}
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
    maxHeight: '85%',
    backgroundColor: colors.surface,
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
    color: colors.muted,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  spacer: {
    width: 32,
  },
  content: {
    paddingBottom: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.secondary,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  eventSub: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  label: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 12,
  },
  descHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descBody: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  rundownCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  rundownText: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 10,
  },
  rundownButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rundownButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  editButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 11,
  },
  editButtonText: { color: colors.surface, fontSize: 12, fontWeight: '800' },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.secondarySoft,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  deleteButtonText: { color: colors.error500, fontSize: 12, fontWeight: '800' },
});
