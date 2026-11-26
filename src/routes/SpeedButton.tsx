import { useSyncExternalStore } from 'react';
import {
  AUDIO_SPEEDS,
  getAudioSpeed,
  nextAudioSpeed,
  onAudioSpeed,
  setAudioSpeed,
  speedLabel,
  type AudioSpeed,
} from '../data/audioSpeed';

/** The chosen audio speed, kept in step with every other place that changes it. */
const useAudioSpeed = (): AudioSpeed =>
  useSyncExternalStore(onAudioSpeed, getAudioSpeed, getAudioSpeed);

/**
 * A button that steps the audio speed down (1×, 0.85×, 0.7×, 0.5×), then back to 1×. `short`
 * shows only the speed, for a toolbar with little room.
 */
export function SpeedButton({ className, short }: { className?: string; short?: boolean }) {
  const speed = useAudioSpeed();
  return (
    <button
      type="button"
      className={className}
      aria-label={`Audio speed ${speedLabel(speed)}. Tap for ${speedLabel(nextAudioSpeed())}.`}
      onClick={() => setAudioSpeed(nextAudioSpeed())}
    >
      {short ? speedLabel(speed) : `Speed ${speedLabel(speed)}`}
    </button>
  );
}

/** The same choice as a list, for Profile's settings. */
export function SpeedSelect({ className }: { className?: string }) {
  const speed = useAudioSpeed();
  return (
    <select
      id="audio-speed"
      className={className}
      value={speed}
      onChange={(e) => setAudioSpeed(Number(e.target.value) as AudioSpeed)}
    >
      {AUDIO_SPEEDS.map((s) => (
        <option key={s} value={s}>
          {s === 1 ? '1× (normal)' : speedLabel(s)}
        </option>
      ))}
    </select>
  );
}
