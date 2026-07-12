import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store'; // ← ADD THIS IMPORT

const AuthContext = createContext({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }
  return value;
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ← ADD THIS useEffect to load saved session on app start
  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        setSession(token);
      } catch (e) {
        console.log('Error loading session:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        signIn: async (token) => {
          await SecureStore.setItemAsync('token', token);
          setSession(token);
        },
        signOut: async () => {
          await SecureStore.deleteItemAsync('token');
          setSession(null);
        },
      }}>
      {children}
    </AuthContext.Provider>
  );
}