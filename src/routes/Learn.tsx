import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { AppBar } from '../components/AppBar';
import { Flashcard, type DeckTone } from '../components/Flashcard';
import { FlashcardDeck } from '../components/FlashcardDeck';
import { SessionHeader } from '../components/SessionHeader';
import { LearnSession, type CardView } from '../data/learnSession';
import { isMyWord } from '../data/myWords';
import { loadDeckLearned } from '../data/repo';
import type { AnswerResult, Deck } from '../engine/learn';
import type { Item, ItemForm } from '../engine/types';
import { placeLabel } from '../engine/vocabulary';
import { CardNotes, ReportMistake } from './CardExtras';
import {
  dictionaryLine,
  hasNotes,
  playAudio,
  preloadAudio,
  pronunciationFor,
  tagFor,
} from './cardText';
import { useProgressVersion } from './useProgressVersion';

const DECK_NAMES: Record<Deck, string> = { words: 'Words', phrases: 'Phrases', mine: 'My words' };
const DECKS: readonly Deck[] = ['words', 'phrases', 'mine'];
const GHOSTS: DeckTone[] = ['orange', 'blue', 'yellow'];
const GRADUATION_NOTE = 'Learned. Back for review in 5 minutes.';

export function Learn() {
  const { deck } = useParams();
  if (!DECKS.includes(deck as Deck)) return <Navigate to="/" replace />;
  const d = deck as Deck;
  return <LearnDeck key={d} deck={d} />;
}

function DeckSwitch({ deck }: { deck: Deck }) {
  return (
    <nav className="deck-switch" aria-label="Deck">
      {DECKS.map((d) => (
        <Link
          key={d}
          to={`/learn/${d}`}
          replace
          className="deck-switch-option body-bold"
          aria-current={d === deck ? 'page' : undefined}
        >
          {DECK_NAMES[d]}
        </Link>
      ))}
    </nav>
  );
}

function LearnDeck({ deck }: { deck: Deck }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<LearnSession | null>(null);
  const [view, setView] = useState<CardView | null>(null);
  const [flippedKey, setFlippedKey] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; id: number } | null>(null);
  const [learned, setLearned] = useState<{ today: number; total: number } | null>(null);
  const flipRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const gotRef = useRef<HTMLButtonElement>(null);
  const version = useProgressVersion();
  // Bumped as each Next or answer starts and ends.
  const actions = useRef(0);

  useEffect(() => {
    let alive = true;
    const open = () => {
      const at = actions.current;
      void LearnSession.open(deck).then((s) => {
        if (!alive) return;
        // A sync can land mid-card. A session read while a card was being answered would put
        // that card back, so it is read again from what the answer saved.
        if (actions.current !== at) return open();
        setSession(s);
        setView(s.view());
      });
    };
    open();
    return () => {
      alive = false;
    };
  }, [deck, version]);

  // Recounted after a sync and whenever a card graduates (note is set then).
  useEffect(() => {
    let alive = true;
    void loadDeckLearned(deck, Date.now()).then((l) => {
      if (alive) setLearned(l);
    });
    return () => {
      alive = false;
    };
  }, [deck, version, note]);

  const step = view?.step;
  const flipped = view !== null && flippedKey === view.key;

  // Each new card takes focus, so keyboard and screen reader users stay on the card.
  useEffect(() => {
    if (step?.type === 'intro') nextRef.current?.focus();
    else if (step?.type === 'test') flipRef.current?.focus();
  }, [view?.key, step?.type]);

  useEffect(() => {
    if (flipped) gotRef.current?.focus();
  }, [flipped]);

  // Play the introduction's audio, when it has any.
  useEffect(() => {
    if (step?.type === 'intro' && view?.form?.audio_path) playAudio(view.form.audio_path);
  }, [view?.key, step?.type, view?.form?.audio_path]);

  // The next cards' audio downloads in the background, so it plays at once.
  useEffect(() => {
    if (session) preloadAudio(session.upcomingAudio());
  }, [session, view?.key]);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 4000);
    return () => clearTimeout(t);
  }, [note]);

  const flip = useCallback(() => {
    if (view?.step.type === 'test') setFlippedKey(view.key);
  }, [view]);

  const next = useCallback(async () => {
    if (!session) return;
    actions.current++;
    await session.next();
    actions.current++;
    setView(session.view());
  }, [session]);

  const answer = useCallback(
    async (result: AnswerResult) => {
      if (!session || !view || view.step.type !== 'test' || flippedKey !== view.key) return;
      actions.current++;
      const out = await session.answer(view.step.cardViewId, result);
      actions.current++;
      if (!out.counted) return;
      if (out.graduated) setNote({ text: GRADUATION_NOTE, id: Date.now() });
      setView(session.view());
    },
    [session, view, flippedKey],
  );

  // Space flips the card; Right Arrow is ✓ and Left Arrow is ✗ once it is flipped.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || step?.type !== 'test') return;
      if (e.key === ' ' && !flipped) {
        e.preventDefault();
        flip();
      } else if (flipped && e.key === 'ArrowRight') {
        e.preventDefault();
        void answer('got');
      } else if (flipped && e.key === 'ArrowLeft') {
        e.preventDefault();
        void answer('missed');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step?.type, flipped, flip, answer]);

  const title = DECK_NAMES[deck];

  return (
    <main className="screen screen-learn">
      <AppBar title={title} onBack={() => navigate('/')} backLabel="Back to Home" />
      <DeckSwitch deck={deck} />
      <p className="learn-count body-small">
        {learned
          ? `${DECK_NAMES[deck]} learned: ${learned.today} today · ${learned.total} in all`
          : ' '}
      </p>

      {view === null ? null : view.step.type === 'done' && deck === 'mine' ? (
        <section className="learn-done" aria-labelledby="done-title">
          <h2 id="done-title" className="h2-bold">
            {learned?.total ? 'All done for now' : 'Your own words'}
          </h2>
          <p className="body">
            {learned?.total
              ? 'You have learned every word on your list. Each one comes back in Review.'
              : 'Add words you meet, in a story or anywhere else, and learn them here.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/words')}>
            {learned?.total ? 'Add more words' : 'Add a word'}
          </button>
        </section>
      ) : view.step.type === 'done' ? (
        <section className="learn-done" aria-labelledby="done-title">
          <h2 id="done-title" className="h2-bold">
            All done for now
          </h2>
          <p className="body">
            You have learned every {deck === 'words' ? 'word' : 'phrase'} available so far. Each one
            comes back in Review.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </section>
      ) : (
        <CardArea
          view={view}
          flipped={flipped}
          flipRef={flipRef}
          nextRef={nextRef}
          gotRef={gotRef}
          onFlip={flip}
          onNext={next}
          onAnswer={answer}
        />
      )}

      <p className="learn-note body-bold" role="status" aria-live="polite">
        {note ? (
          <span key={note.id} className="learn-note-text">
            <span aria-hidden="true">✓ </span>
            {note.text}
          </span>
        ) : null}
      </p>
    </main>
  );
}

interface CardAreaProps {
  view: CardView;
  flipped: boolean;
  flipRef: RefObject<HTMLButtonElement | null>;
  nextRef: RefObject<HTMLButtonElement | null>;
  gotRef: RefObject<HTMLButtonElement | null>;
  onFlip: () => void;
  onNext: () => Promise<void>;
  onAnswer: (r: AnswerResult) => Promise<void>;
}

/**
 * The card's switch to the next of its forms, so a learner sees how the word changes: a
 * noun's singular and plural, or a verb's forms. None when the word has only one form.
 */
function switchFor(
  item: Item,
  form: ItemForm,
  choices: readonly ItemForm[],
  go: (next: ItemForm) => void,
): { label: string; onToggle: () => void } | undefined {
  if (choices.length < 2) return undefined;
  const at = choices.findIndex((f) => f.id === form.id);
  const k = (at + 1) % choices.length;
  const next = choices[k]!;
  const label =
    item.word_type === 'noun'
      ? next.number === 'plural'
        ? 'Plural'
        : 'Singular'
      : `Next form · ${k + 1} of ${choices.length}`;
  return { label, onToggle: () => go(next) };
}

function CardArea({
  view,
  flipped,
  flipRef,
  nextRef,
  gotRef,
  onFlip,
  onNext,
  onAnswer,
}: CardAreaProps) {
  // The form switched to on this card, if any; a new card starts on the one it was dealt.
  const [switched, setSwitched] = useState<{ key: string; formId: string } | null>(null);
  const { item, step, choices } = view;
  const dealt = view.form;
  if (!item || !dealt || step.type === 'done') return null;
  // A class 9/10 noun is spelled the same in the plural, so the content has one form; the
  // card still switches, to a plural that says so, since knowing that is part of the class.
  const samePlural =
    item.word_type === 'noun' && item.noun_class === '9/10' && choices.length < 2
      ? { ...dealt, id: `${dealt.id}:plural`, number: 'plural' as const, is_base: false }
      : null;
  const cardChoices = samePlural ? [dealt, samePlural] : choices;
  const form =
    (switched?.key === view.key && cardChoices.find((f) => f.id === switched.formId)) || dealt;
  const isSamePlural = form === samePlural;
  const isIntro = step.type === 'intro';
  const audio = form.audio_path;
  const toggle = switchFor(item, form, cardChoices, (next) => {
    setSwitched({ key: view.key, formId: next.id });
    if (next.audio_path) playAudio(next.audio_path);
  });
  const ghosts = Math.min(GHOSTS.length, Math.max(0, view.inPlay - 1));

  return (
    <>
      <SessionHeader
        level={`${view.inPlay} of ${view.maxPool} in play`}
        meta={
          isIntro
            ? isMyWord(item)
              ? 'New card · My words'
              : item.kind === 'word'
                ? `New card · ${placeLabel(item)}`
                : 'New card'
            : `Streak ${view.streak} of ${view.graduateStreak}`
        }
        progress={isIntro ? 0 : view.streak / view.graduateStreak}
        progressLabel="Streak"
      />

      <div className="learn-deck" data-card={view.key}>
        <FlashcardDeck behind={GHOSTS.slice(GHOSTS.length - ghosts)}>
          <Flashcard
            key={view.key}
            side={isIntro ? 'both' : flipped ? 'back' : 'front'}
            word={form.text}
            phonetic={
              isSamePlural
                ? `${pronunciationFor(item, form)} · plural, same word`
                : pronunciationFor(item, form)
            }
            translation={form.en}
            detail={
              isSamePlural
                ? `Plural: the same word (class 9 singular, class 10 plural)`
                : dictionaryLine(item, form)
            }
            notes={hasNotes(item) ? <CardNotes item={item} /> : undefined}
            tag={tagFor(item)}
            hint="Tap to reveal meaning"
            onFlip={onFlip}
            onSpeak={audio ? () => playAudio(audio) : undefined}
            toggle={toggle}
            flipRef={flipRef}
          />
        </FlashcardDeck>
      </div>

      <p className="sr-only" aria-live="polite">
        {flipped ? `Meaning: ${form.en}` : ''}
      </p>

      <div className="learn-actions">
        {isIntro ? (
          <button
            ref={nextRef}
            type="button"
            className="btn btn-primary"
            onClick={() => void onNext()}
          >
            Next
          </button>
        ) : flipped ? (
          <div className="grade" role="group" aria-label="Did you know it?">
            <button
              type="button"
              className="btn btn-missed"
              onClick={() => void onAnswer('missed')}
            >
              <span aria-hidden="true">✗</span> I didn&apos;t
            </button>
            <button
              ref={gotRef}
              type="button"
              className="btn btn-got"
              onClick={() => void onAnswer('got')}
            >
              <span aria-hidden="true">✓</span> I knew it
            </button>
          </div>
        ) : (
          // Turn sits where "I knew it" appears, so two taps in one place turn and mark it.
          <div className="grade">
            <p className="learn-tip body-small">Tap the card or Turn, or press Space.</p>
            <button type="button" className="btn btn-primary" onClick={onFlip}>
              Turn
            </button>
          </div>
        )}
        {(isIntro || flipped) && !isMyWord(item) ? (
          <ReportMistake item={item} form={form} module="learn" />
        ) : null}
      </div>
    </>
  );
}
