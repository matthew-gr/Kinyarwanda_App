import type { DayActivity } from '../engine/stats';

const SHORT = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const LONG = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

const dateOf = (day: string) => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12);
};

/**
 * One measure per day as thin bars, newest on the right. A single series, so the title names
 * it and there is no legend. Each bar shows its value on hover, and a table carries the
 * same numbers for screen readers and keyboard users.
 */
export function DayBars({
  title,
  days,
  value,
  unit,
  tone,
}: {
  title: string;
  days: DayActivity[];
  value: (d: DayActivity) => number;
  /** Singular; "s" is added for other counts. */
  unit: string;
  tone: 'green' | 'blue';
}) {
  const values = days.map(value);
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  const words = (n: number) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  const id = `bars-${title.replace(/\W+/g, '-').toLowerCase()}`;

  return (
    <figure className="daybars" aria-labelledby={id}>
      <figcaption id={id} className="daybars-head">
        <span className="h3-bold">{title}</span>
        <span className="body-small daybars-total">
          {words(total)} in {days.length} days
        </span>
      </figcaption>
      <div className="daybars-plot" aria-hidden="true">
        <span className="daybars-max caption">{max}</span>
        {days.map((d, i) => (
          <div
            key={d.day}
            className="daybars-col"
            data-tip={`${SHORT.format(dateOf(d.day))}: ${words(values[i]!)}`}
          >
            <span
              className={`daybars-bar daybars-${tone}`}
              style={{ height: `${(values[i]! / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="daybars-axis caption" aria-hidden="true">
        <span>{days[0] ? SHORT.format(dateOf(days[0].day)) : ''}</span>
        <span>Today</span>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {days.map((d, i) => (
            <tr key={d.day}>
              <th scope="row">{LONG.format(dateOf(d.day))}</th>
              <td>{words(values[i]!)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
