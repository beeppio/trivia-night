import { Crown, Smartphone, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { formatSeconds, usePlayerSession, useRemainingSeconds, type PublicSession } from '@/hooks/use-local-session';
import { PREVIEW_ROOM } from '@/lib/preview-data';

export default function TV() {
  const broadcastSession = usePlayerSession();
  const [directSession, setDirectSession] = useState<{ session: PublicSession | null } | null>(null);
  useEffect(() => {
    const host = window.opener;
    if (!host) return;
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== host || event.data?.type !== '285-tv-session') return;
      setDirectSession({ session: event.data.session });
    };
    window.addEventListener('message', receive);
    const request = () => { if (!host.closed) host.postMessage({ type: '285-tv-request' }, window.location.origin); };
    request();
    const interval = window.setInterval(request, 2000);
    return () => { window.removeEventListener('message', receive); window.clearInterval(interval); };
  }, []);
  const session = directSession ? directSession.session : broadcastSession;
  const waiting = !session || Boolean(session.waiting);
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    if (!waiting) return;
    setDotCount(1);
    const interval = window.setInterval(() => setDotCount(count => (count + 1) % 4), 500);
    return () => window.clearInterval(interval);
  }, [waiting]);
  const joinUrl = new URL(`/player/${PREVIEW_ROOM}`, window.location.origin).href;
  const remaining = useRemainingSeconds(session?.deadline ?? null, session?.duration ?? 30);
  const showingQuestion = Boolean(session && !session.waiting && !session.preparing && !session.ended);
  const revealed = session?.answer !== undefined;
  const expired = showingQuestion && session?.deadline !== null && remaining === 0;
  const progress = session?.deadline ? Math.max(0, Math.min(100, (session.deadline - Date.now()) / (session.duration * 1000) * 100)) : 100;
  const winners = session?.ended && session.rankings.length ? session.rankings.filter(team => team.score === session.rankings[0].score) : [];

  return <main className="flex min-h-svh flex-col bg-background px-5 py-6 text-foreground sm:px-10 lg:px-16 lg:py-10">
    <header className="flex min-h-12 flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-primary/25 pb-5 text-lg font-semibold text-primary sm:text-2xl lg:text-3xl">
      <span className="min-w-0 break-words">{session?.ended ? 'Final standings' : waiting ? 'Join the game' : session?.roundName}</span>
      <span className="shrink-0">{showingQuestion && session ? `Question ${session.questionIndex + 1} · ${session.questionPoints ?? 10} points` : ''}</span>
    </header>

    <section className="flex flex-1 items-center justify-center py-10 lg:py-12">
      {session?.ended ? <div className="w-full max-w-4xl space-y-8 text-center">
        <Trophy className="mx-auto h-12 w-12 text-yellow-300 sm:h-16 sm:w-16" />
        <div><p className="mb-3 text-lg font-semibold text-primary">{winners.length > 1 ? 'Joint winners' : 'Winner'}</p><h1 className="break-words text-[clamp(2rem,4vw,5rem)] font-bold text-yellow-300">{winners.map(team => team.name).join(' & ') || 'Game complete'}</h1></div>
        <ol aria-label="Final rankings" className="space-y-3 text-left">{session.rankings.map((team, index) => {
          const winner = winners.some(item => item.id === team.id);
          return <li key={team.id} className={`flex items-center gap-4 rounded-2xl border p-4 sm:p-5 ${winner ? 'border-yellow-300/60 bg-yellow-300/10' : 'border-primary/25 bg-card'}`}>
            <span className="w-8 shrink-0 text-xl font-bold text-primary">{index + 1}</span>
            <div className="relative shrink-0">{winner && <Crown aria-label="Winner" className="absolute -top-5 left-1/2 z-10 h-7 w-7 -translate-x-1/2 fill-yellow-300 text-yellow-300" />}<Avatar className={`h-14 w-14 rounded-xl ${winner ? 'ring-2 ring-yellow-300' : ''}`}><AvatarImage src={team.avatarUrl} alt={`${team.name}'s profile picture`} className="object-cover" /><AvatarFallback className="rounded-xl bg-primary/20 font-bold text-primary">{team.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar></div>
            <p className="min-w-0 flex-1 break-words text-lg font-semibold sm:text-2xl">{team.name}</p><p className={`shrink-0 text-xl font-bold tabular-nums sm:text-3xl ${winner ? 'text-yellow-300' : 'text-primary'}`}>{team.score}<span className="ml-2 text-xs">points</span></p>
          </li>;
        })}</ol>
      </div> : session?.preparing ? <div className="w-full space-y-6 text-center"><h1 className="break-words text-[clamp(2rem,5vw,7rem)] font-bold leading-tight text-primary">{session.roundName}</h1>{session.roundDescription?.trim() && <p className="mx-auto max-w-5xl whitespace-pre-wrap break-words text-[clamp(1.25rem,2.5vw,3rem)] leading-relaxed">{session.roundDescription}</p>}</div> : showingQuestion ? <div className="w-full text-center">{revealed && <p className="mb-5 text-[clamp(1rem,2vw,2rem)] font-semibold text-primary">Correct Answer</p>}<h1 role={expired && !revealed ? 'status' : undefined} className={`whitespace-pre-wrap break-words text-[clamp(2rem,5vw,7rem)] font-bold leading-[1.15] tracking-tight ${expired && !revealed ? 'text-red-400' : 'text-foreground'}`}>{revealed ? session?.answer : expired ? 'Time is up!' : session?.text}</h1></div> : <div className="w-full max-w-5xl space-y-8 text-center">
        <Smartphone aria-hidden="true" className="mx-auto h-16 w-16 text-primary sm:h-20 sm:w-20" />
        <div className="space-y-4"><p className="text-lg font-semibold sm:text-2xl">Open this link on your phone</p><a href={joinUrl} className="block break-all rounded-3xl border border-primary/40 bg-primary/10 px-5 py-6 text-[clamp(1.25rem,3vw,3rem)] font-bold text-primary underline-offset-4 hover:underline">{joinUrl}</a><p className="text-lg text-foreground sm:text-2xl">Room code <span className="ml-2 font-bold tracking-[.2em] text-primary">{PREVIEW_ROOM}</span></p></div>
        <p role="status" aria-label="Waiting for host to start game" className="text-[clamp(1.25rem,2.5vw,2.5rem)] font-semibold">Waiting for host to start game<span aria-hidden="true" className="inline-block w-[1.5em] text-left">{'.'.repeat(dotCount)}</span></p>
      </div>}
    </section>

    {!session?.ended && <footer className="space-y-5 border-t border-primary/25 pt-6">
      {showingQuestion && <div className="relative h-14 overflow-hidden rounded-2xl border border-violet-400/40 bg-violet-950 sm:h-16">
        <div role="progressbar" aria-label="Question time remaining" aria-valuemin={0} aria-valuemax={session?.duration ?? 30} aria-valuenow={remaining} style={{ width: `${progress}%` }} className="absolute inset-y-0 left-0 rounded-xl bg-violet-600 transition-[width] duration-100 ease-linear motion-reduce:transition-none" />
        <div role="timer" className="relative flex h-full items-center justify-between px-5 text-white"><span className="text-sm font-semibold sm:text-lg">{expired ? 'Time is up!' : revealed ? 'Answer revealed' : 'Time remaining'}</span><span className="text-3xl font-bold tabular-nums sm:text-4xl">{formatSeconds(remaining).replace(/^0(?=\d:)/, '')}</span></div>
      </div>}
      {waiting && <p className="text-center text-lg font-semibold text-primary">{session?.rankings.length ?? 0} {(session?.rankings.length ?? 0) === 1 ? 'player joined' : 'players joined'}</p>}
      <ul aria-label="Team scores and answers" className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {session?.rankings.map(team => {
          const result = session.results?.find(item => item.teamId === team.id);
          const unanswered = showingQuestion && !revealed && !session.submittedTeamIds?.includes(team.id);
          const badgeColors = result?.grade === 1 ? 'border-emerald-400/60 bg-emerald-950 text-emerald-200' : result?.grade === 0.5 ? 'border-yellow-400/60 bg-yellow-950 text-yellow-200' : result?.grade === 0 ? 'border-red-400/60 bg-red-950 text-red-200' : 'border-primary/40 bg-card text-foreground';
          return <li key={team.id} className="min-w-0 space-y-3">
            {revealed && <div className={`rounded-2xl border px-4 py-3 text-center ${badgeColors}`}><p className="whitespace-pre-wrap break-words text-base font-semibold sm:text-lg">{result?.answer || 'No Answer'}</p><p className="mt-2 text-xs font-semibold">{result?.grade === 1 ? 'Correct' : result?.grade === 0.5 ? 'Half correct' : result?.grade === 0 ? 'Incorrect' : 'Awaiting grade'}{result?.grade !== undefined ? ` · ${result.points} points` : ''}</p></div>}
            <div className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 transition-colors sm:p-4 ${unanswered ? 'border-slate-500/40 bg-slate-500/15 text-slate-300' : 'border-primary/30 bg-card'}`}>
              <Avatar className={`h-12 w-12 shrink-0 rounded-xl sm:h-14 sm:w-14 ${unanswered ? 'grayscale' : ''}`}><AvatarImage src={team.avatarUrl} alt={`${team.name}'s profile picture`} className="object-cover" /><AvatarFallback className="rounded-xl bg-primary/20 text-lg font-bold text-primary">{team.name.slice(0, 2).toUpperCase() || '?'}</AvatarFallback></Avatar>
              <div className="min-w-0"><p className="break-words text-base font-semibold sm:text-lg">{team.name}</p>{waiting ? <p className={`mt-2 text-sm font-semibold ${team.ready ? 'text-emerald-300' : 'text-amber-300'}`}>{team.ready ? 'Ready' : 'Not ready'}</p> : <p className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${unanswered ? 'text-slate-300' : 'text-primary'}`}>{team.score}<span className="ml-2 text-xs font-medium">points</span></p>}</div>
            </div>
          </li>;
        })}
      </ul>
    </footer>}
  </main>;
}