import { useState } from 'react';
import { Logo } from '../components/Common';
import { IconEye, IconEyeOff, GoogleIcon } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

// Returns the raw error string so we can see exactly what Supabase says
const rawError = (err) => {
  console.error('[StatAI] Auth error (full object):', err);
  const msg  = err?.message ?? '';
  const code = err?.code ?? '';
  const status = err?.status ?? '';
  return `${msg}${code ? ` [${code}]` : ''}${status ? ` (HTTP ${status})` : ''}` || JSON.stringify(err);
};

export default function AuthScreen() {
  const { t } = useLanguage();
  const [tab, setTab]         = useState('login');
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail]     = useState('');
  const [pwd, setPwd]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');

  const isLogin = tab === 'login';

  const reset = () => { setError(''); setInfo(''); };

  const switchTab = (k) => { setTab(k); reset(); };

  const handleSubmit = async () => {
    reset();
    if (!email || !pwd) { setError('Please enter your email and password.'); return; }
    if (pwd.length < 6)  { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    console.log('[StatAI] Auth attempt:', { action: isLogin ? 'signIn' : 'signUp', email });

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
        console.log('[StatAI] signIn response:', { data, error });
        if (error) throw error;
        // onAuthStateChange in AuthContext navigates away
      } else {
        console.log('[StatAI] Calling supabase.auth.signUp with email:', email);
        const { data, error } = await supabase.auth.signUp({ email, password: pwd });
        console.log('[StatAI] signUp response:', JSON.stringify({ data, error }, null, 2));
        if (error) throw error;
        // If email confirmation is required, session will be null
        if (!data.session) {
          setInfo('Account created! Check your email for a confirmation link, then sign in.');
        }
        // If email confirmation is disabled in Supabase, session exists → AuthContext navigates
      }
    } catch (err) {
      setError(rawError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    reset();
    console.log('[StatAI] Google OAuth attempt, redirectTo:', window.location.origin);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(rawError(error));
  };

  const handleForgotPassword = async () => {
    reset();
    if (!email) { setError('Enter your email address first, then click Forgot password.'); return; }
    setLoading(true);
    const redirectTo = `${window.location.origin}/`;
    console.log('[StatAI] Password reset, redirectTo:', redirectTo);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) setError(rawError(error));
    else setInfo('Password reset email sent. Check your inbox.');
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div aria-hidden="true" style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.10) 0%, rgba(108,99,255,0) 60%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }}/>

      <div className="card card--glow" style={{ position: 'relative', width: '100%', maxWidth: 400, padding: '32px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo size={28}/>
        </div>

        {/* Sign in / Sign up tabs */}
        <div style={{
          display: 'flex', background: 'var(--bg-input)',
          padding: 3, borderRadius: 'var(--r-button)',
          border: '1px solid var(--border-subtle)', marginBottom: 20,
        }}>
          {[
            { k: 'login',  label: t.signInTab },
            { k: 'signup', label: t.signUpTab },
          ].map(tb => (
            <button key={tb.k} type="button" onClick={() => switchTab(tb.k)} style={{
              flex: 1, padding: '8px 12px',
              background: tab === tb.k ? 'var(--accent)' : 'transparent',
              color: tab === tb.k ? '#fff' : 'var(--fg-muted)',
              border: 'none', borderRadius: 4,
              fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'all 180ms var(--ease-out)',
            }}>{tb.label}</button>
          ))}
        </div>

        {/* Email */}
        <label className="label" style={{ display: 'block', marginBottom: 5 }}>
          {t.emailLabel}
        </label>
        <input
          className="input" type="email" dir="ltr"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoComplete="email"
          style={{ marginBottom: 14, textAlign: 'left' }}
        />

        {/* Password */}
        <label className="label" style={{ display: 'block', marginBottom: 5 }}>
          {t.passwordLabel}
        </label>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            className="input" type={showPwd ? 'text' : 'password'} dir="ltr"
            value={pwd} onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            style={{ paddingInlineEnd: 40, textAlign: 'left' }}
          />
          <button type="button" onClick={() => setShowPwd(s => !s)} aria-label="toggle password" style={{
            position: 'absolute', insetInlineEnd: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', display: 'flex', padding: 4,
          }}>
            {showPwd ? <IconEyeOff size={16}/> : <IconEye size={16}/>}
          </button>
        </div>

        {isLogin && (
          <div style={{ textAlign: 'end', marginBottom: 16 }}>
            <button type="button" onClick={handleForgotPassword} disabled={loading} style={{
              background: 'none', border: 'none', padding: 0,
              cursor: 'pointer', fontSize: 12, color: 'var(--accent)',
              fontWeight: 500, fontFamily: 'inherit',
            }}>
              {t.forgotPassword}
            </button>
          </div>
        )}

        {/* Debug strip — always visible so we can see the Supabase URL in use */}
        <div style={{
          marginBottom: 10, padding: '6px 10px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-input)', fontSize: 11, color: 'var(--fg-muted)',
          direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', wordBreak: 'break-all',
        }}>
          url: {import.meta.env.VITE_SUPABASE_URL || 'MISSING → using fallback'}<br/>
          key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 20)}…` : 'MISSING'}
        </div>

        {/* Error / info banners */}
        {error && (
          <div style={{
            marginBottom: 14, padding: '9px 12px',
            background: 'var(--error-tint)', border: '1px solid rgba(239,68,68,0.28)',
            borderRadius: 'var(--r-input)', fontSize: 13, color: 'var(--error)', lineHeight: 1.5,
            direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', wordBreak: 'break-all',
          }}>{error}</div>
        )}
        {info && (
          <div style={{
            marginBottom: 14, padding: '9px 12px',
            background: 'var(--success-tint)', border: '1px solid rgba(16,185,129,0.28)',
            borderRadius: 'var(--r-input)', fontSize: 13, color: 'var(--success)', lineHeight: 1.5,
            direction: 'ltr', textAlign: 'left',
          }}>{info}</div>
        )}

        {/* Primary action */}
        <button
          className="btn btn--primary btn--full btn--lg"
          style={{ marginTop: isLogin ? 0 : 8, opacity: loading ? 0.65 : 1 }}
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? '…' : isLogin ? t.signInBtn : t.createAccountBtn}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0', color: 'var(--fg-muted)', fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}/>
          <span>{t.orDivider}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}/>
        </div>

        {/* Google OAuth */}
        <button className="btn btn--google btn--full" type="button" onClick={handleGoogle} disabled={loading}>
          <GoogleIcon size={16}/>
          <span style={{ fontSize: 13 }}>{t.continueWithGoogle}</span>
        </button>

        {/* Switch tab link */}
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--fg-muted)' }}>
          {isLogin ? (
            <>{t.noAccount}{' '}
              <button type="button" onClick={() => switchTab('signup')} style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                color: 'var(--accent)', fontWeight: 500, fontSize: 12, fontFamily: 'inherit',
              }}>{t.createAccountLink}</button>
            </>
          ) : (
            <>{t.haveAccount}{' '}
              <button type="button" onClick={() => switchTab('login')} style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                color: 'var(--accent)', fontWeight: 500, fontSize: 12, fontFamily: 'inherit',
              }}>{t.signInLink}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
