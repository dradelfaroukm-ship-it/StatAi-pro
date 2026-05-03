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
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        background: selected ? 'var(--accent-tint)' : 'var(--bg-card)',
        border: `1px solid ${selected ? 'var(--accent)' : hovered ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--r-card)',
        color: selected ? 'var(--fg-primary)' : 'var(--fg-secondary)',
        fontFamily: 'inherit', fontSize: 13, fontWeight: selected ? 500 : 400,
        textAlign: 'right', cursor: 'pointer',
        transition: 'all 180ms var(--ease-out)',
        width: '100%',
      }}>
      <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, opacity: 0.85 }}>{lang.flag}</span>
      <span style={{ flex: 1, textAlign: 'start', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang.name}</span>
      {selected && <IconCheck size={14} style={{ color: 'var(--accent)', flexShrink: 0 }}/>}
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
      padding: '48px 24px 72px',
    }}>
      <LogoLarge/>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--fg-primary)', marginBottom: 4 }}>
          {t.chooseLanguage}
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-muted)', fontFamily: 'var(--font-latin)', direction: 'ltr' }}>
          {t.chooseLanguageSub}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, marginTop: 28 }}>
        <span style={{
          position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--fg-muted)', display: 'flex', pointerEvents: 'none',
        }}>
          <IconSearch size={16}/>
        </span>
        <input
          className="input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t.searchLanguage}
          style={{ paddingInlineStart: 36, fontSize: 13 }}
        />
      </div>

      {/* Count */}
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          background: 'var(--accent-tint)', color: 'var(--accent)',
          padding: '1px 8px', borderRadius: 'var(--r-pill)',
          fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-numeric)',
        }}>
          {filtered.length}
        </span>
        {query ? 'نتيجة / results' : 'لغة متاحة / languages available'}
      </div>

      {/* Grid */}
      <div className="grid-lang" style={{ marginTop: 16, width: '100%', maxWidth: 1000 }}>
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
            padding: '40px 0', color: 'var(--fg-muted)', fontSize: 13,
          }}>
            No languages found · لا توجد نتائج
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: 'var(--fg-muted)' }}>
        {t.canChangeLater}
      </div>

      <button
        className="btn btn--primary btn--lg"
        style={{ marginTop: 20, minWidth: 180 }}
        onClick={onContinue}>
        {t.continueBtn}
      </button>
    </div>
  );
}
