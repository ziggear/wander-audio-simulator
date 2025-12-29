import React, { createContext, useContext, useState, useEffect } from 'react'
import en from '../i18n/en'
import zh from '../i18n/zh'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Read saved language setting from localStorage, default to English
    const saved = localStorage.getItem('wander-language')
    return saved || 'en'
  })

  const translations = {
    en,
    zh
  }

  // Debug: Check if translation files are loaded correctly
  useEffect(() => {
    console.log('LanguageProvider initialized:', {
      currentLanguage: language,
      hasEn: !!translations.en,
      hasZh: !!translations.zh,
      enKeys: translations.en ? Object.keys(translations.en) : [],
      zhKeys: translations.zh ? Object.keys(translations.zh) : []
    })
  }, [])

  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[language]
    
    if (!value) {
      console.error(`Translation object not found for language: ${language}`)
      return key
    }
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    if (value === undefined) {
      console.warn(`Translation missing for key: ${key} in language: ${language}`)
      return key
    }
    
    // Replace parameters
    if (typeof value === 'string' && params && Object.keys(params).length > 0) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] || match
      })
    }
    
    return value
  }

  const changeLanguage = (lang) => {
    setLanguage(lang)
    localStorage.setItem('wander-language', lang)
  }

  useEffect(() => {
    localStorage.setItem('wander-language', language)
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

