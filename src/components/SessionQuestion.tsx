import { useState, type FormEvent } from 'react';
import { LockKeyhole, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { QuestionMedia } from '@/components/QuestionMedia';
import { GameMediaList } from '@/components/GameMedia';
import { formatSeconds, useRemainingSeconds, type PublicSession } from '@/hooks/use-local-session';

export function SessionQuestion({ session, player = false, onSubmit }: { session: PublicSession; player?: boolean; onSubmit?: (answer: string) => void }) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const remaining = useRemainingSeconds(session.deadline, session.duration);
  const locked = !session.open || (session.deadline !== null && remaining === 0);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (locked || submitted || !answer.trim() || !session.deadline || Date.now() >= session.deadline) return;
    onSubmit?.(answer.trim());
    setSubmitted(true);
  };
  if (session.ended) return <section className="py-12 text-center"><h1 className="text-3xl font-bold text-primary">Game complete</h1></section>;
  return <section className="space-y-6 py-7">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="eyebrow text-primary">Round {session.roundIndex + 1} · Question {session.questionIndex + 1}</p><span className="display-font rounded-xl border border-border px-3 py-2 text-2xl font-bold tabular-nums text-white">{formatSeconds(remaining)}</span></div>
    <h1 className="whitespace-pre-wrap break-words text-2xl font-bold text-white sm:text-3xl">{session.text}</h1>
    <QuestionMedia media={session.media} imagesRevealed={session.imagesRevealed} videoStartedAt={session.videoStartedAt} audience />
    {player && <form onSubmit={submit} className="space-y-4">
      <Textarea aria-label="Your answer" placeholder="Type your answer" maxLength={4000} value={answer} disabled={locked || submitted} onChange={event => setAnswer(event.target.value)} className="min-h-28 rounded-xl bg-transparent" />
      <Button type="submit" disabled={locked || submitted || !answer.trim()} className="h-12 w-full rounded-xl text-white">{submitted ? <><Check className="mr-2 h-4 w-4" /> Answer locked in</> : locked ? <><LockKeyhole className="mr-2 h-4 w-4" /> Answers locked</> : 'Submit answer'}</Button>
      <p role="status" className="text-center text-sm text-muted-foreground">{remaining === 0 || (locked && session.deadline !== null) ? 'Time is up. Wait for the next question.' : submitted ? 'Submitted to the host for review.' : session.deadline === null ? 'Wait for the host to start the question.' : ''}</p>
    </form>}
    {session.answer !== undefined && <section className="space-y-4 border-t-2 border-dotted border-primary/60 pt-6"><h2 className="text-sm font-semibold text-primary">Answer</h2><p className="whitespace-pre-wrap break-words text-xl text-white">{session.answer}</p><GameMediaList media={session.answerMedia || []} /></section>}
  </section>;
}