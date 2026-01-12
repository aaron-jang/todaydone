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
  updateMetaTag('name', 'language', currentLang === 'ko' ? 'Korean' : 'English');

  // Update Open Graph tags
  updateMetaTag('property', 'og:title', title);
  updateMetaTag('property', 'og:description', description);
  updateMetaTag('property', 'og:locale', currentLang === 'ko' ? 'ko_KR' : 'en_US');
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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": appName,
    "alternateName": "TodayDone",
    "description": description,
    "url": "https://soosoo.life/todaydone/",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": currentLang === 'ko' ? 'KRW' : 'USD'
    },
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "screenshot": "https://soosoo.life/todaydone/icon-512x512.png",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "ratingCount": "1"
    },
    "author": {
      "@type": "Organization",
      "name": "TodayDone"
    },
    "inLanguage": currentLang === 'ko' ? 'ko-KR' : 'en-US',
    "featureList": featureList
  };

  // Find existing script tag or create new one
  let scriptTag = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;

  if (scriptTag) {
    scriptTag.textContent = JSON.stringify(structuredData, null, 2);
  } else {
    scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(scriptTag);
  }
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
