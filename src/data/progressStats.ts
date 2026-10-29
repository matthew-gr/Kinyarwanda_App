// Progress figures for Home, Profile and History, worked out from the answer log, so they
// match on every device once sync has run.

import { learnConfigFor } from '../engine/learn';
import { rebuildProgress, type LogEvent } from '../engine/progress';
import {
  activityByDay,
  badges,
  dayKey,
  dayStreak,
  lastDays,
  reviewAccuracy,
  type BadgeState,
  type DayActivity,
  type Streak,
} from '../engine/stats';
import { db, type KinyaDb } from './db';
import { getProfile } from './repo';

export interface ProgressStats {
  streak: Streak;
  wordsLearned: number;
  phrasesLearned: number;
  learnedToday: number;
  dailyGoal: number;
  verbLevel: number;
  badges: BadgeState[];
  /** The last 14 days, oldest first. */
  recent: DayActivity[];
  /** Review accuracy over the last 7 and 30 days; null with no Review answers. */
  accuracy7: number | null;
  accuracy30: number | null;
  totalAnswers: number;
}

export async function loadProgressStats(now: number, d: KinyaDb = db): Promise<ProgressStats> {
  const [events, items, profile] = await Promise.all([
    d.answer_events.toArray(),
    d.items.toArray(),
    getProfile(d),
  ]);
  const log: LogEvent[] = events.map((e) => ({
    id: e.id,
    itemId: e.item_id,
    module: e.module,
    result: e.result,
    answeredAt: Date.parse(e.answered_at),
  }));
  const progress = rebuildProgress(log, learnConfigFor('words').graduateStreak);
  const kindById = new Map(items.map((i) => [i.id, i.kind]));

  const wordTimes: number[] = [];
  let phrasesLearned = 0;
  for (const [id, p] of progress) {
    if (p.graduatedAt === null) continue;
    if (kindById.get(id) === 'phrase') phrasesLearned++;
    else wordTimes.push(p.graduatedAt);
  }

  const days = activityByDay(log, progress);
  const month = lastDays(days, now, 30);
  return {
    streak: dayStreak(
      [...days.values()].filter((a) => a.answers > 0).map((a) => a.day),
      now,
    ),
    wordsLearned: wordTimes.length,
    phrasesLearned,
    learnedToday: days.get(dayKey(now))?.learned ?? 0,
    dailyGoal: profile.daily_goal,
    verbLevel: profile.verb_level,
    badges: badges(wordTimes),
    recent: month.slice(-14),
    accuracy7: reviewAccuracy(month.slice(-7)),
    accuracy30: reviewAccuracy(month),
    totalAnswers: log.length,
  };
}
