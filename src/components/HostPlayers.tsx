import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { PlayerProfile } from '@/hooks/use-local-session';

type Player = PlayerProfile & { score: number };

export function HostPlayers({ players = [], showReadiness = false, showAnswers = false, submittedTeamIds = [] }: { players?: Player[]; showReadiness?: boolean; showAnswers?: boolean; submittedTeamIds?: string[] }) {
  return <section className="panel p-5">
    <div className="flex items-center justify-between"><h2 className="font-semibold">Players</h2><span className="text-xs tabular-nums text-muted-foreground">{players.length}</span></div>
    <ul className="mt-4 space-y-3">{players.map(player => {
      const answered = submittedTeamIds.includes(player.id);
      const ready = player.ready && player.name.trim();
      return <li key={player.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${showAnswers && !answered ? 'border-slate-500/40 bg-slate-500/15 text-slate-300' : 'border-primary/20 bg-primary/5'}`}>
        <Avatar className={`h-10 w-10 shrink-0 rounded-xl ${showAnswers && !answered ? 'grayscale' : ''}`}><AvatarImage src={player.avatarUrl} alt={`${player.name}'s picture`} className="object-cover" /><AvatarFallback className="rounded-xl bg-secondary text-sm text-foreground">{player.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{player.name}</p>{showReadiness && <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ready ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'}`}>{ready ? 'Ready' : 'Not ready'}</span>}{showAnswers && <p className={`mt-1 text-xs ${answered ? 'text-primary' : 'text-slate-300'}`}>{answered ? 'Answered' : 'Not answered'}</p>}</div>
        <span className="text-sm font-semibold tabular-nums text-primary" aria-label={`${player.score} total points`}>{player.score.toLocaleString()}</span>
      </li>;
    })}</ul>
  </section>;
}
