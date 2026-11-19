import { useEffect, useId, useRef, useState } from 'react';
import { loadStreak } from '../data/progressStats';
import { useProgressVersion } from './useProgressVersion';

/** The frozen day this device last told the learner about. */
const SEEN_KEY = 'kinya.streakFreezeSeen';

function seenFreeze(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function markSeen(day: string): void {
  try {
    localStorage.setItem(SEEN_KEY, day);
  } catch {
    // The notice may show once more on this device.
  }
}

const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

interface Notice {
  day: string;
  current: number;
}

/**
 * Tells the learner, the first time they open the app after a streak freeze saved their
 * streak, that it was applied and how long the streak is. Once per freeze on each device,
 * and not at all once they have practised since the frozen day on any device.
 */
export function StreakFreezeNotice() {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [check, setCheck] = useState(0);
  const version = useProgressVersion();

  // Look again when the learner comes back to an app left open overnight.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setCheck((c) => c + 1);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    let alive = true;
    void loadStreak(Date.now()).then((s) => {
      if (!alive) return;
      const day = s.freshFreeze;
      setNotice(day !== null && day !== seenFreeze() ? { day, current: s.current } : null);
    });
    return () => {
      alive = false;
    };
  }, [version, check]);

  useEffect(() => {
    const d = dialog.current;
    if (notice && d && !d.open) d.showModal?.();
  }, [notice]);

  if (!notice) return null;

  const close = () => {
    markSeen(notice.day);
    setNotice(null);
  };

  return (
    <dialog ref={dialog} className="freeze-dialog" aria-labelledby={titleId} onClose={close}>
      <form method="dialog" className="form">
        <h2 id={titleId} className="h3-bold">
          Streak freeze
        </h2>
        <p className="body">
          Hey, your streak freeze has been applied. You still have {days(notice.current)} in your
          streak.
        </p>
        <button type="submit" className="btn btn-primary">
          Keep going
        </button>
      </form>
    </dialog>
  );
}
