// app/_layout.jsx
import { Slot, Stack, Redirect } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UsageProvider } from './Usage/UsageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import WelcomeScreen from './(auth)/welcome';

function RootLayoutNav() {
  const { token, isRestoring } = useAuth();

  // Show loading while checking stored session
  if (isRestoring) {
    return <WelcomeScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Redirect to welcome if not logged in */}
      {!token && <Redirect href="/(auth)/welcome" />}
      
      <Stack.Screen name="(main)" />
     
      <Stack.Screen name="UsageDetail" options={{ presentation: 'transparentModal', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UsageProvider>
          <RootLayoutNav />
        </UsageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}