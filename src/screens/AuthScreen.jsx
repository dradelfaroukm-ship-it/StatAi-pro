import { useState } from 'react';
import { Logo } from '../components/Common';
import { IconEye, IconEyeOff, GoogleIcon } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';

export default function AuthScreen({ onLogin }) {
  const { t } = useLanguage();
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
      <div aria-hidden="true" style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.10) 0%, rgba(108,99,255,0) 60%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }}/>

      <div className="card card--glow" style={{ position: 'relative', width: '100%', maxWidth: 400, padding: '32px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo size={28}/>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'var(--bg-input)',
          padding: 3, borderRadius: 'var(--r-button)',
          border: '1px solid var(--border-subtle)', marginBottom: 20,
        }}>
          {[
            { k: 'login',  label: t.signInTab  },
            { k: 'signup', label: t.signUpTab },
          ].map(tb => (
            <button key={tb.k} onClick={() => setTab(tb.k)} style={{
              flex: 1, padding: '8px 12px',
              background: tab === tb.k ? 'var(--accent)' : 'transparent',
              color: tab === tb.k ? '#fff' : 'var(--fg-muted)',
              border: 'none', borderRadius: 4,
              fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'all 180ms var(--ease-out)',
            }}>{tb.label}</button>
          ))}
        </div>

        <label className="label" style={{ display: 'block', marginBottom: 5 }}>
          {t.emailLabel}
        </label>
        <input className="input" type="email" dir="ltr" value={email}
               onChange={e => setEmail(e.target.value)}
               style={{ marginBottom: 14, textAlign: 'left' }}/>

        <label className="label" style={{ display: 'block', marginBottom: 5 }}>
          {t.passwordLabel}
        </label>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input className="input" type={showPwd ? 'text' : 'password'} dir="ltr"
                 value={pwd} onChange={e => setPwd(e.target.value)}
                 style={{ paddingInlineEnd: 40, textAlign: 'left' }}/>
          <button onClick={() => setShowPwd(s => !s)} aria-label="toggle password" style={{
            position: 'absolute', insetInlineEnd: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', display: 'flex', padding: 4,
          }}>
            {showPwd ? <IconEyeOff size={16}/> : <IconEye size={16}/>}
          </button>
        </div>

        {isLogin && (
          <div style={{ textAlign: 'end', marginBottom: 18 }}>
            <a href="#" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              {t.forgotPassword}
            </a>
          </div>
        )}

        <button className="btn btn--primary btn--full btn--lg" style={{ marginTop: 8 }} onClick={onLogin}>
          {isLogin ? t.signInBtn : t.createAccountBtn}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0', color: 'var(--fg-muted)', fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}/>
          <span>{t.orDivider}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}/>
        </div>

        <button className="btn btn--google btn--full" onClick={onLogin}>
          <GoogleIcon size={16}/>
          <span style={{ fontSize: 13 }}>{t.continueWithGoogle}</span>
        </button>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--fg-muted)' }}>
          {isLogin ? (
            <>{t.noAccount}{' '}
              <a href="#" onClick={e => { e.preventDefault(); setTab('signup'); }}
                 style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                {t.createAccountLink}
              </a>
            </>
          ) : (
            <>{t.haveAccount}{' '}
              <a href="#" onClick={e => { e.preventDefault(); setTab('login'); }}
                 style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                {t.signInLink}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
