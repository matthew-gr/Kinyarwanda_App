import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { Flashcard } from '../components/Flashcard';
import { FlashcardDeck } from '../components/FlashcardDeck';
import { SessionHeader } from '../components/SessionHeader';
import { ReviewSession, type ReviewCard, type ReviewView } from '../data/reviewSession';
import type { AnswerResult } from '../engine/learn';
import { TOP_STAGE, type ReviewSchedule } from '../engine/review';
import { dictionaryLine, playAudio, tagFor, waitInWords } from './cardText';
import { useProgressVersion } from './useProgressVersion';

/** Longest the empty screen waits before checking again for newly due items. */
const MAX_WAIT_MS = 60 * 60 * 1000;

function noteFor(result: AnswerResult, s: ReviewSchedule, now: number): string {
  if (result === 'missed') return `Down to stage ${s.stage}. Recheck in 5 minutes.`;
  if (s.recheckStep === 2) return 'Recheck again in 1 hour.';
  return `Next review in ${waitInWords(s.dueAt - now)}.`;
}

export function Review() {
  const navigate = useNavigate();
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [view, setView] = useState<ReviewView | null>(null);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; good: boolean; id: number } | null>(null);
  const flipRef = useRef<HTMLButtonElement>(null);
  const gotRef = useRef<HTMLButtonElement>(null);
  const version = useProgressVersion();

  useEffect(() => {
    let alive = true;
    void ReviewSession.open().then((s) => {
      if (!alive) return;
      setSession(s);
      setView(s.view());
    });
    return () => {
      alive = false;
    };
  }, [version]);

  const card = view?.card ?? null;
  const flipped = card !== null && flippedId === card.cardViewId;

  useEffect(() => {
    if (card) flipRef.current?.focus();
  }, [card?.cardViewId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (flipped) gotRef.current?.focus();
  }, [flipped]);

  // The front plays its audio, when it has any.
  useEffect(() => {
    if (card?.form.audio_path) playAudio(card.form.audio_path);
  }, [card?.cardViewId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 4000);
    return () => clearTimeout(t);
  }, [note]);

  // With nothing due, check again when the next item comes due. Due times live in storage;
  // this timer only wakes the screen.
  const nextDueAt = card ? null : (view?.counts.nextDueAt ?? null);
  useEffect(() => {
    if (!session || nextDueAt === null) return;
    const wait = Math.min(Math.max(0, nextDueAt - Date.now()) + 250, MAX_WAIT_MS);
    const t = setTimeout(() => {
      void session.refresh().then(() => setView(session.view()));
    }, wait);
    return () => clearTimeout(t);
  }, [session, nextDueAt]);

  const flip = useCallback(() => {
    if (card) setFlippedId(card.cardViewId);
  }, [card]);

  const answer = useCallback(
    async (result: AnswerResult) => {
      if (!session || !card || flippedId !== card.cardViewId) return;
      const out = await session.answer(card.cardViewId, result);
      if (!out.counted || !out.schedule) return;
      setNote({
        text: noteFor(result, out.schedule, Date.now()),
        good: result === 'got',
        id: Date.now(),
      });
      setView(session.view());
    },
    [session, card, flippedId],
  );

  // Space flips the card; Right Arrow is ✓ and Left Arrow is ✗ once it is flipped.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || !card) return;
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
  }, [card, flipped, flip, answer]);

  return (
    <main className="screen screen-learn">
      <AppBar title="Review" onBack={() => navigate('/')} backLabel="Back to Home" />

      {view === null ? null : card ? (
        <ReviewCardArea
          card={card}
          dueNow={view.dueNow}
          flipped={flipped}
          flipRef={flipRef}
          gotRef={gotRef}
          onFlip={flip}
          onAnswer={answer}
        />
      ) : (
        <Caught view={view} onHome={() => navigate('/')} onLearn={() => navigate('/learn/words')} />
      )}

      <p className="learn-note body-bold" role="status" aria-live="polite">
        {note ? (
          <span key={note.id} className="learn-note-text">
            <span aria-hidden="true">{note.good ? '✓ ' : '✗ '}</span>
            {note.text}
          </span>
        ) : null}
      </p>
    </main>
  );
}

function Caught({
  view,
  onHome,
  onLearn,
}: {
  view: ReviewView;
  onHome: () => void;
  onLearn: () => void;
}) {
  const { counts } = view;
  if (counts.total === 0) {
    return (
      <section className="learn-done" aria-labelledby="review-empty">
        <h2 id="review-empty" className="h2-bold">
          Nothing to review yet
        </h2>
        <p className="body">
          Words and phrases come here 5 minutes after you learn them, then again on a schedule that
          stretches out to a year.
        </p>
        <button type="button" className="btn btn-primary" onClick={onLearn}>
          Learn words
        </button>
      </section>
    );
  }
  return (
    <section className="learn-done" aria-labelledby="review-caught">
      <h2 id="review-caught" className="h2-bold">
        All caught up
      </h2>
      <p className="body">
        {counts.nextDueAt === null
          ? 'Nothing else is due.'
          : `Next review in ${waitInWords(counts.nextDueAt - Date.now())}.`}{' '}
        {counts.laterToday > 0 ? `${counts.laterToday} more due later today.` : ''}
      </p>
      <button type="button" className="btn btn-primary" onClick={onHome}>
        Back to Home
      </button>
    </section>
  );
}

interface ReviewCardAreaProps {
  card: ReviewCard;
  dueNow: number;
  flipped: boolean;
  flipRef: React.RefObject<HTMLButtonElement | null>;
  gotRef: React.RefObject<HTMLButtonElement | null>;
  onFlip: () => void;
  onAnswer: (r: AnswerResult) => Promise<void>;
}

function ReviewCardArea({
  card,
  dueNow,
  flipped,
  flipRef,
  gotRef,
  onFlip,
  onAnswer,
}: ReviewCardAreaProps) {
  const { item, form } = card;
  const audio = form.audio_path;
  const meta =
    card.recheckStep > 0
      ? `Recheck ${card.recheckStep} of 2`
      : `Stage ${card.stage} of ${TOP_STAGE}`;

  return (
    <>
      <SessionHeader
        level={`${dueNow} due`}
        meta={meta}
        progress={card.stage / TOP_STAGE}
        progressLabel="Stage"
      />

      <div className="learn-deck" data-card={card.cardViewId}>
        <FlashcardDeck behind={dueNow > 2 ? ['yellow', 'blue'] : dueNow > 1 ? ['yellow'] : []}>
          <Flashcard
            key={card.cardViewId}
            side={flipped ? 'back' : 'front'}
            word={form.text}
            translation={form.en}
            detail={dictionaryLine(item, form)}
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
        {flipped ? (
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
      </div>
    </>
  );
}
