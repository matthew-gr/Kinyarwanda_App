// A word on the back of its card in its pieces (decision 208; learner feedback of 27 November):
// a noun's class prefix in its class's colour, and the stem underlined, to tap for the words
// that share it and what the prefix says.

import { useEffect, useState } from 'react';
import { loadStemWords, type StemWords } from '../data/stems';
import { CLASS_MEANINGS, type WordShape } from '../engine/morphology';
import type { Item } from '../engine/types';

export function WordParts({
  shape,
  open,
  onStem,
}: {
  shape: WordShape;
  open: boolean;
  onStem: () => void;
}) {
  return (
    <span className="word-parts">
      {shape.parts.map((p, i) =>
        p.role === 'stem' ? (
          <button
            key={i}
            type="button"
            className="kn-reset-btn word-stem"
            aria-expanded={open}
            aria-label={`Stem ${p.text}: words that share it`}
            onClick={(e) => {
              // The back of the card doesn't flip, but the tap shouldn't reach it either.
              e.stopPropagation();
              onStem();
            }}
          >
            {p.text}
          </button>
        ) : (
          <span
            key={i}
            className={
              p.role === 'prefix' && shape.colour ? `word-prefix nc-${shape.colour}` : undefined
            }
          >
            {p.text}
          </span>
        ),
      )}
    </span>
  );
}

const prefixOf = (shape: WordShape) => shape.parts.find((p) => p.role === 'prefix')?.text;

/** Under the card once its stem is tapped: what the prefix is, and the words sharing the stem. */
export function StemPanel({ item, shape }: { item: Item; shape: WordShape }) {
  const [words, setWords] = useState<StemWords | null>(null);
  useEffect(() => {
    let alive = true;
    void loadStemWords(item, shape.stem).then((w) => alive && setWords(w));
    return () => {
      alive = false;
    };
  }, [item, shape.stem]);
  const prefix = prefixOf(shape);
  return (
    <div className="stem-panel body-small" aria-live="polite">
      <p className="body-small-bold">
        Stem <span lang="rw">-{shape.stem}-</span>
      </p>
      {shape.nounClass && prefix ? (
        <p>
          <span lang="rw" className={`word-prefix nc-${shape.colour}`}>
            {prefix.toLowerCase()}-
          </span>{' '}
          is the prefix of noun class {shape.nounClass}: {CLASS_MEANINGS[shape.nounClass]}.
        </p>
      ) : item.word_type === 'verb' ? (
        <p>The stem of the verb {item.base}, which its other forms are built on.</p>
      ) : null}
      {words === null ? null : words.known.length > 0 ? (
        <>
          <p>Words you’ve learned with it:</p>
          <ul>
            {words.known.map((w) => (
              <li key={w.base}>
                <span lang="rw">{w.base}</span>: {w.en}
              </li>
            ))}
          </ul>
          {words.notYet > 0 ? <p>And {words.notYet} more in the course to learn.</p> : null}
        </>
      ) : (
        <p>
          None of the words you’ve learned share it yet
          {words.notYet > 0
            ? `; ${words.notYet} in the course ${words.notYet === 1 ? 'does' : 'do'}.`
            : '.'}
        </p>
      )}
    </div>
  );
}
