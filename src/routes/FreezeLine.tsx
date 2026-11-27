import { useEffect, useState } from 'react';
import { loadStreak } from '../data/progressStats';
import type { Streak } from '../engine/stats';
import { useProgressVersion } from './useProgressVersion';

/** How recently a freeze must have been earned for the finish screen to celebrate it. */
const JUST_NOW_MS = 2 * 60 * 1000;

/** The streak freezes in hand, and how far the perfect rounds have got towards the next one. */
function useStreak(): Streak | null {
  const version = useProgressVersion();
  const [streak, setStreak] = useState<Streak | null>(null);
  useEffect(() => {
    let alive = true;
    void loadStreak(Date.now()).then((s) => alive && setStreak(s));
    return () => {
      alive = false;
    };
  }, [version]);
  return streak;
}

const freezesText = (n: number) => `${n} streak ${n === 1 ? 'freeze' : 'freezes'}`;

/**
 * On Review's finish screen (decision 208): a freeze just earned, or the freezes in hand and
 * the perfect rounds of 20 in a row the next one takes.
 */
export function FreezeLine() {
  const s = useStreak();
  if (!s) return null;
  const justEarned = s.lastEarnedAt !== null && Date.now() - s.lastEarnedAt < JUST_NOW_MS;
  return (
    <p className="body-small freeze-line">
      <span aria-hidden="true">❄️ </span>
      {justEarned
        ? `Perfect round! You earned a streak freeze. You have ${freezesText(s.freezes)}.`
        : `You have ${freezesText(s.freezes)}. Perfect rounds of 20 in a row: ${s.perfectInARow} of ${s.nextFreezeAfter} for the next one.`}
    </p>
  );
}
