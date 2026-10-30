// Pieces the drill screens share: the session header with time left, the locked screen and
// the start panel.

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { SessionHeader } from '../components/SessionHeader';
import type { NumbersLearned } from '../data/drills';
import { SESSION_MS, timeLeft, type DrillTimer } from '../engine/drill';
import { clockText } from './drillTime';

export function DrillHeader({
  title,
  timer,
  now,
}: {
  title: string;
  timer: DrillTimer;
  now: number;
}) {
  const left = timeLeft(timer, now);
  return (
    <SessionHeader
      level={title}
      meta={<span aria-label={`${clockText(left)} left`}>{clockText(left)}</span>}
      progress={1 - left / SESSION_MS}
      progressLabel="Time used"
    />
  );
}

/** Shown until numbers 1 to 5 are learned. */
export function DrillLocked({ numbers }: { numbers: NumbersLearned }) {
  const navigate = useNavigate();
  return (
    <section className="learn-done">
      <h2 className="h2-bold">Learn numbers 1 to 5 first</h2>
      <p className="body">
        This drill opens once rimwe, kabiri, gatatu, kane and gatanu are learned. {numbers.learned}{' '}
        of {numbers.needed} learned so far.
      </p>
      <button type="button" className="btn btn-primary" onClick={() => navigate('/learn/words')}>
        Go to Learn
      </button>
    </section>
  );
}

export function DrillStart({
  title,
  children,
  onStart,
}: {
  title: string;
  children: ReactNode;
  onStart: () => void;
}) {
  return (
    <section className="drill-start panel">
      <h2 className="h2-bold">{title}</h2>
      {children}
      <button type="button" className="btn btn-primary" onClick={onStart}>
        Start
      </button>
    </section>
  );
}
