import { ActivityIndicator, View } from 'react-native';

export default function AuthorizeRedirectScreen() {
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
