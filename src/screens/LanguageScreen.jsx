import { useState } from 'react';
import { LogoLarge } from '../components/Common';
import { IconSearch, IconCheck, IconChev } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES, TOP_LANG_CODES } from '../i18n/languages';

const TOP_LANGUAGES  = LANGUAGES.filter(l => TOP_LANG_CODES.includes(l.code));
const MORE_LANGUAGES = LANGUAGES.filter(l => !TOP_LANG_CODES.includes(l.code));

// ── Large featured card (top 10) ────────────────────────────────────────────
const FeaturedCard = ({ lang, selected, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 18px',
      background: selected ? 'var(--accent-tint)' : 'var(--bg-card)',
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--r-card)',
      color: selected ? 'var(--fg-primary)' : 'var(--fg-secondary)',
      fontFamily: 'inherit', fontSize: 14, fontWeight: selected ? 500 : 400,
      cursor: 'pointer', textAlign: 'start', width: '100%',
      transition: 'all 160ms var(--ease-out)',
    }}
    onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--fg-primary)'; }}}
    onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--fg-secondary)'; }}}>
    <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{lang.flag}</span>
    <span style={{ flex: 1 }}>{lang.name}</span>
    {selected && <IconCheck size={15} style={{ color: 'var(--accent)', flexShrink: 0 }}/>}
  </button>
);

// ── Compact row (more languages list) ───────────────────────────────────────
const CompactRow = ({ lang, selected, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '8px 12px',
      background: selected ? 'var(--accent-tint)' : 'transparent',
      border: `1px solid ${selected ? 'var(--accent)' : 'transparent'}`,
      borderRadius: 6,
      color: selected ? 'var(--fg-primary)' : 'var(--fg-secondary)',
      fontFamily: 'inherit', fontSize: 13, fontWeight: selected ? 500 : 400,
      cursor: 'pointer', textAlign: 'start', width: '100%',
      transition: 'all 120ms var(--ease-out)',
    }}
    onMouseEnter={e => { if (!selected) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--fg-primary)'; }}}
    onMouseLeave={e => { if (!selected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-secondary)'; }}}>
    <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0, opacity: 0.8 }}>{lang.flag}</span>
    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang.name}</span>
    {selected && <IconCheck size={13} style={{ color: 'var(--accent)', flexShrink: 0 }}/>}
  </button>
);

export default function LanguageScreen({ onContinue }) {
  const { code, setLang, t } = useLanguage();
  const [query, setQuery]     = useState('');
  const [expanded, setExpanded] = useState(false);

  const isSearching = query.trim().length > 0;

  const filtered = isSearching
    ? LANGUAGES.filter(l =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.code.toLowerCase().includes(query.toLowerCase())
      )
    : null;

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

      {/* Search box */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 440, marginTop: 24 }}>
        <span style={{
          position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--fg-muted)', display: 'flex', pointerEvents: 'none',
        }}>
          <IconSearch size={15}/>
        </span>
        <input
          className="input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t.searchLanguage}
          style={{ paddingInlineStart: 36, fontSize: 13 }}
        />
      </div>

      <div style={{ width: '100%', maxWidth: 760, marginTop: 20 }}>

        {/* ── Search results ── */}
        {isSearching && (
          <>
            <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--fg-muted)' }}>
              <span style={{
                background: 'var(--accent-tint)', color: 'var(--accent)',
                padding: '1px 8px', borderRadius: 'var(--r-pill)',
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-numeric)',
                marginInlineEnd: 6,
              }}>{filtered.length}</span>
              {t.searchResults}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 6,
            }}>
              {filtered.map(l => (
                <CompactRow key={l.code} lang={l} selected={code === l.code} onClick={() => setLang(l.code)}/>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: '1 / -1', color: 'var(--fg-muted)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
                  No languages found
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Featured top 10 ── */}
        {!isSearching && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
            }}>
              {TOP_LANGUAGES.map(l => (
                <FeaturedCard key={l.code} lang={l} selected={code === l.code} onClick={() => setLang(l.code)}/>
              ))}
            </div>

            {/* ── More languages toggle ── */}
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                marginTop: 16, width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 0',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-card)',
                color: 'var(--fg-muted)', fontSize: 13, fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 160ms var(--ease-out)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--fg-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--fg-muted)'; }}>
              {expanded ? t.collapseLanguages : t.moreLanguages}
              <span style={{ color: 'var(--fg-muted)', fontSize: 11, fontFamily: 'var(--font-numeric)' }}>
                +{MORE_LANGUAGES.length}
              </span>
              <IconChev size={14} style={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms var(--ease-out)',
              }}/>
            </button>

            {expanded && (
              <div style={{
                marginTop: 8,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-card)',
                padding: '12px 8px',
                maxHeight: 320,
                overflowY: 'auto',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 2,
                }}>
                  {MORE_LANGUAGES.map(l => (
                    <CompactRow key={l.code} lang={l} selected={code === l.code} onClick={() => setLang(l.code)}/>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
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
