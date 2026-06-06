import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';

export default function AuthorizeRedirectScreen() {
  useEffect(() => {
    router.replace('/(main)');
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
      }}
    >
      <ActivityIndicator color="#3B3BFF" />
    </View>
  );
}
