import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PartyLayout } from '@/components/PartyLayout';
import Player from '@/pages/Player';

export default function Join() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigate(`/play?room=${encodeURIComponent(code)}`);
  };
  if (params.has('room')) return <Player />;
  return <PartyLayout>
    <main className="mx-auto max-w-md px-5 py-12 sm:py-16">
      <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <section className="panel p-6 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Join the game</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Enter your room code, then create your team's name and animated profile. Returning? This browser remembers your team.</p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="room-code">Room code</Label>
            <Input id="room-code" placeholder="A1B2C" autoCapitalize="characters" spellCheck={false} autoComplete="off" pattern="[A-Z0-9]{5}" maxLength={5} minLength={5} value={code} onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)); setError(''); }} required className="h-14 rounded-xl bg-background text-center font-mono text-2xl tracking-[.35em]" aria-describedby="room-hint" />
            <p id="room-hint" className="text-xs text-muted-foreground">Enter the five-character code shown on your host's dashboard.</p>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="party-button w-full">Enter room <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </form>
      </section>
      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Online room joining is enabled. Online gameplay synchronization is the next phase.</p>
    </main>
  </PartyLayout>;
}