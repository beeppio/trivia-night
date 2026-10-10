import { PartyLayout } from '@/components/PartyLayout';
import { BackgroundPattern } from '@/components/BackgroundPattern';
import { PREVIEW_ROOM, PLAYER_URL } from '@/lib/preview-data';

export default function Index() {
  return (
    <PartyLayout>
      <main className="relative isolate flex min-h-[calc(100svh-190px)] items-center justify-center overflow-hidden px-5 py-16">
        <BackgroundPattern />
        <section className="enter relative w-full max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Join the game</h1>
          <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">
            On your phone, go to the websites and enter the room code
          </p>
          <p className="display-font mt-2 text-2xl font-semibold text-primary sm:text-3xl">
            {PLAYER_URL}
          </p>
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
