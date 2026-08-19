import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import axios from 'axios';
import { saveSession } from '../utils/authStorage';
import { showAuthSuccessNotification } from '../utils/authNotification';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import {
  Image,
  View,
  Text,
  StatusBar,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import CustomButton from '../../components/CustomButton';
import SocialButton from '../../components/SocialButton';
import {
  FACEBOOK_APP_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from '../../config/auth';
import { API_BASE_URL } from '../../config/api';

WebBrowser.maybeCompleteAuthSession();

const HEADER_COLOR = '#3B3BFF';
const GOOGLE_REDIRECT_URI = 'com.anonymous.easyeco:/oauthredirect';
const FACEBOOK_REDIRECT_URI = `fb${FACEBOOK_APP_ID}://authorize`;
const AUTH_REDIRECT_OPTIONS = {
  scheme: 'com.anonymous.easyeco',
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_HEIGHT < 700;

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();

  const [isChecked, setIsChecked] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest(
    {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      redirectUri: GOOGLE_REDIRECT_URI,
      scopes: ['profile', 'email'],
      selectAccount: true,
    },
    AUTH_REDIRECT_OPTIONS
  );

  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
    redirectUri: FACEBOOK_REDIRECT_URI,
    extraParams: {
      auth_type: 'reauthenticate',
      display: 'touch',
    },
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      const accessToken =
        authentication?.accessToken || googleResponse.params?.access_token;
      if (accessToken) {
        handleGoogleLogin(accessToken);
      }
    }
    if (googleResponse?.type === 'error') {
      Alert.alert('Google Login Failed', JSON.stringify(googleResponse.error));
    }
  }, [googleResponse]);

  useEffect(() => {
    if (fbResponse?.type === 'success') {
      const { authentication } = fbResponse;
      const accessToken =
        authentication?.accessToken || fbResponse.params?.access_token;
      if (accessToken) {
        handleFacebookLogin(accessToken);
      }
    }
    if (fbResponse?.type === 'error') {
      Alert.alert('Facebook Login Failed', JSON.stringify(fbResponse.error));
    }
  }, [fbResponse]);

  const handleGoogleLogin = async (accessToken) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/google-login`, {
        accessToken,
      });
      await saveSession({ ...response.data, provider: 'google' });
      await showAuthSuccessNotification(true);
      router.replace('/(main)');
    } catch (error) {
      Alert.alert(
        'Google Login Failed',
        error.response?.data?.message || error.message || 'Please try again.'
      );
    }
  };

  const handleFacebookLogin = async (accessToken) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/facebook-login`, {
        accessToken,
      });
      await saveSession({ ...response.data, provider: 'facebook' });
      await showAuthSuccessNotification(true);
      router.replace('/(main)');
    } catch (error) {
      Alert.alert('Facebook Login Failed');
    }
  };

  const handleSubmit = async () => {
    try {
      if (isSubmitting) return;

      if (!name.trim()) {
        return Alert.alert('Error', 'Please enter your name');
      }

      if (!email.trim()) {
        return Alert.alert('Error', 'Please enter your Gmail / email');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return Alert.alert('Error', 'Please enter a valid email address');
      }

      if (password.length < 6) {
        return Alert.alert('Error', 'Password must be at least 6 characters');
      }

      if (confirmPassword !== password) {
        return Alert.alert('Error', 'Passwords do not match');
      }

      if (!isChecked) {
        return Alert.alert('Error', 'Please agree to Terms & Conditions');
      }

      setIsSubmitting(true);

      const response = await axios.post(
        `${API_BASE_URL}/users/register`,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
        { timeout: 10000 }
      );

      await saveSession(response.data);
      await showAuthSuccessNotification(true);
      router.replace('/(main)');
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Signup failed'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={HEADER_COLOR} barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.screen}>
          {/* HEADER */}
          <View
            style={[
              styles.blueHeaderWrapper,
              { paddingTop: Math.max(insets.top, 10) + 4 },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.profileCircle}>
                <Image
                  source={require('../../assets/Logoact2.png')}
                  style={{
                    width: isSmallScreen ? 28 : 34,
                    height: isSmallScreen ? 28 : 34,
                    resizeMode: 'contain',
                  }}
                />
              </View>
              <Text style={styles.title}>Create Your Account</Text>
            </View>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <View style={styles.fieldsGroup}>
              {/* Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              {/* Gmail */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Gmail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your Gmail / email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <Ionicons
                      name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm password"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!isConfirmPasswordVisible}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() =>
                      setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                    }
                  >
                    <Ionicons
                      name={
                        isConfirmPasswordVisible
                          ? 'eye-outline'
                          : 'eye-off-outline'
                      }
                      size={20}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* TERMS CHECKBOX */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[styles.checkbox, isChecked && styles.checkboxChecked]}
                onPress={() => setIsChecked(!isChecked)}
                activeOpacity={0.8}
              >
                {isChecked && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <Text style={styles.label}>
                I agree to the{' '}
                <Text style={styles.linkText}>Terms & Conditions</Text>
              </Text>
            </View>

            {/* BOTTOM BUTTONS & SOCIAL */}
            <View
              style={[
                styles.bottomFixed,
                { paddingBottom: Math.max(insets.bottom, 10) },
              ]}
            >
              <View style={{ alignItems: 'center' }}>
                <CustomButton
                  title={isSubmitting ? 'Signing Up...' : 'Sign Up'}
                  onPress={handleSubmit}
                  loading={isSubmitting}
                />
              </View>

              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                activeOpacity={0.7}
              >
                <Text style={styles.loginText}>
                  Already have an account?{' '}
                  <Text style={{ color: HEADER_COLOR, fontWeight: 'bold' }}>
                    Sign in
                  </Text>
                </Text>
              </TouchableOpacity>

              <Text style={styles.or}>Or</Text>

              {/* SOCIAL LOGIN */}
              <View style={styles.socialRow}>
                <SocialButton
                  title="Google"
                  icon={require('../../assets/google1.png')}
                  onPress={() => {
                    if (googleRequest) {
                      googlePromptAsync();
                    }
                  }}
                />
                <SocialButton
                  title="Facebook"
                  icon={require('../../assets/facebook2.png')}
                  onPress={() => {
                    if (fbRequest) {
                      fbPromptAsync();
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  blueHeaderWrapper: {
    backgroundColor: HEADER_COLOR,
    paddingBottom: isSmallScreen ? 14 : 20,
  },
  header: {
    paddingHorizontal: 22,
  },
  profileCircle: {
    width: isSmallScreen ? 42 : 48,
    height: isSmallScreen ? 42 : 48,
    borderRadius: 200,
    backgroundColor: '#fff',
    marginTop: 2,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: isSmallScreen ? 17 : 19,
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: isSmallScreen ? 10 : 12,
    marginTop: -16,
    justifyContent: 'space-between',
  },
  fieldsGroup: {
    justifyContent: 'flex-start',
  },
  fieldContainer: {
    marginBottom: isSmallScreen ? 5 : 7,
    width: '100%',
  },
  fieldLabel: {
    marginBottom: 2,
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
  },
  input: {
    width: '100%',
    height: isSmallScreen ? 38 : 43,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#CCC',
    paddingHorizontal: 12,
    fontSize: isSmallScreen ? 13 : 14,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: isSmallScreen ? 2 : 4,
    marginLeft: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: HEADER_COLOR,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: HEADER_COLOR,
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  label: {
    color: '#666',
    fontSize: isSmallScreen ? 11 : 12,
  },
  linkText: {
    color: HEADER_COLOR,
    fontWeight: 'bold',
  },
  bottomFixed: {
    paddingHorizontal: 0,
    backgroundColor: '#fff',
  },
  loginText: {
    textAlign: 'center',
    marginTop: isSmallScreen ? 4 : 6,
    fontSize: isSmallScreen ? 12 : 13,
    color: '#333',
  },
  or: {
    textAlign: 'center',
    marginVertical: isSmallScreen ? 2 : 4,
    color: '#aaa',
    fontSize: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 2,
  },
});
