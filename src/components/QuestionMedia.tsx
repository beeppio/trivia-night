import { useEffect, useRef, useState } from 'react';
import { FileText, Play } from 'lucide-react';
import type { GameMedia } from '@/lib/local-games';

function QuestionMediaItem({ media, imagesRevealed, videoStartedAt, audience }: { media: GameMedia; imagesRevealed: boolean; videoStartedAt: number | null; audience: boolean }) {
  const [url, setUrl] = useState('');
  const [visible, setVisible] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [progress, setProgress] = useState(0);
  const element = useRef<HTMLMediaElement | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(media.file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [media.file]);
  useEffect(() => {
    setVisible(false);
    if (!imagesRevealed || !url) return;
    let second = 0;
    const frame = requestAnimationFrame(() => { second = requestAnimationFrame(() => setVisible(true)); });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(second); };
  }, [imagesRevealed, url]);
  useEffect(() => {
    const player = element.current;
    if (!player || !url) return;
    setBlocked(false);
    if (!videoStartedAt) { player.pause(); player.currentTime = 0; setProgress(0); return; }
    const play = () => {
      player.currentTime = Math.min(Math.max(0, (Date.now() - videoStartedAt) / 1000), Number.isFinite(player.duration) ? player.duration : Infinity);
      void player.play().catch(() => setBlocked(true));
    };
    if (player.readyState >= 1) play();
    else player.addEventListener('loadedmetadata', play, { once: true });
    return () => player.removeEventListener('loadedmetadata', play);
  }, [videoStartedAt, url]);
  const updateProgress = () => {
    const player = element.current;
    if (player && Number.isFinite(player.duration) && player.duration > 0) setProgress(player.currentTime / player.duration * 100);
  };
  if (media.kind === 'image') return imagesRevealed && url ? <img src={url} alt="Question illustration" style={{ opacity: visible ? 1 : 0 }} className="max-h-96 w-auto rounded-xl object-contain transition-opacity duration-700 motion-reduce:transition-none" /> : null;
  if (media.kind === 'pdf') return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary"><FileText className="h-4 w-4" />Open PDF</a> : null;
  return <div className="space-y-2">
    {media.kind === 'audio' ? <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-secondary/20 p-4">
      <audio ref={node => { element.current = node; }} src={url || undefined} preload="metadata" onTimeUpdate={updateProgress} />
      <Play aria-hidden="true" className="h-6 w-6 shrink-0 fill-primary text-primary" />
      <div role="progressbar" aria-label="Audio progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="h-2 w-full overflow-hidden rounded-full bg-secondary"><div style={{ width: `${progress}%` }} className="h-full rounded-full bg-primary transition-[width] duration-200" /></div>
    </div> : <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
      <video ref={node => { element.current = node; }} src={url || undefined} playsInline preload="metadata" controls={false} tabIndex={-1} disablePictureInPicture disableRemotePlayback className="pointer-events-none h-full w-full object-contain" />
      {!videoStartedAt && <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"><Play aria-hidden="true" className="h-8 w-8 fill-primary text-primary" /></span></div>}
    </div>}
    {blocked && <p role="status" className="text-xs text-muted-foreground">{audience ? 'Your browser blocked host-triggered playback. Allow autoplay for this site in your browser settings.' : 'Your browser blocked playback. Allow autoplay for this site in your browser settings.'}</p>}
  </div>;
}

export function QuestionMedia({ media, imagesRevealed, videoStartedAt, audience = false }: { media: GameMedia[]; imagesRevealed: boolean; videoStartedAt: number | null; audience?: boolean }) {
  return <div className="space-y-4">{media.map(item => <QuestionMediaItem key={item.id} media={item} imagesRevealed={imagesRevealed} videoStartedAt={videoStartedAt} audience={audience} />)}</div>;
}
