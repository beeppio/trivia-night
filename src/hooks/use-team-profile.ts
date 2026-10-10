import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { PlayerProfile } from '@/hooks/use-local-session';

function openProfiles(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('285-team-profiles', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('profiles');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function useTeamProfile(room: string) {
  const [profile, setProfile] = useState<PlayerProfile>();
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const key = `285-device-team-${room}`;
        let id = localStorage.getItem(key);
        if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
        const database = await openProfiles();
        const saved = await new Promise<PlayerProfile | undefined>((resolve, reject) => {
          const request = database.transaction('profiles', 'readonly').objectStore('profiles').get(room);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        database.close();
        if (!cancelled) setProfile(saved ? { ...saved, id } : { id, name: '', ready: false });
      } catch { if (!cancelled) setError(true); }
    };
    void restore();
    return () => { cancelled = true; };
  }, [room]);
  const updateProfile = useCallback((next: PlayerProfile) => {
    setProfile(next);
    void openProfiles().then(database => {
      const transaction = database.transaction('profiles', 'readwrite');
      transaction.objectStore('profiles').put(next, room);
      transaction.oncomplete = () => database.close();
      transaction.onabort = () => { database.close(); toast.error('Your profile could not be saved on this device. Check browser storage.'); };
    }).catch(() => toast.error('Your profile could not be saved on this device.'));
  }, [room]);
  return { profile, updateProfile, error };
}
