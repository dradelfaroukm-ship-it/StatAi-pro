import { useState, useEffect } from 'react';
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

  // Route protection: runs whenever session or screen changes
  useEffect(() => {
    if (loading) return;
    // No session on a protected screen → send to auth
    if (!session && PROTECTED.has(screen)) {
      setScreen('auth');
    }
    // Session exists but on a non-app screen (language, auth, or any OAuth callback URL
    // that didn't match a screen key) → go straight to projects
    if (session && !PROTECTED.has(screen)) {
      setScreen('projects');
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

      {showSidebar && <StepSidebar currentScreen={screen}/>}

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
