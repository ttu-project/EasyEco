import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import axios from 'axios';

import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';

import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';

import {
  Image,
  View,
  Text,
  StatusBar,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomInput from '../../components/CustomInput';
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
const APP_SCHEME = 'easyeco';
const FACEBOOK_REDIRECT_URI = `fb${FACEBOOK_APP_ID}://authorize`;
const AUTH_REDIRECT_OPTIONS = {
  scheme: APP_SCHEME,
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  console.log('API_BASE_URL=', API_BASE_URL);

  const [phoneNumber, setPhoneNumber] =
    useState('');

  const [password, setPassword] =
    useState('');
  const [isSocialLoginLoading, setIsSocialLoginLoading] =
    useState(false);

  const [
    googleRequest,
    googleResponse,
    googlePromptAsync,
  ] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['profile', 'email'],
    selectAccount: true,
    extraParams: {
      prompt: 'select_account',
    },
  }, AUTH_REDIRECT_OPTIONS);

  const [
    fbRequest,
    fbResponse,
    fbPromptAsync,
  ] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
    redirectUri: FACEBOOK_REDIRECT_URI,
    extraParams: {
      auth_type: 'reauthenticate',
      display: 'touch',
    },
  });
  const isSocialAuthRedirecting =
    isSocialLoginLoading ||
    googleResponse?.type === 'success' ||
    fbResponse?.type === 'success';

  useEffect(() => {
    if (
      googleResponse?.type === 'success'
    ) {
      setIsSocialLoginLoading(true);

      const { authentication } =
        googleResponse;

      const accessToken =
        authentication?.accessToken ||
        googleResponse.params?.access_token;

      if (accessToken) {
        console.log('GOOGLE LOGIN SUCCESS');
        handleGoogleLogin(accessToken).finally(() => {
          router.replace('/(main)');
        });
      } else {
        setIsSocialLoginLoading(false);

        Alert.alert(
          'Google Login Failed',
          'No access token returned from Google'
        );
      }
    }

    if (
      googleResponse?.type === 'error'
    ) {
      setIsSocialLoginLoading(false);

      Alert.alert(
        'Google Login Failed'
      );
    }
  }, [googleResponse]);

  useEffect(() => {
    if (fbResponse?.type === 'success') {
      setIsSocialLoginLoading(true);

      const accessToken =
        fbResponse.authentication?.accessToken ||
        fbResponse.params?.access_token;

      if (accessToken) {
        router.replace('/(main)');
        handleFacebookLogin(accessToken);
      }
    }

    if (fbResponse?.type === 'error') {
      setIsSocialLoginLoading(false);

      Alert.alert(
        'Facebook Login Failed'
      );
    }
  }, [fbResponse]);

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/login`,
        {
          phoneNumber,
          password,
        }
      );

      console.log(response.data);
      
       const token = response.data.token;
      if (token) {
        await signIn(token);
      }

      router.replace('/(main)');
    } catch (error) {
      console.log(
        error.response?.data ||
        error.message
      );

      Alert.alert(
        'Error',
        error.response?.data?.message ||
        'Login failed'
      );
    }
  };

  const handleGoogleLogin = async (
    accessToken
  ) => {
    try {
      const userInfoResponse =
        await axios.get(
          'https://www.googleapis.com/userinfo/v2/me',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

      const googleUser = userInfoResponse.data;

      console.log(
        'GOOGLE USER =>',
        `${googleUser.name} | ${googleUser.email} | ${googleUser.id}`
      );
    } catch (error) {
      console.log(
        'GOOGLE USER INFO ERROR =>',
        JSON.stringify(
          error.response?.data || {
            message: error.message,
            status: error.response?.status,
          },
          null,
          2
        )
      );
    }
  };

  const handleFacebookLogin =
    async (accessToken) => {
      try {
        const userInfoResponse =
          await axios.get(
            `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
          );

        console.log(
          'FACEBOOK USER =>',
          userInfoResponse.data
        );

      } catch (error) {
        console.log(error);
      }
    };

  const handleGooglePress = async () => {
    if (!googleRequest) {
      return;
    }

    setIsSocialLoginLoading(true);
    const result = await googlePromptAsync();

    if (result?.type !== 'success') {
      setIsSocialLoginLoading(false);
    }
  };

  const handleFacebookPress = async () => {
    if (!fbRequest) {
      return;
    }

    setIsSocialLoginLoading(true);
    const result = await fbPromptAsync();

    if (result?.type !== 'success') {
      setIsSocialLoginLoading(false);
    }
  };

  if (isSocialAuthRedirecting) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar
          backgroundColor={HEADER_COLOR}
          barStyle="light-content"
        />
        <ActivityIndicator
          color={HEADER_COLOR}
          size="large"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={HEADER_COLOR}
        barStyle="light-content"
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View
              style={[
                styles.headerWrapper,
                {
                  paddingTop: insets.top,
                  paddingBottom: 40,
                },
              ]}
            >
              <View style={styles.header}>
                <View style={styles.header}>
                  <View style={styles.profileCircle}>
                    <Image
                      source={require('../../assets/Logoact2.png')}
                      style={{
                        width: 50,
                        height: 50,
                        resizeMode: 'contain',
                      }}
                    />
                  </View>
                </View>

                <Text style={styles.title}>
                  Welcome Back
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              <CustomInput
                label="Phone number"
                placeholder="Enter phone"
                value={phoneNumber}
                onChangeText={
                  setPhoneNumber
                }
                keyboardType="phone-pad"
              />

              <CustomInput
                label="Password"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secure
              />

              <TouchableOpacity
  onPress={() => router.push('/forgot-password')}
  style={styles.forgotPasswordContainer}
>
  <Text style={styles.forgotPasswordText}>
    Forgot Password?
  </Text>
</TouchableOpacity>

              <View
                style={{
                  alignItems: 'center',
                  marginTop: 10,
                }}
              >
                <CustomButton
                  title="Login"
                  onPress={handleLogin}
                />
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push(
                    '/(auth)/signup'
                  )
                }
              >
                <Text
                  style={styles.signupText}
                >
                  Don’t have an account?{' '}
                  <Text
                    style={styles.linkText}
                  >
                    Sign up
                  </Text>
                </Text>
              </TouchableOpacity>

              <Text style={styles.or}>
                Or
              </Text>

              <View
                style={styles.socialRow}
              >
                <SocialButton
                  title="Google"
                  icon={require('../../assets/google1.png')}
                  onPress={handleGooglePress}
                />

                <SocialButton
                  title="Facebook"
                  icon={require('../../assets/facebook2.png')}
                  onPress={handleFacebookPress}
                />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  headerWrapper: {
    backgroundColor: HEADER_COLOR,
  },

  header: {
    paddingHorizontal: 20,
  },

  profileCircle: {
  width: 80,
  height: 80,
  borderRadius: 200,
  backgroundColor: '#fff',
  marginTop: 20,
  marginBottom: 10,
  justifyContent: 'center',
  alignItems: 'center',
},

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    paddingBottom: 20,
  },

  form: {
    flex: 1,
    marginTop: -20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 20,
  },

  signupText: {
    textAlign: 'center',
    marginTop: 15,
    color: '#555',
  },

  linkText: {
    color: '#3B3BFF',
    fontWeight: 'bold',
  },
  or: {
    textAlign: 'center',
    marginVertical: 12,
    color: '#aaa',
  },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 5,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  forgotPasswordContainer: {
  alignSelf: 'flex-end',  
  marginTop: -4,
  marginBottom: 4,
   marginRight: 32,
},
forgotPasswordText: {
  color: '#3B3BFF',  // Match your app's accent color
  fontSize: 11,
  fontWeight: '500',
},
});
