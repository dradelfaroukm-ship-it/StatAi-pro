import { IconCheck } from './Icons';

export const SigmaTile = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden="true">
    <defs>
      <linearGradient id={`sigma-${size}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7c4dff"/>
        <stop offset="100%" stopColor="#5b32d1"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="56" height="56" rx="14" fill={`url(#sigma-${size})`}/>
    <path d="M16 13 L40 13 L40 19 L25 19 L34 28 L25 37 L40 37 L40 43 L16 43 L16 38.5 L27 28 L16 17.5 Z" fill="#fff"/>
  </svg>
);

export const Logo = ({ size = 36 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <SigmaTile size={size}/>
    <span style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 700, fontSize: size * 0.6, color: '#f4f5fa',
      letterSpacing: '-0.02em', direction: 'ltr',
    }}>
      Stat<span style={{ color: '#7c4dff' }}>AI</span>
    </span>
  </div>
);

export const LogoLarge = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
    <SigmaTile size={88}/>
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 700, fontSize: 56, color: '#f4f5fa',
      letterSpacing: '-0.03em', lineHeight: 1, direction: 'ltr',
    }}>
      Stat<span style={{ color: '#7c4dff' }}>AI</span>
    </div>
  </div>
);

export const Avatar = ({ name = 'سارة', initial }) => {
  const ch = initial || (name && name[0]) || '؟';
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: 'linear-gradient(135deg, #9d6bff 0%, #6a3de8 100%)',
      color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-arabic)', fontWeight: 700, fontSize: 16,
      flexShrink: 0,
    }}>{ch}</div>
  );
};

export const NavBar = ({ user = { name: 'د. سارة المنصوري' } }) => (
  <nav style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 32px',
    background: 'rgba(10,15,30,0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border-subtle)',
    position: 'sticky', top: 0, zIndex: 10,
  }}>
    <Logo size={36}/>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ textAlign: 'right', direction: 'rtl' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)' }}>{user.name}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>باحث</div>
      </div>
      <Avatar name={user.name} initial="س"/>
    </div>
  </nav>
);

export const StepIndicator = ({ current = 1, completed = [] }) => {
  const steps = [
    { n: 1, label: 'رفع الملف' },
    { n: 2, label: 'مراجعة الخطة' },
    { n: 3, label: 'التحليل' },
    { n: 4, label: 'النتائج' },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 0, padding: '20px 0', flexWrap: 'wrap',
    }}>
      {steps.map((s, i) => {
        const isDone   = completed.includes(s.n);
        const isActive = s.n === current;
        const dim      = !isDone && !isActive;
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-numeric)', fontWeight: 700, fontSize: 14,
                background: isDone ? 'var(--success-tint)'
                          : isActive ? 'var(--accent)' : 'transparent',
                color: isDone ? 'var(--success)'
                     : isActive ? '#fff' : 'var(--fg-muted)',
                border: `1.5px solid ${
                  isDone ? 'rgba(102,187,106,0.5)'
                  : isActive ? 'var(--accent)' : 'var(--border)'}`,
                transition: 'all 200ms var(--ease-out)',
              }}>
                {isDone ? <IconCheck size={16}/> : <span className="num">{s.n}</span>}
              </div>
              <span style={{
                fontSize: 14, fontWeight: isActive ? 600 : 500,
                color: dim ? 'var(--fg-muted)' : 'var(--fg-primary)',
                whiteSpace: 'nowrap',
              }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 56, height: 2, margin: '0 16px',
                background: completed.includes(s.n)
                  ? 'rgba(102,187,106,0.5)' : 'var(--border)',
                transition: 'background 320ms var(--ease-out)',
              }}/>
            )}
          </div>
        );
      })}
    </div>
  );
};
