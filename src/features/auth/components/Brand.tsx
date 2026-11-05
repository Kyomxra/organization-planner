import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

type BrandMarkProps = { size?: number };

export function BrandMark({ size = 42 }: BrandMarkProps) {
  const strokeWidth = Math.max(1.4, size * 0.035);

  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <View
        style={[
          styles.orbitBack,
          {
            width: size * 0.6,
            height: size * 0.28,
            borderRadius: size,
            borderWidth: strokeWidth,
          },
        ]}
      />
      <View
        style={[
          styles.planet,
          {
            width: size * 0.34,
            height: size * 0.34,
            borderRadius: size,
            borderWidth: strokeWidth,
          },
        ]}
      />
      <View
        style={[
          styles.orbitFront,
          {
            width: size * 0.58,
            height: strokeWidth,
            borderRadius: strokeWidth,
          },
        ]}
      />
      <View style={[styles.orbitDot, { width: strokeWidth, height: strokeWidth, borderRadius: size }]} />
    </View>
  );
}

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.header}>
      <BrandMark size={compact ? 34 : 40} />
      <View style={styles.brandCopy}>
        <Text style={styles.brandName}>Orbit</Text>
        <Text style={styles.tagline}>Organize. Connect. Grow.</Text>
      </View>
    </View>
  );
}

export function SplashBrand() {
  return (
    <View style={styles.splashBrand}>
      <View style={styles.splashGlow}>
        <BrandMark size={78} />
      </View>
      <Text style={styles.splashName}>Orbit</Text>
      <Text style={styles.splashTagline}>Organize. Connect. Grow.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.22,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  orbitBack: {
    position: 'absolute',
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-27deg' }],
  },
  planet: {
    position: 'absolute',
    backgroundColor: colors.primary,
    borderColor: '#FFFFFF',
  },
  orbitFront: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-24deg' }],
    left: '14%',
    top: '55%',
  },
  orbitDot: {
    position: 'absolute',
    right: '20%',
    top: '39%',
    backgroundColor: '#FFFFFF',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  brandCopy: { marginLeft: 10 },
  brandName: { color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  tagline: { color: colors.muted, fontSize: 9, marginTop: 1, letterSpacing: 0.15 },
  splashBrand: { alignItems: 'center' },
  splashGlow: {
    width: 142,
    height: 142,
    borderRadius: 71,
    backgroundColor: '#EFEEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  splashName: { color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6 },
  splashTagline: { color: colors.muted, fontSize: 12, marginTop: 5 },
});
