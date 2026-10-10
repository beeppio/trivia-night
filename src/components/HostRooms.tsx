import { useState } from 'react';
import { DoorOpen, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { OnlineRoom } from '@/hooks/use-online-room';
import { apiError } from '@/lib/online-game';

export function HostRooms({ rooms, current, busy, onCreate, onSelect }: { rooms: OnlineRoom[]; current: OnlineRoom | null; busy: boolean; onCreate: () => Promise<void>; onSelect: (id: string) => Promise<void> }) {
  const [selecting, setSelecting] = useState(false);
  const select = async (id: string) => {
    setSelecting(true);
    try { await onSelect(id); }
    catch (error) { toast.error(apiError(error)); }
    finally { setSelecting(false); }
  };
  return <section className="mt-8 space-y-4 border-t border-primary/25 pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold text-primary"><DoorOpen className="h-5 w-5" />My rooms</h2><Button variant="outline" disabled={busy || selecting} onClick={() => { void onCreate(); }} className="rounded-xl border-primary/40 bg-primary/10 text-primary"><Plus className="mr-2 h-4 w-4" />{busy ? 'Creating…' : 'Create another room'}</Button></div>
    <p className="text-xs leading-5 text-muted-foreground">Rooms owned by this browser's host identity. Switching rooms does not delete your saved games. Cross-computer access requires a shared host account; a room code is not a host password.</p>
    {!rooms.length ? <p className="rounded-xl border border-dotted border-primary/40 p-4 text-sm text-muted-foreground">No rooms found for this host identity. Your saved games stay in this browser.</p> : <ul className="grid gap-3 sm:grid-cols-2">{rooms.map(room => <li key={room.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${current?.id === room.id ? 'border-primary/60 bg-primary/10' : 'border-border bg-secondary/20'}`}><div><p className="font-mono text-xl font-bold tracking-widest text-primary">{room.code}</p><p className="mt-1 text-xs text-muted-foreground">{current?.id === room.id ? 'Current room' : 'Saved online room'}</p></div><Button disabled={busy || selecting || current?.id === room.id} onClick={() => { void select(room.id); }} className="rounded-xl">{current?.id === room.id ? 'Selected' : 'Use room'}</Button></li>)}</ul>}
  </section>;
}
