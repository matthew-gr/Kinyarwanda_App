// Noun Classes (decision 212): which class a learned noun is in, and its plural or singular.
// Ten questions a session; after each, the word with its prefix in its class's colour and what
// the class mostly holds.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { cx } from '../components/cx';
import { SessionHeader } from '../components/SessionHeader';
import { loadClassNouns } from '../data/nounClasses';
import { CLASS_MEANINGS, type WordShape } from '../engine/morphology';
import {
  askable,
  buildClassSession,
  MIN_NOUNS,
  prefixLabel,
  type ClassNoun,
  type ClassQuestion,
} from '../engine/nounClasses';
import { createAppRng } from '../engine/random';
import { DrillStart } from './DrillParts';
import { WordParts } from './WordParts';

interface Answer {
  question: ClassQuestion;
  picked: string;
  right: boolean;
}

type Phase =
  | { type: 'start' }
  | { type: 'question'; questions: ClassQuestion[]; answers: Answer[] }
  | { type: 'done'; answers: Answer[] };

export function NounClasses() {
  const navigate = useNavigate();
  const rng = useMemo(() => createAppRng(), []);
  const [nouns, setNouns] = useState<ClassNoun[] | null>(null);
  const [phase, setPhase] = useState<Phase>({ type: 'start' });

  useEffect(() => {
    let alive = true;
    void loadClassNouns().then((n) => alive && setNouns(askable(n, rng)));
    return () => {
      alive = false;
    };
  }, [rng]);

  const start = () => {
    if (nouns)
      setPhase({ type: 'question', questions: buildClassSession(nouns, rng), answers: [] });
  };

  return (
    <main className="screen screen-learn screen-drill">
      <AppBar title="Noun Classes" onBack={() => navigate('/')} backLabel="Back to Home" />
      {nouns === null ? null : nouns.length < MIN_NOUNS ? (
        <section className="learn-done">
          <h2 className="h2-bold">Not open yet</h2>
          <p className="body">
            Noun Classes asks about nouns you’ve learned: which class each is in, and how it changes
            from singular to plural. It opens once you’ve learned {MIN_NOUNS} nouns; {nouns.length}{' '}
            so far.
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
        <DrillStart title="Classes and plurals" onStart={start}>
          <p className="body">
            Every noun is in a class, shown by its prefix: igi-tabo is class 7, and its plural
            ibi-tabo class 8. Pick a noun’s class, or make its plural or singular. Ten questions.
          </p>
          <p className="body-small">{nouns.length} of your nouns to ask about.</p>
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

const classLabel = (cls: string) => `Class ${cls} · ${prefixLabel(cls)}`;

function Question({
  number,
  total,
  question: q,
  onDone,
}: {
  number: number;
  total: number;
  question: ClassQuestion;
  onDone: (a: Answer) => void;
}) {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const prompt =
    q.kind === 'class'
      ? 'Which class is it in?'
      : q.kind === 'plural'
        ? 'What is its plural?'
        : 'What is its singular?';
  const word = q.kind === 'class' ? q.noun.base : q.shown;
  // The word shown, and once answered, the word asked for, in their pieces.
  const shown: WordShape = q.kind === 'class' ? q.shape : q.shownShape;
  return (
    <>
      <SessionHeader
        level={`${number} of ${total}`}
        meta={q.kind === 'class' ? 'Class' : q.kind === 'plural' ? 'Plural' : 'Singular'}
        progress={(number - 1) / total}
        progressLabel="Questions"
      />
      <section className="panel drill-card" aria-label="The question">
        <p className="meta-label">{prompt}</p>
        <p className="drill-words recall-word" lang="rw">
          {answer ? <WordParts shape={shown} /> : word}
        </p>
        <p className="body-small">{q.noun.en}</p>
      </section>
      <div className="recall-options class-options" role="group" aria-label="Choices">
        {q.options.map((o) => {
          const right = answer !== null && o === q.answer;
          const wrong = answer?.picked === o && !answer.right;
          return (
            <button
              key={o}
              type="button"
              lang={q.kind === 'class' ? undefined : 'rw'}
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
              {q.kind === 'class' ? classLabel(o) : o}
            </button>
          );
        })}
      </div>
      <p className="body-small recall-status" role="status">
        {answer === null
          ? ' '
          : answer.right
            ? 'Right.'
            : `It’s ${q.kind === 'class' ? `class ${q.answer}` : q.answer}.`}
      </p>
      {answer ? (
        <>
          <Explain question={q} />
          <button type="button" className="btn btn-primary" onClick={() => onDone(answer)}>
            {number === total ? 'See how it went' : 'Next'}
          </button>
        </>
      ) : null}
    </>
  );
}

/** The answer in its pieces, and what its class mostly holds. */
function Explain({ question: q }: { question: ClassQuestion }) {
  const shape = q.kind === 'class' ? q.shape : q.answerShape;
  const cls = shape.nounClass!;
  return (
    <div className="stem-panel body-small">
      <p className="body" lang="rw">
        <WordParts shape={shape} />
      </p>
      <p>
        Class {cls}: {CLASS_MEANINGS[cls]}.
      </p>
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
          <p className="body">To look at again:</p>
          <ul className="pair-compare body">
            {missed.map((a) => (
              <li key={a.question.noun.itemId}>
                <span lang="rw" className="body-bold">
                  {a.question.noun.base}
                </span>
                {a.question.noun.plural && a.question.noun.plural !== a.question.noun.base
                  ? ` / ${a.question.noun.plural}`
                  : ''}
                : class {a.question.noun.nounClass}, {a.question.noun.en}
              </li>
            ))}
          </ul>
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
