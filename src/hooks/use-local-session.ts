import { useEffect, useRef, useState } from 'react';
import type { GameMedia } from '@/lib/local-games';

export type PublicSession = {
  runId: string;
  title: string;
  roundName: string;
  roundIndex: number;
  questionIndex: number;
  text: string;
  media: GameMedia[];
  imagesRevealed: boolean;
  videoStartedAt: number | null;
  deadline: number | null;
  duration: number;
  open: boolean;
  ended: boolean;
  answer?: string;
  answerMedia?: GameMedia[];
};
export type PlayerSubmission = { runId: string; teamId: string; name: string; answer: string };
const channelName = '285-trivia-local-session';

export function useHostSession(session: PublicSession | null, onSubmit?: (submission: PlayerSubmission) => void) {
  const channel = useRef<BroadcastChannel | null>(null);
  const latest = useRef(session);
  const submitHandler = useRef(onSubmit);
  submitHandler.current = onSubmit;
  latest.current = session;
  useEffect(() => {
    const connection = new BroadcastChannel(channelName);
    channel.current = connection;
    connection.onmessage = event => {
      if (event.data?.type === 'request') connection.postMessage({ type: 'session', session: latest.current });
      if (event.data?.type === 'submit') {
        const submission = event.data.submission;
        const active = latest.current;
        if (active?.open && active.deadline && Date.now() < active.deadline && submission?.runId === active.runId && typeof submission.teamId === 'string' && submission.teamId.length <= 100 && typeof submission.name === 'string' && submission.name.length <= 80 && typeof submission.answer === 'string' && submission.answer.trim() && submission.answer.length <= 4000) submitHandler.current?.(submission);
      }
    };
    return () => { connection.postMessage({ type: 'session', session: null }); connection.close(); channel.current = null; };
  }, []);
  useEffect(() => { channel.current?.postMessage({ type: 'session', session }); }, [session]);
}

export function usePlayerSession() {
  const [session, setSession] = useState<PublicSession | null>(null);
  useEffect(() => {
    const connection = new BroadcastChannel(channelName);
    connection.onmessage = event => {
      if (event.data?.type === 'session') setSession(event.data.session);
    };
    connection.postMessage({ type: 'request' });
    return () => connection.close();
  }, []);
  return session;
}

export function useRemainingSeconds(deadline: number | null, duration: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!deadline) return;
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, [deadline]);
  return deadline === null ? duration : Math.max(0, Math.ceil((deadline - Math.max(now, Date.now())) / 1000));
}

export function formatSeconds(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function sendPlayerSubmission(submission: PlayerSubmission) {
  const channel = new BroadcastChannel(channelName);
  channel.postMessage({ type: 'submit', submission });
  channel.close();
}