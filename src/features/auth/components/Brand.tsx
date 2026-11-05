import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../../../theme/colors';

type BrandMarkProps = { size?: number };

export function BrandMark({ size = 42 }: BrandMarkProps) {
  const id = React.useId().replace(/:/g, '');
  const backgroundId = `${id}-background`;
  const glowId = `${id}-glow`;
  const clipId = `${id}-clip`;
  const planetClipId = `${id}-planet-clip`;

  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityRole="image" accessibilityLabel="Orbit planet logo">
        <Defs>
          <LinearGradient id={backgroundId} x1="0" y1="0" x2="80" y2="100" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#5145E8" />
            <Stop offset="1" stopColor="#382FA9" />
          </LinearGradient>
          <RadialGradient id={glowId} cx="75" cy="18" r="62" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#8278FF" stopOpacity="0.5" />
            <Stop offset="1" stopColor="#8278FF" stopOpacity="0" />
          </RadialGradient>
          <ClipPath id={clipId}>
            <Rect width="100" height="100" rx="28" />
          </ClipPath>
          <ClipPath id={planetClipId}>
            <Circle cx="50" cy="50" r="13" />
          </ClipPath>
        </Defs>
        <Rect width="100" height="100" rx="28" fill={`url(#${backgroundId})`} />
        <G clipPath={`url(#${clipId})`}>
          <Circle cx="75" cy="18" r="44" fill={`url(#${glowId})`} />
          <Path
            d="M 29 58 C 26 55, 33 50, 42 46 M 57 40 C 66 36, 73 33, 75 36 C 77 39, 72 43, 66 46"
            fill="none"
            stroke="#FFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx="50"
            cy="50"
            r="13"
            fill={`url(#${backgroundId})`}
            stroke="#FFF"
            strokeWidth="2.2"
          />
          <G clipPath={`url(#${planetClipId})`}>
            <Circle cx="75" cy="18" r="44" fill={`url(#${glowId})`} />
          </G>
          <Path
            d="M 29 58 C 39 56, 51 50, 61 45"
            fill="none"
            stroke="#FFF"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <Circle cx="64" cy="51" r="0.9" fill="#FFF" />
          <Circle cx="66" cy="48" r="0.75" fill="#FFF" />
        </G>
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
      <BrandMark size={142} />
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
  splashName: { color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6, marginTop: 18 },
  splashTagline: { color: colors.muted, fontSize: 12, marginTop: 5 },
});
