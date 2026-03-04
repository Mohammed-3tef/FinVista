import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {strings, Language } from '../constants/strings';

interface LanguageContextType {
  language: Language;
  t: typeof strings.en;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
}
const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>('en');
  useEffect(() => {
    AsyncStorage.getItem('language').then(val => {
      if (val === 'en' || val === 'ar') setLang(val);
    });
  }, []);
  const setLanguage = async (lang: Language) => {
    setLang(lang);
    await AsyncStorage.setItem('language', lang);
  };
  return (
    <LanguageContext.Provider value={{ language, t: strings[language], isRTL: language === 'ar', setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
export const useLanguage = () => useContext(LanguageContext);
