import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ============================================
// STEP 1: Import translation files
// ============================================
// Add new languages here by importing their JSON files
import ko from './locales/ko.json';
import en from './locales/en.json';
// import ja from './locales/ja.json';  // Example: Japanese
// import zh from './locales/zh.json';  // Example: Chinese
// import es from './locales/es.json';  // Example: Spanish

// ============================================
// STEP 2: Browser language detection
// ============================================
// Detects user's browser language and returns the best match
const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.toLowerCase();

  // Korean detection (ko, ko-KR, ko-KP, etc.)
  if (browserLang.startsWith('ko')) {
    return 'ko';
  }

  // English detection (en, en-US, en-GB, en-CA, etc.)
  if (browserLang.startsWith('en')) {
    return 'en';
  }

  // Add new language detection here:
  // if (browserLang.startsWith('ja')) return 'ja';  // Japanese
  // if (browserLang.startsWith('zh')) return 'zh';  // Chinese
  // if (browserLang.startsWith('es')) return 'es';  // Spanish

  // Default fallback language
  return 'en';
};

// ============================================
// STEP 3: Configure i18n
// ============================================
i18n
  .use(initReactI18next)
  .init({
    // Add new languages to resources here
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      // ja: { translation: ja },  // Example: Japanese
      // zh: { translation: zh },  // Example: Chinese
      // es: { translation: es },  // Example: Spanish
    },

    // Auto-detect browser language
    lng: getBrowserLanguage(),

    // Fallback language when detection fails
    fallbackLng: 'en',

    // Interpolation settings
    interpolation: {
      escapeValue: false // React already escapes values
    },

    // Debug mode (set to true during development if needed)
    debug: false
  });

export default i18n;

// ============================================
// Supported languages
// ============================================
// Current: ko (Korean), en (English)
// To add more: Follow steps 1-3 above and update this comment
