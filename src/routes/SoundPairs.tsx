// Sound Pairs (decision 210): words one letter apart, told apart by reading and by ear. Ten
// questions a session; after each, both words with their meanings and recordings, to compare.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { cx } from '../components/cx';
import { Icon } from '../components/Icon';
import { SessionHeader } from '../components/SessionHeader';
import { loadSoundPairs } from '../data/soundPairs';
import { createAppRng } from '../engine/random';
import {
  answerPair,
  buildSession,
  MIN_PAIRS,
  usablePairs,
  type PairAnswer,
  type PairQuestion,
  type PairWord,
  type SoundPair,
} from '../engine/soundPairs';
import { playAudio } from './cardText';
import { DrillStart } from './DrillParts';

type Phase =
  | { type: 'start' }
  | { type: 'question'; questions: PairQuestion[]; answers: PairAnswer[] }
  | { type: 'done'; answers: PairAnswer[] };

export function SoundPairs() {
  const navigate = useNavigate();
  const rng = useMemo(() => createAppRng(), []);
  const [pairs, setPairs] = useState<SoundPair[] | null>(null);
  const [phase, setPhase] = useState<Phase>({ type: 'start' });

  useEffect(() => {
    let alive = true;
    void loadSoundPairs().then((p) => alive && setPairs(usablePairs(p)));
    return () => {
      alive = false;
    };
  }, []);

  const start = () => {
    if (pairs) setPhase({ type: 'question', questions: buildSession(pairs, rng), answers: [] });
  };

  return (
    <main className="screen screen-learn screen-drill">
      <AppBar title="Sound Pairs" onBack={() => navigate('/')} backLabel="Back to Home" />
      {pairs === null ? null : pairs.length < MIN_PAIRS ? (
        <section className="learn-done">
          <h2 className="h2-bold">Not open yet</h2>
          <p className="body">
            Sound Pairs asks about words you’ve learned that look and sound almost the same as
            another word, like umwana (child) and umwaka (year). It opens once {MIN_PAIRS} such
            pairs are among your words; {pairs.length} so far.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/learn/words')}
          >
            Go to Learn
          </button>
        </section>
      ) : phase.type === 'start' ? (
        <DrillStart title="Tell them apart" onStart={start}>
          <p className="body">
            Words one letter apart, like umwana (child) and umwaka (year). Read a meaning and pick
            the word, or hear a word and pick the one that was said. Ten questions.
          </p>
          <p className="body-small">{pairs.length} pairs among your words.</p>
        </DrillStart>
      ) : phase.type === 'question' ? (
        <Question
          key={phase.answers.length}
          number={phase.answers.length + 1}
          total={phase.questions.length}
          question={phase.questions[phase.answers.length]!}
          onDone={(a) => {
            const answers = [...phase.answers, a];
            setPhase(
              answers.length === phase.questions.length
                ? { type: 'done', answers }
                : { ...phase, answers },
            );
          }}
        />
      ) : (
        <Results answers={phase.answers} onAgain={start} onHome={() => navigate('/')} />
      )}
    </main>
  );
}

function Question({
  number,
  total,
  question,
  onDone,
}: {
  number: number;
  total: number;
  question: PairQuestion;
  onDone: (a: PairAnswer) => void;
}) {
  const [answer, setAnswer] = useState<PairAnswer | null>(null);
  const { target, mode } = question;
  const ear = mode === 'ear' && target.audioPath !== null;

  useEffect(() => {
    if (ear) playAudio(target.audioPath!);
  }, [ear, target.audioPath]);

  return (
    <>
      <SessionHeader
        level={`${number} of ${total}`}
        meta={ear ? 'By ear' : 'Reading'}
        progress={(number - 1) / total}
        progressLabel="Questions"
      />
      <section className="panel drill-card" aria-label="The question">
        {ear ? (
          <p className="drill-listen">
            <span className="meta-label">Which word did you hear?</span>
            <button
              type="button"
              className="kn-reset-btn verb-speak"
              onClick={() => playAudio(target.audioPath!)}
              aria-label="Play the word again"
            >
              <Icon name="speaker" size={24} />
            </button>
          </p>
        ) : (
          <>
            <p className="meta-label">Which word means</p>
            <p className="drill-words recall-word">{target.en}</p>
          </>
        )}
      </section>
      <div className="recall-options" role="group" aria-label="Words">
        {question.options.map((o) => {
          const right = answer !== null && o.itemId === target.itemId;
          const wrong = answer?.picked.itemId === o.itemId && !answer.right;
          return (
            <button
              key={o.itemId}
              type="button"
              lang="rw"
              className={cx(
                'kn-reset-btn recall-option',
                right && 'recall-option-right',
                wrong && 'recall-option-wrong',
              )}
              disabled={answer !== null}
              onClick={() => setAnswer(answerPair(question, o))}
            >
              {right ? (
                <span aria-hidden="true">✓ </span>
              ) : wrong ? (
                <span aria-hidden="true">✗ </span>
              ) : null}
              {o.text}
            </button>
          );
        })}
      </div>
      <p className="body-small recall-status" role="status">
        {answer === null ? ' ' : answer.right ? 'Right.' : `It was ${target.text}.`}
      </p>
      {answer ? (
        <>
          <PairCompare pair={question.pair} />
          <button type="button" className="btn btn-primary" onClick={() => onDone(answer)}>
            {number === total ? 'See how it went' : 'Next'}
          </button>
        </>
      ) : null}
    </>
  );
}

/** Both words of a pair with their meanings, and their recordings to hear side by side. */
function PairCompare({ pair }: { pair: SoundPair }) {
  const line = (w: PairWord) => (
    <li key={w.itemId} className="pair-line">
      {w.audioPath ? (
        <button
          type="button"
          className="kn-reset-btn verb-speak"
          onClick={() => playAudio(w.audioPath!)}
          aria-label={`Play ${w.text}`}
        >
          <Icon name="speaker" size={20} />
        </button>
      ) : null}
      <span>
        <span lang="rw" className="body-bold">
          {w.text}
        </span>
        : {w.en}
      </span>
    </li>
  );
  return <ul className="pair-compare body">{[line(pair.a), line(pair.b)]}</ul>;
}

function Results({
  answers,
  onAgain,
  onHome,
}: {
  answers: PairAnswer[];
  onAgain: () => void;
  onHome: () => void;
}) {
  const right = answers.filter((a) => a.right).length;
  const missed = answers.filter((a) => !a.right);
  return (
    <section className="learn-done drill-results" role="status">
      <h2 className="h2-bold">Done</h2>
      <p className="body">
        {right} of {answers.length} right.
      </p>
      {missed.length > 0 ? (
        <>
          <p className="body">Pairs to look at again:</p>
          {missed.map((a) => (
            <PairCompare key={a.question.target.itemId} pair={a.question.pair} />
          ))}
        </>
      ) : null}
      <button type="button" className="btn btn-primary" onClick={onAgain}>
        Play again
      </button>
      <button type="button" className="btn btn-missed" onClick={onHome}>
        Done for now
      </button>
    </section>
  );
}
