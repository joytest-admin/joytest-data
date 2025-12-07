'use client';

/**
 * Translation context for managing language state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, Translations, getTranslations, getDefaultLanguage, setLanguage } from '@/src/lib/translations';

interface TranslationContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: Translations;
  showLanguageNotification: boolean;
  setShowLanguageNotification: (show: boolean) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('cs-CZ');
  const [showLanguageNotification, setShowLanguageNotification] = useState(false);

  // Initialize language from localStorage or browser
  useEffect(() => {
    const defaultLang = getDefaultLanguage();
    setLanguageState(defaultLang);
  }, []);

  const handleSetLanguage = (lang: LanguageCode) => {
    const previousLang = language;
    setLanguageState(lang);
    setLanguage(lang);
    // Store language in cookie for server-side access
    if (typeof document !== 'undefined') {
      document.cookie = `language=${lang}; path=/; max-age=31536000`; // 1 year
      // Show notification if language actually changed
      if (previousLang !== lang) {
        setShowLanguageNotification(true);
      }
    }
  };

  const t = getTranslations(language);

  return (
    <TranslationContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
        showLanguageNotification,
        setShowLanguageNotification,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

