import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function CustomInput({
  label,
  placeholder,
  secure,
  value,
 onChangeText,
  keyboardType,
  ...rest
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        placeholder={placeholder}
        secureTextEntry={secure}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.input}
        {...rest}
      />
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
    width: '90%',
    height: 50,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#929090',
    paddingHorizontal: 15,
    alignSelf: 'center',
  },
});