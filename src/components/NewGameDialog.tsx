import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaUpload } from '@/components/GameMedia';
import { emptyQuestion, emptyRound, type GameQuestion, type LocalGame } from '@/lib/local-games';

function CountSelect({ id, label, count, maximum, onChange }: { id: string; label: string; count: number; maximum: number; onChange: (count: number) => void }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Select value={String(count)} onValueChange={value => onChange(Number(value))}><SelectTrigger id={id} className="h-12 rounded-xl bg-background"><SelectValue /></SelectTrigger><SelectContent className="max-h-64 rounded-xl">{Array.from({ length: maximum }, (_, index) => <SelectItem key={index} value={String(index + 1)}>{index + 1}</SelectItem>)}</SelectContent></Select></div>;
}

export function NewGameDialog({ onClose, onSave, initialGame }: { onClose: () => void; onSave: (game: LocalGame) => Promise<boolean>; initialGame?: LocalGame }) {
  const [game, setGame] = useState<LocalGame>(() => initialGame || { id: crypto.randomUUID(), title: '', rounds: [emptyRound(0)] });
  const [saving, setSaving] = useState(false);
  const updateQuestion = (roundId: string, questionId: string, update: Partial<GameQuestion>) => setGame(previous => ({ ...previous, rounds: previous.rounds.map(round => round.id === roundId ? { ...round, questions: round.questions.map(question => question.id === questionId ? { ...question, ...update } : question) } : round) }));
  const resizeRounds = (count: number) => {
    if (count < game.rounds.length && !window.confirm('Remove the extra rounds and their questions?')) return;
    setGame(previous => ({ ...previous, rounds: count <= previous.rounds.length ? previous.rounds.slice(0, count) : [...previous.rounds, ...Array.from({ length: count - previous.rounds.length }, (_, index) => emptyRound(previous.rounds.length + index))] }));
  };
  const resizeQuestions = (roundId: string, count: number) => {
    const round = game.rounds.find(item => item.id === roundId)!;
    if (count < round.questions.length && !window.confirm('Remove the extra questions and their attachments?')) return;
    setGame(previous => ({ ...previous, rounds: previous.rounds.map(item => item.id === roundId ? { ...item, questions: count <= item.questions.length ? item.questions.slice(0, count) : [...item.questions, ...Array.from({ length: count - item.questions.length }, emptyQuestion)] } : item) }));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!game.title.trim() || game.rounds.some(round => !round.name.trim() || round.questions.some(question => !question.text.trim() || !question.answer.trim()))) { toast.error('Enter a game name, round names, and every question and answer.'); return; }
    const bytes = game.rounds.flatMap(round => round.questions).flatMap(question => [...question.questionMedia, ...question.answerMedia]).reduce((total, media) => total + media.file.size, 0);
    if (bytes > 100 * 1024 * 1024) { toast.error('Attachments must total 100 MB or less per game.'); return; }
    setSaving(true);
    try { if (await onSave({ ...game, title: game.title.trim() })) onClose(); }
    finally { setSaving(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}><DialogContent aria-describedby={undefined} className="max-h-[90svh] max-w-4xl overflow-y-auto rounded-2xl bg-card p-5 sm:p-8"><DialogHeader><DialogTitle className="text-2xl">{initialGame ? 'Edit game' : 'Create a new game'}</DialogTitle></DialogHeader><form onSubmit={submit} className="mt-4 space-y-7"><fieldset disabled={saving} className="space-y-7 disabled:opacity-60">
    <div className="grid gap-5 sm:grid-cols-[2fr_1fr]"><div className="space-y-2"><Label htmlFor="game-name">Game name</Label><Input id="game-name" value={game.title} onChange={event => setGame(previous => ({ ...previous, title: event.target.value }))} placeholder="285’s Trivia Night" maxLength={80} required className="h-12 rounded-xl bg-background" /></div><CountSelect id="round-count" label="Number of rounds" count={game.rounds.length} maximum={10} onChange={resizeRounds} /></div>
    {game.rounds.map((round, roundIndex) => <section key={round.id} className="space-y-6 border-t border-border pt-6"><div className="grid items-end gap-5 sm:grid-cols-[2fr_1fr]"><div className="space-y-2"><Label htmlFor={`round-${round.id}`}>Round {roundIndex + 1} name</Label><Input id={`round-${round.id}`} value={round.name} maxLength={80} required onChange={event => setGame(previous => ({ ...previous, rounds: previous.rounds.map(item => item.id === round.id ? { ...item, name: event.target.value } : item) }))} className="h-12 rounded-xl bg-background" /></div><CountSelect id={`count-${round.id}`} label="Questions in this round" count={round.questions.length} maximum={20} onChange={count => resizeQuestions(round.id, count)} /></div>
      {round.questions.map((question, questionIndex) => <section key={question.id} className="space-y-5 rounded-2xl border border-border bg-secondary/20 p-4 sm:p-5"><h3 className="font-semibold text-primary">Question {questionIndex + 1}</h3><div className="grid gap-6 md:grid-cols-2"><div className="space-y-4"><div className="space-y-2"><Label htmlFor={`question-${question.id}`}>Question</Label><Textarea id={`question-${question.id}`} value={question.text} onChange={event => updateQuestion(round.id, question.id, { text: event.target.value })} placeholder="Enter your question" required maxLength={4000} className="min-h-28 rounded-xl bg-background" /></div><MediaUpload id={`question-files-${question.id}`} label="Add question media" media={question.questionMedia} onChange={questionMedia => updateQuestion(round.id, question.id, { questionMedia })} /></div><div className="space-y-4"><div className="space-y-2"><Label htmlFor={`answer-${question.id}`}>Answer</Label><Textarea id={`answer-${question.id}`} value={question.answer} onChange={event => updateQuestion(round.id, question.id, { answer: event.target.value })} placeholder="Enter the correct answer" required maxLength={4000} className="min-h-28 rounded-xl bg-background" /></div><MediaUpload id={`answer-files-${question.id}`} label="Add answer media" media={question.answerMedia} onChange={answerMedia => updateQuestion(round.id, question.id, { answerMedia })} /></div></div></section>)}
    </section>)}
  </fieldset><div className="sticky -bottom-5 flex justify-end gap-3 border-t border-border bg-card py-4 sm:-bottom-8"><Button type="button" variant="outline" disabled={saving} className="rounded-xl" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving} className="rounded-xl">{saving ? 'Saving…' : 'Save game'}</Button></div></form></DialogContent></Dialog>;
}
