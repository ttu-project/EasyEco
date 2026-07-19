import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { API_BASE_URL } from '../../config/api';

export default function Forgot() {
  const [screenStep, setScreenStep] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [confirmation, setConfirmation] = useState(null);
  const [resetToken, setResetToken] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const otpInputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (screenStep === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [screenStep, timer]);

  const normalisePhoneNumber = (phoneNumber) => {
    const value = phoneNumber.replace(/[\s-]/g, '');
    if (value.startsWith('+959')) return value;
    if (value.startsWith('959')) return `+${value}`;
    if (value.startsWith('09')) return `+959${value.slice(2)}`;
    return value;
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (phoneNumber.length > 3) {
      return `${phoneNumber.slice(0, 4)}******${phoneNumber.slice(-3)}`;
    }
    return phoneNumber;
  };

  const sendVerificationCode = async () => {
    const rawPhoneNumber = inputValue.trim();
    if (!rawPhoneNumber) {
      Alert.alert('Phone number required', 'Please enter the phone number registered with EasyEco.');
      return;
    }

    if (rawPhoneNumber.includes('@')) {
      Alert.alert('Phone verification only', 'Email password reset is not available yet. Please enter your registered phone number.');
      return;
    }

    const phoneNumber = normalisePhoneNumber(rawPhoneNumber);
    if (!/^\+\d{8,15}$/.test(phoneNumber)) {
      Alert.alert('Invalid phone number', 'Use international format, for example +959123456789.');
      return;
    }

    try {
      setIsSendingCode(true);
      const result = await signInWithPhoneNumber(getAuth(), phoneNumber);
      setInputValue(phoneNumber);
      setConfirmation(result);
      setOtp(['', '', '', '', '', '']);
      setTimer(60);
      setScreenStep(2);
    } catch (error) {
      Alert.alert('Could not send code', error.message || 'Please try again.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async () => {
    const code = otp.join('');
    if (code.length !== 6 || !confirmation) {
      Alert.alert('Enter the code', 'Please enter the 6-digit verification code.');
      return;
    }

    try {
      setIsVerifyingCode(true);
      const credential = await confirmation.confirm(code);
      const idToken = await credential.user.getIdToken();
      const response = await axios.post(`${API_BASE_URL}/users/verify-reset-phone`, { idToken });
      setResetToken(response.data.resetToken);
      setScreenStep(3);
    } catch (error) {
      Alert.alert(
        'Verification failed',
        error.response?.data?.message || error.message || 'The code is invalid or expired.'
      );
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const resendCode = async () => {
    if (timer > 0 || isSendingCode) return;
    await sendVerificationCode();
  };

  const handleOtpChange = (value, index) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    if (!digits) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    digits.split('').forEach((digit, digitIndex) => {
      if (index + digitIndex < newOtp.length) {
        newOtp[index + digitIndex] = digit;
      }
    });
    setOtp(newOtp);

    const nextIndex = Math.min(index + digits.length, newOtp.length - 1);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleOtpKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password must be at least 6 characters');
      return;
    }

    if (!resetToken) {
      Alert.alert('Verification expired', 'Please verify your phone number again.');
      setScreenStep(1);
      return;
    }

    try {
      setIsResettingPassword(true);
      await axios.post(`${API_BASE_URL}/users/reset-password`, {
        resetToken,
        newPassword,
      });
      setScreenStep(4);
    } catch (error) {
      Alert.alert('Could not reset password', error.response?.data?.message || error.message);
    } finally {
      setIsResettingPassword(false);
    }
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
              Enter your registered phone number and we'll send you a verification code.
            </Text>

            <Text style={styles.inputLabel}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number, e.g. +959123456789"
              placeholderTextColor="#94A3B8"
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={sendVerificationCode}
              disabled={isSendingCode}
            >
              <Text style={styles.buttonText}>{isSendingCode ? 'Sending code...' : 'Continue'}</Text>
            </TouchableOpacity>
          </View>
        )}

       
        {screenStep === 2 && (
          <View style={styles.content}>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{' '}
              <Text style={styles.highlightText}>
                {formatPhoneNumber(inputValue)}
              </Text>
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(input) => { otpInputRefs.current[index] = input; }}
                  style={styles.otpBox}
                  maxLength={6}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(event) => handleOtpKeyPress(event, index)}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                />
              ))}
            </View>

            <TouchableOpacity
              disabled={timer > 0}
              onPress={resendCode}
            >
              <Text style={[styles.resendText, timer > 0 && styles.resendDisabled]}>
                {timer > 0
                  ? `Resend code in 00:${timer < 10 ? '0' + timer : timer}`
                  : 'Resend code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={verifyCode}
              disabled={isVerifyingCode}
            >
              <Text style={styles.buttonText}>{isVerifyingCode ? 'Verifying...' : 'Verify Code'}</Text>
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
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter new password"
                placeholderTextColor="#94A3B8"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!isNewPasswordVisible}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setIsNewPasswordVisible((visible) => !visible)} accessibilityRole="button" accessibilityLabel={isNewPasswordVisible ? 'Hide password' : 'Show password'}>
                <Ionicons name={isNewPasswordVisible ? 'eye-outline' : 'eye-off-outline'} size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirm password</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm password"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!isConfirmPasswordVisible}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setIsConfirmPasswordVisible((visible) => !visible)} accessibilityRole="button" accessibilityLabel={isConfirmPasswordVisible ? 'Hide password' : 'Show password'}>
                <Ionicons name={isConfirmPasswordVisible ? 'eye-outline' : 'eye-off-outline'} size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleResetPassword}
              disabled={isResettingPassword}
            >
              <Text style={styles.buttonText}>{isResettingPassword ? 'Resetting...' : 'Reset password'}</Text>
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
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    height: 52,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpBox: {
    width: '15%',
    aspectRatio: 1,
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
