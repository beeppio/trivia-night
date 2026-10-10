import { Trophy } from 'lucide-react';
import { previewPlayers } from '@/lib/preview-data';

export function Leaderboard({ players = previewPlayers }: { players?: typeof previewPlayers }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return <div><div className="mb-6 flex items-center gap-3"><Trophy className="h-6 w-6 text-[hsl(var(--yellow))]" /><h2 className="text-2xl font-bold">The bragging board</h2></div><div className="space-y-3">{sorted.map((player, index) => {
    const rank = sorted.findIndex(p => p.score === player.score) + 1;
    return <div key={player.id} className={`enter flex items-center gap-4 rounded-xl border p-4 ${index === 0 ? 'border-primary/40 bg-primary/10' : 'border-border bg-secondary/40'}`}><span className="w-6 text-center font-bold text-muted-foreground">{rank}</span><span className="text-2xl" aria-hidden="true">{player.emoji}</span><span className="flex-1 font-semibold">{player.name}</span><span className="display-font text-xl font-bold tabular-nums text-primary">{player.score.toLocaleString()}<span className="ml-1 text-xs font-normal text-muted-foreground">pts</span></span></div>;
  })}</div><p className="mt-4 text-xs text-muted-foreground">Sample rankings · Equal scores share a rank.</p></div>;
}
