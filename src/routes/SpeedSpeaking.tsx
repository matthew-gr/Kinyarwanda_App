import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { Icon } from '../components/Icon';
import { ProgressBar } from '../components/ProgressBar';
import {
  drillsOpen,
  loadDrillSummary,
  loadNounNumbers,
  numbersLearned,
  saveScore,
  type NumbersLearned,
} from '../data/drills';
import {
  beats,
  pickFresh,
  startTimer,
  timeUp,
  type DrillScore,
  type DrillTimer,
} from '../engine/drill';
import { createAppRng } from '../engine/random';
import { createCountdown, markCard, type CountdownState } from '../engine/speedSpeaking';
import type { NumberPhrase } from '../engine/types';
import { playAudio } from './cardText';
import { DrillHeader, DrillLocked, DrillStart } from './DrillParts';
import { secondsText, useNow } from './drillTime';
import { nounPicture } from './numberPictures';

const LEVEL = 1;

type Phase =
  | { type: 'start' }
  | {
      type: 'card';
      timer: DrillTimer;
      countdown: CountdownState;
      card: NumberPhrase;
      shownAt: number;
      revealed: boolean;
      recent: string[];
    }
  | { type: 'done'; score: DrillScore; before: DrillScore | null };

export function SpeedSpeaking() {
  const navigate = useNavigate();
  const rng = useMemo(() => createAppRng(), []);
  const [numbers, setNumbers] = useState<NumbersLearned | null>(null);
  const [cards, setCards] = useState<NumberPhrase[]>([]);
  const [best, setBest] = useState<DrillScore | null>(null);
  const [phase, setPhase] = useState<Phase>({ type: 'start' });

  useEffect(() => {
    let alive = true;
    void Promise.all([
      numbersLearned(),
      loadNounNumbers(),
      loadDrillSummary('speed_speaking', LEVEL),
    ]).then(([n, c, s]) => {
      if (!alive) return;
      setNumbers(n);
      setCards(c);
      setBest(s.best);
    });
    return () => {
      alive = false;
    };
  }, []);

  const start = useCallback(() => {
    const now = Date.now();
    setPhase({
      type: 'card',
      timer: startTimer(now),
      countdown: createCountdown(),
      card: pickFresh(cards, [], rng),
      shownAt: now,
      revealed: false,
      recent: [],
    });
  }, [cards, rng]);

  const mark = useCallback(
    async (got: boolean) => {
      if (phase.type !== 'card') return;
      const countdown = markCard(phase.countdown, got);
      const now = Date.now();
      if (timeUp(phase.timer, now)) {
        const score: DrillScore = {
          id: crypto.randomUUID(),
          drill: 'speed_speaking',
          level: LEVEL,
          played_at: new Date(now).toISOString(),
          answers: countdown.answers,
          correct: countdown.correct,
          median_ms: null,
          best_countdown_ms: countdown.best_ms,
        };
        const before = await saveScore(score);
        setPhase({ type: 'done', score, before });
        if (beats(score, before)) setBest(score);
        return;
      }
      const recent = [...phase.recent, phase.card.id].slice(-8);
      setPhase({
        ...phase,
        countdown,
        card: pickFresh(cards, recent, rng),
        shownAt: now,
        revealed: false,
        recent,
      });
    },
    [phase, cards, rng],
  );

  return (
    <main className="screen screen-learn screen-drill">
      <AppBar title="Speed Speaking" onBack={() => navigate('/')} backLabel="Back to Home" />
      {!numbers ? null : !drillsOpen(numbers) ? (
        <DrillLocked numbers={numbers} />
      ) : cards.length === 0 ? (
        <section className="learn-done">
          <h2 className="h2-bold">No cards yet</h2>
          <p className="body">The numbers haven’t loaded. Check back after the next update.</p>
        </section>
      ) : phase.type === 'start' ? (
        <DrillStart title="Say it before the answer appears" onStart={start}>
          <p className="body">
            You’ll see a noun and a number, such as abantu + 2. Say the phrase aloud before the
            countdown ends, then mark yourself. Get 5 right in a row and the countdown gets shorter.
          </p>
          <p className="body-small">
            {best?.best_countdown_ms
              ? `Your best: ${secondsText(best.best_countdown_ms)}`
              : 'About 2 minutes. No personal best yet.'}
          </p>
        </DrillStart>
      ) : phase.type === 'card' ? (
        <Card
          key={`${phase.card.id}-${phase.shownAt}`}
          phase={phase}
          onReveal={() => setPhase({ ...phase, revealed: true })}
          onMark={(got) => void mark(got)}
        />
      ) : (
        <Results
          score={phase.score}
          before={phase.before}
          onAgain={start}
          onHome={() => navigate('/')}
        />
      )}
    </main>
  );
}

type CardPhase = Extract<Phase, { type: 'card' }>;

function Card({
  phase,
  onReveal,
  onMark,
}: {
  phase: CardPhase;
  onReveal: () => void;
  onMark: (got: boolean) => void;
}) {
  const { card, countdown, revealed, shownAt } = phase;
  const now = useNow(true, 50);
  const left = Math.max(0, countdown.countdown_ms - (now - shownAt));
  const gotRef = useRef<HTMLButtonElement>(null);

  // The countdown running out shows the answer.
  useEffect(() => {
    if (!revealed && left === 0) onReveal();
  }, [revealed, left, onReveal]);

  // The answer plays as it appears.
  useEffect(() => {
    if (!revealed) return;
    if (card.audio_path) playAudio(card.audio_path);
    gotRef.current?.focus();
  }, [revealed, card.audio_path]);

  return (
    <>
      <DrillHeader title="Speed Speaking" timer={phase.timer} now={now} />
      <section className="panel drill-card" aria-label="Say this aloud">
        <p className="drill-picture" aria-hidden="true">
          {nounPicture(card.noun)}
        </p>
        <p className="drill-prompt">
          <strong>{card.noun}</strong>
          <span className="drill-plus" aria-hidden="true">
            +
          </span>
          <strong className="drill-numeral">{card.value}</strong>
        </p>
        <p className="body-small drill-countdown-label">
          Countdown {secondsText(countdown.countdown_ms)}
        </p>
        <ProgressBar
          value={revealed ? 0 : left / countdown.countdown_ms}
          size="session"
          label="Time to answer"
        />
        {revealed ? (
          <div className="drill-answer" role="status">
            <p className="drill-answer-text">
              <strong>{card.text}</strong>
              {card.audio_path ? (
                <button
                  type="button"
                  className="kn-reset-btn verb-speak"
                  onClick={() => playAudio(card.audio_path!)}
                  aria-label={`Play ${card.text}`}
                >
                  <Icon name="speaker" size={24} />
                </button>
              ) : null}
            </p>
            <p className="body-small">{card.en}</p>
          </div>
        ) : null}
      </section>
      <div className="learn-actions drill-actions">
        {revealed ? (
          <>
            <button type="button" className="btn btn-missed" onClick={() => onMark(false)}>
              Missed
            </button>
            <button ref={gotRef} type="button" className="btn btn-got" onClick={() => onMark(true)}>
              Got it
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onReveal}>
            I said it: show the answer
          </button>
        )}
      </div>
    </>
  );
}

function Results({
  score,
  before,
  onAgain,
  onHome,
}: {
  score: DrillScore;
  before: DrillScore | null;
  onAgain: () => void;
  onHome: () => void;
}) {
  const record = beats(score, before);
  return (
    <section className="learn-done drill-results" role="status">
      <h2 className="h2-bold">Time’s up</h2>
      <p className="body">
        {score.best_countdown_ms
          ? `Shortest countdown: ${secondsText(score.best_countdown_ms)}`
          : 'No cards marked Got it this time.'}
      </p>
      <p className="body">
        {score.correct} of {score.answers} right
      </p>
      {record ? (
        <p className="drill-record">New personal best!</p>
      ) : before?.best_countdown_ms ? (
        <p className="body-small">Your best: {secondsText(before.best_countdown_ms)}</p>
      ) : null}
      <button type="button" className="btn btn-primary" onClick={onAgain}>
        Play again
      </button>
      <button type="button" className="btn btn-missed" onClick={onHome}>
        Back to Home
      </button>
    </section>
  );
}
