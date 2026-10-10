import { useEffect, useState } from 'react';
import type { GameMedia } from '@/lib/local-games';
import { supabase } from '@/integrations/supabase/client';

export function useMediaUrl(media: GameMedia) {
  const [url, setUrl] = useState(media.url || '');
  useEffect(() => {
    if (media.file) {
      const objectUrl = URL.createObjectURL(media.file);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    if (!media.storagePath || !supabase) { setUrl(media.url || ''); return; }
    let cancelled = false;
    let objectUrl = '';
    setUrl('');
    void supabase.storage.from('trivia-media').download(media.storagePath).then(({ data, error }) => {
      if (cancelled || error || !data) return;
      objectUrl = URL.createObjectURL(data); setUrl(objectUrl);
    });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [media.file, media.url, media.storagePath]);
  return url;
}
