import { useState, useEffect, useRef } from 'react';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import { StepSidebar, SIDEBAR_W } from './components/Common';
import LanguageScreen from './screens/LanguageScreen';
import AuthScreen from './screens/AuthScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import UploadScreen from './screens/UploadScreen';
import PlanScreen from './screens/PlanScreen';
import ResultsScreen from './screens/ResultsScreen';

const SCREEN_KEYS = ['language', 'auth', 'projects', 'upload', 'plan', 'results'];
const PROTECTED   = new Set(['projects', 'upload', 'plan', 'results']);

export default function App() {
  const { dir, font, code } = useLanguage();
  const { session, loading }   = useAuth();

  const [screen, setScreen] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return SCREEN_KEYS.includes(hash) ? hash : 'language';
  });

  // Keep a ref so the session-change effect always reads the current screen
  // without adding it to its own dep array (which would re-run it on manual nav).
  const screenRef = useRef(screen);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  // After login / OAuth callback: redirect away from non-app screens.
  // Intentionally omits `screen` from deps so manual sidebar navigation to
  // Language or Login is not immediately overridden while the user is logged in.
  useEffect(() => {
    if (loading) return;
    if (session && !PROTECTED.has(screenRef.current)) {
      setScreen('projects');
    }
  }, [session, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guard protected screens: kick to auth if session is lost.
  useEffect(() => {
    if (loading) return;
    if (!session && PROTECTED.has(screen)) {
      setScreen('auth');
    }
  }, [session, loading, screen]);

  useEffect(() => {
    window.location.hash = screen;
    document.title = 'StatAI';
  }, [screen]);

  const go = (key) => () => setScreen(key);

  const handleSignOut = () => setScreen('language');

  const showSidebar = !['language', 'auth'].includes(screen);

  if (loading) {
    return (
      <div dir={dir} style={{ fontFamily: font, minHeight: '100vh', background: 'var(--bg-primary)' }}/>
    );
  }

  return (
    <div dir={dir} style={{ fontFamily: font }}>
      {screen === 'language' && (
        <LanguageScreen onContinue={go(session ? 'projects' : 'auth')}/>
      )}
      {screen === 'auth' && <AuthScreen/>}

      {showSidebar && <StepSidebar currentScreen={screen} onNavigate={setScreen}/>}

      {showSidebar && (
        <div style={{ paddingInlineStart: SIDEBAR_W }}>
          {screen === 'projects' && <ProjectsScreen onNew={go('upload')} onOpen={go('plan')} onSignOut={handleSignOut}/>}
          {/* key={code} remounts so translated initial state re-inits on language change */}
          {screen === 'upload'   && <UploadScreen   key={code} onNext={go('plan')}    onBack={go('projects')} onSignOut={handleSignOut}/>}
          {screen === 'plan'     && <PlanScreen     key={code} onNext={go('results')} onBack={go('upload')}   onSignOut={handleSignOut}/>}
          {screen === 'results'  && <ResultsScreen  key={code} onBack={go('plan')}                            onSignOut={handleSignOut}/>}
        </div>
      )}
    </div>
  );
}
