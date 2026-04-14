'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import i18n, { AppLanguage, RTL_LANGUAGES, SUPPORTED_LANGUAGES } from '@/lib/i18n'

type LanguageContextValue = {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'hijra-language'

const isAppLanguage = (value: string): value is AppLanguage =>
  SUPPORTED_LANGUAGES.includes(value as AppLanguage)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en')

  useEffect(() => {
    const storedLanguage = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    const browserLanguage = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en'
    const initialLanguage = storedLanguage && isAppLanguage(storedLanguage)
      ? storedLanguage
      : isAppLanguage(browserLanguage)
      ? browserLanguage
      : 'en'

    setLanguageState(initialLanguage)
    i18n.changeLanguage(initialLanguage)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'
  }, [language])

  const setLanguage = (nextLanguage: AppLanguage) => {
    if (nextLanguage === language) return

    setLanguageState(nextLanguage)
    i18n.changeLanguage(nextLanguage)
    localStorage.setItem(STORAGE_KEY, nextLanguage)

    // Force a full refresh so all pages/components pick up the selected language.
    window.location.reload()
  }

  const value = useMemo(() => ({ language, setLanguage }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return context
}
