import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { GameMedia } from '@/lib/local-games';

type Settings = { media?: GameMedia; enabled: boolean };
const empty: Settings = { enabled: false };
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('285-homepage-music', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('settings');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export function useHomepageMusic() {
  const [settings, setSettings] = useState<Settings>(empty);
  const [loaded, setLoaded] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const db = await database();
        const transaction = db.transaction('settings', 'readonly');
        const request = transaction.objectStore('settings').get('homepage');
        request.onsuccess = () => { if (!cancelled) { setSettings(request.result || empty); setStartedAt(Date.now()); setLoaded(true); } };
        transaction.oncomplete = () => db.close();
      } catch { if (!cancelled) { setLoaded(true); toast.error('Unable to restore homepage music.'); } }
    };
    void load();
    const channel = new BroadcastChannel('285-homepage-music');
    channel.onmessage = event => { setSettings(event.data); setStartedAt(Date.now()); };
    return () => { cancelled = true; channel.close(); };
  }, []);
  const update = async (next: Settings) => {
    if (next.media?.trimEnd !== undefined && next.media.trimEnd <= (next.media.trimStart ?? 0)) { toast.error('Clip end must be after its start.'); return; }
    try {
      const db = await database();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('settings', 'readwrite');
        transaction.objectStore('settings').put(next, 'homepage');
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onabort = () => { db.close(); reject(transaction.error); };
      });
      setSettings(next); setStartedAt(Date.now());
      const channel = new BroadcastChannel('285-homepage-music');
      channel.postMessage(next); channel.close();
    } catch { toast.error('Unable to save homepage music. Check browser storage.'); }
  };
  return { ...settings, loaded, startedAt, update };
}
