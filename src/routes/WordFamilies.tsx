// Word Families (decision 213): which word shares a learned word's stem and meaning, among
// look-alikes. Ten questions a session; after each, the whole family with its meanings.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { cx } from '../components/cx';
import { SessionHeader } from '../components/SessionHeader';
import { loadFamilies } from '../data/families';
import {
  buildFamilySession,
  MIN_FAMILIES,
  usableFamilies,
  type FamilyQuestion,
  type FamilyWord,
  type WordFamily,
} from '../engine/families';
import { createAppRng } from '../engine/random';
import { DrillStart } from './DrillParts';

interface Answer {
  question: FamilyQuestion;
  picked: FamilyWord;
  right: boolean;
}

type Phase =
  | { type: 'start' }
  | { type: 'question'; questions: FamilyQuestion[]; answers: Answer[] }
  | { type: 'done'; answers: Answer[] };

export function WordFamilies() {
  const navigate = useNavigate();
  const rng = useMemo(() => createAppRng(), []);
  const [data, setData] = useState<{ families: WordFamily[]; words: FamilyWord[] } | null>(null);
  const [phase, setPhase] = useState<Phase>({ type: 'start' });

  useEffect(() => {
    let alive = true;
    void loadFamilies().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);

  const usable = data ? usableFamilies(data.families) : [];
  const start = () => {
    if (data)
      setPhase({
        type: 'question',
        questions: buildFamilySession(data.families, data.words, rng),
        answers: [],
      });
  };

  return (
    <main className="screen screen-learn screen-drill">
      <AppBar title="Word Families" onBack={() => navigate('/')} backLabel="Back to Home" />
      {data === null ? null : usable.length < MIN_FAMILIES ? (
        <section className="learn-done">
          <h2 className="h2-bold">Not open yet</h2>
          <p className="body">
            Word Families asks which words grow from the same stem as one you’ve learned, like
            gukina (to play), umukino (game) and umukinnyi (player). It opens once {MIN_FAMILIES}{' '}
            families have a word you’ve learned; {usable.length} so far.
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
        <DrillStart title="Find the family" onStart={start}>
          <p className="body">
            Many words grow from one stem: gukina (to play), umukino (game), umukinnyi (player).
            Pick the word from the same family as one you know. The others only look alike.
          </p>
          <p className="body-small">{usable.length} families with words you’ve learned.</p>
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
  question: q,
  onDone,
}: {
  number: number;
  total: number;
  question: FamilyQuestion;
  onDone: (a: Answer) => void;
}) {
  const [answer, setAnswer] = useState<Answer | null>(null);
  return (
    <>
      <SessionHeader
        level={`${number} of ${total}`}
        meta="Families"
        progress={(number - 1) / total}
        progressLabel="Questions"
      />
      <section className="panel drill-card" aria-label="The question">
        <p className="meta-label">Which word is in the same family as</p>
        <p className="drill-words recall-word" lang="rw">
          {q.target.base}
        </p>
        <p className="body-small">{q.target.en}</p>
      </section>
      <div className="recall-options" role="group" aria-label="Words">
        {q.options.map((o) => {
          const right = answer !== null && o === q.answer;
          const wrong = answer?.picked === o && !answer.right;
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
              onClick={() => setAnswer({ question: q, picked: o, right: o === q.answer })}
            >
              {right ? (
                <span aria-hidden="true">✓ </span>
              ) : wrong ? (
                <span aria-hidden="true">✗ </span>
              ) : null}
              {o.base}
            </button>
          );
        })}
      </div>
      <p className="body-small recall-status" role="status">
        {answer === null
          ? ' '
          : answer.right
            ? 'Right.'
            : `${answer.picked.base} means “${answer.picked.en}”: it only looks alike.`}
      </p>
      {answer ? (
        <>
          <FamilyList family={q.family} />
          <button type="button" className="btn btn-primary" onClick={() => onDone(answer)}>
            {number === total ? 'See how it went' : 'Next'}
          </button>
        </>
      ) : null}
    </>
  );
}

/** A family's words with their meanings, and what to notice about them. */
function FamilyList({ family }: { family: WordFamily }) {
  return (
    <div className="stem-panel body-small">
      <ul>
        {family.words.map((w) => (
          <li key={w.itemId}>
            <span lang="rw" className="body-small-bold">
              {w.base}
            </span>
            : {w.en}
          </li>
        ))}
      </ul>
      {family.note ? <p>{family.note}</p> : null}
    </div>
  );
}

function Results({
  answers,
  onAgain,
  onHome,
}: {
  answers: Answer[];
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
          <p className="body">Families to look at again:</p>
          {missed.map((a) => (
            <FamilyList key={a.question.target.itemId} family={a.question.family} />
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
