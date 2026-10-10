import { useEffect, useRef, useState } from 'react';
import type { GameMedia } from '@/lib/local-games';

export type PlayerProfile = { id: string; name: string; avatarUrl?: string; frames?: string[]; ready?: boolean };
export type PublicResult = { teamId: string; answer: string; grade?: number; points: number };
export type PublicSession = {
  runId: string;
  title: string;
  waiting?: boolean;
  preparing?: boolean;
  questionPoints?: number;
  mediaPausedAt?: number | null;
  answerMediaPausedAt?: number | null;
  roundName: string;
  roundDescription?: string;
  roundIndex: number;
  questionIndex: number;
  text: string;
  media: GameMedia[];
  imagesRevealed: boolean;
  videoStartedAt: number | null;
  answerMediaStartedAt: number | null;
  deadline: number | null;
  duration: number;
  open: boolean;
  ended: boolean;
  rankings: (PlayerProfile & { score: number })[];
  submittedTeamIds?: string[];
  answer?: string;
  answerMedia?: GameMedia[];
  results?: PublicResult[];
};
export type PlayerSubmission = { runId: string; teamId: string; name: string; answer: string };
const channelName = '285-trivia-local-session';
const validImage = (image: unknown) => typeof image === 'string' && image.length < 3000000 && /^data:image\/(png|jpeg|webp|gif);base64,/.test(image);
function validProfile(profile: PlayerProfile) {
  return profile && typeof profile.id === 'string' && profile.id.length <= 100 && typeof profile.name === 'string' && profile.name.length <= 80 && (!profile.avatarUrl || validImage(profile.avatarUrl)) && (profile.ready === undefined || typeof profile.ready === 'boolean') && (!profile.frames || (Array.isArray(profile.frames) && profile.frames.length === 2 && profile.frames.every(frame => frame === '' || validImage(frame))));
}

export function useHostSession(session: PublicSession | null, onSubmit?: (submission: PlayerSubmission) => void, onJoin?: (profile: PlayerProfile) => void) {
  const channel = useRef<BroadcastChannel | null>(null);
  const latest = useRef(session);
  const submitHandler = useRef(onSubmit);
  const joinHandler = useRef(onJoin);
  submitHandler.current = onSubmit;
  joinHandler.current = onJoin;
  latest.current = session;
  useEffect(() => {
    const connection = new BroadcastChannel(channelName);
    channel.current = connection;
    connection.onmessage = event => {
      if (event.data?.type === 'request' || event.data?.type === 'profile') {
        if (validProfile(event.data.profile)) joinHandler.current?.(event.data.profile);
        if (event.data.type === 'request') connection.postMessage({ type: 'session', session: latest.current });
      }
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

export function usePlayerSession(profile?: PlayerProfile) {
  const [session, setSession] = useState<PublicSession | null>(null);
  const latestProfile = useRef(profile);
  latestProfile.current = profile;
  useEffect(() => {
    const connection = new BroadcastChannel(channelName);
    connection.onmessage = event => {
      if (event.data?.type === 'session') setSession(event.data.session);
    };
    const request = () => connection.postMessage({ type: 'request', profile: latestProfile.current });
    request();
    const interval = window.setInterval(request, 5000);
    return () => { window.clearInterval(interval); connection.close(); };
  }, []);
  useEffect(() => {
    if (!profile) return;
    const connection = new BroadcastChannel(channelName);
    connection.postMessage({ type: 'profile', profile });
    connection.close();
  }, [profile]);
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