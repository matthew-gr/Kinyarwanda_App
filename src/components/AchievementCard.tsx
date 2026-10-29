import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';

/** Port of the design system's AchievementCard: a score tile for a carousel on Profile. */
export function AchievementCard({
  value,
  title,
  lines = [],
  icon,
  tone = 'orange',
  muted = false,
  className,
}: {
  value: ReactNode;
  title: ReactNode;
  lines?: ReactNode[];
  icon?: IconName;
  tone?: 'orange' | 'green' | 'blue';
  /** Greys the title, for a badge not earned yet. */
  muted?: boolean;
  className?: string;
}) {
  return (
    <div className={cx('kn-ach', `kn-ach-${tone}`, muted && 'is-muted', className)}>
      <span className="kn-ach-tile h3-bold">{value}</span>
      {icon ? <Icon name={icon} size={32} className="kn-ach-icon" /> : null}
      <div className="kn-ach-text">
        <p className={cx('kn-ach-title', muted ? 'h3-bold' : 'body-bold')}>{title}</p>
        {lines.map((l, i) => (
          <p key={i} className="kn-ach-line body-small">
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}
