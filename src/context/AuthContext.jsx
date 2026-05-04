import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = still loading, null = no session, object = authenticated
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    const hasOAuthToken = window.location.hash.includes('access_token=');

    const init = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
    };

    // Give Supabase time to parse the access_token from the URL hash before
    // calling getSession, otherwise it returns null and we loop back to auth.
    if (hasOAuthToken) {
      setTimeout(init, 2000);
    } else {
      init();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ session, signOut, loading: session === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
