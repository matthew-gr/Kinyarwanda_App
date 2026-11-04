import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { cx } from '../components/cx';
import { Icon } from '../components/Icon';
import {
  countRecallAsReview,
  loadRecallPool,
  loadScores,
  recallOpen,
  recallStatus,
  saveScore,
  type RecallPool,
  type RecallStatus,
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
  answer,
  buildQuestion,
  createTarget,
  MIN_PROMPTS,
  MIN_STAGE,
  OPEN_AT_IN_REVIEW,
  perMinute,
  RECALL_LEVELS,
  summarizeRecall,
  type RecallAnswer,
  type RecallQuestion,
  type TargetState,
} from '../engine/quickRecall';
import { createAppRng } from '../engine/random';
import { DrillHeader } from './DrillParts';
import { playThen, secondsText, useNow } from './drillTime';

/** How long the marked answer stays before the next question: short when right. */
const RIGHT_PAUSE_MS = 500;
const WRONG_PAUSE_MS = 1500;

type Phase =
  | { type: 'levels' }
  | {
      type: 'question';
      level: number;
      timer: DrillTimer;
      question: RecallQuestion;
      /** Counts questions shown, so each one gets a fresh screen. */
      round: number;
      target: TargetState;
      answers: RecallAnswer[];
      recent: string[];
      /** Due Review words answered right in time, which counted as reviews. */
      reviewed: number;
      /** The option tapped, once tapped. */
      picked?: string;
      last?: RecallAnswer;
    }
  | { type: 'done'; level: number; score: DrillScore; before: DrillScore | null; reviewed: number };

export function QuickRecall() {
  const navigate = useNavigate();
  const rng = useMemo(() => createAppRng(), []);
  const [status, setStatus] = useState<RecallStatus | null>(null);
  const [scores, setScores] = useState<DrillScore[]>([]);
  const [pool, setPool] = useState<RecallPool | null>(null);
  const [phase, setPhase] = useState<Phase>({ type: 'levels' });

  useEffect(() => {
    let alive = true;
    void Promise.all([recallStatus(), loadScores('quick_recall')]).then(([st, sc]) => {
      if (!alive) return;
      setStatus(st);
      setScores(sc);
    });
    return () => {
      alive = false;
    };
  }, []);

  const ask = useCallback(
    (p: RecallPool, recent: string[]) =>
      buildQuestion(pickFresh(p.prompts, recent, rng), p.meanings, rng),
    [rng],
  );

  const start = useCallback(
    async (level: number) => {
      const p = await loadRecallPool();
      if (p.prompts.length === 0) return;
      setPool(p);
      setPhase({
        type: 'question',
        level,
        timer: startTimer(Date.now()),
        question: ask(p, []),
        round: 0,
        target: createTarget(),
        answers: [],
        recent: [],
        reviewed: 0,
      });
    },
    [ask],
  );

  const pick = useCallback(
    (option: string, ms: number) => {
      if (phase.type !== 'question' || phase.picked !== undefined) return;
      const out = answer(phase.target, option === phase.question.prompt.en, ms);
      setPhase({
        ...phase,
        picked: option,
        last: out.answer,
        target: out.state,
        answers: [...phase.answers, out.answer],
      });
      // Right inside the target counts as a review for a word due today; a miss does nothing.
      if (out.answer.on_time) {
        const id = phase.question.prompt.id;
        void countRecallAsReview(id, Date.now()).then((counted) => {
          if (counted)
            setPhase((p) => (p.type === 'question' ? { ...p, reviewed: p.reviewed + 1 } : p));
        });
      }
    },
    [phase],
  );

  const next = useCallback(async () => {
    if (phase.type !== 'question' || !pool) return;
    const now = Date.now();
    if (timeUp(phase.timer, now)) {
      const { on_time, ...totals } = summarizeRecall(phase.answers);
      const score: DrillScore = {
        id: crypto.randomUUID(),
        drill: 'quick_recall',
        level: phase.level,
        played_at: new Date(now).toISOString(),
        ...totals,
        on_time,
        best_countdown_ms: null,
      };
      const before = await saveScore(score);
      setScores((s) => [...s, score]);
      setPhase({ type: 'done', level: phase.level, score, before, reviewed: phase.reviewed });
      return;
    }
    const recent = [...phase.recent, phase.question.prompt.id].slice(-10);
    setPhase({
      type: 'question',
      level: phase.level,
      timer: phase.timer,
      question: ask(pool, recent),
      round: phase.round + 1,
      target: phase.target,
      answers: phase.answers,
      recent,
      reviewed: phase.reviewed,
    });
  }, [phase, pool, ask]);

  return (
    <main className="screen screen-learn screen-drill">
      <AppBar title="Quick Recall" onBack={() => navigate('/')} backLabel="Back to Home" />
      {!status ? null : !recallOpen(status) ? (
        <RecallLocked status={status} />
      ) : phase.type === 'levels' ? (
        <LevelList scores={scores} onPick={(level) => void start(level)} />
      ) : phase.type === 'done' ? (
        <Results
          phase={phase}
          onAgain={() => void start(phase.level)}
          onLevels={() => setPhase({ type: 'levels' })}
        />
      ) : (
        <Question key={phase.round} phase={phase} onPick={pick} onNext={() => void next()} />
      )}
    </main>
  );
}

function RecallLocked({ status }: { status: RecallStatus }) {
  const navigate = useNavigate();
  return (
    <section className="learn-done">
      <h2 className="h2-bold">Not open yet</h2>
      <p className="body">
        Quick Recall opens once {OPEN_AT_IN_REVIEW} words and phrases are in Review and{' '}
        {MIN_PROMPTS} have reached stage {MIN_STAGE}, so it only asks what you know well.
      </p>
      <p className="body-small">
        {status.inReview} in Review · {status.wellKnown} at stage {MIN_STAGE} or above
      </p>
      <button type="button" className="btn btn-primary" onClick={() => navigate('/review')}>
        Go to Review
      </button>
    </section>
  );
}

function LevelList({ scores, onPick }: { scores: DrillScore[]; onPick: (level: number) => void }) {
  return (
    <section className="drill-start panel">
      <h2 className="h2-bold">Pick the meaning, fast</h2>
      <p className="body">
        Words you know well, with 4 meanings to choose from. Answer inside the target time and it
        gets shorter. About 2 minutes per session. A word due for review today that you get right in
        time counts as reviewed; a miss here doesn’t count against it.
      </p>
      <ol className="drill-levels">
        {RECALL_LEVELS.map((l) => {
          const best = personalBest(scores, 'quick_recall', l.level);
          return (
            <li key={l.level}>
              <button type="button" className="drill-level" onClick={() => onPick(l.level)}>
                <span className="drill-level-name">{l.title}</span>
                <span className="body-small drill-level-meta">
                  {best ? `Best: ${perMinute(best)} a minute` : 'Open'}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

type QuestionPhase = Extract<Phase, { type: 'question' }>;

function Question({
  phase,
  onPick,
  onNext,
}: {
  phase: QuestionPhase;
  onPick: (option: string, ms: number) => void;
  onNext: () => void;
}) {
  const { question, picked, last } = phase;
  const { prompt } = question;
  const listening = phase.level === 2 && prompt.audio_path !== null;
  const now = useNow(true, 250);
  // Reaction time runs from the word appearing, or from the end of its audio.
  const shownAt = useRef<number | null>(listening ? null : Date.now());

  const play = useCallback(() => {
    if (!prompt.audio_path) return () => undefined;
    return playThen(prompt.audio_path, () => {
      shownAt.current ??= Date.now();
    });
  }, [prompt.audio_path]);

  useEffect(() => (listening ? play() : undefined), [listening, play]);

  useEffect(() => {
    if (!last) return;
    const t = setTimeout(onNext, last.correct ? RIGHT_PAUSE_MS : WRONG_PAUSE_MS);
    return () => clearTimeout(t);
  }, [last, onNext]);

  // Time running out mid-question ends the session; the unanswered question doesn't count.
  const over = timeUp(phase.timer, now);
  useEffect(() => {
    if (over && !last) onNext();
  }, [over, last, onNext]);

  const title = `${RECALL_LEVELS[phase.level - 1]!.title} · target ${secondsText(phase.target.target_ms)}`;

  return (
    <>
      <DrillHeader title={title} timer={phase.timer} now={now} />
      <section className="panel drill-card" aria-label="The word">
        {listening ? (
          <p className="drill-listen">
            <span className="meta-label">What does it mean?</span>
            <button
              type="button"
              className="kn-reset-btn verb-speak"
              onClick={() => play()}
              aria-label="Play the word again"
            >
              <Icon name="speaker" size={24} />
            </button>
          </p>
        ) : (
          <>
            <p className="meta-label">What does it mean?</p>
            <p className="drill-words recall-word">{prompt.text}</p>
          </>
        )}
        {listening && picked !== undefined ? (
          <p className="body recall-heard">{prompt.text}</p>
        ) : null}
      </section>
      <div className="recall-options" role="group" aria-label="Meanings">
        {question.options.map((o) => {
          const right = picked !== undefined && o === prompt.en;
          const wrong = picked === o && o !== prompt.en;
          return (
            <button
              key={o}
              type="button"
              className={cx(
                'kn-reset-btn recall-option',
                right && 'recall-option-right',
                wrong && 'recall-option-wrong',
              )}
              disabled={picked !== undefined}
              onClick={() => {
                const tapped = Date.now();
                onPick(o, Math.max(0, tapped - (shownAt.current ?? tapped)));
              }}
            >
              {right ? (
                <span aria-hidden="true">✓ </span>
              ) : wrong ? (
                <span aria-hidden="true">✗ </span>
              ) : null}
              {o}
            </button>
          );
        })}
      </div>
      <p className="body-small recall-status" role="status">
        {!last
          ? ' '
          : !last.correct
            ? `It means “${prompt.en}”.`
            : last.on_time
              ? `Right, ${secondsText(last.ms)}.`
              : `Right, but slower than the target (${secondsText(last.ms)}).`}
      </p>
    </>
  );
}

function Results({
  phase,
  onAgain,
  onLevels,
}: {
  phase: Extract<Phase, { type: 'done' }>;
  onAgain: () => void;
  onLevels: () => void;
}) {
  const { score, before } = phase;
  return (
    <section className="learn-done drill-results" role="status">
      <h2 className="h2-bold">Time’s up</h2>
      <p className="body">
        {perMinute(score)} right a minute inside the target ({score.on_time ?? 0} in all)
      </p>
      <p className="body">
        {score.correct} of {score.answers} right ({Math.round(accuracy(score) * 100)}%)
      </p>
      {phase.reviewed > 0 ? (
        <p className="body">
          {phase.reviewed} {phase.reviewed === 1 ? 'review' : 'reviews'} due today done along the
          way
        </p>
      ) : null}
      {score.median_ms !== null ? (
        <p className="body">Median time: {secondsText(score.median_ms)}</p>
      ) : null}
      {beats(score, before) ? (
        <p className="drill-record">New personal best!</p>
      ) : before ? (
        <p className="body-small">Your best: {perMinute(before)} a minute</p>
      ) : (
        <p className="body-small">A personal best needs at least 10 answers and 80% right.</p>
      )}
      <button type="button" className="btn btn-primary" onClick={onAgain}>
        Play again
      </button>
      <button type="button" className="btn btn-missed" onClick={onLevels}>
        Read or hear
      </button>
    </section>
  );
}
