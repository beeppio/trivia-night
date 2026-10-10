import { useState } from 'react';
import { UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { apiError } from '@/lib/online-game';
import type { PlayerProfile } from '@/hooks/use-local-session';

type Player = PlayerProfile & { score: number; active?: boolean };

export function HostPlayers({ players = [], offlinePlayers = [], onRemove, showReadiness = false, showAnswers = false, submittedTeamIds = [] }: { players?: Player[]; offlinePlayers?: Player[]; onRemove?: (id: string) => Promise<void>; showReadiness?: boolean; showAnswers?: boolean; submittedTeamIds?: string[] }) {
  const [target, setTarget] = useState<Player | null>(null);
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!target || !onRemove) return;
    setBusy(true);
    try { await onRemove(target.id); setTarget(null); toast.success('Player kicked'); }
    catch (error) { toast.error(apiError(error)); }
    finally { setBusy(false); }
  };
  return <section className="panel p-5">
    <div className="flex items-center justify-between"><h2 className="font-semibold">Players</h2><span className="text-xs tabular-nums text-muted-foreground">{players.length} active</span></div>
    <ul className="mt-4 space-y-3">{[...players, ...offlinePlayers].map(player => {
      const offline = player.active === false;
      const answered = submittedTeamIds.includes(player.id);
      const ready = player.ready && player.name.trim();
      return <li key={player.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-colors ${offline || (showAnswers && !answered) ? 'border-slate-500/40 bg-slate-500/15 text-slate-300' : 'border-primary/20 bg-primary/5'}`}>
        <Avatar className={`h-10 w-10 shrink-0 rounded-xl ${offline || (showAnswers && !answered) ? 'grayscale' : ''}`}><AvatarImage src={player.avatarUrl} alt={`${player.name}'s picture`} className="object-cover" /><AvatarFallback className="rounded-xl bg-secondary text-sm text-foreground">{player.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{player.name || 'Unnamed player'}</p>{offline ? <p className="mt-1 text-xs text-amber-300">Offline · history retained</p> : <>{showReadiness && <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ready ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'}`}>{ready ? 'Ready' : 'Not ready'}</span>}{showAnswers && <p className={`mt-1 text-xs ${answered ? 'text-primary' : 'text-slate-300'}`}>{answered ? 'Answered' : 'Not answered'}</p>}</>}</div>
        <span className="text-sm font-semibold tabular-nums text-primary" aria-label={`${player.score} total points`}>{player.score.toLocaleString()}</span>
        {onRemove && <Button variant="outline" size="sm" onClick={() => setTarget(player)} className="h-auto rounded-lg border-red-400/40 bg-red-400/10 px-2 py-2 text-xs text-red-300 hover:bg-red-400/20 hover:text-red-200"><UserMinus className="mr-1 h-3.5 w-3.5" />Kick Player</Button>}
      </li>;
    })}</ul>
    <AlertDialog open={Boolean(target)} onOpenChange={open => { if (!open && !busy) setTarget(null); }}>
      <AlertDialogContent className="rounded-2xl border-primary/25 bg-card"><AlertDialogHeader><AlertDialogTitle>Kick {target?.name || 'this player'}?</AlertDialogTitle><AlertDialogDescription>They will be returned to the join screen and this player identity will not be allowed to rejoin this room. Historical answers and scores will be retained.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy} className="rounded-xl">Cancel</AlertDialogCancel><Button disabled={busy} onClick={() => { void remove(); }} className="rounded-xl bg-red-700 text-white hover:bg-red-800">{busy ? 'Kicking…' : 'Kick Player'}</Button></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </section>;
}