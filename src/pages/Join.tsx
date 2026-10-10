import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PartyLayout, PreviewNotice } from '@/components/PartyLayout';
import { PREVIEW_ROOM } from '@/lib/preview-data';

export default function Join() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code !== PREVIEW_ROOM) { setError('Live rooms are not connected yet. Use 482913 to explore the preview.'); return; }
    if (!nickname.trim()) { setError('Enter a nickname to continue.'); return; }
    sessionStorage.setItem('quiz-social-preview-nickname', nickname.trim());
    navigate(`/player/${code}`);
  };
  return <PartyLayout><main className="mx-auto max-w-md px-5 py-12 sm:py-16"><Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to the party</Link><section className="panel p-6 sm:p-8"><span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent"><Gamepad2 className="h-7 w-7" /></span><p className="eyebrow">YOU’RE ON THE LIST</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Join the fun.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">A room code. A great nickname.<br />That’s all you need.</p><form onSubmit={submit} className="mt-7 space-y-5"><div className="space-y-2"><Label htmlFor="room-code">Room code</Label><Input id="room-code" placeholder="000000" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} minLength={6} value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} required className="h-14 rounded-xl bg-background text-center font-mono text-2xl tracking-[.35em]" aria-describedby="room-hint" /><p id="room-hint" className="text-xs text-muted-foreground">Preview code: <button type="button" className="font-semibold text-primary underline underline-offset-4" onClick={() => setCode(PREVIEW_ROOM)}>{PREVIEW_ROOM}</button></p></div><div className="space-y-2"><Label htmlFor="nickname">Your nickname</Label><Input id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={24} required placeholder="e.g. Quiz Khalifa" autoComplete="nickname" className="h-12 rounded-xl bg-background" /><p className="text-xs text-muted-foreground">Keep it friendly. Make it memorable.</p></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" className="party-button w-full bg-accent text-accent-foreground hover:bg-accent/90">Enter preview lobby <ArrowRight className="ml-2 h-4 w-4" /></Button></form><p className="mt-5 text-center text-xs text-muted-foreground">No account. No email. No downloads.</p></section><PreviewNotice className="mt-5" /></main></PartyLayout>;
}
