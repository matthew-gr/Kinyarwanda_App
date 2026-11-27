// Today's wall (decisions 202 and 204, learner feedback of 27 November): one block per Review
// round and per batch of 20 Learn answers, five to a row, built up from the bottom left. A Review
// block's colour is its share known, from red (0%) through yellow (50%) to green (100%); Learn
// blocks are blue. Tapping a block shows how it went and the words missed.

import { useState } from 'react';
import type { WallBlock } from '../data/wall';

/** Red at 0%, yellow at 50%, green at 100%, in between for the rest. */
const accuracyColour = (share: number) => `hsl(${Math.round(120 * share)} 62% 46%)`;

const LEARN_COLOUR = 'hsl(212 70% 52%)';

export function RoundWall({ blocks }: { blocks: WallBlock[] }) {
  const [open, setOpen] = useState<number | null>(blocks.length - 1);
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
  const rows: number[][] = [];
  for (let i = 0; i < blocks.length; i += 5) rows.push(blocks.slice(i, i + 5).map((_, j) => i + j));
  const shown = open === null ? null : blocks[open];
  return (
    <div className="round-wall-wrap">
      <div className="round-wall" role="group" aria-label="Today’s rounds">
        {[...rows].reverse().map((row, k) => (
          <div className="round-wall-row" key={k}>
            {row.map((i) => {
              const b = blocks[i]!;
              return (
                <button
                  key={i}
                  type="button"
                  className="round-block"
                  style={{
                    background:
                      b.kind === 'learn'
                        ? LEARN_COLOUR
                        : accuracyColour(b.done ? b.known / b.done : 0),
                  }}
                  aria-pressed={open === i}
                  aria-label={say(b, i)}
                  title={say(b, i)}
                  onClick={() => setOpen(open === i ? null : i)}
                />
              );
            })}
          </div>
        ))}
      </div>
      {shown ? (
        <div className="round-wall-detail body-small" aria-live="polite">
          <p className="body-small-bold">
            {shown.kind === 'learn'
              ? say(shown, open!)
              : `${names[open!]}: ${pct(shown)}% known (${shown.known} of ${shown.done})`}
          </p>
          {shown.missed.length > 0 ? (
            <ul>
              {shown.missed.map((m, i) => (
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
