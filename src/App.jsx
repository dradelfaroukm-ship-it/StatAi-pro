import { useState, useEffect } from 'react';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import LanguageScreen from './screens/LanguageScreen';
import AuthScreen from './screens/AuthScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import UploadScreen from './screens/UploadScreen';
import PlanScreen from './screens/PlanScreen';
import ResultsScreen from './screens/ResultsScreen';

const SCREEN_KEYS = ['language', 'auth', 'projects', 'upload', 'plan', 'results'];
const PROTECTED   = new Set(['projects', 'upload', 'plan', 'results']);

export default function App() {
  const { dir, font, t, code } = useLanguage();
  const { session, loading }   = useAuth();

  const [screen, setScreen] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return SCREEN_KEYS.includes(hash) ? hash : 'language';
  });

  // Route protection: runs whenever session or screen changes
  useEffect(() => {
    if (loading) return;
    if (!session && PROTECTED.has(screen)) {
      setScreen('auth');
    }
    if (session && screen === 'auth') {
      setScreen('projects');
    }
  }, [session, loading, screen]);

  useEffect(() => {
    window.location.hash = screen;
    document.title = 'StatAI';
  }, [screen]);

  const go = (key) => () => setScreen(key);

  const handleSignOut = () => setScreen('language');

  const SCREEN_LABELS = {
    language: t.screenLang,
    auth:     t.screenAuth,
    projects: t.screenProjects,
    upload:   t.screenUpload,
    plan:     t.screenPlan,
    results:  t.screenResults,
  };

  // Blank while Supabase resolves the initial session (avoids flash of wrong screen)
  if (loading) {
    return (
      <div dir={dir} style={{ fontFamily: font, minHeight: '100vh', background: 'var(--bg-primary)' }}/>
    );
  }

  return (
    <div dir={dir} style={{ fontFamily: font }}>
      {/* Dev screen switcher */}
      <div style={{
        position: 'fixed', top: 64, left: 12,
        zIndex: 100,
        background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: 8, padding: 4,
        display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: '92vw',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {SCREEN_KEYS.map((key, i) => (
          <button key={key} onClick={() => setScreen(key)}
            style={{
              background: screen === key ? 'var(--accent)' : 'transparent',
              border: 'none',
              color: screen === key ? '#fff' : 'var(--fg-muted)',
              padding: '6px 10px', borderRadius: 5,
              fontFamily: 'var(--font-latin)',
              fontSize: 11, fontWeight: 500, cursor: 'pointer',
              transition: 'all 160ms var(--ease-out)',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { if (screen !== key) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--fg-primary)'; }}}
            onMouseLeave={e => { if (screen !== key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-muted)'; }}}>
            <span style={{ fontFamily: 'var(--font-numeric)', marginInlineEnd: 3, opacity: 0.5 }}>{i + 1}.</span>
            {SCREEN_LABELS[key]}
          </button>
        ))}
      </div>

      {screen === 'language' && (
        <LanguageScreen onContinue={go(session ? 'projects' : 'auth')}/>
      )}
      {screen === 'auth'     && <AuthScreen/>}
      {screen === 'projects' && <ProjectsScreen onNew={go('upload')} onOpen={go('plan')} onSignOut={handleSignOut}/>}
      {/* key={code} remounts so translated initial state re-inits on language change */}
      {screen === 'upload'   && <UploadScreen   key={code} onNext={go('plan')}    onBack={go('projects')} onSignOut={handleSignOut}/>}
      {screen === 'plan'     && <PlanScreen     key={code} onNext={go('results')} onBack={go('upload')}   onSignOut={handleSignOut}/>}
      {screen === 'results'  && <ResultsScreen  key={code} onBack={go('plan')}                            onSignOut={handleSignOut}/>}
    </div>
  );
}
