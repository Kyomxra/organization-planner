import React, { useEffect, useState } from 'react';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/ThemeContext';
import { showMessage, showToast } from '../../auth/utils/feedback';
import { supabase } from '../../../lib/supabase';

interface NotificationScreenProps {
  organizationId: string;
  onBack: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export function NotificationScreen({ organizationId, onBack }: NotificationScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, created_at, read_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error) {
        showMessage('Could not load notifications', error.message);
        setIsLoading(false);
        return;
      }
      setNotifications(data ?? []);
      setIsLoading(false);
    };
    void loadNotifications().catch((error: unknown) => {
      if (!active) return;
      showMessage(
        'Could not load notifications',
        error instanceof Error ? error.message : 'Could not connect to Supabase.',
      );
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [organizationId]);

  const markAsRead = async (item: NotificationItem) => {
    if (item.read_at) return;
    const readAt = new Date().toISOString();
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('id', item.id)
      .eq('organization_id', organizationId)
      .select('id')
      .maybeSingle();
    if (error || !data) {
      showToast('error', 'Could not mark notification as read', error?.message ?? 'The notification could not be updated.');
      return;
    }
    setNotifications((current) => current.map((notification) =>
      notification.id === item.id ? { ...notification, read_at: readAt } : notification
    ));
    showToast('success', 'Notification updated', 'The notification was marked as read.');
  };

  const hasNotifications = notifications.length > 0;

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
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={styles.spacer} />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptySubtitle}>Loading notifications…</Text>
        </View>
      ) : hasNotifications ? (
        <ScrollView contentContainerStyle={styles.notificationList}>
          {notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.notificationCard, !item.read_at && styles.unreadCard]}
              onPress={() => { void markAsRead(item); }}
              activeOpacity={0.8}
            >
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                {!item.read_at && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notificationBody}>{item.body}</Text>
              <Text style={styles.notificationDate}>
                {new Date(item.created_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
      <View style={styles.centerContainer}>
        <View style={styles.mailboxGraphic}>
          <Svg width={180} height={160} viewBox="0 0 200 180">
            {/* Stand Post */}
            <Rect x="85" y="110" width="30" height="45" fill={colors.primary} rx="4" />

            {/* Back Grey Box */}
            <Path
              d="M70 40 H140 C155 40 165 52 165 68 V110 H70 V40 Z"
              fill={colors.muted}
            />

            {/* Front Curved Blue Flap */}
            <Path
              d="M45 68 C45 52 55 40 70 40 V110 H45 C40 110 35 105 35 100 V78 C35 72 40 68 45 68 Z"
              fill={colors.primary}
            />

            {/* Slot Handle on blue body */}
            <Rect x="50" y="88" width="22" height="7" rx="3.5" fill={colors.border} />

            {/* Mailbox Flag Arm & Flag */}
            <Rect x="100" y="58" width="55" height="12" rx="6" fill={colors.border} />
            <Circle cx="106" cy="64" r="8" fill={colors.border} />
            <Rect x="150" y="66" width="16" height="20" rx="3" fill={colors.primary} />
          </Svg>
        </View>
        <Text style={styles.emptyTitle}>No notification yet</Text>
        <Text style={styles.emptySubtitle}>Your notification will appear here.</Text>
      </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  spacer: {
    width: 36,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 60,
  },
  notificationList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 10,
  },
  notificationCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  unreadCard: {
    borderColor: colors.informative200,
    backgroundColor: colors.informative100,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notificationTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  notificationBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  notificationDate: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    backgroundColor: colors.informative500,
  },
  mailboxGraphic: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});
