import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { GreetingHeader } from '../components/GreetingHeader';
import { HeroBanner } from '../components/HeroBanner';
import { PracticeRow } from '../components/PracticeRow';
import { ProgressBar } from '../components/ProgressBar';
import { SectionHeader } from '../components/SectionHeader';
import { loadHomeStats, type HomeStats } from '../data/repo';
import type { DueCounts } from '../engine/review';
import { waitInWords } from './cardText';
import { useProgressVersion } from './useProgressVersion';

function reviewSubtitle(c: DueCounts, now: number): string {
  const due = c.overdue + c.dueNow;
  if (due > 0) return `${due} due now`;
  if (c.total === 0) return 'Opens when you learn your first word';
  if (c.nextDueAt !== null) return `All caught up · next in ${waitInWords(c.nextDueAt - now)}`;
  return 'All caught up';
}

/** Overdue, due now, later today, tomorrow and the total, as the spec lists them. */
function DueSummary({ counts }: { counts: DueCounts }) {
  const cells: Array<[string, number]> = [
    ['Overdue', counts.overdue],
    ['Due now', counts.dueNow],
    ['Later today', counts.laterToday],
    ['Tomorrow', counts.tomorrow],
    ['In Review', counts.total],
  ];
  return (
    <dl className="due-summary" aria-label="Review">
      {cells.map(([label, n]) => (
        <div key={label} className="due-cell">
          <dt className="body-small">{label}</dt>
          <dd className="h3">{n}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Placeholder until accounts arrive in Prompt 3. */
const LEARNER_NAME = 'Learner';

export function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const version = useProgressVersion();

  useEffect(() => {
    let alive = true;
    void loadHomeStats(now).then((s) => {
      if (alive) setStats(s);
    });
    return () => {
      alive = false;
    };
  }, [now, version]);

  // Recount when items come due, and when the learner returns to the tab.
  const nextDueAt = stats?.review.nextDueAt ?? null;
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    const t =
      nextDueAt === null
        ? undefined
        : setTimeout(refresh, Math.min(Math.max(0, nextDueAt - Date.now()) + 250, 60 * 60 * 1000));
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(t);
    };
  }, [nextDueAt]);

  const goal = stats?.dailyGoal ?? 10;
  const today = stats?.learnedToday ?? 0;

  return (
    <div className="stack">
      <GreetingHeader name={LEARNER_NAME} />
      <HeroBanner
        title="Start Learning today"
        subtitle={`${today} of ${goal} new items learned today`}
      >
        <ProgressBar
          className="hero-goal"
          value={today / goal}
          size="session"
          label="Today's goal"
        />
      </HeroBanner>
      <SectionHeader title="Practice" subtitle="Start where you left off" />
      <div className="rows">
        <PracticeRow
          title="Words"
          tone="green"
          subtitle={stats ? `${stats.words.learned} of ${stats.words.total} learned` : ' '}
          progress={stats && stats.words.total ? stats.words.learned / stats.words.total : 0}
          onClick={() => navigate('/learn/words')}
        />
        <PracticeRow
          title="Phrases"
          tone="blue"
          subtitle={stats ? `${stats.phrases.learned} of ${stats.phrases.total} learned` : ' '}
          progress={stats && stats.phrases.total ? stats.phrases.learned / stats.phrases.total : 0}
          onClick={() => navigate('/learn/phrases')}
        />
        <PracticeRow
          title="Review"
          tone="yellow"
          subtitle={stats ? reviewSubtitle(stats.review, now) : ' '}
          onClick={() => navigate('/review')}
        />
      </div>
      {stats && stats.review.total > 0 ? <DueSummary counts={stats.review} /> : null}
    </div>
  );
}
