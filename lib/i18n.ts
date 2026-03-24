import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { translations } from './translations';
import { useLanguageStore } from '../store/languageStore';
import { enUS, tr, es, de, fr } from 'date-fns/locale';
import { format } from 'date-fns';

export const i18n = new I18n(translations);

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Set the initial locale from system settings if possible, otherwise default is used.
// Note: our Zustand store will overwrite this once hydrated.
try {
  const systemLocale = Localization.getLocales()[0]?.languageCode;
  if (systemLocale && translations.hasOwnProperty(systemLocale)) {
    i18n.locale = systemLocale;
  }
} catch (e) {
  // Ignore fallback error
}

export const dateLocales: Record<string, any> = {
  en: enUS,
  tr: tr,
  es: es,
  de: de,
  fr: fr
};

/**
 * A custom hook that subscribes to language changes.
 * Use this in your React components to ensure they re-render
 * immediately when the language is changed.
 */
export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  
  // Keep i18n instance locale in sync with store
  i18n.locale = language;
  
  return {
    t: (key: string, options?: any) => i18n.t(key, options),
    locale: language,
    formatDate: (date: Date | string | number, formatStr: string) => {
      return format(new Date(date), formatStr, { locale: dateLocales[language] || enUS });
    }
  };
};
