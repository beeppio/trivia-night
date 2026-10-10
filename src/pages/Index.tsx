import { Brand, PartyLayout } from '@/components/PartyLayout';
import { BackgroundPattern } from '@/components/BackgroundPattern';
import { PREVIEW_ROOM, PLAYER_URL } from '@/lib/preview-data';

export default function Index() {
  return (
    <PartyLayout showHeaderLogo={false}>
      <main className="relative isolate flex min-h-[calc(100svh-190px)] items-center justify-center overflow-hidden px-5 py-16">
        <BackgroundPattern />
        <section className="enter relative w-full max-w-3xl text-center">
          <Brand large />
          <h1 className="text-lg font-medium leading-tight tracking-tight text-muted-foreground sm:text-2xl">Welcome to 285's Trivia Night</h1>
          <h2 className="mt-8 text-4xl font-bold tracking-tight sm:text-6xl">Join the game</h2>
          <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">
            On your phone, go to the websites and enter the room code
          </p>
          <a href="/play" className="display-font mt-2 block break-all text-2xl font-semibold text-primary underline-offset-4 hover:underline sm:text-3xl">
            {PLAYER_URL}
          </a>
          <div className="mx-auto mt-8 w-fit rounded-2xl border border-primary/30 bg-card px-7 py-6 sm:px-12 sm:py-8">
            <p className="eyebrow">Room code</p>
            <p className="display-font mt-3 pl-[.15em] text-5xl font-bold tracking-[.15em] text-primary sm:text-7xl" aria-label={`Room code ${PREVIEW_ROOM.split('').join(' ')}`}>
              {PREVIEW_ROOM}
            </p>
          </div>
        </section>
      </main>
    </PartyLayout>
  );
}