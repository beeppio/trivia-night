import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { PublicSession } from '@/hooks/use-local-session';

export function useTVPreview(session: PublicSession | null) {
  const preview = useRef<Window | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const latest = useRef(session);
  latest.current = session;

  const publish = () => {
    const current = latest.current;
    const message = { type: '285-tv-session', session: current ? { ...current, media: [], answerMedia: [], rankings: current.rankings.map(({ frames, ...team }) => team) } : null };
    channel.current?.postMessage(message);
    const target = preview.current;
    if (target && !target.closed) target.postMessage(message, window.location.origin);
  };

  useEffect(() => {
    const connection = new BroadcastChannel('285-trivia-tv-session');
    channel.current = connection;
    connection.onmessage = event => {
      if (event.data?.type === '285-tv-request') publish();
    };
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== '285-tv-request' || !event.source) return;
      const source = event.source as Window;
      if (source !== preview.current) {
        try {
          if (source.opener !== window || source.location.pathname !== '/tv') return;
        } catch { return; }
        preview.current = source;
      }
      publish();
    };
    window.addEventListener('message', receive);
    const heartbeat = window.setInterval(publish, 1000);
    publish();
    return () => {
      window.removeEventListener('message', receive);
      window.clearInterval(heartbeat);
      connection.close();
      channel.current = null;
    };
  }, []);

  useEffect(() => { publish(); }, [session]);

  return () => {
    if (preview.current && !preview.current.closed) { preview.current.focus(); publish(); return; }
    preview.current = window.open(new URL('/tv', window.location.href).href, '285-live-tv-preview');
    if (!preview.current) toast.error('Allow pop-ups for this site to open the live TV preview.');
  };
}
