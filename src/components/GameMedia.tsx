import { useEffect, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { GameMedia } from '@/lib/local-games';

function MediaItem({ media }: { media: GameMedia }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(media.file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [media.file]);
  if (!url) return null;
  return <div className="min-w-0 space-y-2">
    {media.kind === 'image' ? <img src={url} alt={media.name} className="max-h-64 w-auto rounded-xl object-contain" /> : media.kind === 'audio' ? <audio src={url} controls preload="metadata" className="w-full" /> : media.kind === 'video' ? <video src={url} controls preload="metadata" className="max-h-72 w-full rounded-xl" /> : <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-primary"><FileText className="h-4 w-4" /> Open PDF</a>}
    <p className="break-all text-xs text-muted-foreground">{media.name}</p>
  </div>;
}

export function GameMediaList({ media }: { media: GameMedia[] }) {
  return <div className="space-y-4">{media.map(item => <MediaItem key={item.id} media={item} />)}</div>;
}

export function MediaUpload({ id, label, media, onChange }: { id: string; label: string; media: GameMedia[]; onChange: (media: GameMedia[]) => void }) {
  const upload = (files: FileList | null) => {
    if (!files) return;
    const additions: GameMedia[] = [];
    for (const file of Array.from(files)) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const kind = extension === 'mp4' ? 'video' : extension === 'mp3' ? 'audio' : extension === 'pdf' ? 'pdf' : ['png', 'jpg', 'jpeg'].includes(extension || '') ? 'image' : null;
      const expectedMime = extension === 'mp4' ? 'video/mp4' : extension === 'mp3' ? 'audio/mpeg' : extension === 'pdf' ? 'application/pdf' : extension === 'png' ? 'image/png' : 'image/jpeg';
      if (!kind || (file.type && file.type !== expectedMime)) { toast.error(`${file.name}: use MP4, MP3, PNG, JPG, or PDF.`); continue; }
      if (file.size > 20 * 1024 * 1024) { toast.error(`${file.name}: maximum file size is 20 MB.`); continue; }
      additions.push({ id: crypto.randomUUID(), name: file.name, kind, file });
    }
    onChange([...media, ...additions]);
  };
  return <div className="space-y-3">
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary focus-within:ring-2 focus-within:ring-ring"><Upload className="h-4 w-4" />{label}<input id={id} type="file" accept=".mp4,.mp3,.png,.jpg,.jpeg,.pdf" multiple className="sr-only" onChange={event => { upload(event.target.files); event.target.value = ''; }} /></label>
    <p className="text-xs text-muted-foreground">MP4, MP3, PNG, JPG, PDF · Up to 20 MB per file</p>
    {media.map(item => <div key={item.id} className="rounded-xl border border-border bg-background p-3"><div className="mb-2 flex justify-end"><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.name}`} className="h-8 w-8 rounded-lg" onClick={() => onChange(media.filter(other => other.id !== item.id))}><X className="h-4 w-4" /></Button></div><MediaItem media={item} /></div>)}
  </div>;
}
