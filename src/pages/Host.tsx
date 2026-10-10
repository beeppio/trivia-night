import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Copy, Crown, Eye, Monitor, Pencil, Play, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PartyLayout } from '@/components/PartyLayout';
import { NewGameDialog } from '@/components/NewGameDialog';
import { GameMediaList } from '@/components/GameMedia';
import { HostPlayers } from '@/components/HostPlayers';
import { PREVIEW_ROOM } from '@/lib/preview-data';
import { loadGames, readLegacyDrafts, saveGame, deleteGame, type LocalGame } from '@/lib/local-games';
import { useRoundMusic } from '@/hooks/use-round-music';

type Stage = 'lobby' | 'round' | 'question' | 'closed' | 'reveal' | 'ended';

export default function Host() {
  const [games, setGames] = useState<LocalGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [editor, setEditor] = useState<{ game?: LocalGame } | null>(null);
  const [activeGame, setActiveGame] = useState<LocalGame | null>(null);
  const [stage, setStage] = useState<Stage>('lobby');
  const [index, setIndex] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const music = useRoundMusic();

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const stored = await loadGames();
        const legacy = readLegacyDrafts();
        const migrated = legacy.filter(game => !stored.some(existing => existing.id === game.id));
        for (const game of migrated) await saveGame(game);
        if (legacy.length) localStorage.removeItem('285-trivia-drafts');
        if (!cancelled) setGames([...stored, ...migrated]);
      } catch {
        if (!cancelled) { setStorageError(true); toast.error('Unable to load local games. Check browser storage permissions.'); }
      } finally { if (!cancelled) setLoading(false); }
    };
    void restore();
    return () => { cancelled = true; };
  }, []);

  const persistGame = async (game: LocalGame) => {
    try {
      await saveGame(game);
      setGames(previous => previous.some(item => item.id === game.id) ? previous.map(item => item.id === game.id ? game : item) : [...previous, game]);
      setStorageError(false);
      toast.success('Game and attachments saved in this browser');
      return true;
    } catch { toast.error('Unable to save. Browser storage may be full or unavailable.'); return false; }
  };
  const removeGame = async (id: string) => {
    try {
      await deleteGame(id);
      setGames(previous => previous.filter(game => game.id !== id));
      toast.success('Game deleted from this browser');
      return true;
    } catch { toast.error('Unable to delete the game. Please try again.'); return false; }
  };
  const questions = activeGame?.rounds.flatMap((round, roundIndex) => round.questions.map((question, questionIndex) => ({ ...question, roundName: round.name, roundIndex, questionIndex }))) || [];
  const question = questions[index];
  const playable = (game: LocalGame) => game.rounds.every(round => round.questions.length > 0 && round.questions.every(item => item.text.trim() && item.answer.trim()));
  const startGame = (game: LocalGame) => { setActiveGame(game); setIndex(0); setStage('round'); music.switchTrack(game.rounds[0].music); };
  const changeQuestion = (next: number) => {
    const differentRound = questions[next].roundIndex !== question.roundIndex;
    if (differentRound) music.switchTrack(activeGame?.rounds[questions[next].roundIndex].music);
    setIndex(next);
    setStage(differentRound ? 'round' : 'question');
  };
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(PREVIEW_ROOM); toast.success('Preview room code copied'); }
    catch { toast.error(`Clipboard unavailable. The preview code is ${PREVIEW_ROOM}.`); }
  };

  return <PartyLayout>
    <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-primary sm:text-3xl"><Crown aria-hidden="true" className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />Host Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl"><Link to={`/player/${PREVIEW_ROOM}?preview=1`}><Eye className="mr-2 h-4 w-4" /> Player preview</Link></Button>
          <Button asChild className="rounded-xl"><Link to={`/display/${PREVIEW_ROOM}`} target="_blank" rel="noopener noreferrer"><Monitor className="mr-2 h-4 w-4" /> Open display</Link></Button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="panel p-5 sm:p-7">
          {stage !== 'lobby' && <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-5">
            <div className="min-w-0 flex-1">{activeGame && <p className="break-words text-lg font-semibold text-primary">{activeGame.title}</p>}{question && <p className="mt-1 text-xs text-muted-foreground">Round {question.roundIndex + 1} · {question.roundName} · Question {question.questionIndex + 1}</p>}</div>
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold capitalize text-primary">{stage}</span>
          </div>}
          {stage === 'lobby' ? loading ? <p role="status" className="py-12 text-center text-muted-foreground">Loading your games…</p> : storageError ? <p role="alert" className="py-12 text-center text-destructive">Local game storage is unavailable. Allow browser storage and refresh to retry.</p> : <div className="py-5">
            <h2 className="mb-4 text-lg font-semibold">Your games</h2>
            <div className="space-y-4">{games.map(game => <article key={game.id} className="rounded-2xl border border-border bg-secondary/30 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0"><h3 className="break-words text-lg font-semibold text-primary">{game.title || 'Untitled game'}</h3><p className="mt-2 text-xs text-muted-foreground">{game.rounds.length} rounds · {game.rounds.reduce((total, round) => total + round.questions.length, 0)} questions</p></div>
                <div className="flex items-center gap-2">
                  <Button className="rounded-xl" disabled={!playable(game)} onClick={() => startGame(game)}><Play className="mr-2 h-4 w-4 fill-white text-white" /> Start game</Button>
                  <Button variant="ghost" size="icon" aria-label={`Edit ${game.title || 'untitled game'}`} title="Edit game" className="rounded-xl border-0 bg-transparent text-primary hover:bg-transparent hover:text-foreground" onClick={() => setEditor({ game })}><Pencil className="h-4 w-4" /></Button>
                </div>
              </div>
              {!playable(game) && <p className="mt-3 text-xs text-muted-foreground">Add questions and answers in Edit before starting.</p>}
            </article>)}
              <Button variant="outline" onClick={() => setEditor({})} className="h-auto min-h-28 w-full gap-3 rounded-2xl border-2 border-dotted border-primary/50 bg-transparent p-5 text-base text-primary hover:border-primary hover:bg-primary/10 hover:text-primary"><Plus aria-hidden="true" className="h-5 w-5" /> Add new game</Button>
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">Saved on this device. Start game runs locally on this dashboard; player and display previews are not connected.</p>
          </div> : stage === 'ended' ? <div className="py-12 text-center"><h2 className="text-3xl font-bold">Game complete</h2><p className="mt-3 text-primary">{activeGame?.title}</p><Button className="party-button mt-6" onClick={() => { setActiveGame(null); setStage('lobby'); }}>Back to games</Button></div> : question && stage === 'round' ? <div className="py-12 text-center"><p className="eyebrow text-primary">ROUND {question.roundIndex + 1}</p><h2 className="mt-4 text-4xl font-bold">{question.roundName}</h2><Button className="party-button mt-7" onClick={() => setStage('question')}>Show question <ArrowRight className="ml-2 h-4 w-4" /></Button></div> : question ? <div className="space-y-6">
            <h2 className="whitespace-pre-wrap break-words text-2xl font-bold leading-tight sm:text-3xl">{question.text}</h2>
            <GameMediaList media={question.questionMedia} />
            {stage === 'reveal' && question.hostNotes?.trim() && <section className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4"><h3 className="text-sm font-semibold text-primary">Host notes</h3><p className="whitespace-pre-wrap break-words text-sm leading-6">{question.hostNotes}</p></section>}
            <div className="space-y-4 rounded-xl border border-[hsl(var(--mint)/.25)] bg-[hsl(var(--mint)/.05)] p-4"><p className="eyebrow text-[hsl(var(--mint))]">Host answer</p><p className="whitespace-pre-wrap break-words font-semibold">{question.answer}</p><GameMediaList media={question.answerMedia} /></div>
            {stage === 'closed' && <p role="status" className="text-sm text-accent">Question closed in this local walkthrough.</p>}
            {stage === 'reveal' && <p role="status" className="text-sm text-[hsl(var(--mint))]">Answer revealed locally. No connected screens were updated.</p>}
          </div> : null}
          {question && stage !== 'lobby' && stage !== 'ended' && <div className="mt-7 flex flex-wrap gap-2 border-t border-border pt-5">
            {stage === 'question' && <Button variant="secondary" className="rounded-xl" onClick={() => setStage('closed')}>Close question</Button>}
            {(stage === 'question' || stage === 'closed') && <Button className="rounded-xl" onClick={() => setStage('reveal')}>Reveal answer</Button>}
            <Button variant="outline" className="rounded-xl" disabled={index === 0} onClick={() => changeQuestion(index - 1)}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>
            <Button variant="outline" className="rounded-xl" disabled={index === questions.length - 1} onClick={() => changeQuestion(index + 1)}>Next question <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => setStage('question')}><RotateCcw className="mr-2 h-4 w-4" /> Replay</Button>
          </div>}
        </section>
        <aside className="space-y-5">
          <section className="panel p-5"><p className="eyebrow">PREVIEW ROOM CODE</p><div className="mt-3 flex items-center justify-between"><span className="display-font text-4xl font-bold tracking-[.15em] text-primary">{PREVIEW_ROOM}</span><Button variant="ghost" size="icon" aria-label="Copy preview room code" className="rounded-xl" onClick={copyCode}><Copy className="h-4 w-4" /></Button></div><p className="mt-3 text-xs text-muted-foreground">Not a live room · sample code only</p></section>
          <HostPlayers />
          <section className="panel p-5"><p className="eyebrow">TIMER LAYOUT</p><p className="display-font my-4 text-center text-6xl font-bold tabular-nums">00:30</p><p className="text-center text-xs leading-5 text-muted-foreground">Static preview. Synchronized timers are not connected yet.</p></section>
          {activeGame && stage !== 'ended' && <section className="panel space-y-4 p-5"><h2 className="font-semibold">Round music</h2><p className="break-words text-xs text-muted-foreground">{activeGame.rounds[question.roundIndex].music?.name || 'No music for this round'}</p><Button variant="outline" className="w-full rounded-xl" onClick={() => music.toggleMusic(activeGame.rounds[question.roundIndex].music)}>{music.enabled ? 'Mute music' : 'Enable music'}</Button><label className="flex items-center gap-3 text-xs text-muted-foreground">Volume<input aria-label="Round music volume" type="range" min="0" max="1" step="0.05" value={music.volume} onChange={event => music.changeVolume(Number(event.target.value))} className="w-full accent-primary" /></label></section>}
          <Button variant="outline" className="w-full rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={stage === 'lobby' || stage === 'ended'} onClick={() => setConfirmEnd(true)}>End game</Button>
        </aside>
      </div>
    </main>
    {editor && <NewGameDialog initialGame={editor.game} onClose={() => setEditor(null)} onSave={persistGame} onDelete={removeGame} />}
    <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>End this game?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">This ends the local walkthrough. Your saved questions and files will be kept.</p><div className="mt-4 flex justify-end gap-3"><Button variant="outline" className="rounded-xl" onClick={() => setConfirmEnd(false)}>Keep playing</Button><Button className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={() => { music.switchTrack(); setStage('ended'); setConfirmEnd(false); }}>End game</Button></div></DialogContent></Dialog>
  </PartyLayout>;
}