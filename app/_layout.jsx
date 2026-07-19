import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { Stack } from 'expo-router';
import messaging from '@react-native-firebase/messaging';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UsageProvider } from './Usage/UsageContext';
import { LanguageProvider } from './context/LanguageContext';
import { presentRemoteNotification } from './utils/notificationPresenter';

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  await presentRemoteNotification(remoteMessage);
});

export default function RootLayout() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Android 13+ requires this runtime permission before notifications can appear.
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const permissionResult = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );

          if (permissionResult !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Notification permission denied.');
            return;
          }
        }

        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        // Firebase permission status is needed for iOS. Android is handled above.
        if (Platform.OS === 'ios' && !enabled) {
          console.log('Notification permission denied.');
          return;
        }

        const token = await messaging().getToken();
        console.log('Device FCM Token:', token);

        await messaging().unsubscribeFromTopic('all_users');
        console.log('Unsubscribed from topic: all_users');
      } catch (error) {
        console.log('Notification setup error:', error);
      }
    };

    setupNotifications();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground Notification Received:', remoteMessage);
      await presentRemoteNotification(remoteMessage);
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <UsageProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(main)" options={{ headerShown: false }} />
            <Stack.Screen name="UsageDetail" options={{ presentation: 'transparentModal', headerShown: false }} />
          </Stack>
        </UsageProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
