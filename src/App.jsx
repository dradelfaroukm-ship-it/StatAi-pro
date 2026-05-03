import { useState, useEffect } from 'react';
import { useLanguage } from './context/LanguageContext';
import LanguageScreen from './screens/LanguageScreen';
import AuthScreen from './screens/AuthScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import UploadScreen from './screens/UploadScreen';
import PlanScreen from './screens/PlanScreen';
import ResultsScreen from './screens/ResultsScreen';

const SCREEN_KEYS   = ['language', 'auth', 'projects', 'upload', 'plan', 'results'];
const SCREEN_LABELS = { language: 'اللغة', auth: 'الدخول', projects: 'المشاريع', upload: 'الرفع', plan: 'الخطة', results: 'النتائج' };

export default function App() {
  const { dir, font } = useLanguage();

  const getInitialScreen = () => {
    const hash = window.location.hash.replace('#', '');
    return SCREEN_KEYS.includes(hash) ? hash : 'language';
  };

  const [screen, setScreen] = useState(getInitialScreen);

  useEffect(() => {
    window.location.hash = screen;
    document.title = `StatAI — ${SCREEN_LABELS[screen] || ''}`;
  }, [screen]);

  const go = (key) => () => setScreen(key);

  return (
    <div dir={dir} style={{ fontFamily: font }}>
      {/* Dev screen switcher */}
      <div style={{
        position: 'fixed', top: 16, left: 16,
        zIndex: 100,
        background: 'rgba(17,24,39,0.92)', backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: 12, padding: 6,
        display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: '92vw',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {SCREEN_KEYS.map((key, i) => (
          <button key={key} onClick={() => setScreen(key)}
            style={{
              background: screen === key ? 'var(--accent)' : 'transparent',
              border: 'none',
              color: screen === key ? '#fff' : 'var(--fg-secondary)',
              padding: '8px 12px', borderRadius: 8,
              fontFamily: 'var(--font-arabic)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 160ms var(--ease-out)',
            }}
            onMouseEnter={e => { if (screen !== key) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--fg-primary)'; }}}
            onMouseLeave={e => { if (screen !== key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-secondary)'; }}}>
            <span style={{ fontFamily: 'var(--font-numeric)', marginInlineEnd: 4 }}>{i + 1}.</span>
            {SCREEN_LABELS[key]}
          </button>
        ))}
      </div>

      {screen === 'language' && <LanguageScreen onContinue={go('auth')}/>}
      {screen === 'auth'     && <AuthScreen onLogin={go('projects')}/>}
      {screen === 'projects' && <ProjectsScreen onNew={go('upload')} onOpen={go('plan')}/>}
      {screen === 'upload'   && <UploadScreen onNext={go('plan')} onBack={go('projects')}/>}
      {screen === 'plan'     && <PlanScreen onNext={go('results')} onBack={go('upload')}/>}
      {screen === 'results'  && <ResultsScreen onBack={go('plan')}/>}
    </div>
  );
}
