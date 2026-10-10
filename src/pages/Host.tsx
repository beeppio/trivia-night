import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Copy, Eye, Monitor, Play, Plus, RotateCcw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PartyLayout } from '@/components/PartyLayout';
import { NewGameDialog } from '@/components/NewGameDialog';
import { QuestionCard } from '@/components/QuestionCard';
import { Leaderboard } from '@/components/Leaderboard';
import { PREVIEW_ROOM, previewPlayers, previewQuestions } from '@/lib/preview-data';

const sampleAnswers = ['The Upside Down', 'Luigi', 'Avocado'];
type Stage = 'lobby' | 'round' | 'question' | 'closed' | 'reveal' | 'leaderboard' | 'ended';
type LocalGame = { id: string; title: string };

export default function Host() {
  const [games, setGames] = useState<LocalGame[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('285-trivia-drafts') || '[]');
      return Array.isArray(saved) ? saved.filter((game): game is LocalGame => game !== null && typeof game === 'object' && typeof game.id === 'string' && typeof game.title === 'string') : [];
    } catch { return []; }
  });
  const [newGameOpen, setNewGameOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const selectedGame = games.find(game => game.id === selectedGameId) || games[0];
  const createGame = (title: string) => {
    const game = { id: crypto.randomUUID(), title };
    const nextGames = [...games, game];
    try { localStorage.setItem('285-trivia-drafts', JSON.stringify(nextGames)); }
    catch { toast.error('Unable to save the draft in this browser. Please allow browser storage and try again.'); return false; }
    setGames(nextGames);
    setSelectedGameId(game.id);
    toast.success('Game draft saved in this browser');
    return true;
  };
  const [stage, setStage] = useState<Stage>('lobby');
  const [index, setIndex] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const question = previewQuestions[index];
  const changeQuestion = (next: number) => { setIndex(next); setStage('round'); };
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(PREVIEW_ROOM); toast.success('Preview room code copied'); }
    catch { toast.error(`Clipboard unavailable. The preview code is ${PREVIEW_ROOM}.`); }
  };

  return <PartyLayout><main className="mx-auto max-w-7xl px-5 py-9 sm:px-8">
    <div className="mb-6 flex flex-wrap justify-end gap-2">
      <Button asChild variant="outline" className="rounded-xl"><Link to={`/player/${PREVIEW_ROOM}?preview=1`}><Eye className="mr-2 h-4 w-4" /> Player preview</Link></Button>
      <Button asChild className="rounded-xl"><Link to={`/display/${PREVIEW_ROOM}`} target="_blank" rel="noopener noreferrer"><Monitor className="mr-2 h-4 w-4" /> Open display</Link></Button>
    </div>
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="panel p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div><h1 className="text-xl font-semibold">Game Board</h1><p className="mt-2 text-sm text-muted-foreground">{selectedGame ? selectedGame.title : 'No games created'}</p>{stage !== 'lobby' && <p className="mt-1 text-xs text-muted-foreground">Round 1 · {question.round} · Question {index + 1} of {previewQuestions.length}</p>}</div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold capitalize text-primary">{stage}</span>
            <Button onClick={() => setStage('round')} disabled={!selectedGame || stage !== 'lobby'} className="rounded-xl"><Play className="mr-2 h-4 w-4" /> Start game</Button>
          </div>
        </div>
        {stage === 'lobby' ? games.length === 0 ? <div className="flex flex-col items-center py-12 text-center">
          <Button variant="outline" size="icon" aria-label="Create a new game" onClick={() => setNewGameOpen(true)} className="mb-5 h-20 w-20 rounded-3xl border-dashed border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"><Plus className="!h-8 !w-8" /></Button>
          <h2 className="text-2xl font-semibold">Create your first game</h2>
          <p className="mt-3 text-sm text-muted-foreground">Click the plus to name a new game.</p>
        </div> : <div className="py-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Your games</h2><Button variant="outline" className="rounded-xl" onClick={() => setNewGameOpen(true)}><Plus className="mr-2 h-4 w-4" /> New game</Button></div>
          <div className="space-y-3">{games.map(game => <button key={game.id} onClick={() => setSelectedGameId(game.id)} aria-pressed={selectedGame?.id === game.id} className={`w-full rounded-xl border p-5 text-left transition-colors ${selectedGame?.id === game.id ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30 hover:border-primary/50'}`}><span className="block font-semibold">{game.title}</span><span className="mt-2 block text-xs text-muted-foreground">Local draft · No questions added</span></button>)}</div>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">Start game opens the sample-question walkthrough. These drafts do not contain playable custom questions yet.</p>
        </div> : stage === 'round' ? <div className="py-12 text-center"><p className="eyebrow text-primary">ROUND 01</p><h2 className="mt-4 text-4xl font-bold">{question.round}</h2><p className="mt-3 text-muted-foreground">Question {index + 1} is ready when you are.</p><Button className="party-button mt-7" onClick={() => setStage('question')}>Show question <ArrowRight className="ml-2 h-4 w-4" /></Button></div> : stage === 'leaderboard' || stage === 'ended' ? <><Leaderboard />{stage === 'ended' && <p className="mt-6 rounded-xl bg-primary/10 p-4 text-center text-primary">Preview complete. Quiz Khalifa takes the crown!</p>}</> : <><QuestionCard index={index} /><div className="mt-6 rounded-xl border border-[hsl(var(--mint)/.25)] bg-[hsl(var(--mint)/.05)] p-4"><p className="eyebrow text-[hsl(var(--mint))]">SAMPLE HOST ANSWER KEY</p><p className="mt-2 font-semibold">{sampleAnswers[index]}</p><p className="mt-1 text-xs text-muted-foreground">Illustrative only; this is not a protected production answer key.</p></div>{stage === 'closed' && <p role="status" className="mt-4 text-sm text-accent">Preview submissions are closed.</p>}{stage === 'reveal' && <p role="status" className="mt-4 flex items-center gap-2 text-sm text-[hsl(var(--mint))]"><Check className="h-4 w-4" /> Answer revealed in this local host preview only.</p>}</>}
          {stage !== 'lobby' && stage !== 'ended' && <div className="mt-7 flex flex-wrap gap-2 border-t border-border pt-5">{stage === 'question' && <Button variant="secondary" className="rounded-xl" onClick={() => setStage('closed')}>Close submissions</Button>}{(stage === 'question' || stage === 'closed') && <Button className="rounded-xl" onClick={() => setStage('reveal')}>Reveal sample answer</Button>}{stage === 'reveal' && <Button className="rounded-xl" onClick={() => setStage('leaderboard')}>Show leaderboard</Button>}<Button variant="outline" className="rounded-xl" disabled={index === 0} onClick={() => changeQuestion(index - 1)}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button><Button variant="outline" className="rounded-xl" disabled={index === previewQuestions.length - 1} onClick={() => changeQuestion(index + 1)}>Next question <ArrowRight className="ml-2 h-4 w-4" /></Button><Button variant="ghost" className="rounded-xl" onClick={() => setStage('round')}><RotateCcw className="mr-2 h-4 w-4" /> Replay</Button></div>}
        </section><aside className="space-y-5"><section className="panel p-5"><p className="eyebrow">PREVIEW ROOM CODE</p><div className="mt-3 flex items-center justify-between"><span className="display-font text-4xl font-bold tracking-[.15em] text-primary">{PREVIEW_ROOM}</span><Button variant="ghost" size="icon" aria-label="Copy preview room code" className="rounded-xl" onClick={copyCode}><Copy className="h-4 w-4" /></Button></div><p className="mt-3 text-xs text-muted-foreground">Not a live room · sample code only</p></section><section className="panel p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">The crew</h2><span className="text-xs text-muted-foreground">4 simulated</span></div><div className="mt-4 space-y-4">{previewPlayers.map(p => <div key={p.id} className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-lg" aria-hidden="true">{p.emoji}</span><span className="flex-1 text-sm">{p.name}</span><span className="text-xs text-muted-foreground">Sample</span></div>)}</div></section><section className="panel p-5"><p className="eyebrow">TIMER LAYOUT</p><p className="display-font my-4 text-center text-6xl font-bold tabular-nums">00:30</p><p className="text-center text-xs leading-5 text-muted-foreground">Static preview. Server-authoritative timer controls and sounds arrive in Phase 4.</p></section><Button variant="outline" className="w-full rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmEnd(true)} disabled={stage === 'ended'}>End preview game</Button>{stage === 'ended' && <Button className="w-full rounded-xl" onClick={() => { setIndex(0); setStage('lobby'); }}>Restart walkthrough</Button>}</aside></div></main>
<NewGameDialog open={newGameOpen} onOpenChange={setNewGameOpen} onCreate={createGame} />
<Dialog open={confirmEnd} onOpenChange={setConfirmEnd}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>End the preview game?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">This ends your local walkthrough. No live players or saved games will be affected.</p><div className="mt-4 flex justify-end gap-3"><Button variant="outline" className="rounded-xl" onClick={() => setConfirmEnd(false)}>Keep playing</Button><Button className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={() => { setStage('ended'); setConfirmEnd(false); }}>End preview</Button></div></DialogContent></Dialog></PartyLayout>;
}