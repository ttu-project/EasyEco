import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const TOKEN_KEY = 'userToken';
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    // restore token on mount
    const restore = async () => {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (saved) {
          setToken(saved);
          axios.defaults.headers.common.Authorization = `Bearer ${saved}`;
        }
      } catch (e) {
        console.warn('Failed to restore token', e);
      } finally {
        setIsRestoring(false);
      }
    };
    restore();
  }, []);

  const signIn = async (newToken) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken, {
        // availableOptions for SecureStore can be added if needed
      });
      setToken(newToken);
      axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    } catch (e) {
      console.warn('Failed to save token', e);
      throw e;
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('Failed to delete token', e);
    } finally {
      setToken(null);
      delete axios.defaults.headers.common.Authorization;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isRestoring,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}