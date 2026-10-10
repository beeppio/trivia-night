import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/PartyLayout';
import { PlayerGameView } from '@/components/PlayerGameView';
import { useJoinedRoom } from '@/hooks/use-online-room';
import type { PlayerProfile, PublicSession } from '@/hooks/use-local-session';

export default function Player() {
  const route = useParams();
  const [params] = useSearchParams();
  const code = (route.roomCode || params.get('room') || '').toUpperCase();
  const online = useJoinedRoom(code);
  const [draft, setDraft] = useState<PlayerProfile>();
  const saveQueue = useRef(Promise.resolve());
  const mine = online.players.find(player => player.id === online.userId);
  useEffect(() => { setDraft(mine); }, [mine?.id]);
  const profile = draft || mine;
  const session: PublicSession | null = online.room ? {
    runId: '', title: 'Online lobby', waiting: true, roundName: '', roundIndex: 0, questionIndex: 0,
    text: '', media: [], imagesRevealed: false, videoStartedAt: null, answerMediaStartedAt: null,
    deadline: null, duration: 30, open: false, ended: false,
    rankings: online.players.map(player => ({ ...player, score: 0 })),
  } : null;
  const update = (next: PlayerProfile) => {
    setDraft(next);
    saveQueue.current = saveQueue.current.then(() => online.updateProfile(next)).catch(error => {
      toast.error(error instanceof Error ? error.message : 'Unable to save your team profile.');
    });
  };
  return <div className="mx-auto min-h-screen max-w-lg px-5 pb-8">
    <header className="flex items-center justify-between border-b border-border py-5"><Brand /><Button asChild variant="ghost" size="icon" className="rounded-xl"><Link to="/play" aria-label="Return to join screen"><LogOut className="h-4 w-4" /></Link></Button></header>
    {online.error ? <section className="space-y-4 py-8"><p role="alert" className="break-words text-destructive">{online.error}</p><Button asChild className="rounded-xl"><Link to="/play">Try another room code</Link></Button></section> : !online.room || !profile ? <p role="status" className="py-8 text-center text-primary">Joining room…</p> : <><p role="status" className="py-4 text-center text-xs leading-5 text-muted-foreground">Connected to room {online.room.code}. Your host can see your team. Online questions and answers are not enabled yet.</p><PlayerGameView key={online.room.id} profile={profile} session={session} onProfileChange={update} onSubmit={() => { toast.info('Online gameplay is not enabled yet.'); }} /></>}
  </div>;
}
