import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ============================================
// STEP 1: Import translation files
// ============================================
// Add new languages here by importing their JSON files
import ko from './locales/ko.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import es from './locales/es.json';
import ar from './locales/ar.json';

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

  // Japanese detection (ja, ja-JP, etc.)
  if (browserLang.startsWith('ja')) {
    return 'ja';
  }

  // Chinese detection
  if (browserLang.startsWith('zh')) {
    // Distinguish between Simplified and Traditional Chinese
    if (browserLang.includes('cn') || browserLang.includes('hans') || browserLang === 'zh-sg') {
      return 'zh-CN'; // Simplified Chinese
    }
    if (browserLang.includes('tw') || browserLang.includes('hk') || browserLang.includes('hant') || browserLang === 'zh-mo') {
      return 'zh-TW'; // Traditional Chinese
    }
    return 'zh-CN'; // Default to Simplified
  }

  // Spanish detection (es, es-ES, es-MX, es-AR, etc.)
  if (browserLang.startsWith('es')) {
    return 'es';
  }

  // Arabic detection (ar, ar-SA, ar-EG, ar-AE, etc.)
  if (browserLang.startsWith('ar')) {
    return 'ar';
  }

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
      ja: { translation: ja },
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
      es: { translation: es },
      ar: { translation: ar },
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
// Current: ko (Korean), en (English), ja (Japanese), zh-CN (Simplified Chinese),
//          zh-TW (Traditional Chinese), es (Spanish), ar (Arabic)
// To add more: Follow steps 1-3 above and update this comment
