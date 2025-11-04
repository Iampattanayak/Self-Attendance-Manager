import { Stack } from 'expo-router';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DataProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
        </Stack>
      </DataProvider>
    </ThemeProvider>
  );
}
