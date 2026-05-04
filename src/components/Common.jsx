import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { IconCheck } from './Icons';

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

const SIGN_OUT_LABELS = {
  ar: 'تسجيل الخروج', en: 'Sign out',   fr: 'Se déconnecter', es: 'Cerrar sesión',
  de: 'Abmelden',     pt: 'Sair',        'zh-CN': '退出登录',   hi: 'साइन आउट',
  tr: 'Çıkış yap',    fa: 'خروج از حساب', nl: 'Uitloggen',     ru: 'Выйти',
};

export const NavBar = ({ onSignOut }) => {
  const { code } = useLanguage();
  const { session, signOut } = useAuth();
  const email = session?.user?.email ?? '';
  const initial = email[0]?.toUpperCase() ?? '?';
  const signOutLabel = SIGN_OUT_LABELS[code] || 'Sign out';
  console.log('[NavBar] lang code:', code, '→ signOut label:', signOutLabel);

  const handleSignOut = async () => {
    await signOut();
    onSignOut?.();
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 10,
      height: 56,
      background: 'rgba(10,15,30,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      {/* Email + avatar — pinned to physical left */}
      <div style={{
        position: 'absolute', left: 32, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Avatar name={email} initial={initial}/>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-primary)', direction: 'ltr', whiteSpace: 'nowrap' }}>{email}</span>
      </div>

      {/* Logo — pinned to physical center */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
        <Logo size={28}/>
      </div>

      {/* Sign out — pinned to physical right, always visible */}
      <button type="button" onClick={handleSignOut} style={{
        position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)',
        background: 'var(--accent)', border: 'none', color: '#fff',
        borderRadius: 6, padding: '7px 16px',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}>
        {signOutLabel}
      </button>
    </nav>
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
