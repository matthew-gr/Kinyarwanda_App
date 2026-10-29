import type { ReactNode } from 'react';
import { Badge } from './Badge';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';

/** Port of the design system's StatRow: a learning stat with its value on the right. */
export function StatRow({
  label,
  value,
  icon,
  strong = false,
  badge = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  icon?: IconName;
  strong?: boolean;
  /** Show the value as a level pill. */
  badge?: boolean;
  className?: string;
}) {
  return (
    <div className={cx('kn-stat', className)}>
      <span className="kn-stat-label h3">{label}</span>
      <span className="kn-stat-value">
        {icon ? <Icon name={icon} size={26} /> : null}
        {badge ? (
          <Badge tone="level">{value}</Badge>
        ) : (
          <span className={strong ? 'body-small-bold' : 'body-small'}>{value}</span>
        )}
      </span>
    </div>
  );
}
