import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PartyLayout, PreviewNotice } from '@/components/PartyLayout';
import { PREVIEW_ROOM } from '@/lib/preview-data';

export default function Join() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState('');
  const uploadAvatar = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('Choose a PNG, JPG, or WebP profile picture under 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setAvatar(String(reader.result)); setError(''); };
    reader.readAsDataURL(file);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code !== PREVIEW_ROOM) { setError(`Live rooms are not connected yet. Use ${PREVIEW_ROOM} to explore the preview.`); return; }
    if (!nickname.trim()) { setError('Enter a nickname to continue.'); return; }
    sessionStorage.setItem('quiz-social-preview-nickname', nickname.trim());
    sessionStorage.setItem('285-avatar', avatar);
    navigate(`/player/${code}`);
  };
  return <PartyLayout>
    <main className="mx-auto max-w-md px-5 py-12 sm:py-16">
      <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <section className="panel p-6 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Join the game</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Enter the room code shown on the game screen and choose a nickname.</p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="room-code">Room code</Label>
            <Input id="room-code" placeholder="A1B2C" autoCapitalize="characters" spellCheck={false} autoComplete="off" pattern="[A-Z0-9]{5}" maxLength={5} minLength={5} value={code} onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)); setError(''); }} required className="h-14 rounded-xl bg-background text-center font-mono text-2xl tracking-[.35em]" aria-describedby="room-hint" />
            <p id="room-hint" className="text-xs text-muted-foreground">5 letters and numbers. Preview code: <button type="button" className="font-semibold text-primary underline underline-offset-4" onClick={() => setCode(PREVIEW_ROOM)}>{PREVIEW_ROOM}</button></p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname">Your nickname</Label>
            <Input id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={24} required placeholder="Nickname" autoComplete="nickname" className="h-12 rounded-xl bg-background" />
          </div>
          <div className="flex items-center gap-4"><Avatar className="h-16 w-16 rounded-2xl"><AvatarImage src={avatar} alt="Profile preview" className="object-cover" /><AvatarFallback className="rounded-2xl bg-primary/15 text-primary">{nickname.slice(0, 2).toUpperCase() || '?'}</AvatarFallback></Avatar><label className="cursor-pointer text-sm text-primary underline underline-offset-4">Add profile picture<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload profile picture" className="sr-only" onChange={event => uploadAvatar(event.target.files?.[0])} /></label></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="party-button w-full">Enter preview lobby <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </form>
      </section>
      <PreviewNotice className="mt-5" />
    </main>
  </PartyLayout>;
}