import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { SplashBrand } from '../components/Brand';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <SplashBrand />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});
