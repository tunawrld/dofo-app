import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { scopedStorage } from './scopedStorage';
import * as Localization from 'expo-localization';

type LanguageState = {
  language: string;
  setLanguage: (lang: string) => void;
};

const SUPPORTED_LANGUAGES = ['en', 'tr', 'es', 'de', 'fr'];
const deviceLang = Localization.getLocales()[0]?.languageCode || 'en';
const defaultLang = SUPPORTED_LANGUAGES.includes(deviceLang) ? deviceLang : 'en';

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: defaultLang,
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => scopedStorage),
    }
  )
);
