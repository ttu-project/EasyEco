import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider , SafeAreaView } from "react-native-safe-area-context";

export default function AuthLayout() {
  return (
    <SafeAreaProvider>
       
          <StatusBar style="light-content" backgroundColor="#3B3BFF" />
          <Stack screenOptions={{ headerShown: false }} />
       
     
    </SafeAreaProvider>
  );
}