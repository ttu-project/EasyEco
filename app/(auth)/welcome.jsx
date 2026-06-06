import React from 'react';
import { router } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
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

    <View style= {[ styles.mainWrapper,{
        backgroundColor: '#3B3BFF',
       }]
      }>
      <StatusBar barStyle="light-content" backgroundColor="#3B3BFF"  />
    

    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      
      <View style={styles.circle}>
        <Ionicons name="person-outline" size={58} color="#D9D9D9" />
      </View>

      <Text style={styles.title}>Lorem ipsum</Text>

      <View style={styles.line} />

      <TouchableOpacity onPress={()=>router.push("/(auth)/signup")} style={styles.button}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

    <View style={styles.footIndicator}>
      <Text style={styles.footerColor}>
      Already have an account?
      </Text>
      <TouchableOpacity onPress={()=>router.push("/(auth)/login")}>
        <Text style={styles.Login}>Log in</Text>
      </TouchableOpacity>
    </View>

      <View style={styles.homeIndicator} />
      </View>
    
    </View> 
 
   
  );
}

const styles = StyleSheet.create({
 mainWrapper:{
  flex:1
 },
  container: {
    flex: 1,
    width:'100%',
    //backgroundColor: '#001EFF',
    alignItems: 'center',
  },

  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
    marginTop: 170,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    marginTop: 18,
    fontSize: 21,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  line: {
    width: 185,
    height: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 14,
    opacity: 0.95,
  },

  button: {
    position: 'absolute',
    bottom: 110,
    width: 280,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 18,
    color: '#202020',
    fontWeight: '500',
  },

  footerColor:{
    color:"#fff",
  },

  footerText: {
    position: 'absolute',
    bottom: 74,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
  },

  

  homeIndicator: {
    position: 'absolute',
    bottom: 18,
    width: 110,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  footIndicator:{
    position:'absolute',
    flexDirection:'row',
    color:'#001EFF',
     bottom: 74,
    justifyContent:'center',
    gap: 5
  },

  Login:{
    color:'#93959d'
  }
});