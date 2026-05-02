import { useState } from 'react';
import { Logo } from '../components/Common';
import { IconEye, IconEyeOff, GoogleIcon } from '../components/Icons';

export default function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('researcher@uni.edu');
  const [pwd, setPwd] = useState('••••••••••');

  const isLogin = tab === 'login';

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Soft purple radial behind card */}
      <div aria-hidden="true" style={{
        position: 'absolute', width: 720, height: 720,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,77,255,0.18) 0%, rgba(124,77,255,0) 60%)',
        filter: 'blur(20px)', pointerEvents: 'none',
      }}/>

      <div className="card card--glow" style={{
        position: 'relative', width: '100%', maxWidth: 440,
        padding: '36px 32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo size={44}/>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'var(--bg-input)',
          padding: 4, borderRadius: 'var(--r-button)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 24,
        }}>
          {[
            { k: 'login',  label: 'تسجيل الدخول' },
            { k: 'signup', label: 'حساب جديد' },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{
                flex: 1, padding: '10px 12px',
                background: tab === t.k ? 'var(--accent)' : 'transparent',
                color: tab === t.k ? '#fff' : 'var(--fg-secondary)',
                border: 'none', borderRadius: 8,
                fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', transition: 'all 200ms var(--ease-out)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Email */}
        <label className="label" style={{ display: 'block', marginBottom: 6, color: 'var(--fg-secondary)' }}>
          البريد الإلكتروني
        </label>
        <input
          className="input" type="email" dir="ltr"
          value={email} onChange={e => setEmail(e.target.value)}
          style={{ marginBottom: 16, textAlign: 'left' }}
        />

        {/* Password */}
        <label className="label" style={{ display: 'block', marginBottom: 6, color: 'var(--fg-secondary)' }}>
          كلمة المرور
        </label>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            className="input"
            type={showPwd ? 'text' : 'password'}
            dir="ltr"
            value={pwd} onChange={e => setPwd(e.target.value)}
            style={{ paddingInlineEnd: 44, textAlign: 'left' }}
          />
          <button onClick={() => setShowPwd(s => !s)} aria-label="toggle password"
            style={{
              position: 'absolute', insetInlineEnd: 12, top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent', border: 'none',
              color: 'var(--fg-muted)', cursor: 'pointer',
              display: 'flex', padding: 4,
            }}>
            {showPwd ? <IconEyeOff/> : <IconEye/>}
          </button>
        </div>

        {isLogin && (
          <div style={{ textAlign: 'left', marginBottom: 20 }}>
            <a href="#" style={{
              fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500,
            }}>نسيت كلمة المرور؟</a>
          </div>
        )}

        <button className="btn btn--primary btn--full" style={{ marginTop: 8 }} onClick={onLogin}>
          {isLogin ? 'دخول' : 'إنشاء حساب'}
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '20px 0', color: 'var(--fg-muted)', fontSize: 13,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}/>
          <span>أو</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}/>
        </div>

        <button className="btn btn--google btn--full" onClick={onLogin}>
          <GoogleIcon/>
          <span>المتابعة بـ <span className="latin">Google</span></span>
        </button>

        <div style={{
          marginTop: 22, textAlign: 'center',
          fontSize: 13, color: 'var(--fg-muted)',
        }}>
          {isLogin ? (
            <>ليس لديك حساب؟{' '}
              <a href="#" onClick={e => { e.preventDefault(); setTab('signup'); }}
                 style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                أنشئ حساباً
              </a>
            </>
          ) : (
            <>لديك حساب بالفعل؟{' '}
              <a href="#" onClick={e => { e.preventDefault(); setTab('login'); }}
                 style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                سجّل دخولك
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
