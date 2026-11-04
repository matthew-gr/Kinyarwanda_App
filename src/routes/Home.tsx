import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { GreetingHeader } from '../components/GreetingHeader';
import { HeroBanner } from '../components/HeroBanner';
import { PracticeRow } from '../components/PracticeRow';
import { ProgressBar } from '../components/ProgressBar';
import { SectionHeader } from '../components/SectionHeader';
import { recallOpen } from '../data/drills';
import { loadStories, storiesStatus } from '../data/stories';
import { loadHomeStats, type HomeStats } from '../data/repo';
import { OPEN_AT_IN_REVIEW } from '../engine/quickRecall';
import { dueRepeats } from '../engine/stories';
import type { DueCounts } from '../engine/review';
import { waitInWords } from './cardText';
import { ModuleCarousel, type ModuleCard } from './ModuleCarousel';
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

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

/** The drills open once numbers 1 to 5 are learned. */
function drillMeta(stats: HomeStats | null): string {
  if (!stats) return ' ';
  const { learned, needed } = stats.numbers;
  return learned >= needed ? 'About 2 minutes' : `${learned} of ${needed} numbers learned`;
}

/** Quick Recall opens at 20 in Review, once a few of them are well known. */
function recallMeta(stats: HomeStats | null): string {
  if (!stats) return ' ';
  if (recallOpen(stats.recall)) return 'About 2 minutes';
  if (stats.recall.inReview < OPEN_AT_IN_REVIEW)
    return `${stats.recall.inReview} of ${OPEN_AT_IN_REVIEW} in Review`;
  return `${stats.recall.wellKnown} well known so far`;
}

interface StoriesInfo {
  wordsLearned: number;
  needed: number;
  due: number;
}

/** Stories open at 100 words; after that, repeats due show beside a new story. */
function storiesMeta(s: StoriesInfo | null): string {
  if (!s) return ' ';
  if (s.wordsLearned < s.needed) return `${s.wordsLearned} of ${s.needed} words learned`;
  return s.due > 0 ? `${s.due} to read again` : 'A new story';
}

/** The modules not built yet, from the product spec. */
const COMING: ModuleCard[] = [
  {
    title: 'Sound Pairs',
    description: 'Tell near-identical words apart by ear.',
    meta: 'Coming soon',
  },
];

/** Until the learner sets a name on Profile. */
const LEARNER_NAME = 'Learner';

export function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [stories, setStories] = useState<StoriesInfo | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const version = useProgressVersion();

  useEffect(() => {
    let alive = true;
    void loadHomeStats(now).then((s) => {
      if (alive) setStats(s);
    });
    void Promise.all([storiesStatus(), loadStories()]).then(([st, list]) => {
      if (alive) setStories({ ...st, due: dueRepeats(list, now).length });
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
  const due = stats ? stats.review.overdue + stats.review.dueNow : 0;
  const learned = stats ? stats.words.learned + stats.phrases.learned : 0;
  const total = stats ? stats.words.total + stats.phrases.total : 0;

  const modules: ModuleCard[] = [
    {
      title: 'Learn',
      description: 'New words and phrases, until each one sticks.',
      meta: `${learned} of ${total} learned`,
      onClick: () => navigate('/learn/words'),
    },
    {
      title: 'Review',
      description: 'Recall what you know, spaced out up to a year.',
      meta: stats ? `${stats.review.total} in Review` : ' ',
      detail: stats ? `${due} due` : undefined,
      onClick: () => navigate('/review'),
    },
    {
      title: 'Stories',
      description: 'Short stories made from words you already know.',
      meta: storiesMeta(stories),
      onClick: () => navigate('/stories'),
    },
    {
      title: 'Verb Builder',
      description: 'Build verbs from picture cues: who, when, what.',
      meta: stats ? `Level ${stats.verbLevel}` : ' ',
      onClick: () => navigate('/verbs'),
    },
    {
      title: 'Speed Speaking',
      description: 'Say a noun and a number aloud, fast.',
      meta: drillMeta(stats),
      onClick: () => navigate('/drills/speaking'),
    },
    {
      title: 'Number Listening',
      description: 'Hear a number and type it as fast as you can.',
      meta: drillMeta(stats),
      onClick: () => navigate('/drills/numbers'),
    },
    {
      title: 'Quick Recall',
      description: 'Pick a word’s meaning against the clock.',
      meta: recallMeta(stats),
      onClick: () => navigate('/drills/recall'),
    },
    ...COMING,
  ];

  return (
    <div className="stack">
      <GreetingHeader
        name={stats?.name || LEARNER_NAME}
        avatarSrc={stats?.avatar ?? undefined}
        onAvatar={() => navigate('/profile')}
      />
      <HeroBanner
        title="Start Learning today"
        subtitle={
          <>
            <span className="hero-line">
              {due > 0 ? `${plural(due, 'review')} due now` : 'No reviews due'}
            </span>
            <span className="hero-line">
              {today >= goal
                ? `Goal reached: ${today} learned today`
                : `${today} of ${goal} new items learned today`}
            </span>
          </>
        }
      >
        <ProgressBar
          className="hero-goal"
          value={today / goal}
          size="session"
          label="Today's goal"
        />
      </HeroBanner>
      <SectionHeader title="Modules" subtitle="Eight ways to practise" />
      <ModuleCarousel cards={modules} />
      <SectionHeader title="Practice" subtitle="Start where you left off" />
      <div className="rows">
        <PracticeRow
          title="Words"
          tone="green"
          subtitle={
            stats
              ? `${stats.wordBand.name} · ${stats.wordBand.learned} of ${stats.wordBand.total} learned`
              : ' '
          }
          progress={
            stats && stats.wordBand.total ? stats.wordBand.learned / stats.wordBand.total : 0
          }
          onClick={() => navigate('/learn/words')}
        />
        {stats && stats.words.learned === 0 ? (
          <PracticeRow
            title="Already know some Kinyarwanda?"
            tone="blue"
            subtitle="Take the placement check (about 5 minutes)"
            onClick={() => navigate('/placement')}
          />
        ) : null}
        <PracticeRow
          title="Topics"
          tone="green"
          subtitle={stats?.topic ? `Learning ${stats.topic} next` : 'Choose a topic to learn next'}
          onClick={() => navigate('/topics')}
        />
        <PracticeRow
          title="My words"
          tone="yellow"
          subtitle={
            !stats
              ? ' '
              : stats.myWords.total === 0
                ? 'Add your own words to learn'
                : `${stats.myWords.learned} of ${stats.myWords.total} learned`
          }
          progress={stats && stats.myWords.total ? stats.myWords.learned / stats.myWords.total : 0}
          onClick={() => navigate('/words')}
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
