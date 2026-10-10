import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Maximize, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/PartyLayout';
import { QuestionCard } from '@/components/QuestionCard';
import { Leaderboard } from '@/components/Leaderboard';
import { PREVIEW_ROOM, PLAYER_URL, previewPlayers } from '@/lib/preview-data';

export default function Display() {
  const { roomCode } = useParams();
  const [params] = useSearchParams();
  const view = params.get('view') || 'lobby';
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else toast.info('Fullscreen is unavailable in this browser.');
    } catch { toast.info('Fullscreen is blocked in this preview. Open the display in its own browser tab.'); }
  };
  return <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-5 sm:px-10 lg:px-16">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-6">
      <Brand /><span className="display-font text-sm font-medium tracking-wide text-muted-foreground">FRIDAY NIGHT TRIVIA</span>
      <Button variant="outline" className="rounded-xl" onClick={fullscreen}><Maximize className="mr-2 h-4 w-4" /> Fullscreen</Button>
    </header>
    <main className="flex flex-1 items-center py-12">
      {roomCode !== PREVIEW_ROOM ? <div className="mx-auto max-w-lg text-center">
        <h1 className="text-4xl font-bold">No live room connected.</h1>
        <p className="mt-4 text-muted-foreground">Phase 1 includes a display preview for sample room {PREVIEW_ROOM}.</p>
        <Button asChild className="party-button mt-6"><Link to={`/display/${PREVIEW_ROOM}`}>Open sample display</Link></Button>
      </div> : view === 'question' ? <div className="mx-auto w-full max-w-5xl">
        <div className="mb-7 flex items-center justify-between"><p className="eyebrow">ROUND 1 · THE WARM-UP · QUESTION 1</p><span className="display-font text-5xl font-bold tabular-nums text-primary">00:30</span></div>
        <QuestionCard large /><p className="mt-7 text-center text-sm text-muted-foreground">0 of 4 sample answers submitted · Static timer preview</p>
      </div> : view === 'leaderboard' ? <div className="mx-auto w-full max-w-3xl"><Leaderboard /></div> : <section className="mx-auto w-full max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Join the game</h1>
        <p className="mt-6 text-lg text-muted-foreground">On your phone, go to</p>
        <p className="display-font mt-2 text-2xl font-semibold text-primary sm:text-4xl">{PLAYER_URL}</p>
        <p className="mt-6 text-base text-muted-foreground">Enter the room code below and choose a nickname.</p>
        <div className="mx-auto mt-8 w-fit rounded-2xl border border-primary/30 bg-card px-7 py-6 sm:px-12 sm:py-8">
          <p className="eyebrow">Room code</p>
          <p className="display-font mt-3 pl-[.15em] text-5xl font-bold tracking-[.15em] text-primary sm:text-7xl">{PREVIEW_ROOM}</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">{previewPlayers.map(p => <div key={p.id} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm"><span aria-hidden="true">{p.emoji}</span>{p.name}</div>)}</div>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Users className="h-4 w-4" /> 4 simulated players · Placeholder address · No live connections</p>
      </section>}
    </main>
    <footer className="flex flex-col items-center justify-between gap-4 border-t border-border py-5 text-xs text-muted-foreground sm:flex-row">
      <p>Public-display preview · Independent of host controls · No live synchronization</p>
      <nav aria-label="Display preview layouts" className="flex gap-4">
        <Link className={view === 'lobby' ? 'text-primary' : 'hover:text-foreground'} to={`/display/${roomCode}`}>Lobby layout</Link>
        <Link className={view === 'question' ? 'text-primary' : 'hover:text-foreground'} to={`/display/${roomCode}?view=question`}>Question layout</Link>
        <Link className={view === 'leaderboard' ? 'text-primary' : 'hover:text-foreground'} to={`/display/${roomCode}?view=leaderboard`}>Leaderboard layout</Link>
      </nav>
    </footer>
  </div>;
}
