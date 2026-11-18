import { Platform, TextStyle } from 'react-native';

/**
 * Modern Design System Typography
 * Uses platform-optimized native fonts (San Francisco on iOS, Roboto/sans-serif on Android)
 * with refined letter spacing, lineHeight, and weight scale.
 */
export const typography: { [key: string]: TextStyle } = {
  // Large Headings (Page titles, major welcomes)
  h1: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 30,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 26,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },
  h3: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 22,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },
  h4: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },

  // Body Text
  bodyLarge: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 22,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  bodyMedium: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  bodySemiBold: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },

  // Captions & Subtitles
  caption: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 15,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  captionBold: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 15,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },

  // Badges & Micro-tags
  badge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },

  // Button text
  button: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },
};
