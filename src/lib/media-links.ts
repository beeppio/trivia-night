export function parseMediaLink(value: string) {
  const url = new URL(value.trim());
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Use an HTTP or HTTPS link.');
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let youtubeId: string | undefined;
  if (host === 'youtu.be') youtubeId = url.pathname.split('/')[1];
  if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) youtubeId = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
  if (youtubeId && !/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) throw new Error('Use a valid YouTube video link.');
  return { url: url.href, youtubeId };
}
