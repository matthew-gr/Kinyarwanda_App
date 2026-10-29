import type { ReactNode } from 'react';
import { cx } from './cx';
import { ProgressBar } from './ProgressBar';

export interface PracticeRowProps {
  title: string;
  subtitle?: ReactNode;
  tone?: 'green' | 'blue' | 'yellow';
  /** 60px thumbnail. Not available yet: the tint panel shows empty. */
  image?: string;
  /** 0 to 1. Omit to hide the percentage and bar. */
  progress?: number;
  onClick?: () => void;
  /** Shown but not usable. Says so in words, not only by style. */
  locked?: boolean;
  className?: string;
}

export function PracticeRow({
  title,
  subtitle,
  tone = 'green',
  image,
  progress,
  onClick,
  locked = false,
  className,
}: PracticeRowProps) {
  const body = (
    <>
      <span className="kn-practice-thumb">{image ? <img src={image} alt="" /> : null}</span>
      <span className="kn-practice-text">
        <span className="kn-practice-title h3">{title}</span>
        {subtitle ? <span className="kn-practice-sub body-small">{subtitle}</span> : null}
      </span>
      {progress === undefined ? null : (
        <span className="kn-practice-progress">
          <span className="kn-practice-pct percent">
            {Math.round(Math.min(1, Math.max(0, progress)) * 100)}%
          </span>
          <ProgressBar value={progress} size="mini" label={`${title} progress`} />
        </span>
      )}
    </>
  );
  const classes = cx(
    'kn-reset-btn',
    'kn-practice',
    `kn-practice-${tone}`,
    locked && 'is-locked',
    className,
  );
  if (onClick && !locked) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {body}
      </button>
    );
  }
  return (
    <div className={classes} aria-disabled={locked || undefined}>
      {body}
    </div>
  );
}
