# Internationalization (i18n) Guide

## Overview

The AURA UI now supports **bilingual interface** with English (EN) and French (FR) translations. Users can switch between languages using the toggle button in the header.

## Features

- ✅ **English** and **French** translations
- ✅ **Language toggle button** in top-right header (🇬🇧 EN / 🇫🇷 FR)
- ✅ **Persistent language preference** (stored in localStorage)
- ✅ **All UI labels translated** (login, chat, messages, routing, inputs)
- ✅ **No logic changes** - only UI text is translated

## How It Works

### Architecture

```
App.tsx
  └── LanguageProvider (context)
      ├── SessionProvider
      └── Components (use useLanguage hook)
          ├── Login
          ├── ChatWindow
          ├── MessageList
          ├── MessageInput
          └── RoutingMessage
```

### Key Files

1. **src/context/LanguageContext.tsx** - Language state management
2. **src/translations/index.ts** - All translations (EN & FR)
3. **src/components/ChatWindow.tsx** - Language toggle button

### Usage in Components

```typescript
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

const MyComponent: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language].mySection;
  
  return <h1>{t.title}</h1>;
};
```

## Translation Structure

```typescript
export const translations = {
  en: {
    login: { ... },
    chat: { ... },
    messages: { ... },
    input: { ... },
    routing: { ... },
    badges: { ... },
  },
  fr: {
    login: { ... },
    chat: { ... },
    messages: { ... },
    input: { ... },
    routing: { ... },
    badges: { ... },
  },
};
```

## Language Toggle Button

Located in **ChatWindow header**, top-right corner:

```typescript
<button onClick={toggleLanguage}>
  {language === 'en' ? '🇫🇷 FR' : '🇬🇧 EN'}
</button>
```

**Behavior:**
- Click to toggle between EN ↔ FR
- Language preference saved to localStorage
- All UI text updates instantly
- Persists across page refreshes

## Adding a New Translation

### 1. Add to English Translations

Edit `src/translations/index.ts`:

```typescript
en: {
  myNewSection: {
    title: 'My Title',
    description: 'My description',
  },
}
```

### 2. Add French Translation

```typescript
fr: {
  myNewSection: {
    title: 'Mon Titre',
    description: 'Ma description',
  },
}
```

### 3. Use in Component

```typescript
const { language } = useLanguage();
const t = translations[language].myNewSection;

return <h1>{t.title}</h1>;
```

## Current Translations

### Login Page
- Title, subtitle
- User ID and Tenant ID labels
- Placeholders
- Continue button
- Demo text

### Chat Window
- Header (title, subtitle)
- Clear and Logout buttons
- Info banner text
- Tenant label
- Confirmation dialog

### Message List
- Empty state messages

### Message Input
- Placeholder text
- "Use RAG" label and tooltip
- Help text
- ARIA labels

### Routing Message
- Routing decision title
- Endpoint, reason labels
- Status information labels
- Prepared payload labels
- Copy/Expand buttons
- Call endpoint button
- Demo mode note
- Yes/No for boolean values

### Badges
- OCR, RAG, CHAT, API

## Testing Translations

1. **Start the app**: `npm run dev`
2. **Login** with any user ID
3. **Click the language toggle** (🇫🇷 FR / 🇬🇧 EN) in top-right corner
4. **Verify all UI text changes**:
   - Header titles
   - Button labels
   - Input placeholders
   - Info messages
   - Routing decision labels

## Language Persistence

The selected language is stored in `localStorage` with key: `aura_language`

```typescript
localStorage.getItem('aura_language') // 'en' or 'fr'
```

## Adding More Languages

To add Spanish, Italian, etc.:

### 1. Update LanguageContext.tsx

```typescript
type Language = 'en' | 'fr' | 'es' | 'it';
```

### 2. Add Translations

```typescript
export const translations = {
  en: { ... },
  fr: { ... },
  es: {
    login: {
      title: 'AURA',
      subtitle: 'Demo de Enrutamiento ORCHA',
      // ...
    },
    // ...
  },
};
```

### 3. Update Toggle Button

Replace the simple toggle with a dropdown:

```typescript
<select onChange={(e) => setLanguage(e.target.value as Language)}>
  <option value="en">🇬🇧 EN</option>
  <option value="fr">🇫🇷 FR</option>
  <option value="es">🇪🇸 ES</option>
</select>
```

## Best Practices

1. **Keep keys consistent** across all languages
2. **Use descriptive key names** (e.g., `userIdPlaceholder` not `text1`)
3. **Test all translations** before committing
4. **Avoid hardcoded strings** in components
5. **Keep translations organized** by section/component

## Troubleshooting

### Language not changing?

**Check:**
1. LanguageProvider wraps the app in `App.tsx`
2. Component uses `useLanguage()` hook
3. Translations exist for that language
4. localStorage is not blocked

### Missing translation?

**Error:** `Cannot read property 'xyz' of undefined`

**Solution:** Add the missing key to both `en` and `fr` in `translations/index.ts`

### Language resets on refresh?

**Check:** localStorage is enabled and accessible

## Future Enhancements

Potential improvements:
- [ ] Detect browser language automatically
- [ ] Add more languages (Spanish, German, etc.)
- [ ] Translate dynamic content (API error messages)
- [ ] Date/time localization
- [ ] Number formatting by locale
- [ ] RTL support (for Arabic, Hebrew)

## Contributing Translations

To contribute new translations:

1. **Fork the repo**
2. **Add translations** to `src/translations/index.ts`
3. **Test thoroughly**
4. **Submit PR** with:
   - Translation file changes
   - Screenshots of UI in new language
   - Native speaker verification

---

**Languages Supported:** 🇬🇧 English, 🇫🇷 French

**Last Updated:** October 17, 2025

