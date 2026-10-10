import { useEffect, useState } from 'react';
import { ensureIdentity, supabase } from '@/integrations/supabase/client';

export function useServerClock(enabled: boolean) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!enabled || !supabase) return;
    let cancelled = false;
    const measure = async () => {
      try {
        await ensureIdentity();
        const start = Date.now();
        const result = await supabase!.rpc('trivia_server_time');
        if (!cancelled && !result.error) setOffset(Number(result.data) - (start + Date.now()) / 2);
      } catch { /* Room connection errors are shown by the room hook. */ }
    };
    void measure();
    const interval = window.setInterval(() => { void measure(); }, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [enabled]);
  return offset;
}
