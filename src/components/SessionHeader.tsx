import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { ProgressBar } from './ProgressBar';

export interface SessionHeaderProps {
  /** Left label, after the star. In the design: the level. */
  level: ReactNode;
  /** Right label. In the design: the timer. */
  meta?: ReactNode;
  /** 0 to 1. */
  progress: number;
  progressLabel?: string;
  className?: string;
}

export function SessionHeader({
  level,
  meta,
  progress,
  progressLabel = 'Session progress',
  className,
}: SessionHeaderProps) {
  return (
    <div className={cx('kn-session', className)}>
      <div className="kn-session-row">
        <span>
          <Icon name="star" size={36} />
          <span className="meta-label">{level}</span>
        </span>
        {meta ? (
          <span>
            <Icon name="fire" size={17} />
            <span className="meta-label">{meta}</span>
          </span>
        ) : null}
      </div>
      <ProgressBar value={progress} size="session" label={progressLabel} />
    </div>
  );
}
