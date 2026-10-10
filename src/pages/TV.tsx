import { Brain } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatSeconds, usePlayerSession, useRemainingSeconds } from '@/hooks/use-local-session';

export default function TV() {
  const session = usePlayerSession();
  const remaining = useRemainingSeconds(session?.deadline ?? null, session?.duration ?? 30);
  const showingQuestion = session && !session.waiting && !session.preparing && !session.ended;

  return <main className="flex min-h-svh flex-col bg-background px-5 py-6 text-foreground sm:px-10 lg:px-16 lg:py-10">
    <header className="flex min-h-12 flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-primary/25 pb-5 text-lg font-semibold text-primary sm:text-2xl lg:text-3xl">
      <span className="min-w-0 break-words">{session && !session.waiting ? session.roundName : ''}</span>
      <span className="shrink-0">{session && !session.waiting ? `Question ${session.questionIndex + 1}` : ''}</span>
    </header>

    <section className="flex flex-1 items-center justify-center py-10 lg:py-16">
      {showingQuestion ? <h1 className="w-full whitespace-pre-wrap break-words text-center text-[clamp(2rem,5vw,7rem)] font-bold leading-[1.15] tracking-tight text-foreground">{session.text}</h1> : <Brain aria-label="Waiting for the next question" className="h-24 w-24 text-primary sm:h-36 sm:w-36 lg:h-48 lg:w-48" />}
    </section>

    <footer className="flex flex-col gap-5 border-t border-primary/25 pt-6 lg:flex-row lg:items-end lg:gap-8">
      <ul aria-label="Team scores" className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {session?.rankings.map(team => <li key={team.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-primary/30 bg-card p-3 sm:gap-4 sm:p-4">
          <Avatar className="h-12 w-12 shrink-0 rounded-xl sm:h-16 sm:w-16"><AvatarImage src={team.avatarUrl} alt={`${team.name}'s profile picture`} className="object-cover" /><AvatarFallback className="rounded-xl bg-primary/20 text-lg font-bold text-primary">{team.name.slice(0, 2).toUpperCase() || '?'}</AvatarFallback></Avatar>
          <div className="min-w-0"><p className="break-words text-base font-semibold sm:text-xl">{team.name}</p><p className="mt-1 text-xl font-bold tabular-nums text-primary sm:text-3xl">{team.score}<span className="ml-2 text-xs font-medium sm:text-sm">points</span></p></div>
        </li>)}
      </ul>
      <div role="timer" aria-label="Question time remaining" className={`shrink-0 self-center rounded-2xl border px-6 py-3 text-[clamp(2.5rem,5vw,6rem)] font-bold leading-none tabular-nums lg:self-end ${session?.deadline && remaining <= 10 ? 'border-red-400/50 bg-red-400/10 text-red-400' : 'border-primary/40 bg-primary/10 text-primary'}`}>
        {formatSeconds(remaining)}
      </div>
    </footer>
  </main>;
}
