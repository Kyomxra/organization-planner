export const lightColors = {
  // Brand Primary: Deep Royal Navy / Sapphire (Authoritative, modern, premium executive vibe)
  primary: '#1E40AF',       // Deep royal blue
  primaryDark: '#172554',   // Midnight navy
  primaryLight: '#3B82F6',  // Cobalt accent
  primarySoft: '#EFF6FF',   // Subtle icy tint
  primaryMuted: '#DBEAFE',  // Border / subtle background

  // Brand Secondary: Modern Indigo-Violet (Sleek tech accent, complements deep royal)
  secondary: '#4F46E5',     // Modern indigo
  secondaryDark: '#3730A3', // Deep indigo
  secondaryLight: '#818CF8',// Soft lavender
  secondarySoft: '#EEF2FF', // Very light indigo wash

  // Accent: Cyan-Teal highlight for badges and active states
  accent: '#0EA5E9',
  accentSoft: '#F0F9FF',

  // Surfaces & Backgrounds: Ultra-clean slate modern neutrals
  background: '#F8FAFC',    // Modern slate white (replaces dull gray)
  surface: '#FFFFFF',       // Pure white card surfaces
  surfaceSubtle: '#F1F5F9', // Elevated subtle surface
  surfaceHover: '#E2E8F0',  // Pressed state

  // Typography & Content
  text: '#0F172A',          // High-contrast deep slate text
  textSecondary: '#334155', // Body secondary text
  muted: '#64748B',         // Subtle guide / metadata text
  placeholder: '#94A3B8',   // Input placeholder

  // Borders & Dividers
  border: '#E2E8F0',        // Clean modern hairline border
  borderSubtle: '#F1F5F9',  // Very soft divider

  // Semantic Status Colors
  success: '#059669',       // Refined emerald
  successLight: '#10B981',
  successSoft: '#ECFDF5',   // Pastel mint fill
  successText: '#065F46',

  warning: '#D97706',       // Warm amber
  warningLight: '#F59E0B',
  warningSoft: '#FFFBEB',   // Pastel warm amber fill
  warningText: '#92400E',

  danger: '#DC2626',        // Clean crimson
  dangerLight: '#EF4444',
  dangerSoft: '#FEF2F2',    // Pastel rose fill
  dangerText: '#991B1B',

  info: '#2563EB',
  infoSoft: '#EFF6FF',

  // Legacy mappings for backwards compatibility
  informative100: '#F0F9FF',
  informative200: '#BAE6FD',
  informative300: '#38BDF8',
  informative400: '#0284C7',
  informative500: '#0369A1',

  success100: '#ECFDF5',
  success200: '#A7F3D0',
  success300: '#34D399',
  success400: '#059669',
  success500: '#047857',

  warning100: '#FFFBEB',
  warning200: '#FDE68A',
  warning300: '#FBBF24',
  warning400: '#D97706',
  warning500: '#B45309',

  error100: '#FEF2F2',
  error200: '#FECACA',
  error300: '#F87171',
  error400: '#DC2626',
  error500: '#B91C1C',

  overlay: 'rgba(15, 23, 42, 0.65)',
};

export type ThemeColors = { [K in keyof typeof lightColors]: string };

export const darkColors: ThemeColors = {
  ...lightColors,
  primary: '#60A5FA',
  primaryDark: '#1D4ED8',
  primaryLight: '#93C5FD',
  primarySoft: '#172554',
  primaryMuted: '#1E3A8A',
  secondary: '#A5B4FC',
  secondaryDark: '#6366F1',
  secondaryLight: '#C7D2FE',
  secondarySoft: '#1E1B4B',
  accent: '#38BDF8',
  accentSoft: '#082F49',
  background: '#0B1220',
  surface: '#111827',
  surfaceSubtle: '#1F2937',
  surfaceHover: '#334155',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  muted: '#94A3B8',
  placeholder: '#64748B',
  border: '#334155',
  borderSubtle: '#1F2937',
  success: '#34D399',
  successLight: '#6EE7B7',
  successSoft: '#052E24',
  successText: '#A7F3D0',
  warning: '#FBBF24',
  warningLight: '#FCD34D',
  warningSoft: '#422006',
  warningText: '#FDE68A',
  danger: '#F87171',
  dangerLight: '#FCA5A5',
  dangerSoft: '#450A0A',
  dangerText: '#FECACA',
  info: '#60A5FA',
  infoSoft: '#172554',
  informative100: '#0C2637',
  informative200: '#164E63',
  informative300: '#22D3EE',
  informative400: '#67E8F9',
  informative500: '#A5F3FC',
  success100: '#052E24',
  success200: '#064E3B',
  success300: '#10B981',
  success400: '#34D399',
  success500: '#6EE7B7',
  warning100: '#422006',
  warning200: '#713F12',
  warning300: '#F59E0B',
  warning400: '#FBBF24',
  warning500: '#FDE68A',
  error100: '#450A0A',
  error200: '#7F1D1D',
  error300: '#EF4444',
  error400: '#F87171',
  error500: '#FCA5A5',
  overlay: 'rgba(0, 0, 0, 0.72)',
};

export const colors = lightColors;
