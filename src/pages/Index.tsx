import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PartyLayout } from '@/components/PartyLayout';
import { PREVIEW_ROOM, PLAYER_URL } from '@/lib/preview-data';

export default function Index() {
  return (
    <PartyLayout>
      <main className="flex min-h-[calc(100svh-190px)] items-center justify-center px-5 py-16">
        <section className="enter w-full max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Join the game</h1>
          <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">
            On your phone, go to
          </p>
          <p className="mt-2 display-font text-2xl font-semibold text-primary sm:text-3xl">
            {PLAYER_URL}
          </p>
          <p className="mt-6 text-base text-muted-foreground">Enter the room code below and choose a nickname.</p>
          <div className="mx-auto mt-8 w-fit rounded-2xl border border-primary/30 bg-card px-7 py-6 sm:px-12 sm:py-8">
            <p className="eyebrow">Room code</p>
            <p className="display-font mt-3 pl-[.15em] text-5xl font-bold tracking-[.15em] text-primary sm:text-7xl" aria-label={`Room code ${PREVIEW_ROOM.split('').join(' ')}`}>
              {PREVIEW_ROOM}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="party-button"><Link to="/play">Enter code</Link></Button>
            <Button asChild variant="outline" className="party-button bg-card"><Link to="/host">Host dashboard</Link></Button>
          </div>
          <p className="mt-6 text-xs leading-5 text-muted-foreground">Preview code only. The website address is a placeholder; live rooms are not connected yet.</p>
        </section>
      </main>
    </PartyLayout>
  );
}
