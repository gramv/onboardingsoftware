import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: 'en' | 'es') => {
    i18n.changeLanguage(lng);
    // Store language preference in localStorage
    localStorage.setItem('preferred-language', lng);
  };

  const currentLanguage = i18n.language as 'en' | 'es';

  // Initialize language from localStorage on first load
  const initializeLanguage = () => {
    const savedLanguage = localStorage.getItem('preferred-language') as 'en' | 'es';
    if (savedLanguage && savedLanguage !== currentLanguage) {
      changeLanguage(savedLanguage);
    }
  };

  return {
    currentLanguage,
    changeLanguage,
    initializeLanguage,
    t,
  };
};