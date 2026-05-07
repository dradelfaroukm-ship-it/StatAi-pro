import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { IconCheck } from './Icons';

export const SIDEBAR_W = 80;

const SIDEBAR_STEPS = [
  { key: 'language', labelKey: 'screenLang' },
  { key: 'auth',     labelKey: 'screenAuth' },
  { key: 'projects', labelKey: 'screenProjects' },
  { key: 'upload',   labelKey: 'screenUpload' },
  { key: 'plan',     labelKey: 'screenPlan' },
  { key: 'results',  labelKey: 'screenResults' },
];

export const SigmaTile = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden="true">
    <defs>
      <linearGradient id={`sigma-${size}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6c63ff"/>
        <stop offset="100%" stopColor="#4a42de"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="56" height="56" rx="12" fill={`url(#sigma-${size})`}/>
    <path d="M16 13 L40 13 L40 19 L25 19 L34 28 L25 37 L40 37 L40 43 L16 43 L16 38.5 L27 28 L16 17.5 Z" fill="#fff"/>
  </svg>
);

export const Logo = ({ size = 28 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
    <SigmaTile size={size}/>
    <span style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 600, fontSize: size * 0.55, color: '#e2e8f0',
      letterSpacing: '-0.02em', direction: 'ltr',
    }}>
      Stat<span style={{ color: '#6c63ff' }}>AI</span>
    </span>
  </div>
);

export const LogoLarge = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
    <SigmaTile size={64}/>
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 600, fontSize: 36, color: '#e2e8f0',
      letterSpacing: '-0.03em', lineHeight: 1, direction: 'ltr',
    }}>
      Stat<span style={{ color: '#6c63ff' }}>AI</span>
    </div>
  </div>
);

export const Avatar = ({ name = 'سارة', initial }) => {
  const ch = initial || (name && name[0]) || '؟';
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: 'var(--accent)',
      color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-arabic)', fontWeight: 600, fontSize: 13,
      flexShrink: 0, opacity: 0.9,
    }}>{ch}</div>
  );
};

export const StepSidebar = ({ currentScreen, onNavigate }) => {
  const { t, dir } = useLanguage();
  const { session } = useAuth();
  const isRTL = dir === 'rtl';
  const currentIdx = SIDEBAR_STEPS.findIndex(s => s.key === currentScreen);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div className="step-sidebar" style={{
      position: 'fixed',
      top: 56,
      bottom: 0,
      [isRTL ? 'right' : 'left']: 0,
      width: SIDEBAR_W,
      background: 'rgba(10,15,30,0.88)',
      backdropFilter: 'blur(10px)',
      borderInlineEnd: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 24,
      paddingBottom: 24,
      zIndex: 15,
      overflowY: 'auto',
    }}>
      {SIDEBAR_STEPS.map((s, i) => {
        const isDone      = i < currentIdx;
        const isActive    = i === currentIdx;
        const isFuture    = i > currentIdx;
        const isClickable = i <= 1 || !!session;
        const isHovered   = hoveredIdx === i && isClickable && !isActive;

        return (
          <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {i > 0 && (
              <div style={{
                width: 1, height: 12, flexShrink: 0,
                background: isDone ? 'rgba(16,185,129,0.45)' : isActive ? 'rgba(108,99,255,0.35)' : 'var(--border)',
              }}/>
            )}
            <button
              onClick={() => isClickable && onNavigate?.(s.key)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 5, padding: '6px 4px', width: '100%',
                background: isHovered ? 'rgba(108,99,255,0.07)' : 'transparent',
                border: 'none',
                cursor: isClickable ? 'pointer' : 'default',
                opacity: isFuture ? (isClickable ? 0.5 : 0.28) : 1,
                transition: 'opacity 200ms, background 140ms',
                fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone ? 'var(--success-tint)' : isActive ? 'var(--accent)' : isHovered ? 'var(--accent-tint)' : 'transparent',
                border: `1.5px solid ${isDone ? 'rgba(16,185,129,0.45)' : isActive ? 'var(--accent)' : isHovered ? 'rgba(108,99,255,0.4)' : 'var(--border)'}`,
                color: isDone ? 'var(--success)' : isActive ? '#fff' : isHovered ? 'var(--accent)' : 'var(--fg-muted)',
                fontSize: 11, fontWeight: 600,
                fontFamily: 'var(--font-numeric)',
                boxShadow: isActive ? '0 0 0 3px var(--accent-tint-2)' : 'none',
                transition: 'all 200ms var(--ease-out)',
                flexShrink: 0,
              }}>
                {isDone ? <IconCheck size={12}/> : <span className="num">{i + 1}</span>}
              </div>
              <div style={{
                fontSize: 9, fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--fg-primary)' : isHovered ? 'var(--fg-secondary)' : 'var(--fg-muted)',
                textAlign: 'center', lineHeight: 1.3,
                width: 66, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                transition: 'color 200ms',
              }}>{t[s.labelKey]}</div>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const NavBar = ({ onSignOut }) => {
  const { t } = useLanguage();
  const { signOut } = useAuth();

  return (
    <>
      {/* Sign out: fixed top-left — physical `left` is never affected by dir="rtl" */}
      <button
        type="button"
        onClick={async () => { await signOut(); onSignOut?.(); }}
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 200,
          background: 'var(--accent)', border: 'none', color: '#fff',
          borderRadius: 6, padding: '7px 16px',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}
      >
        {t.signOut}
      </button>

      {/* Fixed full-width header — unaffected by any parent padding */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        height: 56,
        background: 'rgba(10,15,30,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Logo size={28}/>
      </div>

      {/* Spacer so page content clears the fixed header */}
      <div style={{ height: 56 }}/>
    </>
  );
};

export const StepIndicator = ({ current = 1, completed = [] }) => {
  const { t } = useLanguage();
  const steps = [
    { n: 1, label: t.step1 },
    { n: 2, label: t.step2 },
    { n: 3, label: t.step3 },
    { n: 4, label: t.step4 },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 0, padding: '18px 0', flexWrap: 'wrap',
    }}>
      {steps.map((s, i) => {
        const isDone   = completed.includes(s.n);
        const isActive = s.n === current;
        const dim      = !isDone && !isActive;
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-numeric)', fontWeight: 600, fontSize: 12,
                background: isDone ? 'var(--success-tint)'
                          : isActive ? 'var(--accent)' : 'transparent',
                color: isDone ? 'var(--success)'
                     : isActive ? '#fff' : 'var(--fg-muted)',
                border: `1px solid ${isDone ? 'rgba(16,185,129,0.4)' : isActive ? 'var(--accent)' : 'var(--border)'}`,
                transition: 'all 200ms var(--ease-out)',
                flexShrink: 0,
              }}>
                {isDone ? <IconCheck size={13}/> : <span className="num">{s.n}</span>}
              </div>
              <span className="step-indicator-label" style={{
                fontSize: 12, fontWeight: isActive ? 500 : 400,
                color: dim ? 'var(--fg-muted)' : isActive ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                whiteSpace: 'nowrap',
              }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 40, height: 1, margin: '0 12px',
                background: completed.includes(s.n) ? 'rgba(16,185,129,0.4)' : 'var(--border)',
                transition: 'background 320ms var(--ease-out)',
              }}/>
            )}
          </div>
        );
      })}
    </div>
  );
};
