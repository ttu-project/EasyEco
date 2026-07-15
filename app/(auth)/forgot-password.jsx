import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Forgot() {
  const [screenStep, setScreenStep] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isEmail = inputValue.includes('@');

  useEffect(() => {
    let interval = null;
    if (screenStep === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [screenStep, timer]);

  const formatPhoneNumber = (num) => {
    const cleaned = num.trim();
    if (cleaned.length > 3) {
      const lastThree = cleaned.slice(-3);
      return "+95******" + lastThree;
    }
    return "+95******123";
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  };

  const handleResetPassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }
    
    setScreenStep(4);
  };

 
  const CheckmarkIcon = () => (
    <Svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <Circle cx="32" cy="32" r="30" stroke="#1D5CDE" strokeWidth="2" />
      <Path
        d="M20 32L28 40L44 24"
        stroke="#1D5CDE"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        
        {screenStep !== 4 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (screenStep > 1) {
                setScreenStep(screenStep - 1);
                if (screenStep === 2) setTimer(60);
              } else {
                router.back();
              }
            }}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19L8 12L15 5"
                stroke="#0D2A4A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        )}

        
        {screenStep === 1 && (
          <View style={styles.content}>
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.subtitle}>
              Enter your email or phone number and we'll send you a verification code.
            </Text>

            <Text style={styles.inputLabel}>Email or phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Email or phone number"
              placeholderTextColor="#94A3B8"
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                if (inputValue.trim() !== '') {
                  setScreenStep(2);
                }
              }}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

       
        {screenStep === 2 && (
          <View style={styles.content}>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              We've sent a 4-digit code to{' '}
              <Text style={styles.highlightText}>
                {isEmail ? inputValue : formatPhoneNumber(inputValue)}
              </Text>
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={styles.otpBox}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                />
              ))}
            </View>

            <TouchableOpacity
              disabled={timer > 0}
              onPress={() => setTimer(60)}
            >
              <Text style={[styles.resendText, timer > 0 && styles.resendDisabled]}>
                {timer > 0
                  ? `Resend code in 00:${timer < 10 ? '0' + timer : timer}`
                  : 'Resend code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => setScreenStep(3)}
            >
              <Text style={styles.buttonText}>Verify Code</Text>
            </TouchableOpacity>
          </View>
        )}

        
        {screenStep === 3 && (
          <ScrollView 
    contentContainerStyle={styles.scrollContent}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
  >
          <View style={styles.content}>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>
              Set the new password for your account so you can login and access all the features.
            </Text>

            <Text style={styles.inputLabel}>Enter new password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#94A3B8"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleResetPassword}
            >
              <Text style={styles.buttonText}>Reset password</Text>
            </TouchableOpacity>
          </View>
           </ScrollView>
        )}

      
        {screenStep === 4 && (
          <View style={[styles.content, styles.successContent]}>
            <CheckmarkIcon />

            <Text style={[styles.title, styles.successTitle]}>
              Password Reset Successful
            </Text>
            <Text style={[styles.subtitle, styles.successSubtitle]}>
              Your password has been updated successfully. You can now sign in with your new password.
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flex: 1,
  },
  backButton: {
    padding: 20,
    alignSelf: 'flex-start',
    marginTop: 26,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  successContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  successTitle: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: 40,
  },
  successSubtitle: {
    textAlign: 'center',
    marginBottom: 40,
  },
  highlightText: {
    color: '#64748B',
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#1D5CDE',
    width: '100%',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  otpBox: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  resendText: {
    fontSize: 16,
    color: '#1D5CDE',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  resendDisabled: {
    color: '#94A3B8',
  },
});