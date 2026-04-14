import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        jobs: 'Jobs',
        services: 'Services',
        contact: 'Contact',
        login: 'Login',
        signup: 'Sign Up',
      },
    },
  },
  am: {
    translation: {
      nav: {
        home: 'መነሻ',
        jobs: 'ስራዎች',
        services: 'አገልግሎቶች',
        contact: 'ያግኙን',
        login: 'ግባ',
        signup: 'ይመዝገቡ',
      },
    },
  },
  ar: {
    translation: {
      nav: {
        home: 'الرئيسية',
        jobs: 'الوظائف',
        services: 'الخدمات',
        contact: 'اتصل بنا',
        login: 'تسجيل الدخول',
        signup: 'إنشاء حساب',
      },
    },
  },
  or: {
    translation: {
      nav: {
        home: 'Mana',
        jobs: 'Hojiiwwan',
        services: 'Tajaajiloota',
        contact: 'Nu Qunnamaa',
        login: 'Seeni',
        signup: 'Galmaa’i',
      },
    },
  },
} as const

export const SUPPORTED_LANGUAGES = ['en', 'am', 'ar', 'or'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]
export const RTL_LANGUAGES: AppLanguage[] = ['ar']

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })
}

export default i18n