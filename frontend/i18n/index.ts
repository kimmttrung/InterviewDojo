import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './en.json';
import viTranslations from './vi.json';
import jpTranslations from './jp.json';

const resources = {
    en: { translation: enTranslations },
    vi: { translation: viTranslations },
    jp: { translation: jpTranslations },
};

const savedLanguage = localStorage.getItem('language') || 'en';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: savedLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
