// SEO utility for updating meta tags based on language
import i18n from '../i18n/config';

/**
 * Updates document title and meta tags based on current language
 */
export function updateSeoTags(): void {
  const title = i18n.t('seo.title');
  const description = i18n.t('seo.description');
  const keywords = i18n.t('seo.keywords');
  const appName = i18n.t('seo.appName');
  const appShortName = i18n.t('seo.appShortName');

  // Update document title
  document.title = title;

  // Update meta tags
  updateMetaTag('name', 'title', title);
  updateMetaTag('name', 'description', description);
  updateMetaTag('name', 'keywords', keywords);
  updateMetaTag('name', 'apple-mobile-web-app-title', appShortName);

  // Update language attribute
  const currentLang = i18n.language;
  document.documentElement.lang = currentLang;

  // Set dir attribute for RTL languages (Arabic)
  if (currentLang === 'ar') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }

  // Language name mapping
  const languageNames: Record<string, string> = {
    'ko': 'Korean',
    'en': 'English',
    'ja': 'Japanese',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'es': 'Spanish',
    'ar': 'Arabic'
  };
  updateMetaTag('name', 'language', languageNames[currentLang] || 'English');

  // Update Open Graph tags with locale mapping
  const localeMapping: Record<string, string> = {
    'ko': 'ko_KR',
    'en': 'en_US',
    'ja': 'ja_JP',
    'zh-CN': 'zh_CN',
    'zh-TW': 'zh_TW',
    'es': 'es_ES',
    'ar': 'ar_AR'
  };

  updateMetaTag('property', 'og:title', title);
  updateMetaTag('property', 'og:description', description);
  updateMetaTag('property', 'og:locale', localeMapping[currentLang] || 'en_US');
  updateMetaTag('property', 'og:site_name', appName);

  // Update Twitter tags
  updateMetaTag('name', 'twitter:title', title);
  updateMetaTag('name', 'twitter:description', description);

  // Update structured data
  updateStructuredData();
}

/**
 * Helper function to update a specific meta tag
 */
function updateMetaTag(attribute: string, attributeValue: string, content: string): void {
  let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);

  if (element) {
    element.setAttribute('content', content);
  } else {
    // Create meta tag if it doesn't exist
    element = document.createElement('meta');
    element.setAttribute(attribute, attributeValue);
    element.setAttribute('content', content);
    document.head.appendChild(element);
  }
}

/**
 * Updates the structured data (JSON-LD) based on current language
 */
function updateStructuredData(): void {
  const appName = i18n.t('seo.appName');
  const description = i18n.t('seo.description');
  const featureList = i18n.t('seo.featureList', { returnObjects: true }) as string[];
  const currentLang = i18n.language;

  // Currency mapping for different locales
  const currencyMapping: Record<string, string> = {
    'ko': 'KRW',
    'en': 'USD',
    'ja': 'JPY',
    'zh-CN': 'CNY',
    'zh-TW': 'TWD',
    'es': 'EUR',
    'ar': 'USD'
  };

  // WebApplication structured data
  const webAppData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": appName,
    "alternateName": "TodayDone",
    "description": description,
    "url": "https://soosoo.life/todaydone/",
    "applicationCategory": "ProductivityApplication",
    "applicationSubCategory": "Habit Tracker",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": currencyMapping[currentLang] || 'USD'
    },
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "screenshot": "https://soosoo.life/todaydone/opengraph.png",
    "author": {
      "@type": "Organization",
      "name": "수수라이프",
      "url": "https://soosoo.life"
    },
    "inLanguage": ["ko-KR", "en-US", "ja-JP", "zh-CN", "zh-TW", "es-ES", "ar-SA"],
    "featureList": featureList,
    "softwareHelp": {
      "@type": "CreativeWork",
      "url": "https://soosoo.life/todaydone/"
    }
  };

  // FAQ structured data
  interface FaqItem { q: string; a: string }
  const faqs = i18n.t('seoLanding.faqs', { returnObjects: true }) as FaqItem[];
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  // HowTo structured data
  interface HowToStep { title: string; desc: string }
  const steps = i18n.t('seoLanding.howToSteps', { returnObjects: true }) as HowToStep[];
  const howToData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": i18n.t('seoLanding.howToHeading'),
    "description": description,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.title,
      "text": step.desc
    }))
  };

  // Update all JSON-LD script tags
  const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
  scriptTags.forEach(tag => tag.remove());

  [webAppData, faqData, howToData].forEach(data => {
    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.textContent = JSON.stringify(data);
    document.head.appendChild(scriptTag);
  });
}

/**
 * Initialize SEO tags on app load and listen for language changes
 */
export function initializeSeo(): void {
  // Update SEO tags on initial load
  updateSeoTags();

  // Listen for language changes
  i18n.on('languageChanged', () => {
    updateSeoTags();
  });
}
