import { useCallback, useEffect, useState } from 'react';
import { ensureIdentity, supabase } from '@/integrations/supabase/client';
import type { PlayerProfile } from '@/hooks/use-local-session';

export type OnlineRoom = { id: string; code: string; host_id: string };
const message = (error: unknown) => error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unable to connect to the online room.';
export function useOnlineRoster(room: OnlineRoom | null) {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    setPlayers([]); setError('');
    if (!room || !supabase) return;
    const client = supabase;
    let cancelled = false;
    const load = async () => {
      const result = await client.from('trivia_players').select('user_id,name,ready,avatar_url,frames').eq('room_id', room.id).order('joined_at');
      if (cancelled) return;
      if (result.error) { setError(result.error.message); return; }
      setError('');
      setPlayers(result.data.map(row => ({ id: row.user_id, name: row.name, ready: row.ready, avatarUrl: row.avatar_url || undefined, frames: row.frames || undefined })));
    };
    const channel = client.channel(`roster-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trivia_players', filter: `room_id=eq.${room.id}` }, () => { void load(); })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') void load();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setError('Realtime connection interrupted. Retrying…');
      });
    void load();
    return () => { cancelled = true; void client.removeChannel(channel); };
  }, [room?.id]);
  return { players, error };
}
export function useHostRoom() {
  const [room, setRoom] = useState<OnlineRoom | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const roster = useOnlineRoster(room);
  useEffect(() => {
    const saved = localStorage.getItem('285-online-host-room');
    if (!saved || !supabase) return;
    let cancelled = false;
    void ensureIdentity().then(async userId => {
      const result = await supabase!.from('trivia_rooms').select('id,code,host_id').eq('id', saved).eq('host_id', userId).maybeSingle();
      if (cancelled) return;
      if (result.error) setError(result.error.message);
      else if (result.data) setRoom(result.data);
      else localStorage.removeItem('285-online-host-room');
    }).catch(error => { if (!cancelled) setError(message(error)); });
    return () => { cancelled = true; };
  }, []);
  const create = async () => {
    setBusy(true); setError('');
    try {
      await ensureIdentity();
      const result = await supabase!.rpc('trivia_create_room');
      if (result.error) throw result.error;
      const created: OnlineRoom = result.data;
      localStorage.setItem('285-online-host-room', created.id);
      setRoom(created);
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  };
  return { room, busy, create, players: roster.players, error: error || roster.error };
}
export function useJoinedRoom(code: string, viewer = false) {
  const [room, setRoom] = useState<OnlineRoom | null>(null);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const roster = useOnlineRoster(room);
  useEffect(() => {
    let cancelled = false;
    setRoom(null); setError('');
    const join = async () => {
      try {
        const id = await ensureIdentity();
        const result = await supabase!.rpc(viewer ? 'trivia_watch_room' : 'trivia_join_room', { room_code: code });
        if (result.error) throw result.error;
        if (!cancelled) { setUserId(id); setRoom(result.data); }
      } catch (error) { if (!cancelled) setError(message(error)); }
    };
    if (code && /^[A-Z0-9]{5}$/.test(code)) void join(); else if (code) setError('Enter a valid five-character room code.');
    return () => { cancelled = true; };
  }, [code, viewer]);
  const updateProfile = useCallback(async (profile: PlayerProfile) => {
    if (!room || !userId || !supabase) return;
    const result = await supabase.from('trivia_players').update({ name: profile.name, ready: profile.ready ?? false, avatar_url: profile.avatarUrl || null, frames: profile.frames || null }).eq('room_id', room.id).eq('user_id', userId);
    if (result.error) throw result.error;
  }, [room?.id, userId]);
  return { room, userId, players: roster.players, error: error || roster.error, updateProfile };
}