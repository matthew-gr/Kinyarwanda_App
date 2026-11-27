import { useState, useSyncExternalStore } from 'react';
import { switchScheduler } from '../data/applyProgress';
import { getScheduler, onScheduler } from '../data/scheduler';
import type { SchedulerKind } from '../engine/schedule';
import { getTheme, onTheme, setTheme, type Theme } from '../data/theme';
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

/** Light, dark, or as the phone is set, for Profile's settings (decision 205). */
export function ThemeSelect({ className }: { className?: string }) {
  const theme = useSyncExternalStore(onTheme, getTheme, getTheme);
  return (
    <select
      id="theme"
      className={className}
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
    >
      <option value="system">As the phone is set</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}

/**
 * The app's stages or FSRS, Anki's scheduler, for Profile's settings (decision 206). A switch
 * reschedules every card in Review from the answers so far.
 */
export function SchedulerSelect({ className }: { className?: string }) {
  const kind = useSyncExternalStore(onScheduler, getScheduler, getScheduler);
  const [busy, setBusy] = useState(false);
  return (
    <select
      id="scheduler"
      className={className}
      value={kind}
      disabled={busy}
      onChange={(e) => {
        setBusy(true);
        void switchScheduler(e.target.value as SchedulerKind).finally(() => setBusy(false));
      }}
    >
      <option value="ladder">Stages (5 minutes up to a year)</option>
      <option value="fsrs">FSRS, as in Anki</option>
    </select>
  );
}
