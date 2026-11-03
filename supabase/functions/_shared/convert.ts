// WAV to MP3, shared by the convert-audio server function and scripts/convert-audio.ts. Some
// voices return only WAV, about 5 times the size of a 48 kbps MP3, which matters once phones
// keep every clip offline. No imports, so Deno and Node both load it.

const AUDIO = '/storage/v1/object/public/audio/';

/** The file's path in the audio bucket, from its public URL, or null for anything else. */
export function audioPath(url: string): string | null {
  const at = url.indexOf(AUDIO);
  if (at < 0) return null;
  return decodeURIComponent(url.slice(at + AUDIO.length).split('?')[0]!);
}

export const isWav = (url: string | null | undefined): url is string =>
  !!url && /\.wav(\?.*)?$/i.test(url) && audioPath(url) !== null;

/** Where the MP3 of a WAV goes: the same place, with .mp3. */
export const mp3PathFor = (path: string) => path.replace(/\.wav$/i, '.mp3');

/** The public URL of the MP3 for a WAV's public URL. */
export const mp3UrlFor = (url: string) => url.split('?')[0]!.replace(/\.wav$/i, '.mp3');

/** ffmpeg's arguments: one voice, mono, 48 kbps, which is plenty for speech. */
export const FFMPEG_ARGS = (input: string, output: string) => [
  '-y',
  '-loglevel',
  'error',
  '-i',
  input,
  '-ac',
  '1',
  '-ar',
  '24000',
  '-codec:a',
  'libmp3lame',
  '-b:a',
  '48k',
  output,
];

/** A story's sentences with every converted clip pointed at its MP3. */
export function withMp3<T extends { audio_path: string | null }>(
  sentences: T[],
  done: Set<string>,
): T[] {
  return sentences.map((s) =>
    s.audio_path && done.has(s.audio_path) ? { ...s, audio_path: mp3UrlFor(s.audio_path) } : s,
  );
}
