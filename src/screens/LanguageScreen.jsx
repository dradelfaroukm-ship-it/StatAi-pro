import { useState } from 'react';
import { LogoLarge } from '../components/Common';
import { IconCheck } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../i18n/languages';

const FEATURED_CODES = ['ar', 'en', 'fr', 'es', 'de', 'pt', 'zh-CN', 'hi', 'fa', 'tr', 'nl', 'ru'];
const FEATURED_LANGUAGES = FEATURED_CODES.map(code => LANGUAGES.find(l => l.code === code)).filter(Boolean);

const LanguageCard = ({ lang, selected, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px',
        background: selected ? 'var(--accent-tint)' : hovered ? 'var(--bg-hover)' : 'var(--bg-card)',
        border: `1px solid ${selected ? 'var(--accent)' : hovered ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--r-card)',
        color: selected || hovered ? 'var(--fg-primary)' : 'var(--fg-secondary)',
        fontFamily: 'inherit', fontSize: 14, fontWeight: selected ? 500 : 400,
        cursor: 'pointer', textAlign: 'start', width: '100%',
        transition: 'all 160ms var(--ease-out)',
      }}>
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{lang.flag}</span>
      <span style={{ flex: 1 }}>{lang.name}</span>
      {selected && <IconCheck size={15} style={{ color: 'var(--accent)', flexShrink: 0 }}/>}
    </button>
  );
};

export default function LanguageScreen({ onContinue }) {
  const { code, setLang, t } = useLanguage();

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 24px 80px',
    }}>
      <LogoLarge/>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 500, color: 'var(--fg-primary)' }}>
          {t.chooseLanguage}
        </h1>
        <div style={{ marginTop: 4, fontSize: 13, color: 'var(--fg-muted)', fontFamily: 'var(--font-latin)', direction: 'ltr' }}>
          {t.chooseLanguageSub}
        </div>
      </div>

      <div style={{
        width: '100%', maxWidth: 640, marginTop: 28,
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
      }}>
        {FEATURED_LANGUAGES.map(l => (
          <LanguageCard key={l.code} lang={l} selected={code === l.code} onClick={() => setLang(l.code)}/>
        ))}
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: 'var(--fg-muted)' }}>
        {t.canChangeLater}
      </div>

      <button
        className="btn btn--primary btn--lg"
        style={{ marginTop: 20, minWidth: 160 }}
        onClick={onContinue}>
        {t.continueBtn}
      </button>
    </div>
  );
}
