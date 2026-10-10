import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;

let identity: Promise<string> | undefined;
export function ensureIdentity(): Promise<string> {
  if (!supabase) return Promise.reject(new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then rebuild.'));
  identity ??= (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) return data.session.user.id;
    const result = await supabase.auth.signInAnonymously();
    if (result.error) throw result.error;
    return result.data.user!.id;
  })().catch(error => { identity = undefined; throw error; });
  return identity;
}
