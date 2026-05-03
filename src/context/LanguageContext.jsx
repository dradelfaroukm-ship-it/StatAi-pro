import { createContext, useContext, useState, useEffect } from 'react';
import { LANGUAGES, RTL_LANGS, getFontFamily } from '../i18n/languages';
import { getT } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [code, setCode] = useState(
    () => localStorage.getItem('statai-lang') || 'ar'
  );

  const langInfo = LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
  const dir      = RTL_LANGS.has(code) ? 'rtl' : 'ltr';
  const font     = getFontFamily(code);
  const t        = getT(code);

  // Apply direction + font to <html> immediately on every change
  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', code);
    document.documentElement.style.fontFamily = font;
    document.body.style.fontFamily = font;
  }, [code, dir, font]);

  const setLang = (newCode) => {
    setCode(newCode);
    localStorage.setItem('statai-lang', newCode);
  };

  return (
    <LanguageContext.Provider value={{ code, dir, font, t, langInfo, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
};
