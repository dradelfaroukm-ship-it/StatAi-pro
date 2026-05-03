import { useState } from 'react';
import { LogoLarge } from '../components/Common';
import { IconSearch, IconCheck } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../i18n/languages';

const LangCard = ({ lang, selected, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        background: selected ? 'var(--accent-tint)' : 'var(--bg-card)',
        border: `1.5px solid ${selected ? 'var(--accent)' : hovered ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--r-card)',
        color: 'var(--fg-primary)',
        fontFamily: 'inherit', fontSize: 15, fontWeight: 500,
        textAlign: 'right', cursor: 'pointer',
        transition: 'all 200ms var(--ease-out)',
        boxShadow: selected ? 'var(--shadow-card-glow)' : 'none',
        transform: !selected && hovered ? 'translateY(-2px)' : 'none',
        width: '100%',
      }}>
      <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{lang.flag}</span>
      <span style={{ flex: 1, textAlign: 'start' }}>{lang.name}</span>
      {selected && <IconCheck size={18} style={{ color: 'var(--accent)', flexShrink: 0 }}/>}
    </button>
  );
};

export default function LanguageScreen({ onContinue }) {
  const { code, setLang, t } = useLanguage();
  const [query, setQuery] = useState('');

  const filtered = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(query.toLowerCase()) ||
    l.code.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (langCode) => setLang(langCode);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '64px 24px 80px',
    }}>
      <LogoLarge/>

      <div style={{ marginTop: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 4 }}>
          {t.chooseLanguage}
          <span style={{ color: 'var(--fg-muted)', fontWeight: 400, margin: '0 10px' }}>—</span>
          <span style={{ fontFamily: 'var(--font-latin)', direction: 'ltr', display: 'inline-block' }}>
            {t.chooseLanguageSub}
          </span>
        </div>
      </div>

      {/* Search */}
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
          placeholder={t.searchLanguage}
          style={{ paddingInlineStart: 44, fontSize: 15 }}
        />
      </div>

      {/* Count badge */}
      <div style={{
        marginTop: 16, fontSize: 13, color: 'var(--fg-muted)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          background: 'var(--accent-tint)', color: 'var(--accent)',
          padding: '2px 10px', borderRadius: 'var(--r-pill)',
          fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-numeric)',
        }}>
          {filtered.length}
        </span>
        {query ? 'نتيجة / results' : 'لغة متاحة / languages available'}
      </div>

      {/* Grid */}
      <div className="grid-lang" style={{ marginTop: 20, width: '100%', maxWidth: 960 }}>
        {filtered.map(l => (
          <LangCard
            key={l.code}
            lang={l}
            selected={code === l.code}
            onClick={() => handleSelect(l.code)}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', textAlign: 'center',
            padding: '40px 0', color: 'var(--fg-muted)', fontSize: 15,
          }}>
            No languages found · لا توجد نتائج
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, fontSize: 13, color: 'var(--fg-muted)' }}>
        {t.canChangeLater}
      </div>

      <button
        className="btn btn--primary btn--lg"
        style={{ marginTop: 28, minWidth: 220 }}
        onClick={onContinue}>
        {t.continueBtn}
      </button>
    </div>
  );
}
