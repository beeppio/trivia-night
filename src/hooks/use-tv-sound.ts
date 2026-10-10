import { useEffect, useRef, useState } from 'react';
import type { PublicSession } from '@/hooks/use-local-session';

export function useTVSound(session: PublicSession | null, remaining: number) {
  const context = useRef<AudioContext | null>(null);
  const sounded = useRef(new Set<string>());
  const [enabled, setEnabled] = useState(false);
  const enable = async () => {
    context.current ??= new AudioContext();
    await context.current.resume();
    setEnabled(true);
  };
  useEffect(() => {
    if (!session?.deadline || session.waiting || session.preparing || session.ended || session.answer !== undefined || remaining > 0) return;
    const key = `${session.runId}:${session.deadline}`;
    if (sounded.current.has(key)) return;
    sounded.current.add(key);
    if (!enabled || !context.current || Date.now() - session.deadline > 2000) return;
    const audio = context.current;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(180, audio.currentTime);
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.8);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + 0.85);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }, [session?.runId, session?.deadline, session?.waiting, session?.preparing, session?.ended, session?.answer, remaining, enabled]);
  useEffect(() => () => { void context.current?.close(); context.current = null; }, []);
  return { enabled, enable };
}
