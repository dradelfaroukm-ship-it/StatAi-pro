import { useState } from 'react';
import { LogoLarge } from '../components/Common';
import { IconSearch, IconCheck } from '../components/Icons';

const LANGUAGES = [
  { code: 'ar', name: 'العربية',   flag: '🇸🇦' },
  { code: 'en', name: 'English',   flag: '🇺🇸' },
  { code: 'fr', name: 'Français',  flag: '🇫🇷' },
  { code: 'es', name: 'Español',   flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch',   flag: '🇩🇪' },
  { code: 'zh', name: '中文',       flag: '🇨🇳' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ur', name: 'اردو',       flag: '🇵🇰' },
  { code: 'tr', name: 'Türkçe',    flag: '🇹🇷' },
  { code: 'ru', name: 'Русский',   flag: '🇷🇺' },
  { code: 'ja', name: '日本語',     flag: '🇯🇵' },
  { code: 'hi', name: 'हिन्दी',       flag: '🇮🇳' },
];

const LangCard = ({ lang, selected, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 20px',
        background: selected ? 'var(--accent-tint)' : 'var(--bg-card)',
        border: `1.5px solid ${selected ? 'var(--accent)' : hovered ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--r-card)',
        color: 'var(--fg-primary)',
        fontFamily: 'inherit', fontSize: 16, fontWeight: 500,
        textAlign: 'right', cursor: 'pointer',
        transition: 'all 200ms var(--ease-out)',
        boxShadow: selected ? 'var(--shadow-card-glow)' : 'none',
        transform: !selected && hovered ? 'translateY(-2px)' : 'none',
        width: '100%',
      }}>
      <span style={{ fontSize: 28, lineHeight: 1 }}>{lang.flag}</span>
      <span style={{ flex: 1 }}>{lang.name}</span>
      {selected && <IconCheck size={20} style={{ color: 'var(--accent)' }}/>}
    </button>
  );
};

export default function LanguageScreen({ onContinue, savedLang, onSaveLang }) {
  const [selected, setSelected] = useState(savedLang || 'ar');
  const [query, setQuery] = useState('');

  const filtered = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(query.toLowerCase()) || l.code.includes(query.toLowerCase())
  );

  const handleSelect = (code) => {
    setSelected(code);
    onSaveLang(code);
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '64px 24px 48px',
    }}>
      <LogoLarge/>
      <div style={{ marginTop: 28, textAlign: 'center' }}>
        <div style={{
          fontSize: 22, fontWeight: 600, color: 'var(--fg-primary)',
          direction: 'rtl', marginBottom: 4,
        }}>
          اختر لغتك{' '}
          <span style={{ color: 'var(--fg-muted)', fontWeight: 400 }}>—</span>{' '}
          <span style={{ direction: 'ltr', display: 'inline-block', fontFamily: 'var(--font-latin)' }}>
            Choose your language
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 560, marginTop: 36 }}>
        <span style={{
          position: 'absolute', insetInlineStart: 16, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--fg-muted)', display: 'flex', pointerEvents: 'none',
        }}>
          <IconSearch/>
        </span>
        <input
          className="input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search language / ابحث عن لغتك"
          style={{ paddingInlineStart: 44, fontSize: 15 }}
        />
      </div>

      <div className="grid-lang" style={{ marginTop: 32, width: '100%', maxWidth: 880 }}>
        {filtered.map(l => (
          <LangCard key={l.code} lang={l} selected={selected === l.code}
                    onClick={() => handleSelect(l.code)}/>
        ))}
      </div>

      <div style={{
        marginTop: 28, padding: '10px 18px',
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-pill)',
        fontSize: 13, color: 'var(--fg-muted)',
      }}>
        <span style={{ color: 'var(--fg-secondary)' }}>+ </span>
        <span className="num">100</span> more languages
      </div>

      <div style={{ marginTop: 24, fontSize: 13, color: 'var(--fg-muted)' }}>
        يمكنك تغيير اللغة لاحقاً
      </div>

      <button
        className="btn btn--primary btn--lg"
        style={{ marginTop: 32, minWidth: 200 }}
        onClick={onContinue}
      >
        متابعة
      </button>

      <style>{`
        @media (max-width: 680px) {
          .lang-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 440px) {
          .lang-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
