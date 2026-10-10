import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Gamepad2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/PartyLayout';
import { SessionQuestion } from '@/components/SessionQuestion';
import { PREVIEW_ROOM } from '@/lib/preview-data';
import { usePlayerSession } from '@/hooks/use-local-session';

export default function Player() {
  const { roomCode } = useParams();
  const [params] = useSearchParams();
  const session = usePlayerSession();
  const nickname = sessionStorage.getItem('quiz-social-preview-nickname') || (params.get('preview') === '1' ? 'Preview Player' : '');
  if (roomCode !== PREVIEW_ROOM || !nickname) return <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-6"><Brand /><h1 className="text-3xl font-bold">Let's get you to the lobby.</h1><p className="text-muted-foreground">Enter a nickname to join room {PREVIEW_ROOM} in this browser.</p><Button asChild className="party-button"><Link to="/join">Go to join screen</Link></Button></div>;
  return <div className="mx-auto min-h-screen max-w-lg px-5 pb-8">
    <header className="flex items-center justify-between border-b border-border py-5"><Brand /><Button asChild variant="ghost" size="icon" className="rounded-xl"><Link to="/join" aria-label="Leave lobby"><LogOut className="h-4 w-4" /></Link></Button></header>
    <div className="my-5 flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3"><span className="flex items-center gap-2 text-sm font-semibold"><Gamepad2 className="h-4 w-4 text-accent" /> {nickname}</span><span className="text-xs text-muted-foreground">Room {roomCode}</span></div>
    {session ? <SessionQuestion key={session.runId} session={session} player /> : <section className="py-14 text-center"><Gamepad2 aria-hidden="true" className="mx-auto mb-6 h-16 w-16 text-primary" /><h1 className="text-3xl font-bold">You're in, {nickname}.</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">Waiting for the host to start a game.</p><p className="mt-6 text-xs text-muted-foreground">Keep the host open in another tab of this browser. Separate-device rooms are not connected yet.</p></section>}
  </div>;
}
