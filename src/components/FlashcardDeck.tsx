import type { ReactNode } from 'react';
import { cx } from './cx';
import type { DeckTone } from './Flashcard';

// Cards peeking behind the front card, back to front. Geometry from the design file:
// widths 240, 256 and 285 behind a 302px card.
const DECK = [
  { w: 240, top: 0 },
  { w: 256, top: 11.3 },
  { w: 285, top: 29.8 },
];

export interface FlashcardDeckProps {
  /** Tones of the cards behind, back to front. At most three show. */
  behind?: DeckTone[];
  children: ReactNode;
  className?: string;
}

export function FlashcardDeck({
  behind = ['orange', 'blue', 'yellow'],
  children,
  className,
}: FlashcardDeckProps) {
  const shown = behind.slice(-3);
  const offset = DECK.length - shown.length;
  return (
    <div className={cx('kn-deck', className)}>
      {shown.map((tone, i) => {
        const g = DECK[i + offset]!;
        return (
          <span
            key={i}
            aria-hidden="true"
            className={`kn-deck-ghost kn-tone-${tone}`}
            style={{ width: g.w, height: g.w * 1.2587, top: g.top }}
          />
        );
      })}
      {children}
    </div>
  );
}
