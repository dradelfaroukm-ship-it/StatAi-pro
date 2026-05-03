import { useState, useEffect } from 'react';
import { useLanguage } from './context/LanguageContext';
import LanguageScreen from './screens/LanguageScreen';
import AuthScreen from './screens/AuthScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import UploadScreen from './screens/UploadScreen';
import PlanScreen from './screens/PlanScreen';
import ResultsScreen from './screens/ResultsScreen';

const SCREEN_KEYS = ['language', 'auth', 'projects', 'upload', 'plan', 'results'];

export default function App() {
  const { dir, font, t, code } = useLanguage();

  const getInitialScreen = () => {
    const hash = window.location.hash.replace('#', '');
    return SCREEN_KEYS.includes(hash) ? hash : 'language';
  };

  const [screen, setScreen] = useState(getInitialScreen);

  useEffect(() => {
    window.location.hash = screen;
    document.title = `StatAI`;
  }, [screen]);

  const go = (key) => () => setScreen(key);

  const SCREEN_LABELS = {
    language: t.screenLang,
    auth:     t.screenAuth,
    projects: t.screenProjects,
    upload:   t.screenUpload,
    plan:     t.screenPlan,
    results:  t.screenResults,
  };

  return (
    <div dir={dir} style={{ fontFamily: font }}>
      {/* Dev screen switcher */}
      <div style={{
        position: 'fixed', top: 12, left: 12,
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

      {screen === 'language' && <LanguageScreen onContinue={go('auth')}/>}
      {screen === 'auth'     && <AuthScreen onLogin={go('projects')}/>}
      {screen === 'projects' && <ProjectsScreen onNew={go('upload')} onOpen={go('plan')}/>}
      {/* key={code} remounts these screens when language changes so state re-inits with new translations */}
      {screen === 'upload'   && <UploadScreen key={code} onNext={go('plan')} onBack={go('projects')}/>}
      {screen === 'plan'     && <PlanScreen   key={code} onNext={go('results')} onBack={go('upload')}/>}
      {screen === 'results'  && <ResultsScreen key={code} onBack={go('plan')}/>}
    </div>
  );
}
