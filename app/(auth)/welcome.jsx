import React from 'react';
import { router } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Image,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  return (

    <View style={[styles.mainWrapper, {
      backgroundColor: '#ffffff',
    }]
    }>
      <StatusBar barStyle="light-content" backgroundColor="#1658C3" />


      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.hero}>
          <View style={styles.circle}>
            <Image
              source={require('../../assets/Logoact2.png')}
              style={styles.image}
            />
          </View>

          <Text style={styles.title}>
            <Text style={styles.easyText}>EASY </Text>
            <Text style={styles.ecoText}>Eco</Text>
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")} style={styles.button}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>

          <View style={styles.footIndicator}>
            <Text style={styles.footerColor}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.Login}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

    </View>


  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1
  },
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },

  hero: { alignItems: 'center', flex: 1, justifyContent: 'center' },

  circle: {
    backgroundColor: '#001EFF',
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    hidden: 'overflow',
  },

  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  title: {
    marginTop: -12,
    fontSize: 32,
    fontWeight: 'bold',
  },

  line: {
    width: 185,
    height: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 14,
    opacity: 0.95,
  },

  button: {
    width: '100%',
    maxWidth: 360,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1658C3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
  },

  footerColor: {
    color: "#1658C3",
  },

  actions: { width: '100%', alignItems: 'center', gap: 20 },
  footIndicator: {
    flexDirection: 'row',
    color: '#1658C3',
    justifyContent: 'center',
    gap: 5
  },

  Login: {
    color: '#93959d'
  },

  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  easyText: {
    color: '#1658C3',
    fontWeight: 'bold',
  },

  ecoText: {
    color: '#22C55E',
    fontWeight: 'bold',
  },
});
