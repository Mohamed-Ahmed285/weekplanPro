import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False until the two env vars are set (locally in .env.local, on Vercel in project settings). */
export const isConfigured = Boolean(url && anonKey);
export const googleEnabled = import.meta.env.VITE_ENABLE_GOOGLE === 'true';

// The anon key is public by design; Row Level Security (supabase/schema.sql) protects the data.
export const supabase = isConfigured ? createClient(url, anonKey) : null;
