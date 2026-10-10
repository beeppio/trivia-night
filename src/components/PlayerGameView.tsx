import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SessionQuestion } from '@/components/SessionQuestion';
import { TeamProfileEditor } from '@/components/TeamProfileEditor';
import type { PlayerProfile, PublicSession } from '@/hooks/use-local-session';

export function PlayerGameView({ profile, session, onSubmit, onProfileChange }: { profile: PlayerProfile; session: PublicSession | null; onSubmit: (answer: string) => void; onProfileChange?: (profile: PlayerProfile) => void }) {
  const player = session?.rankings.find(team => team.id === profile.id);
  return <div>
    <header className="flex items-center gap-3 border-b border-border py-4">
      <Avatar className="h-12 w-12 rounded-2xl"><AvatarImage src={profile.avatarUrl} alt="Your profile picture" className="object-cover" /><AvatarFallback className="rounded-2xl bg-primary/20 text-primary">{profile.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
      <div className="min-w-0 flex-1"><p className="break-words font-semibold">{profile.name}</p><p className="mt-1 text-xs text-muted-foreground">Your team</p></div><div className="text-right"><p className="display-font text-2xl font-bold text-primary">{player?.score ?? 0}</p><p className="text-xs text-muted-foreground">points</p></div>
    </header>
    {(!session || session.waiting || (!session.ended && (!profile.ready || !profile.name.trim()))) && onProfileChange ? <div className="py-5"><TeamProfileEditor profile={profile} onChange={onProfileChange} /></div> : session ? <SessionQuestion key={session.runId} session={session} player teamId={profile.id} onSubmit={onSubmit} /> : <section className="py-12 text-center"><h1 className="text-2xl font-bold text-primary">You're in, {profile.name}.</h1><p className="mt-4 text-sm text-muted-foreground">Waiting for the host to start a game.</p></section>}
    <section className="border-t-2 border-dotted border-primary/40 py-5"><h2 className="mb-4 font-semibold text-primary">Team rankings</h2>
      {!session?.rankings.length ? <p className="text-sm text-muted-foreground">Rankings will appear when the game starts.</p> : <ol className="space-y-2">{session.rankings.map((team, index) => <li key={team.id} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${team.id === profile.id ? 'border border-primary/30 bg-primary/10' : 'bg-secondary/20'}`}><span className="w-6 text-sm font-bold text-primary">{index > 0 && session.rankings[index - 1].score === team.score ? session.rankings.findIndex(item => item.score === team.score) + 1 : index + 1}</span><Avatar className="h-8 w-8"><AvatarImage src={team.avatarUrl} alt="Team profile" className="object-cover" /><AvatarFallback className="bg-secondary text-xs">{team.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="min-w-0 flex-1 break-words text-sm">{team.name}</span><span className="font-semibold text-primary">{team.score}</span></li>)}</ol>}
    </section>
  </div>;
}