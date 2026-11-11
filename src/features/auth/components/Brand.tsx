import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../../../theme/colors';

type BrandMarkProps = { size?: number };

export function BrandMark({ size = 42 }: BrandMarkProps) {
  const id = React.useId().replace(/:/g, '');
  const backgroundId = `${id}-background`;

  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.32 }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityRole="image" accessibilityLabel="Orbit planet logo">
        <Defs>
          <LinearGradient id={backgroundId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#5447EA" />
            <Stop offset="1" stopColor="#3C2FB3" />
          </LinearGradient>
        </Defs>
        <Rect width="100" height="100" rx="32" fill={`url(#${backgroundId})`} />
        
        {/* Planet top hemisphere arc */}
        <Path
          d="M 36.5 42.5 C 38.5 35 44 32.5 50.5 32.5 C 57.5 32.5 63 35.8 65 41"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Small orbital highlight dot */}
        <Circle cx="66" cy="45.5" r="1.3" fill="#FFFFFF" />

        {/* Planet bottom hemisphere arc */}
        <Path
          d="M 64.5 53.5 C 62.5 61 57 64.5 50.5 64.5 C 43.5 64.5 38 60.5 36.5 55"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tilted Ring / Orbit: back loop and front swoop */}
        <Path
          d="M 33 51 C 24 53 18 56.5 21 58.5 C 25 61 35 60 48.5 56.5 C 63 53 74 48 78 45.5 C 81 43.5 78.5 41 72 40.5 C 65 40 56 42 47 45"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
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
      <View style={styles.concentricOuter}>
        <View style={styles.concentricInner}>
          <BrandMark size={130} />
        </View>
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
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.22,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  brandCopy: { marginLeft: 10 },
  brandName: { color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  tagline: { color: colors.muted, fontSize: 9, marginTop: 1, letterSpacing: 0.15 },
  splashBrand: { alignItems: 'center' },
  concentricOuter: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: 'rgba(81, 69, 232, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(81, 69, 232, 0.02)',
  },
  concentricInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(81, 69, 232, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashName: { color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6, marginTop: 18 },
  splashTagline: { color: colors.muted, fontSize: 12, marginTop: 5 },
});
