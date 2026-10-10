import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/PartyLayout';
import { PlayerGameView } from '@/components/PlayerGameView';
import { PREVIEW_ROOM } from '@/lib/preview-data';
import { sendPlayerSubmission, usePlayerSession } from '@/hooks/use-local-session';

export default function Player() {
  const { roomCode } = useParams();
  const [params] = useSearchParams();
  const [teamId] = useState(() => {
    const existing = sessionStorage.getItem('285-team-id');
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem('285-team-id', id);
    return id;
  });
  const nickname = sessionStorage.getItem('quiz-social-preview-nickname') || (params.get('preview') === '1' ? 'Preview Player' : '');
  const avatarUrl = sessionStorage.getItem('285-avatar') || undefined;
  const profile = { id: teamId, name: nickname, avatarUrl };
  const session = usePlayerSession(roomCode === PREVIEW_ROOM && nickname ? profile : undefined);
  if (roomCode !== PREVIEW_ROOM || !nickname) return <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-6"><Brand /><h1 className="text-3xl font-bold">Let's get you to the lobby.</h1><p className="text-muted-foreground">Enter a nickname to join room {PREVIEW_ROOM} in this browser.</p><Button asChild className="party-button"><Link to="/join">Go to join screen</Link></Button></div>;
  return <div className="mx-auto min-h-screen max-w-lg px-5 pb-8">
    <header className="flex items-center justify-between border-b border-border py-5"><Brand /><Button asChild variant="ghost" size="icon" className="rounded-xl"><Link to="/join" aria-label="Leave lobby"><LogOut className="h-4 w-4" /></Link></Button></header>
    <PlayerGameView profile={profile} session={session} onSubmit={answer => { if (session) sendPlayerSubmission({ runId: session.runId, teamId, name: nickname, answer }); }} />
  </div>;
}
