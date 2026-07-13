import React, { useState, useEffect } from 'react'; 
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Forgot({ onBack }) {
  const [screenStep, setScreenStep] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);

  const isEmail = inputValue.includes('@');

  
  useEffect(() => {
    let interval = null;
    if (screenStep === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTime) => prevTime - 1);
      }, 1000);
    } else {
      clearInterval(interval);
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

  return (
    <SafeAreaView style={styles.container}>
       <StatusBar style="dark" backgroundColor="#ffffff" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.inner}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (screenStep > 1) {
              setScreenStep(1);
              setTimer(60);
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

        {screenStep === 1 ? (
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
        ) : (
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

            <Text style={styles.resendText}>
              {timer > 0 ? "Resend code in 00:" + (timer < 10 ? "0" + timer : timer) : "Resend code"}
            </Text>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => alert('OTP Code Verified!')}
            >
              <Text style={styles.
              buttonText}>Verify Code</Text>
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
    marginTop:26
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 22,
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
    marginBottom: 40,
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
    color: '#333333',
    textAlign: 'center',
    marginBottom: 40,
  },
});