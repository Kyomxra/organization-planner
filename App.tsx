import React from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { RootFlow } from './src/navigation/RootFlow';
import { colors } from './src/theme/colors';

const ANDROID_STATUS_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 6 : 0;

/** App entry point. Configured with safe-area handling and translucent status bar support. */
export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.root}>
        <RootFlow />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
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
