// Review in rounds (decision 201). A big pile of due cards is discouraging, more so when it grows
// while the learner works through it. So Review deals rounds of at most ROUND_SIZE cards, chosen
// when the round starts: cards that come due during it, a missed word's recheck included, wait
// for the next round, and the count on screen only goes up. Pure functions: no storage, no clock.

import { shuffle, type Rng } from './random';

export const ROUND_SIZE = 20;
/** Above this many rounds due, the first round starts with cards the learner is likely to know. */
export const EASY_START_ROUNDS = 3;
/** Above this many rounds due, Learn suggests a review round first. */
export const REVIEW_FIRST_ROUNDS = 5;
/** Seconds a card takes until the learner's own answers say otherwise. */
export const DEFAULT_SECONDS_PER_CARD = 10;

export interface RoundCandidate {
  itemId: string;
  stage: number;
  recheckStep: number;
}

/**
 * The items of a new round, in the order they are dealt. With a big pile (more than
 * EASY_START_ROUNDS rounds) the round is the cards most likely to go well: rechecks of words just
 * missed, which are fresh in mind, then the highest stages. Otherwise any due cards, shuffled.
 * The item answered last goes to the end when there is another, so it isn't shown twice in a row.
 */
export function startRound(
  due: readonly RoundCandidate[],
  rng: Rng,
  lastItemId: string | null = null,
  size = ROUND_SIZE,
): string[] {
  let picked: RoundCandidate[];
  if (due.length > size * EASY_START_ROUNDS) {
    const ranked = shuffle(due, rng).sort(
      (a, b) => Number(b.recheckStep > 0) - Number(a.recheckStep > 0) || b.stage - a.stage,
    );
    picked = shuffle(ranked.slice(0, size), rng);
  } else {
    picked = shuffle(due, rng).slice(0, size);
  }
  const ids = picked.map((c) => c.itemId);
  const last = ids.indexOf(lastItemId ?? '');
  if (last >= 0 && ids.length > 1) ids.push(...ids.splice(last, 1));
  return ids;
}

/**
 * How long this learner takes per review card, from the times of their recent review answers:
 * the median gap between answers given within 2 minutes of each other, between 3 and 60 seconds.
 */
export function secondsPerCard(answeredAt: readonly number[]): number {
  const times = [...answeredAt].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) {
    const gap = (times[i]! - times[i - 1]!) / 1000;
    if (gap > 0 && gap <= 120) gaps.push(gap);
  }
  if (gaps.length < 5) return DEFAULT_SECONDS_PER_CARD;
  gaps.sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)]!;
  return Math.min(60, Math.max(3, median));
}

/** "about 1 min", "about 4 min": the time for a round of `cards`. */
export function roundTime(cards: number, perCard: number): string {
  return `about ${Math.max(1, Math.round((cards * perCard) / 60))} min`;
}

/** The size of the next round when `due` cards are due. */
export const nextRoundSize = (due: number, size = ROUND_SIZE) => Math.min(due, size);

/** Whether a round can start now (learner feedback, 27 November 2026). */
export interface RoundGate {
  open: boolean;
  /** When ROUND_SIZE cards will be due, if the round has to wait for them. */
  opensAt: number | null;
}

/**
 * A round starts when a full round is due, so reviewing a handful at a time isn't encouraged;
 * or with fewer, when fewer than a full round are due by the end of today anyway.
 */
export function roundGate(
  dueAt: readonly number[],
  now: number,
  endOfDay: number,
  size = ROUND_SIZE,
): RoundGate {
  const due = dueAt.filter((t) => t <= now).length;
  if (due === 0) return { open: false, opensAt: null };
  if (due >= size) return { open: true, opensAt: null };
  const today = [...dueAt].filter((t) => t <= endOfDay).sort((a, b) => a - b);
  if (today.length < size) return { open: true, opensAt: null };
  return { open: false, opensAt: today[size - 1]! };
}

/** The end of the local day of `now`. */
export function endOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** Predicted rounds for the wall (learner feedback, 27 November 2026). */
export interface Forecast {
  /** Rounds to clear what is due now, with its rechecks and what comes due meanwhile. */
  soon: number;
  /** Further rounds for what is due later today. */
  later: number;
}

/** No wall needs more predicted blocks than this. */
const MAX_FORECAST = 40;
/** Accuracy assumed before any round today. */
export const DEFAULT_ACCURACY = 0.85;

/**
 * How many more rounds today will take. The cards waiting now, plus the 5-minute rechecks
 * their likely misses bring (from today's accuracy), plus cards that come due while those are
 * worked through at the learner's pace, make the rounds soon; the rest due before the day ends,
 * with the misses' 1-hour rechecks, make the rounds later.
 */
export function forecastRounds(args: {
  waiting: number;
  dueAt: readonly number[];
  now: number;
  endOfDay: number;
  accuracy: number;
  secondsPerCard: number;
  size?: number;
}): Forecast {
  const size = args.size ?? ROUND_SIZE;
  const miss = Math.min(1, Math.max(0, 1 - args.accuracy));
  const misses = Math.round(args.waiting * miss);
  const workEnd = args.now + (args.waiting + misses) * args.secondsPerCard * 1000;
  const comingSoon = args.dueAt.filter((t) => t > args.now && t <= workEnd).length;
  const soonCards = args.waiting + misses + comingSoon;
  const laterCards = args.dueAt.filter((t) => t > workEnd && t <= args.endOfDay).length + misses;
  const soon = Math.min(MAX_FORECAST, Math.ceil(soonCards / size));
  const later = Math.min(MAX_FORECAST - soon, Math.ceil(laterCards / size));
  return { soon, later };
}
