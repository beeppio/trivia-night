import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/PartyLayout';
import { PlayerGameView } from '@/components/PlayerGameView';
import { PREVIEW_ROOM } from '@/lib/preview-data';
import { sendPlayerSubmission, usePlayerSession } from '@/hooks/use-local-session';
import { useTeamProfile } from '@/hooks/use-team-profile';

export default function Player() {
  const route = useParams();
  const [params] = useSearchParams();
  const roomCode = route.roomCode || params.get('room');
  const { profile, updateProfile, error } = useTeamProfile(roomCode || PREVIEW_ROOM);
  const session = usePlayerSession(roomCode === PREVIEW_ROOM ? profile : undefined);
  if (roomCode !== PREVIEW_ROOM) return <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-6"><Brand /><h1 className="text-3xl font-bold">Let's get you to the lobby.</h1><p className="text-muted-foreground">Enter room {PREVIEW_ROOM} in this browser.</p><Button asChild className="party-button"><Link to="/play">Go to join screen</Link></Button></div>;
  return <div className="mx-auto min-h-screen max-w-lg px-5 pb-8">
    <header className="flex items-center justify-between border-b border-border py-5"><Brand /><Button asChild variant="ghost" size="icon" className="rounded-xl"><Link to="/play" aria-label="Leave lobby"><LogOut className="h-4 w-4" /></Link></Button></header>
    {error ? <p role="alert" className="py-8 text-destructive">Allow browser storage to save your team identity and rejoin safely.</p> : !profile ? <p role="status" className="py-8 text-center text-primary">Restoring your team…</p> : <PlayerGameView profile={profile} session={session} onProfileChange={updateProfile} onSubmit={answer => { if (session) sendPlayerSubmission({ runId: session.runId, teamId: profile.id, name: profile.name, answer }); }} />}
  </div>;
}