import { useCallback, useEffect, useState } from 'react';
import { ensureIdentity, supabase } from '@/integrations/supabase/client';
import type { PlayerProfile } from '@/hooks/use-local-session';

export type OnlineRoom = { id: string; code: string; host_id: string };
const message = (error: unknown) => error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unable to connect to the online room.';
export function useOnlineRoster(room: OnlineRoom | null) {
  const [entries, setEntries] = useState<(PlayerProfile & { active: boolean })[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    setEntries([]); setError('');
    if (!room || !supabase) return;
    const client = supabase;
    let cancelled = false;
    let latest = 0;
    const load = async () => {
      const request = ++latest;
      const result = await client.rpc('trivia_room_roster', { target: room.id });
      if (cancelled || request !== latest) return;
      if (result.error) { setError(result.error.message); return; }
      const next = result.data.map((row: { user_id: string; name: string; ready: boolean; avatar_url: string | null; frames: string[] | null; active: boolean }) => ({ id: row.user_id, name: row.name, ready: row.ready, avatarUrl: row.avatar_url || undefined, frames: row.frames || undefined, active: row.active }));
      setError('');
      setEntries(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const channel = client.channel(`roster-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trivia_players', filter: `room_id=eq.${room.id}` }, () => { void load(); })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') void load();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setError('Realtime connection interrupted. Retrying…');
      });
    void load();
    // Expiry needs polling even when disconnected devices send no more events.
    const interval = window.setInterval(() => { void load(); }, 2000);
    return () => { cancelled = true; clearInterval(interval); void client.removeChannel(channel); };
  }, [room?.id]);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  useEffect(() => {
    const active = entries.filter(player => player.active);
    setPlayers(previous => JSON.stringify(previous) === JSON.stringify(active) ? previous : active);
  }, [entries]);
  return { players, allPlayers: entries, error };
}
export function useHostRoom() {
  const [room, setRoom] = useState<OnlineRoom | null>(null);
  const [rooms, setRooms] = useState<OnlineRoom[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const roster = useOnlineRoster(room);
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    void ensureIdentity().then(async userId => {
      const result = await supabase!.from('trivia_rooms').select('id,code,host_id').eq('host_id', userId).order('created_at', { ascending: false });
      if (cancelled) return;
      if (result.error) { setError(result.error.message); return; }
      setRooms(result.data);
      const saved = localStorage.getItem('285-online-host-room');
      const restored = result.data.find(item => item.id === saved) || result.data[0];
      if (restored) {
        localStorage.setItem('285-online-host-room', restored.id);
        setRoom(restored);
      }
    }).catch(error => { if (!cancelled) setError(message(error)); });
    return () => { cancelled = true; };
  }, []);
  const selectRoom = async (id: string) => {
    if (!supabase) return;
    const userId = await ensureIdentity();
    const result = await supabase.from('trivia_rooms').select('id,code,host_id').eq('id', id).eq('host_id', userId).single();
    if (result.error) throw result.error;
    localStorage.setItem('285-online-host-room', result.data.id);
    setRoom(result.data);
  };
  const create = async () => {
    setBusy(true); setError('');
    try {
      await ensureIdentity();
      const result = await supabase!.rpc('trivia_create_room');
      if (result.error) throw result.error;
      const created: OnlineRoom = result.data;
      setRooms(previous => [created, ...previous.filter(item => item.id !== created.id)]);
      localStorage.setItem('285-online-host-room', created.id);
      setRoom(created);
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  };
  const removePlayer = async (playerId: string) => {
    if (!room || !supabase) return;
    const result = await supabase.rpc('trivia_kick_player', { target: room.id, player_id: playerId });
    if (result.error) throw result.error;
  };
  return { room, rooms, selectRoom, busy, create, removePlayer, players: roster.players, allPlayers: roster.allPlayers, error: error || roster.error };
}
export function useJoinedRoom(code: string, viewer = false) {
  const [room, setRoom] = useState<OnlineRoom | null>(null);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [removed, setRemoved] = useState(false);
  const roster = useOnlineRoster(room);
  useEffect(() => {
    let cancelled = false;
    setRoom(null); setError(''); setRemoved(false);
    const join = async () => {
      try {
        const id = await ensureIdentity();
        const result = await supabase!.rpc(viewer ? 'trivia_watch_room' : 'trivia_join_room', { room_code: code });
        if (result.error) throw result.error;
        if (!cancelled) { setUserId(id); setRoom(result.data); }
      } catch (error) {
        if (!cancelled) {
          if (message(error).includes('You have been removed from this room')) setRemoved(true);
          setError(message(error));
        }
      }
    };
    if (code && /^[A-Z0-9]{5}$/.test(code)) void join(); else if (code) setError('Enter a valid five-character room code.');
    return () => { cancelled = true; };
  }, [code, viewer]);
  useEffect(() => {
    if (!room || viewer || !supabase) return;
    const client = supabase;
    let cancelled = false;
    const markRemoved = () => { if (!cancelled) { setRemoved(true); setRoom(null); } };
    const beat = async () => {
      const result = await client.rpc('trivia_player_heartbeat', { target: room.id });
      if (cancelled) return;
      if (result.data === 'removed') { markRemoved(); return; }
      if (result.error || result.data === 'missing') setError(result.error?.message || 'Room membership is no longer available.');
      else setError('');
    };
    const channel = client.channel(`membership-${room.id}-${userId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trivia_players', filter: `room_id=eq.${room.id}` }, payload => {
      if (payload.new.user_id === userId && payload.new.kicked_at) markRemoved();
    }).subscribe(status => { if (status === 'SUBSCRIBED') void beat(); });
    const wake = () => { void beat(); };
    void beat();
    const interval = window.setInterval(wake, 4000);
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', wake);
    return () => { cancelled = true; clearInterval(interval); window.removeEventListener('online', wake); document.removeEventListener('visibilitychange', wake); void client.removeChannel(channel); };
  }, [room?.id, userId, viewer]);
  const updateProfile = useCallback(async (profile: PlayerProfile) => {
    if (!room || !userId || !supabase) return;
    const result = await supabase.from('trivia_players').update({ name: profile.name, ready: profile.ready ?? false, avatar_url: profile.avatarUrl || null, frames: profile.frames || null }).eq('room_id', room.id).eq('user_id', userId);
    if (result.error) throw result.error;
  }, [room?.id, userId]);
  return { room, userId, removed, players: roster.players, error: error || roster.error, updateProfile };
}