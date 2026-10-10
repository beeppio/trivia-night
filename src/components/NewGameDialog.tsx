import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaUpload } from '@/components/GameMedia';
import { emptyQuestion, emptyRound, type GameQuestion, type LocalGame } from '@/lib/local-games';
import { Trash2 } from 'lucide-react';

function CountSelect({ id, label, count, maximum, onChange }: { id: string; label: string; count: number; maximum: number; onChange: (count: number) => void }) {
  return <Select value={String(count)} onValueChange={value => onChange(Number(value))}>
    <SelectTrigger id={id} aria-label={label} className="h-12 rounded-xl bg-transparent">
      <span className="truncate text-muted-foreground">{label}</span><span className="ml-auto mr-2 font-medium text-foreground">{count}</span>
    </SelectTrigger>
    <SelectContent className="max-h-64 rounded-xl">{Array.from({ length: maximum }, (_, index) => <SelectItem key={index} value={String(index + 1)}>{index + 1}</SelectItem>)}</SelectContent>
  </Select>;
}

export function NewGameDialog({ onClose, onSave, onDelete, initialGame }: { onClose: () => void; onSave: (game: LocalGame) => Promise<boolean>; onDelete: (id: string) => Promise<boolean>; initialGame?: LocalGame }) {
  const [game, setGame] = useState<LocalGame>(() => initialGame || { id: crypto.randomUUID(), title: '', rounds: [emptyRound()] });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateQuestion = (roundId: string, questionId: string, update: Partial<GameQuestion>) => setGame(previous => ({ ...previous, rounds: previous.rounds.map(round => round.id === roundId ? { ...round, questions: round.questions.map(question => question.id === questionId ? { ...question, ...update } : question) } : round) }));
  const resizeRounds = (count: number) => {
    if (count < game.rounds.length && !window.confirm('Remove the extra rounds and their questions?')) return;
    setGame(previous => ({ ...previous, rounds: count <= previous.rounds.length ? previous.rounds.slice(0, count) : [...previous.rounds, ...Array.from({ length: count - previous.rounds.length }, emptyRound)] }));
  };
  const resizeQuestions = (roundId: string, count: number) => {
    const round = game.rounds.find(item => item.id === roundId)!;
    if (count < round.questions.length && !window.confirm('Remove the extra questions and their attachments?')) return;
    setGame(previous => ({ ...previous, rounds: previous.rounds.map(item => item.id === roundId ? { ...item, questions: count <= item.questions.length ? item.questions.slice(0, count) : [...item.questions, ...Array.from({ length: count - item.questions.length }, emptyQuestion)] } : item) }));
  };
  const removeGame = async () => {
    if (!initialGame) return;
    setSaving(true);
    try { if (await onDelete(initialGame.id)) onClose(); }
    finally { setSaving(false); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const allMedia = game.rounds.flatMap(round => [...(round.music ? [round.music] : []), ...round.questions.flatMap(question => [...question.questionMedia, ...question.answerMedia])]);
    const bytes = allMedia.reduce((total, media) => total + (media.file?.size || 0), 0);
    if (allMedia.some(media => media.trimEnd !== undefined && media.trimEnd <= (media.trimStart ?? 0))) { toast.error('Every media end time must be after its start time.'); return; }
    if (game.rounds.some(round => round.questions.some(question => question.type === 'order' && ((question.orderItems?.length ?? 0) < 2 || question.orderItems!.some(item => !item.trim()) || new Set(question.orderItems!.map(item => item.trim())).size !== question.orderItems!.length)))) { toast.error('Ordering questions need at least two distinct, non-empty items.'); return; }
    if (bytes > 100 * 1024 * 1024) { toast.error('Attachments must total 100 MB or less per game.'); return; }
    setSaving(true);
    try {
      if (await onSave({ ...game, title: game.title.trim(), rounds: game.rounds.map((round, index) => ({ ...round, name: round.name.trim() || `Round ${index + 1}` })) })) onClose();
    } finally { setSaving(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent aria-describedby={undefined} className="max-h-[90svh] max-w-4xl overflow-y-auto rounded-2xl bg-card p-5 sm:p-8">
      <DialogHeader><DialogTitle className="text-2xl">{initialGame ? 'Edit game' : 'Create a new game'}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="mt-4 space-y-7">
        <fieldset disabled={saving} className="space-y-7 disabled:opacity-60">
          <div className="grid gap-5 rounded-2xl border border-primary/30 bg-primary/10 p-5 sm:grid-cols-[2fr_1fr]">
            <Input id="game-name" aria-label="Game name" value={game.title} onChange={event => setGame(previous => ({ ...previous, title: event.target.value }))} placeholder="Game name" maxLength={80} className="h-12 rounded-xl bg-transparent placeholder:text-muted-foreground" />
            <CountSelect id="round-count" label="Number of rounds" count={game.rounds.length} maximum={10} onChange={resizeRounds} />
          </div>
          {game.rounds.map((round, roundIndex) => <section key={round.id} className="space-y-6 rounded-2xl border border-border bg-secondary/15 p-4 sm:p-6">
            <div className="grid items-start gap-5 sm:grid-cols-[2fr_1fr]">
              <div className="space-y-3">
                <Input id={`round-${round.id}`} aria-label={`Round ${roundIndex + 1} name`} placeholder={`Round ${roundIndex + 1} name`} value={round.name} maxLength={80} onChange={event => setGame(previous => ({ ...previous, rounds: previous.rounds.map(item => item.id === round.id ? { ...item, name: event.target.value } : item) }))} className="h-12 rounded-xl bg-transparent placeholder:text-muted-foreground" />
                <Textarea aria-label={`Round ${roundIndex + 1} category description`} placeholder="Category description (optional)" value={round.description || ''} maxLength={1000} onChange={event => setGame(previous => ({ ...previous, rounds: previous.rounds.map(item => item.id === round.id ? { ...item, description: event.target.value } : item) }))} className="min-h-20 rounded-xl bg-transparent placeholder:text-muted-foreground" />
                <MediaUpload id={`music-${round.id}`} label={`Add music to round ${roundIndex + 1}`} musicOnly media={round.music ? [round.music] : []} onChange={media => setGame(previous => ({ ...previous, rounds: previous.rounds.map(item => item.id === round.id ? { ...item, music: media[0] } : item) }))} />
              </div>
              <CountSelect id={`count-${round.id}`} label="Number of questions" count={round.questions.length} maximum={20} onChange={count => resizeQuestions(round.id, count)} />
            </div>
            {round.questions.map((question, questionIndex) => <section key={question.id} className="space-y-5 border-t-2 border-dotted border-primary/40 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-primary">Question {questionIndex + 1}</h3><label className="flex items-center gap-3 text-sm text-muted-foreground">Points<Input aria-label={`Points for question ${questionIndex + 1} in round ${roundIndex + 1}`} type="number" min="1" max="1000" step="1" value={question.points ?? 10} onChange={event => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 1 && value <= 1000) updateQuestion(round.id, question.id, { points: value }); }} className="h-10 w-24 rounded-xl bg-transparent text-center" /></label></div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Textarea id={`question-${question.id}`} aria-label={`Round ${roundIndex + 1}, question ${questionIndex + 1}`} value={question.text} onChange={event => updateQuestion(round.id, question.id, { text: event.target.value })} placeholder="Question" maxLength={4000} className="min-h-28 rounded-xl bg-transparent placeholder:text-muted-foreground" />
                  <MediaUpload id={`question-files-${question.id}`} label={`Add media to round ${roundIndex + 1}, question ${questionIndex + 1}`} media={question.questionMedia} onChange={questionMedia => updateQuestion(round.id, question.id, { questionMedia })} />
                </div>
                <div className="space-y-3">
                  <Select value={question.type || 'text'} onValueChange={value => updateQuestion(round.id, question.id, value === 'order' ? { type: 'order', orderItems: question.orderItems || ['', ''], answer: (question.orderItems || []).map((item, index) => `${index + 1}. ${item}`).join('\n') } : { type: 'text' })}><SelectTrigger aria-label="Question type" className="h-11 rounded-xl bg-transparent"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="text">Written answer</SelectItem><SelectItem value="order">Put items in order</SelectItem></SelectContent></Select>
                  {question.type === 'order' ? <div className="space-y-3"><p className="text-sm font-semibold text-primary">Items in correct order (one per line)</p><Textarea aria-label="Items in correct order" value={(question.orderItems || []).join('\n')} maxLength={3000} onChange={event => { const orderItems = event.target.value.split('\n'); updateQuestion(round.id, question.id, { orderItems, answer: orderItems.map((item, index) => `${index + 1}. ${item}`).join('\n') }); }} placeholder={'First item\nSecond item\nThird item'} className="min-h-28 rounded-xl bg-transparent" /><p className="text-xs text-muted-foreground">Players receive shuffled badges. The answer is the order entered here.</p></div> : <Textarea id={`answer-${question.id}`} aria-label={`Answer to round ${roundIndex + 1}, question ${questionIndex + 1}`} value={question.answer} onChange={event => updateQuestion(round.id, question.id, { answer: event.target.value })} placeholder="Answer" maxLength={4000} className="min-h-28 rounded-xl bg-transparent placeholder:text-muted-foreground" />}
                  <MediaUpload id={`answer-files-${question.id}`} label={`Add media to answer ${questionIndex + 1} in round ${roundIndex + 1}`} media={question.answerMedia} onChange={answerMedia => updateQuestion(round.id, question.id, { answerMedia })} />
                </div>
              </div>
              <Textarea id={`notes-${question.id}`} aria-label={`Supplemental host notes for round ${roundIndex + 1}, question ${questionIndex + 1}`} value={question.hostNotes || ''} onChange={event => updateQuestion(round.id, question.id, { hostNotes: event.target.value })} placeholder="Supplemental text (host only · shown after answer reveal)" maxLength={4000} className="min-h-24 rounded-xl bg-transparent placeholder:text-muted-foreground" />
            </section>)}
          </section>)}
        </fieldset>
        <div className="sticky -bottom-5 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-card py-4 sm:-bottom-8">
          {initialGame && <Button type="button" variant="ghost" size="icon" disabled={saving} aria-label="Delete game" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" /></Button>}
          <Button type="button" variant="outline" disabled={saving} className="rounded-xl" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving} className="rounded-xl">{saving ? 'Saving…' : 'Save game'}</Button>
        </div>
      </form>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent aria-describedby={undefined} className="rounded-2xl bg-card">
          <DialogHeader><DialogTitle>Delete this game?</DialogTitle></DialogHeader>
          <p className="text-sm leading-6 text-muted-foreground">This removes the saved game and all its attachments from this browser. This cannot be undone.</p>
          <div className="flex justify-end gap-3"><Button variant="outline" disabled={saving} className="rounded-xl" onClick={() => setConfirmDelete(false)}>Keep game</Button><Button disabled={saving} className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={removeGame}>{saving ? 'Deleting…' : 'Delete game'}</Button></div>
        </DialogContent>
      </Dialog>
    </DialogContent>
  </Dialog>;
}