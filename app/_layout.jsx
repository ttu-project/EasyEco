// app/_layout.jsx
import { Slot } from 'expo-router';
import { UsageProvider } from './Usage/UsageContext'; // Path သေချာစစ်ပါ
import { Children } from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <UsageProvider>
    <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="UsageDetail" options={{ presentation:'transparentModal',headerShown: false }} />
      
    </Stack>
    </UsageProvider>
  );
}