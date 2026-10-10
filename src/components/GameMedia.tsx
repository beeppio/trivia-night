import { useState } from 'react';
import { FileText, Link2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMediaUrl } from '@/hooks/use-media-url';
import { parseMediaLink } from '@/lib/media-links';
import type { GameMedia } from '@/lib/local-games';
import { MediaClipEditor } from '@/components/MediaClipEditor';

function MediaItem({ media }: { media: GameMedia }) {
  const url = useMediaUrl(media);
  if (!url) return null;
  return <div className="min-w-0 space-y-2">{media.youtubeId ? <p className="break-all text-sm text-primary">YouTube · {media.name}</p> : media.kind === 'image' ? <img src={url} alt="Attached illustration" className="max-h-64 w-auto rounded-xl object-contain" /> : media.kind === 'audio' ? <audio src={url} muted preload="metadata" className="hidden" /> : media.kind === 'video' ? <video src={url} muted preload="metadata" className="max-h-72 w-full rounded-xl" /> : <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-primary"><FileText className="h-4 w-4" /> Open PDF</a>}<p className="break-all text-xs text-muted-foreground">{media.name}</p></div>;
}

export function GameMediaList({ media }: { media: GameMedia[] }) {
  return <div className="space-y-4">{media.map(item => <MediaItem key={item.id} media={item} />)}</div>;
}

export function MediaUpload({ id, label, media, onChange, musicOnly = false }: { id: string; label: string; media: GameMedia[]; onChange: (media: GameMedia[]) => void; musicOnly?: boolean }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const [kind, setKind] = useState<'image' | 'audio' | 'video'>(musicOnly ? 'audio' : 'image');
  const append = (additions: GameMedia[]) => onChange(musicOnly ? additions.length ? additions.slice(-1) : media : [...media, ...additions]);
  const upload = (files: FileList | null) => {
    if (!files) return;
    const additions: GameMedia[] = [];
    for (const file of Array.from(files)) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const kind = extension === 'mp4' ? 'video' : extension === 'mp3' ? 'audio' : extension === 'pdf' ? 'pdf' : ['png', 'jpg', 'jpeg'].includes(extension || '') ? 'image' : null;
      const expectedMime = extension === 'mp4' ? 'video/mp4' : extension === 'mp3' ? 'audio/mpeg' : extension === 'pdf' ? 'application/pdf' : extension === 'png' ? 'image/png' : 'image/jpeg';
      if (musicOnly && kind !== 'audio') { toast.error('Choose an MP3 file for round music.'); continue; }
      if (!kind || (file.type && file.type !== expectedMime)) { toast.error(`${file.name}: use MP4, MP3, PNG, JPG, or PDF.`); continue; }
      if (file.size > 20 * 1024 * 1024) { toast.error(`${file.name}: maximum file size is 20 MB.`); continue; }
      additions.push({ id: crypto.randomUUID(), name: file.name, kind, file });
    }
    append(additions);
  };
  const addLink = () => {
    try {
      const parsed = parseMediaLink(link);
      append([{ id: crypto.randomUUID(), name: link.trim(), kind: parsed.youtubeId ? musicOnly ? 'audio' : kind === 'audio' ? 'audio' : 'video' : kind, ...parsed }]);
      setLink(''); setLinkOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Enter a valid media URL.'); }
  };
  return <div className="space-y-3">
    <div className="flex items-center gap-4"><label htmlFor={id} className="inline-flex cursor-pointer text-xs font-medium text-primary underline underline-offset-4">{musicOnly ? 'Upload round music' : 'Upload media'}<input id={id} aria-label={label} type="file" accept={musicOnly ? '.mp3' : '.mp4,.mp3,.png,.jpg,.jpeg,.pdf'} multiple={!musicOnly} className="sr-only" onChange={event => { upload(event.target.files); event.target.value = ''; }} /></label><Button type="button" variant="ghost" className="h-8 rounded-xl px-2 text-xs text-primary" onClick={() => setLinkOpen(!linkOpen)}><Link2 className="mr-1 h-3.5 w-3.5" />Add link</Button></div>
    {linkOpen && <div className="space-y-3 rounded-xl border border-primary/30 p-3"><Input aria-label="Media URL" type="url" placeholder="https://… (YouTube or direct media link)" value={link} onChange={event => setLink(event.target.value)} className="rounded-xl" />{!musicOnly && <select aria-label="Link media type" value={kind} onChange={event => setKind(event.target.value as typeof kind)} className="w-full rounded-xl border border-border bg-background p-2 text-sm"><option value="image">Image</option><option value="audio">Sound / music</option><option value="video">Video</option></select>}<Button type="button" disabled={!link.trim()} onClick={addLink} className="rounded-xl">Add media link</Button><p className="text-xs text-muted-foreground">Use direct image/audio/video URLs or YouTube links. YouTube embedding and autoplay depend on the video and browser.</p></div>}
    {media.map(item => <div key={item.id} className="rounded-xl border border-border bg-background p-3"><div className="mb-2 flex justify-end"><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.name}`} className="h-8 w-8 rounded-lg" onClick={() => onChange(media.filter(other => other.id !== item.id))}><X className="h-4 w-4" /></Button></div>{item.kind === 'audio' || item.kind === 'video' ? <><MediaClipEditor media={item} onChange={updated => onChange(media.map(other => other.id === updated.id ? updated : other))} /><p className="mt-2 break-all text-xs text-muted-foreground">{item.name}</p></> : <MediaItem media={item} />}</div>)}
  </div>;
}