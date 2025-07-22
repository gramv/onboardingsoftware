import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files from backend
import enTranslations from '../../../src/utils/i18n/translations/en.json';
import esTranslations from '../../../src/utils/i18n/translations/es.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  es: {
    translation: esTranslations,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],
    // React specific options
    react: {
      useSuspense: false,
    },
  });

export default i18n;