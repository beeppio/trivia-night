import { useEffect, useRef, useState } from 'react';
import { FileText, Music2, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GameMedia } from '@/lib/local-games';

type PlaybackProps = { imagesRevealed: boolean; videoStartedAt: number | null; pausedAt?: number | null; audience?: boolean; onToggle?: () => void; onReplay?: () => void; controlsDisabled?: boolean };
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function QuestionMediaItem({ media, imagesRevealed, videoStartedAt, pausedAt = null, audience = false, onToggle, onReplay, controlsDisabled = false }: PlaybackProps & { media: GameMedia }) {
  const [url, setUrl] = useState('');
  const [visible, setVisible] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ended, setEnded] = useState(false);
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
  const updateProgress = () => {
    const player = element.current;
    if (!player) return;
    setElapsed(player.currentTime);
    if (Number.isFinite(player.duration) && player.duration > 0) { setDuration(player.duration); setProgress(player.currentTime / player.duration * 100); }
  };
  useEffect(() => {
    const player = element.current;
    if (!player || !url) return;
    setBlocked(false); setEnded(false);
    if (!videoStartedAt) { player.pause(); player.currentTime = 0; setProgress(0); setElapsed(0); return; }
    const sync = () => {
      const position = Math.max(0, ((pausedAt ?? Date.now()) - videoStartedAt) / 1000);
      player.currentTime = Math.min(position, Number.isFinite(player.duration) ? player.duration : position);
      updateProgress();
      if (pausedAt !== null || (Number.isFinite(player.duration) && position >= player.duration)) { player.pause(); setEnded(pausedAt === null); }
      else void player.play().catch(() => setBlocked(true));
    };
    if (player.readyState >= 1) sync();
    else player.addEventListener('loadedmetadata', sync, { once: true });
    return () => player.removeEventListener('loadedmetadata', sync);
  }, [videoStartedAt, pausedAt, url]);
  if (media.kind === 'image') return imagesRevealed && url ? <img src={url} alt="Question illustration" style={{ opacity: visible ? 1 : 0 }} className="max-h-96 w-auto rounded-xl object-contain transition-opacity duration-700 motion-reduce:transition-none" /> : null;
  if (media.kind === 'pdf') return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary"><FileText className="h-4 w-4" />Open PDF</a> : null;
  const playing = videoStartedAt !== null && pausedAt === null && !ended;
  const toggleLabel = playing ? 'Pause' : pausedAt !== null ? 'Resume' : 'Play';
  const videoControls = !audience && onToggle && <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" className="rounded-xl border-primary/40 text-primary" disabled={controlsDisabled} onClick={ended ? onReplay : onToggle}>{playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{toggleLabel}</Button><Button size="icon" variant="ghost" aria-label="Replay video" title="Replay" className="h-9 w-9 rounded-xl text-primary hover:bg-primary/15" disabled={controlsDisabled} onClick={onReplay}><RotateCcw className="h-4 w-4" /></Button><span className="ml-auto text-xs tabular-nums text-muted-foreground">{timeLabel(elapsed)} / {timeLabel(duration)}</span></div>;
  return <div className="space-y-3">
    {media.kind === 'audio' ? <div className="rounded-xl border border-primary/30 bg-secondary/20 p-4">
      <audio ref={node => { element.current = node; }} src={url || undefined} preload="metadata" onLoadedMetadata={updateProgress} onTimeUpdate={updateProgress} onEnded={() => setEnded(true)} />
      <div className="flex items-center gap-3">
        {audience ? <Music2 aria-hidden="true" className="h-6 w-6 shrink-0 text-primary" /> : <Button size="icon" variant="ghost" aria-label={`${toggleLabel} audio`} title={toggleLabel} disabled={controlsDisabled} onClick={ended ? onReplay : onToggle} className="h-10 w-10 shrink-0 rounded-full text-primary hover:bg-primary/15 hover:text-primary">{playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}</Button>}
        <div className="min-w-0 flex-1"><div role="progressbar" aria-label="Audio progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="h-2 w-full overflow-hidden rounded-full bg-secondary"><div style={{ width: `${progress}%` }} className="h-full rounded-full bg-primary transition-[width] duration-200" /></div>{!audience && <p className="mt-2 text-xs tabular-nums text-muted-foreground">{timeLabel(elapsed)} / {timeLabel(duration)}</p>}</div>
        {!audience && <Button size="icon" variant="ghost" aria-label="Replay audio" title="Replay" disabled={controlsDisabled} onClick={onReplay} className="h-10 w-10 shrink-0 rounded-full text-primary hover:bg-primary/15 hover:text-primary"><RotateCcw className="h-5 w-5" /></Button>}
      </div>
    </div> : <><div className="relative aspect-video overflow-hidden rounded-xl bg-black">
      <video ref={node => { element.current = node; }} src={url || undefined} playsInline preload="metadata" onLoadedMetadata={updateProgress} onTimeUpdate={updateProgress} onEnded={() => setEnded(true)} controls={false} tabIndex={-1} disablePictureInPicture disableRemotePlayback className="pointer-events-none h-full w-full object-contain" />
      {!videoStartedAt && <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20"><Play aria-hidden="true" className="h-8 w-8 fill-primary text-primary" /></span></div>}
    </div>{videoControls}</>}
    {blocked && <p role="status" className="text-xs text-muted-foreground">{audience ? 'Your browser blocked host-triggered playback. Allow autoplay for this site in your browser settings.' : 'Your browser blocked playback. Allow autoplay for this site in your browser settings.'}</p>}
  </div>;
}

export function QuestionMedia({ media, ...playback }: PlaybackProps & { media: GameMedia[] }) {
  return <div className="space-y-4">{media.map(item => <QuestionMediaItem key={item.id} media={item} {...playback} />)}</div>;
}
