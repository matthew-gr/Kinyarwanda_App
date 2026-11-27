// The FSRS scheduler (decision 206; learner feedback of 23 November: "I like Anki's scheduler"),
// as a switch beside the stage ladder in review.ts. Pure functions: no React, no storage, no
// clock.
//
// FSRS is the algorithm Anki uses. ts-fsrs is the same project's TypeScript version; 5.x is
// FSRS-6, as Anki ships it. Each card keeps a memory state (stability: days until recall falls
// to 90%; difficulty: 1 to 10), and each answer updates it from how long it actually waited, so
// the waits fit the card and a late right answer counts for the time it was remembered. I knew
// it is Good and I didn't is Again. Fuzz is off, so every device replaying the same answers gets
// the same schedule.

import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
  type Grade,
} from 'ts-fsrs';
import type { AnswerResult } from './learn';
import { addInterval, FIRST_STAGE, intervalOf, TOP_STAGE, type ReviewSchedule } from './review';

export type SchedulerKind = 'ladder' | 'fsrs';

/** A card's FSRS state, as stored: plain numbers, so it fits IndexedDB and compares easily. */
export interface FsrsMemory {
  stability: number;
  difficulty: number;
  /** 0 new, 1 learning, 2 review, 3 relearning (ts-fsrs's State). */
  state: number;
  /** The learning or relearning step it is on. */
  step: number;
  reps: number;
  lapses: number;
  /** Epoch milliseconds of the last answer. */
  lastReview: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const scheduler = fsrs(
  generatorParameters({
    enable_fuzz: false,
    enable_short_term: true,
    learning_steps: ['1m', '10m'],
    relearning_steps: ['10m'],
  }),
);

/** The ladder stage nearest below a wait, so rounds and My words can still sort by it. */
function stageFor(waitMs: number, from: number): number {
  let stage = FIRST_STAGE;
  while (stage < TOP_STAGE && addInterval(from, intervalOf(stage + 1)) - from <= waitMs) stage++;
  return stage;
}

function toSchedule(card: Card, now: number): ReviewSchedule {
  const dueAt = card.due.getTime();
  const relearning = card.state === State.Learning || card.state === State.Relearning;
  return {
    stage: stageFor(dueAt - now, now),
    recheckStep: relearning ? 1 : 0,
    dueAt,
    fsrs: {
      stability: card.stability,
      difficulty: card.difficulty,
      state: card.state,
      step: card.learning_steps,
      reps: card.reps,
      lapses: card.lapses,
      lastReview: now,
    },
  };
}

/**
 * The card a schedule stands for. A schedule from the ladder (made before the switch, or by a
 * device on the ladder) becomes a card in review whose stability is its stage's wait.
 */
function toCard(s: ReviewSchedule): Card {
  const m = s.fsrs;
  if (m) {
    return {
      ...createEmptyCard(new Date(m.lastReview)),
      due: new Date(s.dueAt),
      stability: m.stability,
      difficulty: m.difficulty,
      state: m.state as State,
      learning_steps: m.step,
      reps: m.reps,
      lapses: m.lapses,
      scheduled_days: Math.round((s.dueAt - m.lastReview) / DAY_MS),
      last_review: new Date(m.lastReview),
    };
  }
  const wait = addInterval(s.dueAt, intervalOf(s.stage)) - s.dueAt;
  const last = s.dueAt - wait;
  return {
    ...createEmptyCard(new Date(last)),
    due: new Date(s.dueAt),
    stability: Math.max(0.1, wait / DAY_MS),
    difficulty: 5,
    state: State.Review,
    reps: s.stage,
    scheduled_days: Math.round(wait / DAY_MS),
    last_review: new Date(last),
  };
}

const gradeOf = (result: AnswerResult): Grade => (result === 'got' ? Rating.Good : Rating.Again);

/** A card Learn has just graduated: its first FSRS answer, a Good on a new card. */
export function fsrsFirst(now: number): ReviewSchedule {
  return toSchedule(
    scheduler.next(createEmptyCard(new Date(now)), new Date(now), Rating.Good).card,
    now,
  );
}

/** The schedule after an answer at `now`. */
export function fsrsNext(s: ReviewSchedule, result: AnswerResult, now: number): ReviewSchedule {
  return toSchedule(scheduler.next(toCard(s), new Date(now), gradeOf(result)).card, now);
}

/**
 * A word the placement check found known: in review, remembered for about as long as the
 * ladder's placed stage, first due at `dueAt`.
 */
export function fsrsPlaced(at: number, dueAt: number, stability: number): ReviewSchedule {
  return {
    stage: stageFor(dueAt - at, at),
    recheckStep: 0,
    dueAt,
    fsrs: {
      stability,
      difficulty: 5,
      state: State.Review,
      step: 0,
      reps: 1,
      lapses: 0,
      lastReview: at,
    },
  };
}
