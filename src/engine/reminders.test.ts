import { describe, expect, it } from 'vitest';
import {
  localTime,
  reminderDue,
  type ReminderState,
} from '../../supabase/functions/_shared/reminders';

// 3 November 2026, 16:00 UTC, which is 18:00 in Kigali (UTC+2).
const SIX_PM_KIGALI = Date.parse('2026-11-03T16:00:00Z');

const base: ReminderState = {
  enabled: true,
  hour: 18,
  timezone: 'Africa/Kigali',
  next_due_at: '2026-11-03T15:00:00Z',
  last_sent_on: null,
};

describe('review reminders', () => {
  it('reads the local date and hour in the learner’s time zone', () => {
    expect(localTime(SIX_PM_KIGALI, 'Africa/Kigali')).toEqual({ date: '2026-11-03', hour: 18 });
    expect(localTime(SIX_PM_KIGALI, 'America/New_York')).toEqual({
      date: '2026-11-03',
      hour: 11,
    });
    expect(localTime(SIX_PM_KIGALI, 'Not/AZone')).toEqual({ date: '2026-11-03', hour: 18 });
  });

  it('sends in the chosen hour when something is due, once a day', () => {
    expect(reminderDue(base, SIX_PM_KIGALI)).toBe('2026-11-03');
    expect(reminderDue({ ...base, last_sent_on: '2026-11-03' }, SIX_PM_KIGALI)).toBeNull();
    expect(reminderDue({ ...base, last_sent_on: '2026-11-02' }, SIX_PM_KIGALI)).toBe('2026-11-03');
  });

  it('waits for the chosen hour', () => {
    expect(reminderDue({ ...base, hour: 19 }, SIX_PM_KIGALI)).toBeNull();
    expect(reminderDue(base, SIX_PM_KIGALI + 60 * 60 * 1000)).toBeNull();
  });

  it('sends only if a review comes due by the end of the hour, and only when turned on', () => {
    expect(reminderDue({ ...base, next_due_at: '2026-11-03T16:45:00Z' }, SIX_PM_KIGALI)).toBe(
      '2026-11-03',
    );
    expect(reminderDue({ ...base, next_due_at: '2026-11-04T08:00:00Z' }, SIX_PM_KIGALI)).toBeNull();
    expect(reminderDue({ ...base, next_due_at: null }, SIX_PM_KIGALI)).toBeNull();
    expect(reminderDue({ ...base, enabled: false }, SIX_PM_KIGALI)).toBeNull();
  });
});
