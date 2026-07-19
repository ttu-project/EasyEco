import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';

export default function CustomInput({
  label,
  placeholder,
  secure,
  value,
 onChangeText,
  keyboardType,
  ...rest
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          placeholder={placeholder}
          secureTextEntry={secure && !isPasswordVisible}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          style={[styles.input, secure && styles.passwordInput]}
          maxFontSizeMultiplier={1.2}
          {...rest}
        />
        {secure && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            <Ionicons name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'} size={22} color="#555" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 9,
    width: '100%',
    paddingHorizontal: 20,
  },

  label: {
    marginBottom: 5,
    fontSize: 14,
    marginLeft: '5%',
  },

  input: {
    width: '100%',
    height: 50,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#929090',
    paddingHorizontal: 15,
    alignSelf: 'center',
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    height: 50,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
