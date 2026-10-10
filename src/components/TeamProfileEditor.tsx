import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Check, Eraser, Pencil, Redo2, Undo2, Upload } from 'lucide-react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { PlayerProfile } from '@/hooks/use-local-session';

const background = '#e9d5ff';
const colors = ['#6d28d9', '#e11d48', '#0284c7', '#16a34a', '#ffffff'];
const colorNames = ['Purple', 'Pink', 'Blue', 'Green', 'White'];
const size = 256;

export function TeamProfileEditor({ profile, onChange }: { profile: PlayerProfile; onChange: (profile: PlayerProfile) => void }) {
  const [mode, setMode] = useState<'upload' | 'draw'>(profile.frames ? 'draw' : 'upload');
  const [color, setColor] = useState(colors[0]);
  const [tip, setTip] = useState(8);
  const [eraser, setEraser] = useState(false);
  const [active, setActive] = useState(0);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const history = useRef<string[][]>([[], []]);
  const cursors = useRef([0, 0]);
  const drawing = useRef<number | null>(null);
  const lastBroadcast = useRef(0);
  const latest = useRef({ profile, onChange });
  latest.current = { profile, onChange };
  const edit = (changes: Partial<PlayerProfile>) => { onChange({ ...profile, ...changes, ready: false }); setError(''); };

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      setLoading(true);
      await Promise.all([0, 1].map(async index => {
        const canvas = canvases.current[index]!;
        const context = canvas.getContext('2d')!;
        context.fillStyle = background;
        context.fillRect(0, 0, size, size);
        const source = latest.current.profile.frames?.[index];
        if (source) {
          const image = new Image();
          await new Promise<void>(resolve => { image.onload = () => { if (!cancelled) context.drawImage(image, 0, 0, size, size); resolve(); }; image.onerror = () => resolve(); image.src = source; });
        }
        if (!cancelled) history.current[index] = [canvas.toDataURL('image/png')];
      }));
      if (!cancelled) { setLoading(false); setRevision(value => value + 1); }
    };
    void restore();
    return () => { cancelled = true; };
  }, []);

  const publishDrawing = () => {
    const gif = GIFEncoder();
    const frames = canvases.current.map(canvas => {
      const pixels = canvas!.getContext('2d')!.getImageData(0, 0, size, size).data;
      const palette = quantize(pixels, 32);
      gif.writeFrame(applyPalette(pixels, palette), size, size, { palette, delay: 450, repeat: 0 });
      return canvas!.toDataURL('image/png');
    });
    gif.finish();
    let binary = '';
    for (const byte of gif.bytes()) binary += String.fromCharCode(byte);
    latest.current.onChange({ ...latest.current.profile, frames, avatarUrl: `data:image/gif;base64,${btoa(binary)}`, ready: false });
  };
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * size / rect.width, y: (event.clientY - rect.top) * size / rect.height };
  };
  const start = (event: PointerEvent<HTMLCanvasElement>, index: number) => {
    if (loading || drawing.current !== null || event.button !== 0) return;
    setActive(index); drawing.current = index;
    event.currentTarget.setPointerCapture(event.pointerId);
    const context = event.currentTarget.getContext('2d')!;
    const { x, y } = point(event);
    context.strokeStyle = eraser ? background : color;
    context.lineWidth = tip;
    context.lineCap = 'round'; context.lineJoin = 'round';
    context.beginPath(); context.moveTo(x, y); context.lineTo(x + 0.01, y); context.stroke();
    latest.current.onChange({ ...latest.current.profile, ready: false });
  };
  const move = (event: PointerEvent<HTMLCanvasElement>, index: number) => {
    if (drawing.current !== index) return;
    const context = event.currentTarget.getContext('2d')!;
    const { x, y } = point(event);
    context.lineTo(x, y); context.stroke();
    if (Date.now() - lastBroadcast.current >= 350) { lastBroadcast.current = Date.now(); publishDrawing(); }
  };
  const finish = (index: number) => {
    if (drawing.current !== index) return;
    drawing.current = null;
    const snapshot = canvases.current[index]!.toDataURL('image/png');
    history.current[index] = [...history.current[index].slice(0, cursors.current[index] + 1), snapshot].slice(-40);
    cursors.current[index] = history.current[index].length - 1;
    setRevision(value => value + 1);
    publishDrawing();
  };
  const step = (direction: number) => {
    const cursor = cursors.current[active] + direction;
    if (loading || cursor < 0 || cursor >= history.current[active].length) return;
    const index = active;
    setLoading(true);
    const image = new Image();
    image.onload = () => {
      canvases.current[index]!.getContext('2d')!.drawImage(image, 0, 0);
      cursors.current[index] = cursor;
      setLoading(false); setRevision(value => value + 1); publishDrawing();
    };
    image.src = history.current[index][cursor];
  };
  const upload = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('Choose a PNG, JPG, WebP, or GIF under 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { latest.current.onChange({ ...latest.current.profile, avatarUrl: String(reader.result), ready: false }); setError(''); };
    reader.onerror = () => setError('Unable to read this picture. Please try again.');
    reader.readAsDataURL(file);
  };

  return <section className="space-y-5 rounded-3xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
    <div className="flex items-center gap-4"><Avatar className="h-20 w-20 rounded-3xl"><AvatarImage src={profile.avatarUrl} alt="Your team avatar preview" className="object-cover" /><AvatarFallback className="rounded-3xl bg-primary/20 text-xl text-primary">{profile.name.slice(0, 2).toUpperCase() || '?'}</AvatarFallback></Avatar><div><h2 className="text-xl font-bold text-primary">Create your team profile</h2><p className="mt-1 text-xs text-muted-foreground">Changes appear on the host’s board.</p></div></div>
    <label className="block space-y-2 text-sm font-semibold">Team name<Input value={profile.name} maxLength={24} placeholder="Give your team a name" onChange={event => edit({ name: event.target.value })} className="mt-2 h-12 rounded-xl bg-background" /></label>
    <div className="flex gap-2"><Button variant="outline" className={`flex-1 rounded-xl ${mode === 'upload' ? 'border-primary bg-primary/15 text-primary' : ''}`} onClick={() => setMode('upload')}><Upload className="mr-2 h-4 w-4" />Upload</Button><Button variant="outline" className={`flex-1 rounded-xl ${mode === 'draw' ? 'border-primary bg-primary/15 text-primary' : ''}`} onClick={() => { setMode('draw'); if (!loading) publishDrawing(); }}><Pencil className="mr-2 h-4 w-4" />Draw GIF</Button></div>
    {mode === 'upload' && <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dotted border-primary/40 p-6 text-center text-sm text-primary"><Upload className="h-7 w-7" />Choose a picture or animated GIF<span className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF · up to 2 MB</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={event => { upload(event.target.files?.[0]); event.target.value = ''; }} /></label>}
    <div className={mode === 'draw' ? 'space-y-4' : 'hidden'}>
      <p className="text-xs leading-5 text-muted-foreground">Draw in either panel. Your two frames loop back and forth automatically. Select a panel to undo or redo its strokes.</p>
      <div className="flex flex-wrap items-center gap-2">{colors.map((value, index) => <button key={value} aria-label={`${colorNames[index]} pen`} aria-pressed={!eraser && color === value} onClick={() => { setColor(value); setEraser(false); }} className={`h-8 w-8 rounded-full border-2 ${!eraser && color === value ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : 'border-primary/30'}`} style={{ backgroundColor: value }} />)}<Button variant="outline" size="icon" aria-label="Eraser" aria-pressed={eraser} className={`ml-auto h-9 w-9 rounded-xl ${eraser ? 'border-primary bg-primary/20 text-primary' : ''}`} onClick={() => setEraser(value => !value)}><Eraser className="h-4 w-4" /></Button></div>
      <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">Pen size</span>{[4, 8, 16, 28].map(value => <button key={value} aria-label={`${value} pixel tip`} aria-pressed={tip === value} onClick={() => setTip(value)} className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tip === value ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground'}`}><span className="rounded-full bg-current" style={{ width: value, height: value }} /></button>)}</div>
      <div className="grid grid-cols-2 gap-3">{[0, 1].map(index => <div key={index}><button className={`mb-2 w-full rounded-lg py-1 text-xs font-semibold ${active === index ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`} onClick={() => setActive(index)}>Panel {index + 1}</button><canvas ref={element => { canvases.current[index] = element; }} width={size} height={size} aria-label={`Draw animation panel ${index + 1}`} onPointerDown={event => start(event, index)} onPointerMove={event => move(event, index)} onPointerUp={() => finish(index)} onPointerCancel={() => finish(index)} className={`aspect-square w-full touch-none rounded-2xl border-2 bg-[#e9d5ff] ${active === index ? 'border-primary' : 'border-primary/25'}`} /></div>)}</div>
      <div className="flex gap-2" data-revision={revision}><Button variant="outline" size="sm" className="rounded-xl" disabled={loading || cursors.current[active] === 0} onClick={() => step(-1)}><Undo2 className="mr-2 h-4 w-4" />Undo</Button><Button variant="outline" size="sm" className="rounded-xl" disabled={loading || cursors.current[active] >= history.current[active].length - 1} onClick={() => step(1)}><Redo2 className="mr-2 h-4 w-4" />Redo</Button><span className="ml-auto self-center text-xs text-muted-foreground">Panel {active + 1}</span></div>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="border-t border-primary/25 pt-4"><Button disabled={!profile.name.trim() || loading} className={`h-12 w-full rounded-2xl text-white ${profile.ready ? 'bg-emerald-700 hover:bg-emerald-800' : ''}`} onClick={() => onChange({ ...profile, name: profile.name.trim(), ready: !profile.ready })}><Check className="mr-2 h-4 w-4" />{profile.ready ? 'Ready! Click to unready' : 'We’re ready'}</Button><p role="status" className="mt-3 text-center text-xs text-muted-foreground">{profile.ready ? 'Waiting for the host to start. Editing your profile unreadies your team.' : 'Finish your profile, then ready up.'}</p></div>
  </section>;
}
