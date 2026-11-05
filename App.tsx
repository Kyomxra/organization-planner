import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { AuthFlow } from './src/features/auth/AuthFlow';
import { colors } from './src/theme/colors';

/** App entry point. Keep this file small; feature logic belongs under src/features. */
export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <AuthFlow />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
