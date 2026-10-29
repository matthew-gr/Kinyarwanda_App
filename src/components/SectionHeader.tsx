import type { ReactNode } from 'react';
import { cx } from './cx';

export interface SectionHeaderProps {
  title: ReactNode;
  size?: 'large' | 'default';
  subtitle?: ReactNode;
  highlight?: string;
  action?: ReactNode;
  onAction?: () => void;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export function SectionHeader({
  title,
  size = 'default',
  subtitle,
  highlight,
  action,
  onAction,
  as: Heading = 'h2',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cx('kn-section', className)}>
      <div className="kn-section-text">
        <Heading className={cx('kn-section-title', size === 'large' ? 'h1-bold' : 'h2-bold')}>
          {title}
          {highlight ? <span className="kn-section-highlight"> {highlight}</span> : null}
        </Heading>
        {subtitle ? <p className="kn-section-sub body">{subtitle}</p> : null}
      </div>
      {action ? (
        <button
          type="button"
          className="kn-reset-btn kn-section-action body-small"
          onClick={onAction}
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}
