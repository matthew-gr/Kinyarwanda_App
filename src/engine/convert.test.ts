import { describe, expect, it } from 'vitest';
import {
  audioPath,
  FFMPEG_ARGS,
  isWav,
  mp3PathFor,
  mp3UrlFor,
  withMp3,
} from '../../supabase/functions/_shared/convert';

const BASE = 'https://ujrfelmkvqckurpkqyre.supabase.co/storage/v1/object/public/audio/';

describe('WAV to MP3', () => {
  it('finds the WAV clips in the audio bucket, by their public URLs', () => {
    expect(isWav(`${BASE}forms/f1/c1.wav`)).toBe(true);
    expect(isWav(`${BASE}voice-test/x/a.WAV?v=1`)).toBe(true);
    expect(isWav(`${BASE}forms/f1/c1.mp3`)).toBe(false);
    expect(isWav('https://elsewhere.example/clip.wav')).toBe(false);
    expect(isWav(null)).toBe(false);
  });

  it('puts the MP3 beside the WAV', () => {
    expect(audioPath(`${BASE}stories/s%201/story.wav?v=2`)).toBe('stories/s 1/story.wav');
    expect(mp3PathFor('stories/s1/story.wav')).toBe('stories/s1/story.mp3');
    expect(mp3UrlFor(`${BASE}forms/f1/c1.wav?v=3`)).toBe(`${BASE}forms/f1/c1.mp3`);
  });

  it('points only converted sentence clips at their MP3s', () => {
    const sentences = [
      { rw: 'A.', en: 'A.', audio_path: `${BASE}stories/s/0.wav` },
      { rw: 'B.', en: 'B.', audio_path: `${BASE}stories/s/1.wav` },
      { rw: 'C.', en: 'C.', audio_path: null },
    ];
    const out = withMp3(sentences, new Set([`${BASE}stories/s/0.wav`]));
    expect(out.map((s) => s.audio_path)).toEqual([
      `${BASE}stories/s/0.mp3`,
      `${BASE}stories/s/1.wav`,
      null,
    ]);
    expect(out[1]).toBe(sentences[1]);
  });

  it('encodes one voice in mono at 48 kbps', () => {
    const args = FFMPEG_ARGS('in.wav', 'out.mp3');
    expect(args.slice(args.indexOf('-ac'), args.indexOf('-ac') + 2)).toEqual(['-ac', '1']);
    expect(args.slice(args.indexOf('-b:a'), args.indexOf('-b:a') + 2)).toEqual(['-b:a', '48k']);
    expect(args.at(-1)).toBe('out.mp3');
  });
});
