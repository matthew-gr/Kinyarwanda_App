import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { cx } from '../components/cx';
import { Icon } from '../components/Icon';
import {
  drillsOpen,
  loadListening,
  loadScores,
  numbersLearned,
  saveScore,
  type NumbersLearned,
} from '../data/drills';
import {
  accuracy,
  beats,
  personalBest,
  pickFresh,
  startTimer,
  timeUp,
  type DrillScore,
  type DrillTimer,
} from '../engine/drill';
import {
  gradeNumber,
  LISTENING_LEVELS,
  openListeningLevels,
  summarize,
  type ListeningAnswer,
} from '../engine/numberListening';
import { digitsOnly, phoneDisplay } from '../engine/numbers';
import { createAppRng } from '../engine/random';
import type { NumberPhrase } from '../engine/types';
import { DrillHeader, DrillLocked } from './DrillParts';
import { playThen, secondsText, useNow } from './drillTime';

/** A right answer moves on by itself after this long; a wrong one waits for Next. */
const RIGHT_PAUSE_MS = 1200;

type Phase =
  | { type: 'levels' }
  | {
      type: 'prompt' | 'feedback';
      level: number;
      timer: DrillTimer;
      prompt: NumberPhrase;
      /** Counts prompts shown, so each one gets a fresh screen. */
      round: number;
      answers: ListeningAnswer[];
      recent: string[];
      /** The learner's answer, once checked. */
      typed?: string;
      right?: boolean;
    }
  | {
      type: 'done';
      level: number;
      score: DrillScore;
      before: DrillScore | null;
      opened: number | null;
    };

/** How the number is written once the answer shows: 1,500 or 078 812 34 56. */
const written = (p: NumberPhrase) =>
  p.kind === 'phone' && p.groups
    ? phoneDisplay(p.value, p.groups)
    : Number(p.value).toLocaleString('en-US');

export function NumberListening() {
  const navigate = useNavigate();
  const rng = useMemo(() => createAppRng(), []);
  const [numbers, setNumbers] = useState<NumbersLearned | null>(null);
  const [scores, setScores] = useState<DrillScore[]>([]);
  const [pool, setPool] = useState<NumberPhrase[]>([]);
  const [phase, setPhase] = useState<Phase>({ type: 'levels' });

  useEffect(() => {
    let alive = true;
    void Promise.all([numbersLearned(), loadScores('number_listening')]).then(([n, s]) => {
      if (!alive) return;
      setNumbers(n);
      setScores(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const start = useCallback(
    async (level: number) => {
      const prompts = await loadListening(level);
      if (prompts.length === 0) return;
      setPool(prompts);
      setPhase({
        type: 'prompt',
        level,
        timer: startTimer(Date.now()),
        prompt: pickFresh(prompts, [], rng),
        round: 0,
        answers: [],
        recent: [],
      });
    },
    [rng],
  );

  const check = useCallback(
    (typed: string, ms: number) => {
      if (phase.type !== 'prompt') return;
      const right = gradeNumber(typed, phase.prompt.value);
      setPhase({
        ...phase,
        type: 'feedback',
        typed,
        right,
        answers: [...phase.answers, { correct: right, ms }],
      });
    },
    [phase],
  );

  const next = useCallback(async () => {
    if (phase.type !== 'feedback') return;
    const now = Date.now();
    if (timeUp(phase.timer, now)) {
      const score: DrillScore = {
        id: crypto.randomUUID(),
        drill: 'number_listening',
        level: phase.level,
        played_at: new Date(now).toISOString(),
        ...summarize(phase.answers),
        best_countdown_ms: null,
      };
      const openBefore = openListeningLevels(scores);
      const before = await saveScore(score);
      const all = [...scores, score];
      setScores(all);
      const openAfter = openListeningLevels(all);
      setPhase({
        type: 'done',
        level: phase.level,
        score,
        before,
        opened: openAfter > openBefore ? openAfter : null,
      });
      return;
    }
    const recent = [...phase.recent, phase.prompt.id].slice(-10);
    setPhase({
      type: 'prompt',
      level: phase.level,
      timer: phase.timer,
      prompt: pickFresh(pool, recent, rng),
      round: phase.round + 1,
      answers: phase.answers,
      recent,
    });
  }, [phase, pool, rng, scores]);

  const title =
    phase.type === 'levels'
      ? ''
      : `Level ${phase.level}: ${LISTENING_LEVELS[phase.level - 1]!.title}`;

  return (
    <main className="screen screen-learn screen-drill">
      <AppBar title="Number Listening" onBack={() => navigate('/')} backLabel="Back to Home" />
      {!numbers ? null : !drillsOpen(numbers) ? (
        <DrillLocked numbers={numbers} />
      ) : phase.type === 'levels' ? (
        <LevelList scores={scores} onPick={(level) => void start(level)} />
      ) : phase.type === 'done' ? (
        <section className="learn-done drill-results" role="status">
          <h2 className="h2-bold">Time’s up</h2>
          <p className="body">
            {phase.score.correct} of {phase.score.answers} right (
            {Math.round(accuracy(phase.score) * 100)}%)
          </p>
          {phase.score.median_ms !== null ? (
            <p className="body">Median time: {secondsText(phase.score.median_ms)}</p>
          ) : null}
          {beats(phase.score, phase.before) ? (
            <p className="drill-record">New personal best!</p>
          ) : phase.before?.median_ms ? (
            <p className="body-small">
              Your best on this level: {secondsText(phase.before.median_ms)}
            </p>
          ) : (
            <p className="body-small">A personal best needs at least 10 answers and 80% right.</p>
          )}
          {phase.opened ? (
            <p className="verb-unlocked">
              You’ve opened level {phase.opened}:{' '}
              {LISTENING_LEVELS[phase.opened - 1]!.title.toLowerCase()}.
            </p>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={() => void start(phase.level)}>
            Play again
          </button>
          <button
            type="button"
            className="btn btn-missed"
            onClick={() => setPhase({ type: 'levels' })}
          >
            Choose a level
          </button>
        </section>
      ) : (
        <Prompt
          key={phase.round}
          title={title}
          phase={phase}
          onCheck={check}
          onNext={() => void next()}
        />
      )}
    </main>
  );
}

function LevelList({ scores, onPick }: { scores: DrillScore[]; onPick: (level: number) => void }) {
  const open = openListeningLevels(scores);
  return (
    <section className="drill-start panel">
      <h2 className="h2-bold">Hear it, type it</h2>
      <p className="body">
        You’ll hear a number. Type it in digits as fast as you can. About 2 minutes per session.
      </p>
      <ol className="drill-levels">
        {LISTENING_LEVELS.map((l) => {
          const available = l.built && l.level <= open;
          const best = personalBest(scores, 'number_listening', l.level);
          return (
            <li key={l.level}>
              <button
                type="button"
                className={cx('drill-level', !available && 'drill-level-locked')}
                disabled={!available}
                onClick={() => onPick(l.level)}
              >
                <span className="drill-level-name">
                  Level {l.level}: {l.title}
                </span>
                <span className="body-small drill-level-meta">
                  {!l.built
                    ? 'Coming later'
                    : !available
                      ? `Opens after 80% on level ${l.level - 1}`
                      : best?.median_ms
                        ? `Best: ${secondsText(best.median_ms)}`
                        : 'Open'}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

type PromptPhase = Extract<Phase, { type: 'prompt' | 'feedback' }>;

function Prompt({
  title,
  phase,
  onCheck,
  onNext,
}: {
  title: string;
  phase: PromptPhase;
  onCheck: (typed: string, ms: number) => void;
  onNext: () => void;
}) {
  const { prompt } = phase;
  const now = useNow(true, 250);
  const [typed, setTyped] = useState('');
  // The answer time runs from the end of the audio, or from the words appearing when there is
  // no audio yet, to the last digit typed.
  const heardAt = useRef<number | null>(prompt.audio_path ? null : Date.now());
  const lastDigitAt = useRef<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const feedback = phase.type === 'feedback';

  const play = useCallback(() => {
    if (!prompt.audio_path) return () => undefined;
    return playThen(prompt.audio_path, () => {
      heardAt.current ??= Date.now();
    });
  }, [prompt.audio_path]);

  useEffect(() => {
    const stop = play();
    input.current?.focus();
    return stop;
  }, [play]);

  // A right answer moves on by itself; a wrong one waits so the learner can read it.
  useEffect(() => {
    if (!feedback) return;
    nextRef.current?.focus();
    if (!phase.right) return;
    const t = setTimeout(onNext, RIGHT_PAUSE_MS);
    return () => clearTimeout(t);
  }, [feedback, phase.right, onNext]);

  const submit = () => {
    if (feedback || digitsOnly(typed) === '') return;
    const end = lastDigitAt.current ?? Date.now();
    const start = heardAt.current ?? end;
    onCheck(typed, Math.max(0, end - start));
  };

  return (
    <>
      <DrillHeader title={title} timer={phase.timer} now={now} />
      <section className="panel drill-card" aria-label="The number to type">
        {prompt.audio_path ? (
          <p className="drill-listen">
            <span className="meta-label">Type the number you hear</span>
            <button
              type="button"
              className="kn-reset-btn verb-speak"
              onClick={() => play()}
              aria-label="Play the number again"
            >
              <Icon name="speaker" size={24} />
            </button>
          </p>
        ) : (
          <>
            <p className="meta-label">No audio yet, so read it and type the number</p>
            <p className="drill-words">{prompt.text}</p>
          </>
        )}
        <form
          className="drill-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="sr-only" htmlFor="drill-number">
            The number in digits
          </label>
          <input
            ref={input}
            id="drill-number"
            className="field-input drill-input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={typed}
            readOnly={feedback}
            onChange={(e) => {
              if (digitsOnly(e.target.value) !== digitsOnly(typed))
                lastDigitAt.current = Date.now();
              setTyped(e.target.value);
            }}
          />
          {!feedback ? (
            <button type="submit" className="btn btn-primary" disabled={digitsOnly(typed) === ''}>
              Check
            </button>
          ) : null}
        </form>
        {feedback ? (
          <div className="drill-answer" role="status">
            <p className={cx('h3', phase.right ? 'verb-right' : 'verb-wrong')}>
              {phase.right ? '✓ Right' : `✗ It was ${written(prompt)}`}
            </p>
            <p className="body-small">
              {prompt.text}
              {prompt.kind === 'noun' || prompt.kind === 'money' ? ` (${prompt.en})` : ''}
            </p>
          </div>
        ) : null}
      </section>
      {feedback ? (
        <div className="learn-actions">
          <button ref={nextRef} type="button" className="btn btn-primary" onClick={onNext}>
            Next
          </button>
        </div>
      ) : null}
    </>
  );
}
