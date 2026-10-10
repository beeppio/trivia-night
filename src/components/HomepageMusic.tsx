import { Music2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaUpload } from '@/components/GameMedia';
import { useHomepageMusic } from '@/hooks/use-homepage-music';

export function HomepageMusic() {
  const music = useHomepageMusic();
  return <section className="panel space-y-3 p-4"><h2 className="flex items-center gap-2 font-semibold text-primary"><Music2 className="h-4 w-4" />Homepage music</h2><p className="text-xs leading-5 text-muted-foreground">TV waiting-screen music, independent of your game. Enable TV sound once to hear it.</p>{music.loaded && <MediaUpload id="homepage-music" label="Upload homepage music" uploadLabel="Upload homepage music" musicOnly media={music.media ? [music.media] : []} onChange={media => { void music.update({ media: media[0], enabled: Boolean(media[0]) && music.enabled }); }} />}<Button variant="outline" disabled={!music.loaded || !music.media} className="h-9 w-full rounded-xl border-primary/30 text-primary" aria-pressed={music.enabled} onClick={() => { void music.update({ media: music.media, enabled: !music.enabled }); }}>{music.enabled ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}{music.enabled ? 'Disable homepage music' : 'Enable homepage music'}</Button></section>;
}
