import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { GameMedia } from '@/lib/local-games';

type Track = { audio: HTMLAudioElement; url: string };

export function useRoundMusic() {
  const current = useRef<Track | null>(null);
  const fading = useRef(new Map<Track, number>());
  const enabledRef = useRef(false);
  const volumeRef = useRef(0.4);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const dispose = (track: Track) => { track.audio.pause(); track.audio.removeAttribute('src'); track.audio.load(); URL.revokeObjectURL(track.url); };
  const fadeOut = (track: Track) => {
    const started = performance.now();
    const startVolume = track.audio.volume;
    const step = (time: number) => {
      const progress = Math.min((time - started) / 1500, 1);
      track.audio.volume = startVolume * (1 - progress);
      if (progress < 1) fading.current.set(track, requestAnimationFrame(step));
      else { fading.current.delete(track); dispose(track); }
    };
    fading.current.set(track, requestAnimationFrame(step));
  };
  const switchTrack = (media?: GameMedia) => {
    if (current.current) { fadeOut(current.current); current.current = null; }
    if (!media || !enabledRef.current) return;
    const url = URL.createObjectURL(media.file);
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volumeRef.current;
    const track = { audio, url };
    current.current = track;
    void audio.play().catch(() => {
      if (current.current === track) { current.current = null; dispose(track); toast.error('Music could not play. Enable music again or try another MP3.'); }
    });
  };
  const toggleMusic = (media?: GameMedia) => {
    enabledRef.current = !enabledRef.current;
    setEnabled(enabledRef.current);
    switchTrack(enabledRef.current ? media : undefined);
  };
  const changeVolume = (value: number) => {
    volumeRef.current = value;
    setVolume(value);
    if (current.current) current.current.audio.volume = value;
  };
  useEffect(() => () => {
    if (current.current) dispose(current.current);
    for (const [track, frame] of fading.current) { cancelAnimationFrame(frame); dispose(track); }
    fading.current.clear();
  }, []);
  return { enabled, volume, toggleMusic, changeVolume, switchTrack };
}
