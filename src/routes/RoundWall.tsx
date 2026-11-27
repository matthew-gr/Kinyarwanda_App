// Today's wall (decisions 202 and 204, learner feedback of 27 November): one block per Review
// round and per batch of 20 Learn answers, five to a row, built up from the bottom left. A Review
// block's colour is its share known, from red (0%) through yellow (50%) to green (100%); a Learn
// block's goes from red (0%) through purple to blue (100%). Tapping a block shows how it went
// and the words missed; tapping a gray one, the rounds still to come.

import { useState, type PointerEvent } from 'react';
import type { WallBlock } from '../data/wall';
import type { Forecast } from '../engine/rounds';

/** Red at 0%, yellow at 50%, green at 100%, in between for the rest. */
const accuracyColour = (share: number) => `hsl(${Math.round(120 * share)} 62% 46%)`;

/**
 * A Learn batch: blue when every answer was right, red when none was, through purple in
 * between, so Learn blocks never look like Review ones (learner feedback, 27 November).
 */
const learnColour = (share: number) => `hsl(${Math.round(360 - 148 * share)} 66% 50%)`;

/** A cell of the wall: a finished block, or a predicted round still to come. */
type Cell = { block: number } | { predicted: 'soon' | 'later' };

/** What a tapped or hovered cell describes: a finished block, or the predicted rounds of a kind. */
type Shown = { block: number } | { predicted: 'soon' | 'later' };

const same = (a: Shown | null, b: Shown) =>
  a !== null &&
  ('block' in a && 'block' in b
    ? a.block === b.block
    : 'predicted' in a && 'predicted' in b && a.predicted === b.predicted);

const rounds = (n: number) => `${n} more ${n === 1 ? 'round' : 'rounds'}`;

export function RoundWall({ blocks, forecast }: { blocks: WallBlock[]; forecast?: Forecast }) {
  // Descriptions show only for the cell tapped, or the one under the pointer (learner feedback,
  // 27 November: a cleaner finish screen).
  const [open, setOpen] = useState<Shown | null>(null);
  const [hover, setHover] = useState<Shown | null>(null);
  // Numbered within their kind: Round 3, Learn batch 2.
  const names = (() => {
    const seen = { review: 0, learn: 0 };
    return blocks.map((b) =>
      b.kind === 'learn' ? `Learn batch ${++seen.learn}` : `Round ${++seen.review}`,
    );
  })();
  const pct = (b: WallBlock) => (b.done ? Math.round((100 * b.known) / b.done) : 0);
  const say = (b: WallBlock, i: number) =>
    b.kind === 'learn'
      ? `${names[i]}: ${b.known} of ${b.done} right`
      : `${names[i]}: ${pct(b)}% known`;
  const sayPredicted = (kind: 'soon' | 'later') =>
    kind === 'soon'
      ? `About ${rounds(forecast?.soon ?? 0)} for what is due now`
      : `About ${rounds(forecast?.later ?? 0)} for what comes due later today`;
  // Finished blocks first, then predicted rounds: the darker gray for what is due now, the
  // lighter for later today, so the wall fades out and finished blocks fill it as the day goes.
  const cells: Cell[] = [
    ...blocks.map((_, i) => ({ block: i })),
    ...Array.from({ length: forecast?.soon ?? 0 }, () => ({ predicted: 'soon' as const })),
    ...Array.from({ length: forecast?.later ?? 0 }, () => ({ predicted: 'later' as const })),
  ];
  const rows: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 5) rows.push(cells.slice(i, i + 5));
  const current = hover ?? open;
  const props = (cell: Shown, label: string) => ({
    type: 'button' as const,
    'aria-pressed': same(open, cell),
    'aria-label': label,
    onClick: () => setOpen(same(open, cell) ? null : cell),
    // Only a mouse hovers: on a phone a tap would leave a hover behind.
    onPointerEnter: (e: PointerEvent) => {
      if (e.pointerType === 'mouse') setHover(cell);
    },
    onPointerLeave: () => setHover(null),
  });
  const shownBlock = current && 'block' in current ? blocks[current.block] : undefined;
  return (
    <div className="round-wall-wrap">
      <div className="round-wall" role="group" aria-label="Today’s rounds">
        {[...rows].reverse().map((row, k) => (
          <div className="round-wall-row" key={k}>
            {row.map((cell, k) => {
              if ('predicted' in cell)
                return (
                  <button
                    key={`p${k}`}
                    className={`round-block round-block-${cell.predicted}`}
                    {...props(cell, sayPredicted(cell.predicted))}
                  />
                );
              const i = cell.block;
              const b = blocks[i]!;
              return (
                <button
                  key={i}
                  className="round-block"
                  style={{
                    background:
                      b.kind === 'learn'
                        ? learnColour(b.done ? b.known / b.done : 0)
                        : accuracyColour(b.done ? b.known / b.done : 0),
                  }}
                  {...props(cell, say(b, i))}
                />
              );
            })}
          </div>
        ))}
      </div>
      {current && 'predicted' in current ? (
        <div className="round-wall-detail body-small" aria-live="polite">
          <p className="body-small-bold">{sayPredicted(current.predicted)}.</p>
        </div>
      ) : null}
      {shownBlock && current && 'block' in current ? (
        <div className="round-wall-detail body-small" aria-live="polite">
          <p className="body-small-bold">
            {shownBlock.kind === 'learn'
              ? say(shownBlock, current.block)
              : `${names[current.block]}: ${pct(shownBlock)}% known (${shownBlock.known} of ${shownBlock.done})`}
          </p>
          {shownBlock.missed.length > 0 ? (
            <ul>
              {shownBlock.missed.map((m, i) => (
                <li key={i}>
                  <span lang="rw">{m.text}</span>: {m.en}
                </li>
              ))}
            </ul>
          ) : (
            <p className="body-small">No words missed.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
