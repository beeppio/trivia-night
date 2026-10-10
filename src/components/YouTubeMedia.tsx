import { useEffect, useRef, useState } from 'react';
import type { GameMedia } from '@/lib/local-games';

type YouTubePlayer = { seekTo: (time: number, allowSeekAhead: boolean) => void; playVideo: () => void; pauseVideo: () => void; mute: () => void; unMute: () => void; setVolume: (volume: number) => void; getDuration: () => number; getCurrentTime: () => number; destroy: () => void };
type YouTubeAPI = { Player: new (element: HTMLElement, options: { videoId: string; playerVars: Record<string, string | number>; events: { onReady: () => void; onError: () => void } }) => YouTubePlayer };
let apiPromise: Promise<YouTubeAPI> | undefined;
function loadAPI() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YouTubeAPI>((resolve, reject) => {
    const global = window as unknown as { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void };
    if (global.YT?.Player) { resolve(global.YT); return; }
    global.onYouTubeIframeAPIReady = () => resolve(global.YT!);
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => reject(new Error('YouTube failed to load.'));
    document.head.appendChild(script);
  });
  return apiPromise;
}

export function YouTubeMedia({ media, startedAt, pausedAt, soundEnabled, volume, loop, onProgress }: { media: GameMedia; startedAt: number | null; pausedAt: number | null; soundEnabled: boolean; volume: number; loop: boolean; onProgress: (elapsed: number, duration: number, ended: boolean) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [clipEnded, setClipEnded] = useState(false);
  const progress = useRef(onProgress);
  progress.current = onProgress;
  useEffect(() => {
    let cancelled = false;
    void loadAPI().then(api => {
      if (cancelled || !container.current) return;
      const mount = document.createElement('div');
      container.current.appendChild(mount);
      player.current = new api.Player(mount, { videoId: media.youtubeId!, playerVars: { controls: 0, disablekb: 1, playsinline: 1, origin: window.location.origin, rel: 0, start: Math.floor(media.trimStart ?? 0), ...(media.trimEnd !== undefined ? { end: Math.ceil(media.trimEnd) } : {}) }, events: { onReady: () => { if (!cancelled) setReady(true); }, onError: () => { if (!cancelled) { setError(true); progress.current(0, 0, true); } } } });
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; player.current?.destroy(); player.current = null; };
  }, [media.youtubeId]);
  useEffect(() => {
    if (!ready || !player.current) return;
    player.current.setVolume(volume * 100);
    if (soundEnabled) player.current.unMute(); else player.current.mute();
  }, [ready, soundEnabled, volume]);
  useEffect(() => {
    const video = player.current;
    if (!ready || !video) return;
    let synced = false;
    setClipEnded(false);
    const start = media.trimStart ?? 0;
    const tick = () => {
      const fullLength = video.getDuration();
      if (!fullLength) { if (startedAt && pausedAt === null) video.playVideo(); return; }
      const end = Math.min(media.trimEnd ?? fullLength, fullLength);
      const length = Math.max(0, end - start);
      if (!synced) {
        const elapsed = startedAt ? Math.max(0, ((pausedAt ?? Date.now()) - startedAt) / 1000) : 0;
        const position = loop && length > 0 ? elapsed % length : Math.min(elapsed, length);
        video.seekTo(start + position, true);
        if (startedAt && pausedAt === null && (loop || elapsed < length)) video.playVideo(); else video.pauseVideo();
        synced = true;
      }
      const time = video.getCurrentTime();
      if (time >= end && end > start) {
        if (loop && startedAt && pausedAt === null) { video.seekTo(start, true); video.playVideo(); }
        else video.pauseVideo();
      }
      const done = !loop && time >= end;
      setClipEnded(done);
      progress.current(Math.max(0, time - start), length, done);
    };
    tick();
    const interval = window.setInterval(tick, 100);
    return () => window.clearInterval(interval);
  }, [ready, startedAt, pausedAt, loop, media.trimStart, media.trimEnd]);
  return <div className="relative aspect-video overflow-hidden rounded-xl bg-secondary"><div ref={container} className="pointer-events-none h-full w-full [&_iframe]:h-full [&_iframe]:w-full" />{(!startedAt || pausedAt !== null || clipEnded || !ready) && !error && <div className="absolute inset-0 flex items-center justify-center bg-background text-sm text-primary">{!ready ? 'Loading media…' : clipEnded ? 'Clip finished' : pausedAt !== null ? 'Video paused' : 'Ready for host playback'}</div>}{error && <p role="alert" className="absolute inset-0 flex items-center justify-center bg-background p-5 text-sm text-destructive">Video could not play. It may be unavailable or embedding may be disabled.</p>}</div>;
}