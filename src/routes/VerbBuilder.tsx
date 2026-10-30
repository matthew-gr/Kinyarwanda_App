import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { cx } from '../components/cx';
import { Icon } from '../components/Icon';
import { SessionHeader } from '../components/SessionHeader';
import { VerbSession, type VerbAnswer, type VerbView } from '../data/verbSession';
import { LEVEL_INFO, LEVELS_BUILT, workedExamples } from '../engine/verbLevels';
import {
  formPieces,
  slotValue,
  type Slot,
  type Tile,
  type Verb,
  type VerbForm,
  type VerbRound,
} from '../engine/verbs';
import { playAudio } from './cardText';
import { pictureFor } from './verbPictures';

const SLOT_NAMES: Record<Slot, string> = {
  who: 'Who',
  when: 'When',
  whom: 'To whom',
  action: 'Action',
  ending: 'Ending',
};

type Choices = Partial<Record<Slot, string>>;

export function VerbBuilder() {
  const navigate = useNavigate();
  const [session, setSession] = useState<VerbSession | null>(null);
  const [view, setView] = useState<VerbView | null>(null);
  const [choices, setChoices] = useState<Choices>({});
  const [feedback, setFeedback] = useState<(VerbAnswer & { choices: Choices }) | null>(null);

  useEffect(() => {
    let alive = true;
    void VerbSession.open().then((s) => {
      if (!alive) return;
      setSession(s);
      setView(s.view());
    });
    return () => {
      alive = false;
    };
  }, []);

  const roundId = view?.type === 'round' ? view.round.id : null;
  useEffect(() => setChoices({}), [roundId]);

  const startPractice = useCallback(async () => {
    if (!session) return;
    await session.startPractice();
    setView(session.view());
  }, [session]);

  const check = useCallback(async () => {
    if (!session || view?.type !== 'round') return;
    const out = await session.answer(view.round.id, choices);
    if (!out) return;
    setFeedback({ ...out, choices });
    const audio = session.audioFor(out.result.word);
    if (audio) playAudio(audio);
  }, [session, view, choices]);

  const next = useCallback(async () => {
    if (!session) return;
    await session.next();
    setFeedback(null);
    setView(session.view());
  }, [session]);

  return (
    <main className="screen screen-learn screen-verbs">
      <AppBar title="Verb Builder" onBack={() => navigate('/')} backLabel="Back to Home" />
      {!session || !view ? null : view.type === 'intro' ? (
        <LevelIntro
          key={view.level}
          level={view.level}
          verbs={session.verbs}
          forms={session.forms}
          audioFor={(w) => session.audioFor(w)}
          onStart={() => void startPractice()}
        />
      ) : view.type === 'empty' ? (
        <section className="learn-done">
          <h2 className="h2-bold">No verbs yet</h2>
          <p className="body">The verb table is empty. Check back after the next update.</p>
        </section>
      ) : feedback ? (
        <Feedback
          view={view}
          feedback={feedback}
          verbs={session.verbs}
          audio={session.audioFor(feedback.result.word)}
          onNext={() => void next()}
        />
      ) : (
        <Round
          view={view}
          verbs={session.verbs}
          choices={choices}
          audio={session.audioFor(view.form.word)}
          onChoose={(slot, value) => setChoices((c) => ({ ...c, [slot]: value }))}
          onClear={(slot) =>
            setChoices((c) => {
              const rest = { ...c };
              delete rest[slot];
              return rest;
            })
          }
          onCheck={() => void check()}
        />
      )}
    </main>
  );
}

type RoundView = Extract<VerbView, { type: 'round' }>;

function RoundHeader({ view }: { view: RoundView }) {
  return (
    <SessionHeader
      level={`Level ${view.level}: ${LEVEL_INFO[view.level]?.name ?? ''}`}
      meta={view.guided ? 'Guided practice' : `${view.mastered} of ${view.total} mastered`}
      progress={view.total ? view.mastered / view.total : 0}
      progressLabel="Level progress"
    />
  );
}

/** One word's pieces in a row: ba + ra + rir + a. */
function PieceRow({ pieces }: { pieces: { piece: string; label: string; muted?: boolean }[] }) {
  return (
    <span className="verb-pieces">
      {pieces.map((p, i) => (
        <span key={i} className="verb-pieces-item">
          {i > 0 ? (
            <span className="verb-plus" aria-hidden="true">
              +
            </span>
          ) : null}
          <span className={cx('verb-piece', p.muted && 'verb-piece-fixed')} title={p.label}>
            {p.piece || '–'}
          </span>
        </span>
      ))}
    </span>
  );
}

function SpeakButton({ audio, label }: { audio: string | null; label: string }) {
  if (!audio) return null;
  return (
    <button
      type="button"
      className="kn-reset-btn verb-speak"
      onClick={() => playAudio(audio)}
      aria-label={label}
    >
      <Icon name="speaker" size={24} />
    </button>
  );
}

interface LevelIntroProps {
  level: number;
  verbs: Verb[];
  forms: VerbForm[];
  audioFor: (word: string) => string | null;
  onStart: () => void;
}

/** A level's opening screen: what's new, then worked examples built one piece at a time. */
function LevelIntro({ level, verbs, forms, audioFor, onStart }: LevelIntroProps) {
  const info = LEVEL_INFO[level];
  const examples = workedExamples(level, verbs, forms);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(1);
  const startRef = useRef<HTMLButtonElement>(null);

  const example = examples[index];
  const verb = example ? verbs.find((v) => v.id === example.verb_id) : undefined;
  const pieces = example && verb ? formPieces(example, verb) : [];
  const built = shown >= pieces.length;
  const last = index >= examples.length - 1;

  useEffect(() => {
    if (built && example) {
      const audio = audioFor(example.word);
      if (audio) playAudio(audio);
    }
  }, [built, example, audioFor]);

  useEffect(() => {
    if (built && last) startRef.current?.focus();
  }, [built, last]);

  return (
    <section className="verb-intro" aria-labelledby="verb-intro-title">
      <p className="verb-level-tag meta-label">
        Level {level} of {LEVELS_BUILT}
      </p>
      <h2 id="verb-intro-title" className="h2-bold">
        {info?.title ?? `Level ${level}`}
      </h2>
      <p className="body">{info?.body}</p>

      {example && verb ? (
        <div className="verb-example panel">
          <p className="meta-label">
            Example {index + 1} of {examples.length}: {example.en}
          </p>
          <ol className="verb-example-steps">
            {pieces.slice(0, shown).map((p, i) => (
              <li key={i} className="verb-example-step">
                <span className="verb-piece">{p.piece}</span>
                <span className="body-small">{p.label}</span>
              </li>
            ))}
          </ol>
          <div aria-live="polite">
            {built ? (
              <p className="verb-example-word">
                <PieceRow pieces={pieces} /> <span aria-hidden="true">→</span>{' '}
                <strong className="verb-word">{example.word}</strong>
                <SpeakButton audio={audioFor(example.word)} label={`Play ${example.word}`} />
              </p>
            ) : null}
            {built && pieces.map((p) => p.piece).join('') !== example.word ? (
              <p className="body-small verb-sound-note">
                The pieces change sound when they join, so the word is learned as a whole.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="learn-actions">
        {!built ? (
          <button type="button" className="btn btn-primary" onClick={() => setShown((n) => n + 1)}>
            Add the next piece
          </button>
        ) : !last ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setIndex((i) => i + 1);
              setShown(1);
            }}
          >
            Next example
          </button>
        ) : (
          <button ref={startRef} type="button" className="btn btn-primary" onClick={onStart}>
            Start practice
          </button>
        )}
      </div>
    </section>
  );
}

interface RoundProps {
  view: RoundView;
  verbs: Verb[];
  choices: Choices;
  audio: string | null;
  onChoose: (slot: Slot, value: string) => void;
  onClear: (slot: Slot) => void;
  onCheck: () => void;
}

/** The pieces of the word being built, with the learner's choices filled in. */
function buildStrip(round: VerbRound, form: VerbForm, verb: Verb, choices: Choices) {
  const pieces = formPieces(form, verb);
  // A verb that can take a person still asks whom when this word has no one.
  if (round.slots.includes('whom') && !pieces.some((p) => p.slot === 'whom')) {
    const at = pieces.findIndex((p) => p.slot === 'action');
    pieces.splice(at, 0, { slot: 'whom', piece: '', label: '' });
  }
  return pieces.map((p) => {
    if (!round.slots.includes(p.slot)) {
      return { slot: p.slot, piece: p.piece, label: p.label, fixed: true };
    }
    const value = choices[p.slot];
    const tile = value ? round.tiles[p.slot]?.find((t) => t.value === value) : undefined;
    // "No one" has no piece; a dash shows the choice was made.
    const piece = tile ? tile.piece || '–' : '';
    return { slot: p.slot, piece, label: tile?.label ?? '', fixed: false };
  });
}

function Round({ view, verbs, choices, audio, onChoose, onClear, onCheck }: RoundProps) {
  const { round, form, verb, guided } = view;
  const reverse = round.direction === 'reverse';
  const ready = round.slots.every((s) => choices[s] !== undefined);

  // A reverse round plays the word as it appears.
  useEffect(() => {
    if (reverse && audio) playAudio(audio);
  }, [round.id, reverse, audio]);

  return (
    <>
      <RoundHeader view={view} />

      <section className="verb-target panel" aria-label="The verb to build">
        {reverse ? (
          <>
            <p className="meta-label">What does it mean? Pick the pictures.</p>
            <p className="verb-target-word">
              <strong className="verb-word">{form.word}</strong>
              <SpeakButton audio={audio} label={`Play ${form.word}`} />
            </p>
          </>
        ) : (
          <>
            <p className="meta-label">Build the word for</p>
            <p className="verb-target-pictures" aria-hidden="true">
              {round.slots.map((s) => (
                <span key={s}>{pictureFor(s, slotValue(form, s), verbs)}</span>
              ))}
            </p>
            <p className="verb-target-en">{form.en}</p>
          </>
        )}
      </section>

      {!reverse ? (
        <p className="verb-strip" aria-label="Your word so far">
          {buildStrip(round, form, verb, choices).map((p, i) =>
            p.fixed ? (
              <span key={i} className="verb-piece verb-piece-fixed" title={p.label}>
                {p.piece}
              </span>
            ) : (
              <button
                key={i}
                type="button"
                className={cx('kn-reset-btn verb-piece verb-slot', !p.piece && 'verb-slot-empty')}
                onClick={() => onClear(p.slot)}
                disabled={!p.piece}
                aria-label={
                  p.piece
                    ? `${SLOT_NAMES[p.slot]}: ${p.piece}. Tap to clear`
                    : `${SLOT_NAMES[p.slot]}: empty`
                }
              >
                {p.piece || '?'}
              </button>
            ),
          )}
        </p>
      ) : null}

      {guided ? (
        <p className="body-small verb-guide">Guided practice: the outlined tiles are right.</p>
      ) : null}

      <div className="verb-tiles">
        {round.slots.map((slot) => (
          <fieldset key={slot} className="verb-tile-group">
            <legend className="meta-label">{SLOT_NAMES[slot]}</legend>
            <div className="verb-tile-row">
              {(round.tiles[slot] ?? []).map((tile) => (
                <TileButton
                  key={tile.value}
                  tile={tile}
                  picture={pictureFor(slot, tile.value, verbs)}
                  showPiece={!reverse}
                  selected={choices[slot] === tile.value}
                  hint={guided && slotValue(form, slot) === tile.value}
                  onClick={() => onChoose(slot, tile.value)}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="learn-actions">
        <button type="button" className="btn btn-primary" disabled={!ready} onClick={onCheck}>
          Check
        </button>
      </div>
    </>
  );
}

interface TileButtonProps {
  tile: Tile;
  picture: string;
  showPiece: boolean;
  selected: boolean;
  hint: boolean;
  onClick: () => void;
}

function TileButton({ tile, picture, showPiece, selected, hint, onClick }: TileButtonProps) {
  return (
    <button
      type="button"
      className={cx(
        'kn-reset-btn verb-tile',
        selected && 'verb-tile-selected',
        hint && 'verb-tile-hint',
      )}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="verb-tile-picture" aria-hidden="true">
        {picture}
      </span>
      {showPiece && tile.piece ? <span className="verb-tile-piece">{tile.piece}</span> : null}
      <span className="verb-tile-label">{tile.label}</span>
      {hint ? <span className="sr-only">(hint: this one)</span> : null}
    </button>
  );
}

interface FeedbackProps {
  view: RoundView;
  feedback: VerbAnswer & { choices: Choices };
  verbs: Verb[];
  audio: string | null;
  onNext: () => void;
}

function Feedback({ view, feedback, verbs, audio, onNext }: FeedbackProps) {
  const { round, form } = view;
  const { result, choices, unlocked, finished } = feedback;
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => nextRef.current?.focus(), []);

  const tileText = (slot: Slot, value: string | undefined) => {
    const tile = round.tiles[slot]?.find((t) => t.value === value);
    if (!tile) return 'nothing';
    return tile.piece && round.direction === 'build' ? `${tile.piece} (${tile.label})` : tile.label;
  };

  return (
    <>
      <RoundHeader view={view} />
      <section className="verb-feedback panel" role="status" aria-live="polite">
        <p className={cx('verb-verdict h2-bold', result.correct ? 'verb-right' : 'verb-wrong')}>
          <span aria-hidden="true">{result.correct ? '✓ ' : '✗ '}</span>
          {result.correct ? 'Right' : 'Not quite'}
        </p>
        <p className="verb-target-word">
          <strong className="verb-word">{result.word}</strong>
          <SpeakButton audio={audio} label={`Play ${result.word}`} />
        </p>
        <p className="verb-target-en">{result.en}</p>
        <ul className="verb-slot-results">
          {round.slots.map((slot) => {
            const right = result.slots[slot];
            const answer = slotValue(form, slot);
            return (
              <li key={slot} className={right ? 'verb-right' : 'verb-wrong'}>
                <span aria-hidden="true">{pictureFor(slot, answer, verbs)} </span>
                <span className="body-bold">
                  <span aria-hidden="true">{right ? '✓' : '✗'} </span>
                  {SLOT_NAMES[slot]}:
                </span>{' '}
                {right
                  ? `${tileText(slot, answer)}. Right.`
                  : `you picked ${tileText(slot, choices[slot])}. It's ${tileText(slot, answer)}.`}
              </li>
            );
          })}
        </ul>
        {unlocked ? (
          <p className="body-bold verb-unlocked">
            Level {unlocked - 1} done! You&apos;ve unlocked level {unlocked}:{' '}
            {LEVEL_INFO[unlocked]?.name.toLowerCase()}. Learn and Review can now show these forms
            too.
          </p>
        ) : null}
        {finished ? (
          <p className="body-bold verb-unlocked">
            You&apos;ve finished levels 1 to {LEVELS_BUILT}. Keep practising here; the past tense
            comes in a later update.
          </p>
        ) : null}
      </section>
      <div className="learn-actions">
        <button ref={nextRef} type="button" className="btn btn-primary" onClick={onNext}>
          {unlocked ? 'See what’s new' : 'Continue'}
        </button>
      </div>
    </>
  );
}
