// Time spent learning (decision 190), on the History tab: today, this week and this month, and
// bars for the last 14 days, 8 weeks or 6 months. Time counts while the app is open and in use.

import { useEffect, useState, useSyncExternalStore } from 'react';
import { loadActivity } from '../data/activity';
import {
  totals,
  timeInWords,
  type Period,
  type PeriodTotal,
  type WeekStart,
} from '../engine/activity';
import { getWeekStart, onWeekStart, setWeekStart } from '../data/weekStart';

const PERIODS: { period: Period; label: string; count: number }[] = [
  { period: 'day', label: 'Daily', count: 14 },
  { period: 'week', label: 'Weekly', count: 8 },
  { period: 'month', label: 'Monthly', count: 6 },
];

const dateOf = (day: string) => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12);
};
const DAY = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const LONG_DAY = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const MONTH = new Intl.DateTimeFormat(undefined, { month: 'short' });
const LONG_MONTH = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

function names(t: PeriodTotal, period: Period): { short: string; long: string } {
  const d = dateOf(t.start);
  if (period === 'day') return { short: DAY.format(d), long: LONG_DAY.format(d) };
  if (period === 'week') return { short: DAY.format(d), long: `Week of ${LONG_DAY.format(d)}` };
  return { short: MONTH.format(d), long: LONG_MONTH.format(d) };
}

const NOW_LABEL: Record<Period, string> = { day: 'Today', week: 'This week', month: 'This month' };

export function TimeSpent({ version }: { version: number }) {
  const [byDay, setByDay] = useState<Map<string, number> | null>(null);
  const [period, setPeriod] = useState<Period>('day');
  const [now, setNow] = useState(() => Date.now());
  const weekStart = useSyncExternalStore(onWeekStart, getWeekStart, getWeekStart);

  useEffect(() => {
    let alive = true;
    void loadActivity().then((m) => {
      if (alive) setByDay(m);
    });
    return () => {
      alive = false;
    };
  }, [version, now]);

  // The time on screen keeps up while the tab is open.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!byDay) return null;
  const spec = PERIODS.find((p) => p.period === period)!;
  const bars = totals(byDay, period, now, spec.count, weekStart);
  const current = (p: Period) => totals(byDay, p, now, 1, weekStart)[0]!.ms;
  const max = Math.max(60_000, ...bars.map((b) => b.ms));
  const all = bars.reduce((a, b) => a + b.ms, 0);

  return (
    <section className="stack" aria-labelledby="time-spent">
      <div>
        <h2 id="time-spent" className="h3-bold">
          Time learning
        </h2>
        <p className="body-small history-note">
          Counted while the app is open and you tap at least once a minute.
        </p>
      </div>
      <dl className="time-totals">
        {(['day', 'week', 'month'] as const).map((p) => (
          <div key={p}>
            <dt className="body-small">{NOW_LABEL[p]}</dt>
            <dd className="body-bold">{timeInWords(current(p))}</dd>
          </div>
        ))}
      </dl>
      <nav className="deck-switch time-switch" aria-label="Time by">
        {PERIODS.map((p) => (
          <button
            key={p.period}
            type="button"
            className="kn-reset-btn deck-switch-option body-bold"
            aria-current={p.period === period ? 'page' : undefined}
            onClick={() => setPeriod(p.period)}
          >
            {p.label}
          </button>
        ))}
      </nav>
      {period === 'week' ? (
        <label className="field time-week-start" htmlFor="week-start">
          <span className="body-small">Weeks start on</span>
          <select
            id="week-start"
            className="field-input field-select body-small"
            value={weekStart}
            onChange={(e) => setWeekStart(Number(e.target.value) as WeekStart)}
          >
            <option value={1}>Monday</option>
            <option value={0}>Sunday</option>
          </select>
        </label>
      ) : null}
      <figure className="daybars" aria-labelledby="time-bars">
        <figcaption id="time-bars" className="daybars-head">
          <span className="h3-bold">{spec.label} time</span>
          <span className="body-small daybars-total">
            {timeInWords(all)} in {spec.count} {period === 'day' ? 'days' : `${period}s`}
          </span>
        </figcaption>
        <div className="daybars-plot" aria-hidden="true">
          <span className="daybars-max caption">{timeInWords(max)}</span>
          {bars.map((b) => (
            <div
              key={b.start}
              className="daybars-col"
              data-tip={`${names(b, period).short}: ${timeInWords(b.ms)}`}
            >
              <span
                className="daybars-bar daybars-green"
                style={{ height: `${(b.ms / max) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="daybars-axis caption" aria-hidden="true">
          <span>{bars[0] ? names(bars[0], period).short : ''}</span>
          <span>{NOW_LABEL[period]}</span>
        </div>
        <table className="sr-only">
          <caption>{spec.label} time learning</caption>
          <tbody>
            {bars.map((b) => (
              <tr key={b.start}>
                <th scope="row">{names(b, period).long}</th>
                <td>{timeInWords(b.ms)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    </section>
  );
}
