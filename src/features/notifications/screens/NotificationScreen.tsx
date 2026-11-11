import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../../theme/colors';

interface NotificationScreenProps {
  onBack: () => void;
}

export function NotificationScreen({ onBack }: NotificationScreenProps) {
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

      {/* Center Empty State Graphic */}
      <View style={styles.centerContainer}>
        <View style={styles.mailboxGraphic}>
          <Svg width={180} height={160} viewBox="0 0 200 180">
            {/* Stand Post */}
            <Rect x="85" y="110" width="30" height="45" fill="#4B3DE8" rx="4" />

            {/* Back Grey Box */}
            <Path
              d="M70 40 H140 C155 40 165 52 165 68 V110 H70 V40 Z"
              fill="#9FA2B4"
            />

            {/* Front Curved Blue Flap */}
            <Path
              d="M45 68 C45 52 55 40 70 40 V110 H45 C40 110 35 105 35 100 V78 C35 72 40 68 45 68 Z"
              fill="#4B3DE8"
            />

            {/* Slot Handle on blue body */}
            <Rect x="50" y="88" width="22" height="7" rx="3.5" fill="#D3D5E6" />

            {/* Mailbox Flag Arm & Flag */}
            <Rect x="100" y="58" width="55" height="12" rx="6" fill="#D3D5E6" />
            <Circle cx="106" cy="64" r="8" fill="#D3D5E6" />
            <Rect x="150" y="66" width="16" height="20" rx="3" fill="#4B3DE8" />
          </Svg>
        </View>

        <Text style={styles.emptyTitle}>No notification yet</Text>
        <Text style={styles.emptySubtitle}>Your notification will appear here.</Text>
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
    justifyContent: 'space-between',
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
