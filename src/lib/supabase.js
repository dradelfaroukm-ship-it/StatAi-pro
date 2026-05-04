import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Diagnostics — visible in browser DevTools console
console.log('[StatAI] Supabase init:', {
  url: url ? `${url.slice(0, 30)}…` : 'MISSING',
  key: key ? `${key.slice(0, 12)}…` : 'MISSING',
  mode: import.meta.env.MODE,
});

if (!url || !key) {
  console.error('[StatAI] CRITICAL: Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel → Project → Settings → Environment Variables, then redeploy.');
}

export const supabase = createClient(url ?? '', key ?? '');
