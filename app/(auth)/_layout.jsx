import { StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function AuthLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#ffffff" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
