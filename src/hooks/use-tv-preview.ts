import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { PublicSession } from '@/hooks/use-local-session';

export function useTVPreview(session: PublicSession | null) {
  const preview = useRef<Window | null>(null);
  const latest = useRef(session);
  latest.current = session;

  const publish = () => {
    const target = preview.current;
    if (!target || target.closed) return;
    const current = latest.current;
    target.postMessage({ type: '285-tv-session', session: current ? { ...current, media: [], answerMedia: [], results: undefined, answer: undefined, rankings: current.rankings.map(({ frames, ...team }) => team) } : null }, window.location.origin);
  };

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== preview.current || event.data?.type !== '285-tv-request') return;
      publish();
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);

  useEffect(() => { publish(); }, [session]);

  return () => {
    if (preview.current && !preview.current.closed) { preview.current.focus(); publish(); return; }
    preview.current = window.open(new URL('/tv', window.location.href).href, '285-live-tv-preview');
    if (!preview.current) toast.error('Allow pop-ups for this site to open the live TV preview.');
  };
}
