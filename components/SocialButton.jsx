import React from 'react';
import { Pressable, Text, StyleSheet, Image } from 'react-native';

export default function SocialButton({ title, icon, onPress }) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Image source={icon} style={styles.icon} />
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 100,
    paddingVertical: 12,   
    paddingHorizontal: 20,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  icon: { width: 24, height: 24, marginRight: 10 },
  text: { fontWeight: '500' },
});