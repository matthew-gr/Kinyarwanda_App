import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { AppBar } from '../components/AppBar';
import { Flashcard, type DeckTone } from '../components/Flashcard';
import { FlashcardDeck } from '../components/FlashcardDeck';
import { SessionHeader } from '../components/SessionHeader';
import { LearnSession, type CardView } from '../data/learnSession';
import type { AnswerResult, Deck } from '../engine/learn';
import { CardNotes, ReportMistake } from './CardExtras';
import { dictionaryLine, hasNotes, playAudio, pronunciationFor, tagFor } from './cardText';
import { useProgressVersion } from './useProgressVersion';

const DECK_NAMES: Record<Deck, string> = { words: 'Words', phrases: 'Phrases' };
const GHOSTS: DeckTone[] = ['orange', 'blue', 'yellow'];
const GRADUATION_NOTE = 'Learned. Back for review in 5 minutes.';

export function Learn() {
  const { deck } = useParams();
  if (deck !== 'words' && deck !== 'phrases') return <Navigate to="/" replace />;
  return <LearnDeck key={deck} deck={deck} />;
}

function DeckSwitch({ deck }: { deck: Deck }) {
  return (
    <nav className="deck-switch" aria-label="Deck">
      {(['words', 'phrases'] as const).map((d) => (
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
  const flipRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const gotRef = useRef<HTMLButtonElement>(null);
  const version = useProgressVersion();

  useEffect(() => {
    let alive = true;
    void LearnSession.open(deck).then((s) => {
      if (!alive) return;
      setSession(s);
      setView(s.view());
    });
    return () => {
      alive = false;
    };
  }, [deck, version]);

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
    await session.next();
    setView(session.view());
  }, [session]);

  const answer = useCallback(
    async (result: AnswerResult) => {
      if (!session || !view || view.step.type !== 'test' || flippedKey !== view.key) return;
      const out = await session.answer(view.step.cardViewId, result);
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

      {view === null ? null : view.step.type === 'done' ? (
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
  const { item, form, step } = view;
  if (!item || !form || step.type === 'done') return null;
  const isIntro = step.type === 'intro';
  const audio = form.audio_path;
  const ghosts = Math.min(GHOSTS.length, Math.max(0, view.inPlay - 1));

  return (
    <>
      <SessionHeader
        level={`${view.inPlay} of ${view.maxPool} in play`}
        meta={isIntro ? 'New card' : `Streak ${view.streak} of ${view.graduateStreak}`}
        progress={isIntro ? 0 : view.streak / view.graduateStreak}
        progressLabel="Streak"
      />

      <div className="learn-deck" data-card={view.key}>
        <FlashcardDeck behind={GHOSTS.slice(GHOSTS.length - ghosts)}>
          <Flashcard
            key={view.key}
            side={isIntro ? 'both' : flipped ? 'back' : 'front'}
            word={form.text}
            phonetic={pronunciationFor(item, form)}
            translation={form.en}
            detail={dictionaryLine(item, form)}
            notes={hasNotes(item) ? <CardNotes item={item} /> : undefined}
            tag={tagFor(item)}
            hint="Tap to reveal meaning"
            onFlip={onFlip}
            onSpeak={audio ? () => playAudio(audio) : undefined}
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
          <p className="learn-tip body-small">Tap the card, or press Space, to see the meaning.</p>
        )}
        {isIntro || flipped ? <ReportMistake item={item} form={form} module="learn" /> : null}
      </div>
    </>
  );
}
