import { Tabs } from 'expo-router';
import { TabBar } from '../../components/TabBar'; 
import { useAuth } from '../context/AuthContext';
import { Stack, Redirect } from 'expo-router';

export default function TabLayout() {
  const { isRestoring, isAuthenticated } = useAuth();

  if (isRestoring) {
    // show a splash / loading UI while token restores
    return null;
  }

  if (!isAuthenticated) {
    // protect main routes
    return <Redirect href="/(auth)/welcome" />;
  }
  return (
    
      <Tabs
      
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false, 
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calculate" />
      <Tabs.Screen name="robot" options={{tabBarStyle:{display:'none'}}} />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="profile" />
    </Tabs>
    
  );
}