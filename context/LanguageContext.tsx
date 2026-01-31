
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { LanguageContextType, Currency } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';

type Language = 'en' | 'fr';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useLocalStorage<Language>('prompt-finance-language', 'fr');
  const [currency, setCurrency] = useLocalStorage<Currency>('prompt-finance-currency', 'EUR');
  const [translations] = useState<{ [key in Language]: any }>({
    en: enTranslations,
    fr: frTranslations
  });

  const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
    const langTranslations = translations[language];
    if (!langTranslations) {
      return key; // Return key if translations for the language are not loaded yet
    }

    const keys = key.split('.');
    let result: any = langTranslations;

    for (const k of keys) {
      if (typeof result !== 'object' || result === null || result[k] === undefined) {
        return key; // Key path not found, return the key itself
      }
      result = result[k];
    }

    let strResult = String(result);

    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        strResult = strResult.replace(`{${rKey}}`, String(replacements[rKey]));
      });
    }

    return strResult;
  }, [language, translations]);

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  const value: LanguageContextType = { language, setLanguage, t, locale, currency, setCurrency };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
