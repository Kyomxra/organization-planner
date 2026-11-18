import React, { useMemo } from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { RootFlow } from './src/navigation/RootFlow';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import type { ThemeColors } from './src/theme/ThemeContext';

const ANDROID_STATUS_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 6 : 0;

/** App entry point. Configured with safe-area handling and translucent status bar support. */
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { colors, resolvedMode } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <StatusBar barStyle={resolvedMode === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.root}>
        <RootFlow />
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: ANDROID_STATUS_OFFSET,
  },
});
