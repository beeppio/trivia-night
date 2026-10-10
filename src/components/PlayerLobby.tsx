import { Check, Palette, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { PlayerProfile } from '@/hooks/use-local-session';

export function PlayerLobby({ teams, title }: { teams: PlayerProfile[]; title?: string }) {
  const readyCount = teams.filter(team => team.ready && team.name.trim()).length;
  return <section className="space-y-6 py-4">
    <div className="text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary"><Users className="h-8 w-8" /></div><h1 className="text-3xl font-bold text-primary">Waiting for players</h1>{title && <p className="mt-2 break-words font-semibold">{title}</p>}<p role="status" className="mt-3 text-sm text-muted-foreground">{readyCount} of {teams.length} teams ready</p></div>
    {!teams.length ? <div className="rounded-2xl border-2 border-dotted border-primary/40 p-8 text-center text-sm text-muted-foreground">Share the room code. Teams will appear here as they join.</div> : <ul className="grid gap-3 sm:grid-cols-2">{teams.map(team => <li key={team.id} className={`flex items-center gap-4 rounded-2xl border p-4 ${team.ready ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-primary/25 bg-primary/5'}`}><Avatar className="h-16 w-16 shrink-0 rounded-2xl"><AvatarImage src={team.avatarUrl} alt={`${team.name || 'Team'} profile`} className="object-cover" /><AvatarFallback className="rounded-2xl bg-primary/20 text-primary">{team.name.slice(0, 2).toUpperCase() || '?'}</AvatarFallback></Avatar><div className="min-w-0"><p className="break-words font-semibold">{team.name || 'Creating a team…'}</p><p className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${team.ready ? 'text-emerald-400' : 'text-primary'}`}>{team.ready ? <Check className="h-3.5 w-3.5" /> : <Palette className="h-3.5 w-3.5" />}{team.ready ? 'Ready to play' : 'Editing profile'}</p></div></li>)}</ul>}
  </section>;
}
