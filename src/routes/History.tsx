import { useEffect, useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { StatRow } from '../components/StatRow';
import { loadProgressStats, type ProgressStats } from '../data/progressStats';
import { DayBars } from './DayBars';
import { useProgressVersion } from './useProgressVersion';

const percent = (x: number | null) => (x === null ? 'None yet' : `${Math.round(x * 100)}%`);
const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

export function History() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const version = useProgressVersion();

  useEffect(() => {
    let alive = true;
    void loadProgressStats(Date.now()).then((s) => {
      if (alive) setStats(s);
    });
    return () => {
      alive = false;
    };
  }, [version]);

  return (
    <div className="stack">
      <SectionHeader as="h1" size="large" title="History" subtitle="Your last two weeks" />
      {stats === null ? null : stats.totalAnswers === 0 ? (
        <section className="panel">
          <p className="body">
            Nothing here yet. Your practice shows up here day by day, once you start learning.
          </p>
        </section>
      ) : (
        <>
          <StatRow label="Day streak" value={days(stats.streak.current)} icon="fire" strong />
          <DayBars
            title="Daily activity"
            days={stats.recent}
            value={(d) => d.answers}
            unit="answer"
            tone="green"
          />
          <DayBars
            title="Learned per day"
            days={stats.recent}
            value={(d) => d.learned}
            unit="item"
            tone="blue"
          />
          <p className="body-small history-note">
            Review accuracy: the share of Review answers you knew.
          </p>
          <StatRow label="Accuracy, 7 days" value={percent(stats.accuracy7)} strong />
          <StatRow label="Accuracy, 30 days" value={percent(stats.accuracy30)} strong />
        </>
      )}
    </div>
  );
}
