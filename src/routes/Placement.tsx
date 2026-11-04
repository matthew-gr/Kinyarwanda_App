// The placement check (decision 177): about five minutes of "what does this mean?" questions,
// then the words already known go straight to Review and Learn starts after them.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { applyPlacement, loadPlacementPool, type PlacementSummary } from '../data/placement';
import {
  answerPlacement,
  DONT_KNOW,
  placementResult,
  startPlacement,
  type PlacementPool,
  type PlacementState,
} from '../engine/placement';
import { createAppRng } from '../engine/random';
import { playAudio } from './cardText';

/** What a learner at the placement point can follow, in a sentence. */
function canDo(point: number): string {
  if (point <= 100) return 'enough for greetings and the first words about people and family';
  if (point <= 200) return 'enough for everyday basics: family, food, the house and time';
  if (point <= 500) return 'enough to follow simple talk about family, food and the house';
  if (point <= 800) return 'enough for everyday talk about work, shopping and health';
  if (point <= 1000) return 'enough to follow simple stories and everyday talk on most topics';
  return 'enough for most everyday conversation, and a start on church, the radio and the news';
}

export function Placement() {
  const navigate = useNavigate();
  const rng = useMemo(() => createAppRng(), []);
  const [pool, setPool] = useState<PlacementPool | null>(null);
  const [state, setState] = useState<PlacementState | null>(null);
  const [asked, setAsked] = useState(0);
  const [saving, setSaving] = useState(false);
  const [applied, setApplied] = useState<PlacementSummary | null>(null);

  useEffect(() => {
    let alive = true;
    void loadPlacementPool().then((p) => alive && setPool(p));
    return () => {
      alive = false;
    };
  }, []);

  const q = state?.current ?? null;
  // A word's audio plays with it, when it has any.
  useEffect(() => {
    if (q?.audio) playAudio(q.audio);
  }, [q]);

  const answer = (choice: string) => {
    if (!state || !pool) return;
    setState(answerPlacement(state, choice, pool, rng));
    setAsked((n) => n + 1);
  };

  const result =
    state && pool && state.stage === 'done' ? placementResult(state, pool.words) : null;

  const apply = async () => {
    if (!result) return;
    setSaving(true);
    try {
      setApplied(await applyPlacement(result, Date.now()));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="screen screen-placement">
      <AppBar title="Placement check" onBack={() => navigate(-1)} backLabel="Back" />
      {!state ? (
        <section className="panel stack" aria-labelledby="placement-title">
          <h2 id="placement-title" className="h2-bold">
            Already know some Kinyarwanda?
          </h2>
          <p className="body">
            About five minutes of questions: pick what each word means, or &ldquo;
            {DONT_KNOW}&rdquo; when you&rsquo;re not sure, so you never have to guess. A few made-up
            words are mixed in. At the end, the words you know go straight to Review, and Learn
            starts with the ones you don&rsquo;t.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!pool}
            onClick={() => pool && setState(startPlacement(pool, rng))}
          >
            Start
          </button>
        </section>
      ) : q ? (
        <section className="panel stack placement-question" aria-live="polite">
          <p className="meta-label">
            Question {asked + 1}
            {q.kind === 'verb' ? ' · Verb forms' : ''}
          </p>
          <p className="flash-word placement-word" lang="rw">
            {q.prompt}
          </p>
          {q.audio ? (
            <button type="button" className="btn btn-missed" onClick={() => playAudio(q.audio!)}>
              Play it again
            </button>
          ) : null}
          <p className="body">What does it mean?</p>
          <div className="placement-choices" role="group" aria-label="Meanings">
            {q.choices.map((c) => (
              <button
                key={c}
                type="button"
                className={c === DONT_KNOW ? 'btn btn-missed' : 'btn btn-primary'}
                onClick={() => answer(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </section>
      ) : result && !applied ? (
        <section className="panel stack" aria-labelledby="placement-done">
          <h2 id="placement-done" className="h2-bold">
            {result.point > 0
              ? `You know about the first ${result.point} words`
              : 'Start from the beginning'}
          </h2>
          <p className="body">
            {result.point > 0
              ? `That's ${canDo(result.point)}. They go into Review, coming due a few a day over the next 30 days, and Learn starts after them.`
              : 'Learn starts with the first words, in a few minutes a day.'}
          </p>
          <p className="body">
            Verb Builder: you can start at level {result.verbLevel}.
            {result.guesses > 0
              ? ` (${result.guesses} made-up ${result.guesses === 1 ? 'word was' : 'words were'} given a meaning, so the estimate is a little lower.)`
              : ''}
          </p>
          <div className="admin-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={() => void apply()}
            >
              {result.point > 0 ? 'Put them in Review' : 'Save'}
            </button>
            <button type="button" className="btn btn-missed" onClick={() => navigate('/')}>
              Not now
            </button>
          </div>
        </section>
      ) : applied ? (
        <section className="panel stack" aria-labelledby="placement-saved">
          <h2 id="placement-saved" className="h2-bold">
            Done
          </h2>
          <p className="body" role="status">
            {applied.added > 0
              ? `${applied.added} words added to Review. Verb Builder starts at level ${applied.verbLevel}.`
              : `Nothing new to add. Verb Builder is at level ${applied.verbLevel}.`}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </section>
      ) : null}
    </main>
  );
}
