# Internationalization (i18n) Guide

This project uses `i18next` and `react-i18next` for internationalization.

## Current Languages

- 🇰🇷 Korean (ko) - 한국어
- 🇺🇸 English (en) - Default
- 🇯🇵 Japanese (ja) - 日本語
- 🇨🇳 Simplified Chinese (zh-CN) - 简体中文
- 🇹🇼 Traditional Chinese (zh-TW) - 繁體中文
- 🇪🇸 Spanish (es) - Español
- 🇸🇦 Arabic (ar) - العربية

## How to Add a New Language

### Step 1: Create Translation File

Create a new JSON file in `src/i18n/locales/` with the language code:

```bash
src/i18n/locales/
├── ko.json  (Korean)
├── en.json  (English)
└── [lang].json  (Your new language)
```

Example language codes:
- `ja.json` - Japanese (日本語)
- `zh.json` - Chinese (中文)
- `es.json` - Spanish (Español)
- `fr.json` - French (Français)
- `de.json` - German (Deutsch)
- `pt.json` - Portuguese (Português)
- `ru.json` - Russian (Русский)
- `ar.json` - Arabic (العربية)
- `hi.json` - Hindi (हिन्दी)
- `it.json` - Italian (Italiano)

### Step 2: Copy Translation Structure

Copy the structure from `en.json` or `ko.json` and translate all values:

```json
{
  "nav": {
    "today": "Your translation",
    "routines": "Your translation",
    ...
  },
  ...
}
```

### Step 3: Update config.ts

Add your language to `src/i18n/config.ts`:

```typescript
import yourLang from './locales/[lang].json';

// Add to resources
resources: {
  ko: { translation: ko },
  en: { translation: en },
  [lang]: { translation: yourLang }  // Add this line
}

// Add to browser language detection
const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.toLowerCase();

  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('en')) return 'en';
  if (browserLang.startsWith('[lang]')) return '[lang]';  // Add this line

  return 'en'; // Default
};
```

### Step 4: Test

1. Change your browser language to the new language
2. Refresh the application
3. Verify all text is properly translated

## Translation Keys Structure

```
nav.*           - Navigation menu items
today.*         - Today page
routines.*      - Routines management page
history.*       - History page
settings.*      - Settings page
share.*         - Share functionality
common.*        - Common/shared text
```

## Interpolation Examples

For dynamic values, use interpolation:

```json
{
  "userRoutines": "{{name}}'s Routines"
}
```

Usage in code:
```typescript
t('routines.userRoutines', { name: user.name })
```

## Tips

1. **Keep emojis**: Emojis are universal, keep them in translations
2. **Maintain placeholders**: Keep {{variable}} placeholders as-is
3. **Context matters**: Some words translate differently based on context
4. **Test thoroughly**: Check all pages after adding translations
5. **RTL languages**: For Arabic, Hebrew, etc., additional CSS may be needed

## Need Help?

- Review existing translations in `ko.json` and `en.json`
- Check component usage in `src/pages/*.tsx`
- Test with browser language settings
