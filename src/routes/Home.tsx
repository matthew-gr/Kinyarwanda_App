import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { GreetingHeader } from '../components/GreetingHeader';
import { HeroBanner } from '../components/HeroBanner';
import { PracticeRow } from '../components/PracticeRow';
import { ProgressBar } from '../components/ProgressBar';
import { SectionHeader } from '../components/SectionHeader';
import { loadHomeStats, type HomeStats } from '../data/repo';

/** Placeholder until accounts arrive in Prompt 3. */
const LEARNER_NAME = 'Learner';

export function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<HomeStats | null>(null);

  useEffect(() => {
    let alive = true;
    void loadHomeStats(Date.now()).then((s) => {
      if (alive) setStats(s);
    });
    return () => {
      alive = false;
    };
  }, []);

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
        <PracticeRow title="Review" tone="yellow" subtitle="Locked · Coming next" locked />
      </div>
    </div>
  );
}
