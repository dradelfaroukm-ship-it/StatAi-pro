// Single entry point for the translation system.
// All language data lives in translations.js; this file exposes the React hook.
export { getT, TRANSLATIONS } from './translations';

import { useLanguage } from '../context/LanguageContext';

/**
 * Returns the translation object for the currently active language.
 * Use this in any component that only needs translated strings.
 * For dir, font, setLang, etc. use useLanguage() directly.
 */
export function useTranslation() {
  const { t } = useLanguage();
  return t;
}
