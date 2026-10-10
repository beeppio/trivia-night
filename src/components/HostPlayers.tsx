import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Player = {
  id: string;
  name: string;
  avatarUrl?: string;
  score: number;
};

export function HostPlayers({ players = [] }: { players?: Player[] }) {
  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Players</h2>
        <span className="text-xs tabular-nums text-muted-foreground">{players.length}</span>
      </div>
      {players.length > 0 && (
        <ul className="mt-4 space-y-4">
          {players.map(player => (
            <li key={player.id} className="flex items-center gap-3">
              <Avatar className="h-9 w-9 rounded-xl">
                <AvatarImage src={player.avatarUrl} alt={`${player.name}'s picture`} className="object-cover" />
                <AvatarFallback className="rounded-xl bg-secondary text-sm text-foreground">{player.name.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 break-words text-sm">{player.name}</span>
              <span className="text-sm font-semibold tabular-nums text-primary" aria-label={`${player.score} total points`}>{player.score.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
