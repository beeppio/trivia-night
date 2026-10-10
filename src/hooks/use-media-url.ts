import { useEffect, useState } from 'react';
import type { GameMedia } from '@/lib/local-games';

export function useMediaUrl(media: GameMedia) {
  const [url, setUrl] = useState(media.url || '');
  useEffect(() => {
    if (!media.file) { setUrl(media.url || ''); return; }
    const objectUrl = URL.createObjectURL(media.file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [media.file, media.url]);
  return url;
}
