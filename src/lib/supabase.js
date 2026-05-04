import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uyjnqirqxeggpdvgsvat.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5am5xaXJxeGVnZ3BkdmdzdmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQ5OTQsImV4cCI6MjA5MzQyMDk5NH0.Nh8qFTUqFQwyyEtsyRQD1pj_B517PWonsOC18K2pMW8';

console.log('[StatAI] Supabase init:', {
  url: supabaseUrl,
  keySource: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'env var' : 'hardcoded fallback',
  keyPreview: `${supabaseKey.slice(0, 20)}…`,
  mode: import.meta.env.MODE,
});

export const supabase = createClient(supabaseUrl, supabaseKey);
