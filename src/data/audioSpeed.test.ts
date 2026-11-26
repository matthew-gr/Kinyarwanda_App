// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  applyAudioSpeed,
  getAudioSpeed,
  nextAudioSpeed,
  onAudioSpeed,
  setAudioSpeed,
} from './audioSpeed';

describe('audio speed', () => {
  it('starts at normal speed and steps down, then back to normal', () => {
    expect(getAudioSpeed()).toBe(1);
    const seen = [];
    for (let i = 0; i < 4; i++) {
      setAudioSpeed(nextAudioSpeed());
      seen.push(getAudioSpeed());
    }
    expect(seen).toEqual([0.85, 0.7, 0.5, 1]);
  });

  it('is kept on the device and tells listeners', () => {
    let calls = 0;
    const off = onAudioSpeed(() => calls++);
    setAudioSpeed(0.7);
    expect(localStorage.getItem('kinyarwanda.audio-speed')).toBe('0.7');
    expect(calls).toBe(1);
    off();
    setAudioSpeed(1);
    expect(calls).toBe(1);
  });

  it('slows a clip without changing its pitch, and follows a change while it plays', () => {
    setAudioSpeed(0.85);
    const audio = document.createElement('audio');
    applyAudioSpeed(audio);
    expect(audio.playbackRate).toBe(0.85);
    expect(audio.defaultPlaybackRate).toBe(0.85);
    expect(audio.preservesPitch).toBe(true);
    setAudioSpeed(0.5);
    expect(audio.playbackRate).toBe(0.5);
    setAudioSpeed(1);
  });
});
