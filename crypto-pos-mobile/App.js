// Polyfill must be imported first
import 'text-encoding-polyfill';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/config';
/**
 * Main App Component
 * Entry point for the React Native application
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

