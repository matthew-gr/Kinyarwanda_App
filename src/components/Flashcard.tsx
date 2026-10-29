import type { ReactNode, Ref } from 'react';
import { Badge } from './Badge';
import { cx } from './cx';
import { Icon } from './Icon';

export type DeckTone = 'green' | 'yellow' | 'blue' | 'orange';

export interface FlashcardProps {
  word: string;
  /** Syllables joined with underscores, long vowels doubled. */
  phonetic?: string;
  translation: ReactNode;
  /** A line under the translation, such as the dictionary form. */
  detail?: ReactNode;
  /** Word-type tag: WORD, VERB or PHRASE. */
  tag?: string;
  tone?: DeckTone;
  /** `both` shows front and back together, for an introduction. */
  side: 'front' | 'back' | 'both';
  hint?: string;
  /** Called when the front is tapped. The card only flips front to back. */
  onFlip?: () => void;
  /** The play button shows only when this is set. */
  onSpeak?: () => void;
  /** The front's flip button, for moving focus to a new card. */
  flipRef?: Ref<HTMLButtonElement>;
  className?: string;
}

function SpeakButton({ onSpeak, hidden }: { onSpeak?: () => void; hidden?: boolean }) {
  if (!onSpeak) return null;
  return (
    <button
      type="button"
      className="kn-reset-btn kn-flash-speak"
      onClick={onSpeak}
      aria-label="Play pronunciation"
      tabIndex={hidden ? -1 : undefined}
    >
      <Icon name="speaker" size={24} />
    </button>
  );
}

export function Flashcard({
  word,
  phonetic,
  translation,
  detail,
  tag,
  tone = 'green',
  side,
  hint = 'Tap to reveal meaning',
  onFlip,
  onSpeak,
  flipRef,
  className,
}: FlashcardProps) {
  if (side === 'both') {
    return (
      <div className={cx('kn-flash', `kn-flash-${tone}`, 'kn-flash-intro', className)}>
        <div className="kn-flash-face kn-flash-front">
          {tag ? (
            <Badge tone="phrase" className="kn-flash-tag kn-flash-tag-left">
              {tag}
            </Badge>
          ) : null}
          <SpeakButton onSpeak={onSpeak} />
          <div className="kn-flash-center">
            <p className="kn-flash-word flash-word">{word}</p>
            {phonetic ? <p className="kn-flash-phonetic phonetic">{phonetic}</p> : null}
            <span className="kn-flash-rule" />
            <p className="kn-flash-translation flash-translation">{translation}</p>
            {detail ? <p className="kn-flash-detail body">{detail}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  const isBack = side === 'back';
  return (
    <div className={cx('kn-flash', `kn-flash-${tone}`, isBack && 'is-back', className)}>
      <div className="kn-flash-inner">
        <div className="kn-flash-face kn-flash-front" aria-hidden={isBack || undefined}>
          <button
            ref={flipRef}
            type="button"
            className="kn-reset-btn kn-flash-flip"
            onClick={onFlip}
            tabIndex={isBack ? -1 : undefined}
          >
            <span className="kn-flash-center">
              <span className="kn-flash-word flash-word">{word}</span>
              {phonetic ? <span className="kn-flash-phonetic phonetic">{phonetic}</span> : null}
            </span>
            <span className="kn-flash-hint">
              <Icon name="bulb" size={24} />
              <span>{hint}</span>
            </span>
          </button>
          <SpeakButton onSpeak={onSpeak} hidden={isBack} />
        </div>
        <div className="kn-flash-face kn-flash-back" aria-hidden={!isBack || undefined}>
          {tag ? (
            <Badge tone="phrase" className="kn-flash-tag">
              {tag}
            </Badge>
          ) : null}
          <div className="kn-flash-center">
            <p className="kn-flash-backword flash-word">{word}</p>
            <span className="kn-flash-rule" />
            <p className="kn-flash-translation flash-translation">{translation}</p>
            {detail ? <p className="kn-flash-detail body">{detail}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
