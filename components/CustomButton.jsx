import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';

export default function CustomButton({
  title,
  onPress,
  disabled = false,
  loading = false,
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        (pressed || loading) && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      hitSlop={8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '80%',
    height: 50,
    borderRadius: 33,
    opacity: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3B3BFF",
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  text: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
