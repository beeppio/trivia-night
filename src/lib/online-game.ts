import { supabase } from '@/integrations/supabase/client';
import type { GameMedia } from '@/lib/local-games';
import type { PublicSession } from '@/hooks/use-local-session';

const uploads = new Map<string, Promise<string>>();
async function upload(roomId: string, media: GameMedia): Promise<GameMedia> {
  const { file, name, ...metadata } = media;
  if (!file) return { ...metadata, name: '' };
  const key = `${roomId}/${media.id}`;
  let task = uploads.get(key);
  if (!task) {
    task = (async () => {
      const path = `${key}-${crypto.randomUUID()}`;
      const result = await supabase!.storage.from('trivia-media').upload(path, file, { contentType: file.type || 'application/octet-stream' });
      if (result.error) throw result.error;
      const registration = await supabase!.rpc('trivia_register_media', { target: roomId, object_path: path });
      if (registration.error) throw registration.error;
      return path;
    })().catch(error => { uploads.delete(key); throw error; });
    uploads.set(key, task);
  }
  return { ...metadata, name: '', storagePath: await task };
}
export async function onlineSnapshot(roomId: string, state: PublicSession): Promise<PublicSession> {
  const [media, answerMedia, roundMusic] = await Promise.all([
    Promise.all(state.media.map(item => upload(roomId, item))),
    state.answerMedia ? Promise.all(state.answerMedia.map(item => upload(roomId, item))) : undefined,
    state.roundMusic ? upload(roomId, state.roundMusic) : undefined,
  ]);
  return { ...state, media, answerMedia, roundMusic, rankings: state.rankings.map(({ frames, ...team }) => team) };
}
export function shiftSessionClock(state: PublicSession, delta: number): PublicSession {
  const shift = (value: number | null | undefined) => value == null ? value : value + delta;
  return { ...state, deadline: shift(state.deadline)!, videoStartedAt: shift(state.videoStartedAt)!, answerMediaStartedAt: shift(state.answerMediaStartedAt)!, mediaPausedAt: shift(state.mediaPausedAt), answerMediaPausedAt: shift(state.answerMediaPausedAt), roundMusicStartedAt: shift(state.roundMusicStartedAt) };
}
export const apiError = (error: unknown) => error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Online game synchronization failed.';