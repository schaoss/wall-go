import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import zhHant from './locales/zh-Hant.json'
import zhHans from './locales/zh-Hans.json'
import es from './locales/es.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'

const resources = {
  en: { translation: en },
  'zh-Hant': { translation: zhHant },
  'zh-Hans': { translation: zhHans },
  es: { translation: es },
  ja: { translation: ja },
  ko: { translation: ko },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: ['en', 'zh-Hant', 'zh-Hans', 'es', 'ja', 'ko'],
    debug: false,
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  })

export default i18n
