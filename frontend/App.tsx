import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { I18nProvider } from './src/i18n';
import { ToastProvider } from './src/components/Toast';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <I18nProvider>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
