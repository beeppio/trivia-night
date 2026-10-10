import { useEffect, useRef, useState } from 'react';
import { FileText, Music2, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { YouTubeMedia } from '@/components/YouTubeMedia';
import { useMediaUrl } from '@/hooks/use-media-url';
import type { GameMedia } from '@/lib/local-games';

type PlaybackProps = { imagesRevealed: boolean; videoStartedAt: number | null; pausedAt?: number | null; audience?: boolean; soundEnabled?: boolean; volume?: number; loop?: boolean; onToggle?: () => void; onReplay?: () => void; controlsDisabled?: boolean; onPlaybackChange?: (id: string, playing: boolean) => void };
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function QuestionMediaItem({ media, imagesRevealed, videoStartedAt, pausedAt = null, audience = false, soundEnabled = false, volume = 1, loop = false, onToggle, onReplay, controlsDisabled = false, onPlaybackChange }: PlaybackProps & { media: GameMedia }) {
  const url = useMediaUrl(media);
  const [blocked, setBlocked] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(Math.max(0, (media.trimEnd ?? 0) - (media.trimStart ?? 0)));
  const [ended, setEnded] = useState(false);
  const element = useRef<HTMLMediaElement | null>(null);
  const start = media.trimStart ?? 0;
  const playing = videoStartedAt !== null && pausedAt === null && !ended;
  const playbackCallback = useRef(onPlaybackChange);
  playbackCallback.current = onPlaybackChange;
  useEffect(() => {
    if (media.kind !== 'audio' && media.kind !== 'video') return;
    playbackCallback.current?.(media.id, playing && !blocked);
    return () => playbackCallback.current?.(media.id, false);
  }, [media.id, media.kind, playing, blocked]);
  const updateProgress = () => {
    const player = element.current;
    if (!player) return;
    const end = Math.min(media.trimEnd ?? player.duration, player.duration);
    if (!Number.isFinite(end)) return;
    setDuration(Math.max(0, end - start));
    setElapsed(Math.max(0, player.currentTime - start));
    if (player.currentTime >= end) {
      if (loop && videoStartedAt && pausedAt === null) { player.currentTime = start; void player.play().catch(() => setBlocked(true)); }
      else { player.pause(); setEnded(true); }
    }
  };
  useEffect(() => {
    const player = element.current;
    if (!player) return;
    player.muted = !soundEnabled;
    player.volume = volume;
    if (soundEnabled && videoStartedAt && pausedAt === null && !ended) void player.play().catch(() => setBlocked(true));
  }, [soundEnabled, volume]);
  useEffect(() => {
    const player = element.current;
    if (!player || !url || media.youtubeId) return;
    setBlocked(false); setEnded(false);
    const sync = () => {
      const end = Math.min(media.trimEnd ?? player.duration, player.duration);
      const length = Math.max(0, end - start);
      const position = videoStartedAt ? Math.max(0, ((pausedAt ?? Date.now()) - videoStartedAt) / 1000) : 0;
      player.currentTime = start + (loop && length > 0 ? position % length : Math.min(position, length));
      updateProgress();
      if (!videoStartedAt || pausedAt !== null || (!loop && position >= length)) { player.pause(); setEnded(Boolean(videoStartedAt && pausedAt === null && position >= length)); }
      else void player.play().catch(() => setBlocked(true));
    };
    if (player.readyState >= 1) sync(); else player.addEventListener('loadedmetadata', sync, { once: true });
    const interval = window.setInterval(updateProgress, 100);
    return () => { player.removeEventListener('loadedmetadata', sync); window.clearInterval(interval); };
  }, [videoStartedAt, pausedAt, url, start, media.trimEnd, loop]);
  useEffect(() => {
    if (!media.youtubeId || audience) return;
    const tick = () => {
      const length = media.trimEnd !== undefined ? media.trimEnd - start : 0;
      const position = videoStartedAt ? Math.max(0, ((pausedAt ?? Date.now()) - videoStartedAt) / 1000) : 0;
      setElapsed(length > 0 ? Math.min(position, length) : position);
      setDuration(length); setEnded(length > 0 && position >= length);
    };
    tick(); const interval = window.setInterval(tick, 100);
    return () => window.clearInterval(interval);
  }, [media.youtubeId, audience, videoStartedAt, pausedAt, start, media.trimEnd]);
  if (media.kind === 'image') return imagesRevealed && url ? <img src={url} alt={media.name || 'Question illustration'} className="max-h-96 w-auto rounded-xl object-contain" /> : null;
  if (media.kind === 'pdf') return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary"><FileText className="h-4 w-4" />Open PDF</a> : null;
  const toggleLabel = playing ? 'Pause' : pausedAt !== null ? 'Resume' : 'Play';
  const controls = !audience && <><Button size="icon" variant="ghost" aria-label={`${toggleLabel} ${media.kind}`} title={toggleLabel} disabled={controlsDisabled} onClick={ended ? onReplay : onToggle} className="h-10 w-10 shrink-0 rounded-full text-primary hover:bg-primary/15 hover:text-primary">{playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}</Button></>;
  const replay = !audience && <Button size="icon" variant="ghost" aria-label={`Replay ${media.kind}`} title="Replay" disabled={controlsDisabled} onClick={onReplay} className="h-10 w-10 shrink-0 rounded-full text-primary hover:bg-primary/15 hover:text-primary"><RotateCcw className="h-5 w-5" /></Button>;
  const youtube = media.youtubeId && audience ? <YouTubeMedia media={media} startedAt={videoStartedAt} pausedAt={pausedAt} soundEnabled={soundEnabled} volume={volume} loop={loop} onProgress={(time, length, done) => { setElapsed(time); setDuration(length); setEnded(done); }} /> : null;
  return <div className="space-y-3">
    {media.kind === 'audio' ? <div className="rounded-xl border border-primary/30 bg-secondary/20 p-4">
      {media.youtubeId ? youtube : <audio ref={node => { element.current = node; }} src={url || undefined} muted={!soundEnabled} preload="metadata" onLoadedMetadata={updateProgress} onTimeUpdate={updateProgress} onEnded={() => setEnded(!loop)} onError={() => setBlocked(true)} />}
      <div className="flex items-center gap-3">{audience ? <Music2 aria-hidden="true" className="h-6 w-6 shrink-0 text-primary" /> : controls}<div className="min-w-0 flex-1"><div role="progressbar" aria-label="Audio progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={duration > 0 ? Math.round(elapsed / duration * 100) : 0} className="h-2 overflow-hidden rounded-full bg-secondary"><div style={{ width: `${duration > 0 ? Math.min(100, elapsed / duration * 100) : 0}%` }} className="h-full rounded-full bg-primary transition-[width] duration-100" /></div>{!audience && <p className="mt-2 text-xs tabular-nums text-muted-foreground">{timeLabel(elapsed)} / {duration > 0 ? timeLabel(duration) : '—'}</p>}</div>{replay}</div>
    </div> : <>{media.youtubeId ? audience ? youtube : null : <div className={audience ? 'relative aspect-video overflow-hidden rounded-xl bg-secondary' : 'hidden'}><video ref={node => { element.current = node; }} src={url || undefined} muted={!soundEnabled} playsInline preload="metadata" onLoadedMetadata={updateProgress} onTimeUpdate={updateProgress} onEnded={() => setEnded(!loop)} onError={() => setBlocked(true)} controls={false} tabIndex={-1} disablePictureInPicture disableRemotePlayback className="pointer-events-none h-full w-full object-contain" />{!videoStartedAt && <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center bg-secondary"><Play className="h-16 w-16 fill-primary text-primary" /></div>}</div>}{!audience && <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-secondary/20 p-4">{controls}<div className="min-w-0 flex-1"><div role="progressbar" aria-label="Video progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={duration > 0 ? Math.min(100, Math.round(elapsed / duration * 100)) : 0} className="h-2 overflow-hidden rounded-full bg-secondary"><div style={{ width: `${duration > 0 ? Math.min(100, elapsed / duration * 100) : 0}%` }} className="h-full rounded-full bg-primary transition-[width] duration-100" /></div><p className="mt-2 text-xs tabular-nums text-muted-foreground">{timeLabel(elapsed)} / {duration > 0 ? timeLabel(duration) : '—'}</p></div>{replay}</div>}</>}
    {blocked && <p role="status" className="text-xs text-destructive">Media could not play. Check the link/file and allow autoplay on the TV screen.</p>}
  </div>;
}

export function QuestionMedia({ media, ...playback }: PlaybackProps & { media: GameMedia[] }) {
  return <div className="space-y-4">{media.map(item => <QuestionMediaItem key={item.id} media={item} {...playback} />)}</div>;
}