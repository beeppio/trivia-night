import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { onlineSnapshot, apiError, shiftSessionClock } from '@/lib/online-game';
import { useServerClock } from '@/hooks/use-server-clock';
import type { OnlineRoom } from '@/hooks/use-online-room';
import type { PlayerProfile, PublicSession } from '@/hooks/use-local-session';
import type { TeamAnswer } from '@/components/TeamAnswers';

export function useOnlineGame(room: OnlineRoom | null, players: PlayerProfile[]) {
  const offset = useServerClock(Boolean(room));
  const [session, setSession] = useState<PublicSession | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setSession(null); setError('');
    if (!room || !supabase) return;
    const client = supabase;
    let cancelled = false;
    let revision = 0;
    const load = async () => {
      const result = await client.from('trivia_game_state').select('state,revision').eq('room_id', room.id).maybeSingle();
      if (cancelled) return;
      if (result.error) { setError(result.error.message); return; }
      if (result.data && result.data.revision > revision) { revision = result.data.revision; setSession(result.data.state as PublicSession); }
      setError('');
    };
    const channel = client.channel(`game-${room.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'trivia_game_state', filter: `room_id=eq.${room.id}` }, () => { void load(); }).subscribe(status => {
      if (status === 'SUBSCRIBED') void load();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setError('Game connection interrupted. Reconnecting…');
    });
    void load();
    const retry = window.setInterval(() => { void load(); }, 5000);
    return () => { cancelled = true; clearInterval(retry); void client.removeChannel(channel); };
  }, [room?.id]);
  const activeIds = new Set(players.map(player => player.id));
  return { session: session ? { ...shiftSessionClock(session, -offset), rankings: session.rankings.filter(player => activeIds.has(player.id)) } : null, error };
}
export function usePublishGame(room: OnlineRoom | null, session: PublicSession) {
  const offset = useServerClock(Boolean(room));
  const [error, setError] = useState('');
  const queue = useRef(Promise.resolve());
  const roomRef = useRef(room?.id);
  roomRef.current = room?.id;
  useEffect(() => {
    if (!room || !supabase) return;
    const id = room.id;
    queue.current = queue.current.then(async () => {
      if (roomRef.current !== id) return;
      const snapshot = await onlineSnapshot(id, shiftSessionClock(session, offset));
      const result = await supabase!.rpc('trivia_publish_state', { target: id, snapshot });
      if (result.error) throw result.error;
      setError('');
    }).catch(error => { setError(apiError(error)); });
  }, [room?.id, session, offset]);
  return { error, flush: () => queue.current };
}
export function useHostSubmissions(room: OnlineRoom | null) {
  const [answers, setAnswers] = useState<Record<string, TeamAnswer[]>>({});
  const [error, setError] = useState('');
  useEffect(() => {
    setAnswers({});
    if (!room || !supabase) return;
    const client = supabase;
    let cancelled = false;
    const load = async () => {
      const result = await client.from('trivia_submissions').select('run_id,user_id,answer').eq('room_id', room.id);
      if (cancelled) return;
      if (result.error) { setError(result.error.message); return; }
      const grouped: Record<string, TeamAnswer[]> = {};
      for (const row of result.data) (grouped[row.run_id] ??= []).push({ teamId: row.user_id, answer: row.answer });
      setAnswers(grouped); setError('');
    };
    const channel = client.channel(`answers-${room.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trivia_submissions', filter: `room_id=eq.${room.id}` }, () => { void load(); }).subscribe(status => { if (status === 'SUBSCRIBED') void load(); });
    void load();
    return () => { cancelled = true; void client.removeChannel(channel); };
  }, [room?.id]);
  return { answers, error };
}