// A word on the back of its card in its pieces (decision 208; learner feedback of 27 November):
// a noun's class prefix in its class's colour, and the stem underlined, to tap for the words
// that share it and what the prefix says.

import { useEffect, useState, useSyncExternalStore } from 'react';
import { getHintLanguages, onHintLanguages } from '../data/hintLanguages';
import { loadWordNotes, type WordNotes } from '../data/stems';
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

/**
 * Under the card once its stem or Hints is tapped (decisions 208 and 211): what the prefix is,
 * the other words of its family, and memory hints, in Swahili and German too when chosen.
 */
export function WordNotesPanel({ item, shape }: { item: Item; shape: WordShape | null }) {
  const [notes, setNotes] = useState<WordNotes | null>(null);
  const langs = useSyncExternalStore(onHintLanguages, getHintLanguages);
  useEffect(() => {
    let alive = true;
    void loadWordNotes(item).then((n) => alive && setNotes(n));
    return () => {
      alive = false;
    };
  }, [item]);
  const prefix = shape ? prefixOf(shape) : undefined;
  const hint = notes?.hint;
  const hints = hint
    ? [hint.en, langs.sw ? hint.sw : undefined, langs.de ? hint.de : undefined].filter(
        (h): h is string => Boolean(h),
      )
    : [];
  return (
    <div className="stem-panel body-small" aria-live="polite">
      {shape ? (
        <p className="body-small-bold">
          Stem <span lang="rw">-{shape.stem}-</span>
        </p>
      ) : null}
      {shape?.nounClass && prefix ? (
        <p>
          <span lang="rw" className={`word-prefix nc-${shape.colour}`}>
            {prefix.toLowerCase()}-
          </span>{' '}
          is the prefix of noun class {shape.nounClass}: {CLASS_MEANINGS[shape.nounClass]}.
        </p>
      ) : shape && item.word_type === 'verb' ? (
        <p>The stem of the verb {item.base}, which its other forms are built on.</p>
      ) : null}
      {notes && notes.family.length > 0 ? (
        <>
          <p className="body-small-bold">Same family</p>
          <ul>
            {notes.family.map((w) => (
              <li key={w.base}>
                <span lang="rw">{w.base}</span>: {w.en}
                {w.learned ? <span className="family-learned"> ✓ learned</span> : null}
              </li>
            ))}
          </ul>
          {notes.familyNote ? <p>{notes.familyNote}</p> : null}
        </>
      ) : notes && shape ? (
        <p>No other word in the course is known to share this stem with a related meaning.</p>
      ) : null}
      {hints.length > 0 ? (
        <>
          <p className="body-small-bold">To remember it</p>
          <ul>
            {hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
