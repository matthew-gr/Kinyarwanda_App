import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { Flashcard } from '../components/Flashcard';
import { FlashcardDeck } from '../components/FlashcardDeck';
import { SessionHeader } from '../components/SessionHeader';
import {
  ReviewSession,
  UNDO_WINDOW_MS,
  type ReviewCard,
  type ReviewView,
} from '../data/reviewSession';
import type { AnswerResult } from '../engine/learn';
import { TOP_STAGE, type ReviewSchedule } from '../engine/review';
import { nextRoundSize, ROUND_SIZE, roundTime } from '../engine/rounds';
import { AudioCheck, CardNotes, CardPicture, ReportMistake } from './CardExtras';
import { audioCheckOf, isAudioWrong, onAudioChecks } from '../data/audioChecks';
import {
  dictionaryLine,
  hasNotes,
  hasPicture,
  playAudio,
  preloadAudio,
  pronunciationFor,
  tagFor,
  preciseWait,
  waitInWords,
} from './cardText';
import { RoundWall } from './RoundWall';
import { useProgressVersion } from './useProgressVersion';

/** Longest the empty screen waits before checking again for newly due items. */
const MAX_WAIT_MS = 60 * 60 * 1000;

function noteFor(result: AnswerResult, s: ReviewSchedule, now: number): string {
  // FSRS (decision 206) has no stages or fixed rechecks: just when it comes back.
  if (s.fsrs)
    return `${result === 'missed' ? 'Again' : 'Next review'} in ${preciseWait(s.dueAt - now)}.`;
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

  // Bumped as each answer starts and ends.
  const actions = useRef(0);

  useEffect(() => {
    let alive = true;
    const open = () => {
      const at = actions.current;
      void ReviewSession.open().then((s) => {
        if (!alive) return;
        // A sync can land mid-answer. A session read while an answer was saving would show the
        // answered card again, and answering it twice fails, so it is read again after.
        if (actions.current !== at) return open();
        setSession(s);
        setView(s.view());
      });
    };
    open();
    return () => {
      alive = false;
    };
  }, [version]);

  const card = view?.card ?? null;
  const flipped = card !== null && flippedId === card.cardViewId;

  useEffect(() => {
    if (card) flipRef.current?.focus();
  }, [card?.cardViewId]); // eslint-disable-line react-hooks/exhaustive-deps

  // The next cards' audio downloads in the background, so it plays at once.
  useEffect(() => {
    if (session) preloadAudio(session.upcomingAudio());
  }, [session, card?.cardViewId]);

  useEffect(() => {
    if (flipped) gotRef.current?.focus();
  }, [flipped]);

  // The front plays its audio, when it has any, unless the learner marked it wrong.
  useEffect(() => {
    if (card?.form.audio_path && !isAudioWrong(card.form.id)) playAudio(card.form.audio_path);
  }, [card?.cardViewId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 4000);
    return () => clearTimeout(t);
  }, [note]);

  // With nothing due, check again when the next item comes due, and start a round with it. Due
  // times live in storage; this timer only wakes the screen. A finished round with more waiting
  // stays on its finish screen until the learner asks for the next.
  // A round waiting for 20 cards to be due wakes the screen when they are: a finished round's
  // screen then offers the next one, and an idle screen starts it.
  const idle = !card && (!view?.round || (view.round.finished && view.waiting === 0));
  const gateAt = !card && view && !view.gate.open ? view.gate.opensAt : null;
  const nextDueAt = gateAt ?? (idle ? (view?.counts.nextDueAt ?? null) : null);
  useEffect(() => {
    if (!session || nextDueAt === null) return;
    const wait = Math.min(Math.max(0, nextDueAt - Date.now()) + 250, MAX_WAIT_MS);
    const t = setTimeout(() => {
      if (idle) void session.newRound().then(() => setView(session.view()));
      else setView(session.view());
    }, wait);
    return () => clearTimeout(t);
  }, [session, nextDueAt, idle]);

  // Undo last answer shows for a few seconds after each answer (decision 205).
  const [undoUntil, setUndoUntil] = useState(0);
  useEffect(() => {
    if (!undoUntil) return;
    const t = setTimeout(() => setUndoUntil(0), Math.max(0, undoUntil - Date.now()));
    return () => clearTimeout(t);
  }, [undoUntil]);
  const undo = useCallback(async () => {
    if (!session) return;
    setUndoUntil(0);
    const ok = await session.undo();
    const next = session.view();
    setView(next);
    if (ok && next.card) setFlippedId(next.card.cardViewId);
    setNote({
      text: ok
        ? 'Answer taken back. Choose again.'
        : 'That answer is already saved, so it can’t be taken back.',
      good: ok,
      id: Date.now(),
    });
  }, [session]);

  const nextRound = useCallback(async () => {
    if (!session) return;
    await session.newRound();
    setView(session.view());
  }, [session]);

  const flip = useCallback(() => {
    if (card) setFlippedId(card.cardViewId);
  }, [card]);

  const answer = useCallback(
    async (result: AnswerResult) => {
      if (!session || !card || flippedId !== card.cardViewId) return;
      actions.current++;
      let out;
      try {
        out = await session.answer(card.cardViewId, result);
      } finally {
        actions.current++;
      }
      if (!out.counted || !out.schedule) return;
      setUndoUntil(Date.now() + UNDO_WINDOW_MS);
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
          view={view}
          flipped={flipped}
          flipRef={flipRef}
          gotRef={gotRef}
          onFlip={flip}
          onAnswer={answer}
        />
      ) : view.round?.finished ? (
        <RoundDone view={view} onNext={() => void nextRound()} onHome={() => navigate('/')} />
      ) : (
        <Caught view={view} onHome={() => navigate('/')} onLearn={() => navigate('/learn/words')} />
      )}

      {undoUntil > 0 ? (
        <div className="review-undo">
          <button type="button" className="btn btn-missed" onClick={() => void undo()}>
            <span aria-hidden="true">↶</span> Undo last answer
          </button>
        </div>
      ) : null}

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
  const due = counts.overdue + counts.dueNow;
  if (due > 0 && !view.gate.open && view.gate.opensAt !== null) {
    return (
      <section className="learn-done" aria-labelledby="review-soon">
        <h2 id="review-soon" className="h2-bold">
          Next round soon
        </h2>
        <p className="body">
          {due} due now. A round starts when {ROUND_SIZE} are due, in{' '}
          {waitInWords(view.gate.opensAt - Date.now())}.
        </p>
        {view.pace.reviewedToday > 0 ? (
          <p className="body">{view.pace.reviewedToday} reviewed today.</p>
        ) : null}
        <button type="button" className="btn btn-primary" onClick={onHome}>
          Back to Home
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
      {view.pace.reviewedToday > 0 ? (
        <p className="body">{view.pace.reviewedToday} reviewed today.</p>
      ) : null}
      <button type="button" className="btn btn-primary" onClick={onHome}>
        Back to Home
      </button>
    </section>
  );
}

/** The end of a round: what was done, and the next round if more are due (decision 201). */
function RoundDone({
  view,
  onNext,
  onHome,
}: {
  view: ReviewView;
  onNext: () => void;
  onHome: () => void;
}) {
  const { round, waiting, pace, counts } = view;
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => nextRef.current?.focus(), []);
  if (!round) return null;
  return (
    <section className="learn-done" aria-labelledby="round-done">
      <h2 id="round-done" className="h2-bold">
        Round done
      </h2>
      <p className="body">
        {round.done} reviewed, {round.known} known. {pace.reviewedToday} reviewed today.
      </p>
      {view.today.length > 0 ? <RoundWall blocks={view.today} forecast={view.forecast} /> : null}
      {waiting > 0 && !view.gate.open && view.gate.opensAt !== null ? (
        <>
          <p className="body">
            {waiting} due now. The next round starts when {ROUND_SIZE} are due, in{' '}
            {waitInWords(view.gate.opensAt - Date.now())}.
          </p>
          <button ref={nextRef} type="button" className="btn btn-primary" onClick={onHome}>
            Back to Home
          </button>
        </>
      ) : waiting > 0 ? (
        <>
          <p className="body">
            Next round: {nextRoundSize(waiting)} cards,{' '}
            {roundTime(nextRoundSize(waiting), pace.secondsPerCard)}.
          </p>
          <p className="body-small">{waiting} waiting in all</p>
          <div className="round-actions">
            <button ref={nextRef} type="button" className="btn btn-primary" onClick={onNext}>
              Another round
            </button>
            <button type="button" className="btn btn-missed" onClick={onHome}>
              Done for now
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="body">
            All caught up.{' '}
            {counts.nextDueAt === null
              ? 'Nothing else is due.'
              : `Next review in ${waitInWords(counts.nextDueAt - Date.now())}.`}
          </p>
          <button ref={nextRef} type="button" className="btn btn-primary" onClick={onHome}>
            Back to Home
          </button>
        </>
      )}
    </section>
  );
}

interface ReviewCardAreaProps {
  card: ReviewCard;
  view: ReviewView;
  flipped: boolean;
  flipRef: React.RefObject<HTMLButtonElement | null>;
  gotRef: React.RefObject<HTMLButtonElement | null>;
  onFlip: () => void;
  onAnswer: (r: AnswerResult) => Promise<void>;
}

function ReviewCardArea({
  card,
  view,
  flipped,
  flipRef,
  gotRef,
  onFlip,
  onAnswer,
}: ReviewCardAreaProps) {
  const { item, form } = card;
  const audio = form.audio_path;
  const audioCheck = useSyncExternalStore(onAudioChecks, () => audioCheckOf(form.id));
  const round = view.round;
  // Cards still to come in this round after the one on screen, for the stack behind it.
  const after = round ? round.total - round.done - 1 : view.dueNow - 1;
  const wait = card.scheduler === 'fsrs' ? preciseWait : waitInWords;
  const meta =
    card.scheduler === 'fsrs'
      ? card.every > 0
        ? `FSRS · every ${preciseWait(card.every)}`
        : 'FSRS'
      : card.recheckStep > 0
        ? `Recheck ${card.recheckStep} of 2`
        : `Stage ${card.stage} of ${TOP_STAGE} · every ${waitInWords(card.every)}`;

  return (
    <>
      <SessionHeader
        level={round ? `${round.done + 1} of ${round.total}` : `${view.dueNow} due`}
        meta={meta}
        progress={round ? round.done / round.total : 0}
        progressLabel="Round progress"
      />

      <div className="learn-deck" data-card={card.cardViewId}>
        <FlashcardDeck behind={after > 1 ? ['yellow', 'blue'] : after > 0 ? ['yellow'] : []}>
          <Flashcard
            key={card.cardViewId}
            side={flipped ? 'back' : 'front'}
            word={form.text}
            phonetic={pronunciationFor(item, form)}
            translation={form.en}
            detail={
              [dictionaryLine(item, form), card.plural && `Plural: ${card.plural}`]
                .filter(Boolean)
                .join(' · ') || undefined
            }
            notes={hasNotes(item) ? <CardNotes item={item} /> : undefined}
            tag={tagFor(item)}
            picture={hasPicture(item) ? <CardPicture item={item} /> : undefined}
            hint="Tap to reveal meaning"
            onFlip={onFlip}
            onSpeak={audio ? () => playAudio(audio) : undefined}
            speakChecked={
              audio && item.source !== 'learner' ? (audioCheck ?? 'unchecked') : undefined
            }
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
              <span className="grade-wait">in {wait(card.wait.missed)}</span>
            </button>
            <button
              ref={gotRef}
              type="button"
              className="btn btn-got"
              onClick={() => void onAnswer('got')}
            >
              <span aria-hidden="true">✓</span> I knew it
              <span className="grade-wait">in {wait(card.wait.got)}</span>
            </button>
          </div>
        ) : (
          // As in Learn, Turn sits where "I knew it" appears, so two taps in one place turn
          // and mark it.
          <div className="grade">
            <p className="learn-tip body-small">Tap the card or Turn, or press Space.</p>
            <button type="button" className="btn btn-primary" onClick={onFlip}>
              Turn
            </button>
          </div>
        )}
        {item.source !== 'learner' ? <AudioCheck form={form} /> : null}
        {flipped && item.source !== 'learner' ? (
          <ReportMistake item={item} form={form} module="review" />
        ) : null}
      </div>
    </>
  );
}
