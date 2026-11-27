// A reminder to take a short break after a long stretch of practice (learner feedback,
// 27 November 2026). Spaced short breaks help what was just practised settle; 25 minutes on,
// 5 off is the familiar rhythm.

import { useEffect, useState } from 'react';
import { BREAK_GAP_MS, practisingFor } from '../data/activity';

/** Practice without a break after which the reminder shows. */
export const BREAK_AFTER_MS = 25 * 60_000;

export function BreakReminder() {
  const [show, setShow] = useState(false);
  /** Keep going asks again after another BREAK_AFTER_MS. */
  const [quietUntil, setQuietUntil] = useState(0);
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const stretch = practisingFor(now);
      // A real break resets the snooze, so the next long stretch is reminded in full.
      if (stretch === 0 && quietUntil !== 0) setQuietUntil(0);
      setShow(stretch >= BREAK_AFTER_MS && now >= quietUntil);
    };
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [quietUntil]);
  if (!show) return null;
  return (
    <div className="update-banner break-banner" role="status">
      <p className="body-small">
        {Math.round(BREAK_AFTER_MS / 60_000)} minutes of practice. A{' '}
        {Math.round(BREAK_GAP_MS / 60_000)}-minute break helps it stick.
      </p>
      <button
        type="button"
        className="btn btn-missed update-btn"
        onClick={() => {
          setQuietUntil(Date.now() + BREAK_AFTER_MS);
          setShow(false);
        }}
      >
        Keep going
      </button>
    </div>
  );
}
