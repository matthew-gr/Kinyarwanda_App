// Review reminders, shared by the app and the send-reminders server function. No imports, so
// Deno and Vite both load it.
//
// A learner turns reminders on and picks an hour. Each device uploads when its next review or
// recheck comes due. Once an hour the server sends at most one reminder a day, in the hour
// chosen, and only if something is due by then.

/** The hour reminders go out unless the learner picks another: 6 pm. */
export const DEFAULT_REMINDER_HOUR = 18;

/** The date (YYYY-MM-DD) and hour at `now` in a time zone such as Africa/Kigali. */
export function localTime(now: number, timeZone: string): { date: string; hour: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
  } catch {
    // An unknown zone: fall back to Kigali, where most learners are.
    return localTime(now, 'Africa/Kigali');
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}

export interface ReminderState {
  enabled: boolean;
  hour: number;
  timezone: string;
  /** The earliest review or recheck due on any of the learner's devices, or null. */
  next_due_at: string | null;
  /** The local date the last reminder went out. */
  last_sent_on: string | null;
}

/** Whether to send a reminder now. Returns the local date to record as sent, or null. */
export function reminderDue(r: ReminderState, now: number): string | null {
  if (!r.enabled || !r.next_due_at) return null;
  const { date, hour } = localTime(now, r.timezone);
  if (hour !== r.hour || r.last_sent_on === date) return null;
  // Something must be due by the end of the reminder hour.
  if (Date.parse(r.next_due_at) > now + 60 * 60 * 1000) return null;
  return date;
}

export const REMINDER_TEXT = {
  title: 'Time to review',
  body: 'Your Kinyarwanda reviews are ready. A few minutes now keeps the words fresh.',
  url: '/review',
} as const;
