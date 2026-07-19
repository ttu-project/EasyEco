import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../locales/translations';

const LANGUAGE_STORAGE_KEY = '@easyeco_language';
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage === 'en' || savedLanguage === 'my') {
          setLanguage(savedLanguage);
        }
      } finally {
        setIsLanguageReady(true);
      }
    };

    loadLanguage();
  }, []);

  const changeLanguage = async (nextLanguage) => {
    if (nextLanguage !== 'en' && nextLanguage !== 'my') return;
    setLanguage(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  };

  const value = useMemo(() => ({
    language,
    isLanguageReady,
    changeLanguage,
    t: (key) => translations[language]?.[key] ?? translations.en[key] ?? key,
  }), [language, isLanguageReady]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider.');
  }
  return context;
}
