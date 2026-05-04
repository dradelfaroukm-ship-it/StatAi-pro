import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://uyjnqirqxeggpdvgsvat.supabase.co';

const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('[StatAI] Supabase init:', {
  url,
  keyPresent: !!key,
  keyPreview: key ? `${key.slice(0, 20)}…` : 'MISSING — set VITE_SUPABASE_ANON_KEY in Vercel',
  source: import.meta.env.VITE_SUPABASE_URL ? 'env var' : 'hardcoded fallback',
  mode: import.meta.env.MODE,
});

export const supabase = createClient(url, key || 'missing-anon-key');
