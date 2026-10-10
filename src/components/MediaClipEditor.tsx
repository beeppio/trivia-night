import { useEffect, useRef, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Music2, Pause, Play, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { YouTubeMedia } from '@/components/YouTubeMedia';
import { useMediaUrl } from '@/hooks/use-media-url';
import type { GameMedia } from '@/lib/local-games';

const timestamp = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, '0')}`;

export function MediaClipEditor({ media, onChange }: { media: GameMedia; onChange: (media: GameMedia) => void }) {
  const url = useMediaUrl(media);
  const player = useRef<HTMLMediaElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(media.trimStart ?? 0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const start = duration > 0 ? Math.min(media.trimStart ?? 0, Math.max(0, duration - 0.1)) : media.trimStart ?? 0;
  const end = duration > 0 ? Math.min(media.trimEnd ?? duration, duration) : media.trimEnd ?? 0;
  const ready = duration > 0 && end > start && !error;
  const update = useRef(onChange);
  update.current = onChange;
  useEffect(() => {
    if (!media.youtubeId || !ready) return;
    const now = Date.now();
    setStartedAt(now);
    setPausedAt(now);
  }, [duration]);
  useEffect(() => {
    if (!ready || media.youtubeId || !player.current) return;
    player.current.pause();
    player.current.currentTime = start;
    setPosition(start); setPlaying(false);
  }, [duration, url]);
  const loadDuration = (length: number) => {
    if (!Number.isFinite(length) || length <= 0) return;
    setDuration(length);
  };
  const progress = () => {
    const element = player.current;
    if (!element) return;
    setPosition(element.currentTime);
    if (!element.paused && element.currentTime >= end && end > start) { element.pause(); element.currentTime = end; setPlaying(false); }
  };
  const changeRange = (values: number[]) => {
    const nextStart = values[0];
    const nextEnd = values[1];
    const movedStart = Math.abs(nextStart - start) > 0.001;
    const seek = movedStart ? nextStart : Math.max(nextStart, nextEnd - 0.05);
    setPlaying(false); setPosition(seek);
    if (media.youtubeId) {
      const now = Date.now();
      setStartedAt(now - (seek - nextStart) * 1000); setPausedAt(now);
    } else if (player.current) { player.current.pause(); player.current.currentTime = seek; }
    update.current({ ...media, trimStart: nextStart, trimEnd: nextEnd });
  };
  const toggle = () => {
    if (!ready) return;
    if (media.youtubeId) {
      if (playing) { setPausedAt(Date.now()); setPlaying(false); }
      else { setStartedAt(Date.now()); setPausedAt(null); setPosition(start); setPlaying(true); }
      return;
    }
    const element = player.current;
    if (!element) return;
    if (playing) { element.pause(); setPlaying(false); }
    else {
      element.currentTime = start;
      setPosition(start);
      void element.play().then(() => setPlaying(true)).catch(() => setError(true));
    }
  };
  useEffect(() => {
    if (!playing || media.youtubeId) return;
    const interval = window.setInterval(progress, 50);
    return () => window.clearInterval(interval);
  }, [playing, start, end, media.youtubeId]);
  return <section className="space-y-4 rounded-2xl border border-primary/30 bg-secondary/15 p-4">
    <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Scissors className="h-4 w-4" />Trim & preview</div>
    {media.youtubeId ? <YouTubeMedia media={media} startedAt={startedAt} pausedAt={pausedAt} soundEnabled={playing} volume={1} loop={false} preview onDuration={loadDuration} onProgress={(elapsed, _length, ended) => { setPosition((media.trimStart ?? 0) + elapsed); if (ended) setPlaying(false); }} /> : media.kind === 'video' ? <video ref={node => { player.current = node; }} src={url || undefined} playsInline preload="metadata" onLoadedMetadata={event => loadDuration(event.currentTarget.duration)} onTimeUpdate={progress} onEnded={() => setPlaying(false)} onError={() => setError(true)} className="aspect-video w-full rounded-xl bg-background object-contain" /> : <><div className="flex h-24 items-center justify-center rounded-xl bg-primary/10"><Music2 className="h-10 w-10 text-primary" /><span className="ml-3 text-sm font-semibold text-primary">Audio preview</span></div><audio ref={node => { player.current = node; }} src={url || undefined} preload="metadata" onLoadedMetadata={event => loadDuration(event.currentTarget.duration)} onTimeUpdate={progress} onEnded={() => setPlaying(false)} onError={() => setError(true)} /></>}
    <div className="space-y-3 px-2">
      <Slider.Root aria-label="Selected clip range" value={[start, end]} min={0} max={duration || 1} step={0.1} minStepsBetweenThumbs={1} disabled={!ready} onValueChange={changeRange} className="relative flex h-10 w-full touch-none select-none items-center">
        <Slider.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-secondary"><Slider.Range className="absolute h-full rounded-full bg-primary" /></Slider.Track>
        <Slider.Thumb aria-label="Clip start" className="block h-8 w-5 cursor-ew-resize rounded-lg border-2 border-primary bg-background shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50" />
        <Slider.Thumb aria-label="Clip end" className="block h-8 w-5 cursor-ew-resize rounded-lg border-2 border-primary bg-background shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50" />
      </Slider.Root>
      <div className="flex justify-between gap-3 text-xs tabular-nums"><span className="text-white">Start <strong className="text-primary">{timestamp(start)}</strong></span><span className="text-white">End <strong className="text-primary">{timestamp(end)}</strong></span></div>
      <p className="text-xs text-muted-foreground">Drag the left handle to set the start and the right handle to set the end. The preview seeks to the edge you move.</p>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3"><Button type="button" variant="outline" onClick={toggle} disabled={!ready} className="rounded-xl border-primary/40 bg-primary/10 text-primary">{playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{playing ? 'Pause preview' : 'Play clip'}</Button><span className="text-xs tabular-nums text-muted-foreground">{timestamp(Math.max(start, Math.min(position, end)))} · {timestamp(Math.max(0, end - start))} selected</span></div>
    {error ? <p role="alert" className="text-xs text-destructive">Cannot preview this media. Check that the file or link is playable.</p> : !ready ? <p role="status" className="text-xs text-muted-foreground">Loading media length… Live streams cannot be trimmed.</p> : <p className="text-xs text-muted-foreground">Preview sound plays here only when you press Play clip. Live-game playback remains TV-only.</p>}
  </section>;
}
