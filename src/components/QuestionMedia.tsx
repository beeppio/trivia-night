import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameMediaList } from '@/components/GameMedia';
import type { GameMedia } from '@/lib/local-games';

function QuestionMediaItem({ media, imagesRevealed, videoStartedAt, audience }: { media: GameMedia; imagesRevealed: boolean; videoStartedAt: number | null; audience: boolean }) {
  const [url, setUrl] = useState('');
  const [visible, setVisible] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(media.file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [media.file]);
  useEffect(() => {
    setVisible(false);
    if (!imagesRevealed || !url) return;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(frame);
  }, [imagesRevealed, url]);
  useEffect(() => {
    const element = video.current;
    if (!element || !url) return;
    if (!videoStartedAt) { element.pause(); element.currentTime = 0; return; }
    const play = () => {
      element.currentTime = Math.min(Math.max(0, (Date.now() - videoStartedAt) / 1000), Number.isFinite(element.duration) ? element.duration : Infinity);
      void element.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
    };
    if (element.readyState >= 1) play();
    else element.addEventListener('loadedmetadata', play, { once: true });
    return () => element.removeEventListener('loadedmetadata', play);
  }, [videoStartedAt, url]);
  if (media.kind === 'image') return imagesRevealed && url ? <img src={url} alt={media.name} style={{ opacity: visible ? 1 : 0 }} className="max-h-96 w-auto rounded-xl object-contain transition-opacity duration-700 motion-reduce:transition-none" /> : null;
  if (media.kind !== 'video') return <GameMediaList media={[media]} />;
  return <div className="space-y-3">
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
      <video ref={video} src={url || undefined} playsInline preload="metadata" controls={false} tabIndex={-1} disablePictureInPicture disableRemotePlayback className="pointer-events-none h-full w-full object-contain" />
      {!videoStartedAt && <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"><Play aria-hidden="true" className="h-8 w-8 fill-primary text-primary" /></span></div>}
    </div>
    {blocked && <div className="rounded-xl border border-primary/30 p-3"><p className="mb-2 text-xs text-muted-foreground">Your browser requires a tap to allow video playback.</p><Button className="rounded-xl text-white" onClick={() => { const element = video.current; if (!element) return; if (videoStartedAt) element.currentTime = Math.max(0, (Date.now() - videoStartedAt) / 1000); void element.play().then(() => setBlocked(false)).catch(() => setBlocked(true)); }}>Allow {audience ? 'host video' : 'video'} playback</Button></div>}
  </div>;
}

export function QuestionMedia({ media, imagesRevealed, videoStartedAt, audience = false }: { media: GameMedia[]; imagesRevealed: boolean; videoStartedAt: number | null; audience?: boolean }) {
  return <div className="space-y-4">{media.map(item => <QuestionMediaItem key={item.id} media={item} imagesRevealed={imagesRevealed} videoStartedAt={videoStartedAt} audience={audience} />)}</div>;
}
