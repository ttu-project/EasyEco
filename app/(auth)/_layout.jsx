import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Stack } from 'expo-router'; 
import { StatusBar } from "react-native";
import { SafeAreaProvider , SafeAreaView } from "react-native-safe-area-context";

export default function AuthLayout() {
  return (
    <SafeAreaProvider>     
      <StatusBar style="light-content" backgroundColor="#ffffff" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}

export  function RootLayout() {
  
  useEffect(() => {
    const setupNotification = async () => {
      try {

        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Notification permission granted.');
          await messaging().subscribeToTopic('all_users');
          console.log('Subscribed to topic: all_users');
        }
      } catch (error) {
        console.log('Notification setup error:', error);
      }
    };

    setupNotification();
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground Notification:', remoteMessage);
    });

    return unsubscribe;
  }, []);

  return <Stack />;
}