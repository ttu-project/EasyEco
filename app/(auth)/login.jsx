import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import axios from 'axios';

import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';

import * as WebBrowser from 'expo-web-browser';

import {
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

  const [phoneNumber, setPhoneNumber] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    googleRequest,
    googleResponse,
    googlePromptAsync,
  ] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    selectAccount: true,
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

  useEffect(() => {
    console.log(
      'GOOGLE RESPONSE =>',
      googleResponse
    );

    if (
      googleResponse?.type === 'success'
    ) {
      const { authentication } =
        googleResponse;

      const accessToken =
        authentication?.accessToken ||
        googleResponse.params?.access_token;

      console.log(
        'GOOGLE ACCESS TOKEN =>',
        accessToken
      );

      if (accessToken) {
        router.replace('/(main)');
        handleGoogleLogin(accessToken);
      }
    }

    if (
      googleResponse?.type === 'error'
    ) {
      Alert.alert(
        'Google Login Failed'
      );
    }
  }, [googleResponse]);

  useEffect(() => {
    console.log(
      'FACEBOOK RESPONSE =>',
      fbResponse
    );

    if (fbResponse?.type === 'success') {
      const accessToken =
        fbResponse.authentication?.accessToken ||
        fbResponse.params?.access_token;

      console.log(
        'FACEBOOK ACCESS TOKEN =>',
        accessToken
      );

      if (accessToken) {
        router.replace('/(main)');
        handleFacebookLogin(accessToken);
      }
    }

    if (fbResponse?.type === 'error') {
      Alert.alert(
        'Facebook Login Failed'
      );
    }
  }, [fbResponse]);

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/users/login`,
        {
          phoneNumber,
          password,
        }
      );

      console.log(response.data);

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

      console.log(
        'GOOGLE USER =>',
        userInfoResponse.data
      );
    } catch (error) {
      console.log(error);
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
                <View
                  style={styles.profileCircle}
                />

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
                  icon={require('../../assets/google.png')}
                  onPress={() => {
                    console.log(
                      'GOOGLE BUTTON PRESSED'
                    );

                    if (googleRequest) {
                      googlePromptAsync();
                    }
                  }}
                />

                <SocialButton
                  title="Facebook"
                  icon={require('../../assets/facebook.png')}
                  onPress={() => {
                    console.log(
                      'FACEBOOK BUTTON PRESSED'
                    );

                    if (fbRequest) {
                      fbPromptAsync();
                    }
                  }}
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    marginBottom: 15,
    marginTop: 50,
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
});
