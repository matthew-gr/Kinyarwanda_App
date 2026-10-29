import type { ReactNode } from 'react';
import { cx } from './cx';

export function Badge({
  tone = 'level',
  children,
  className,
}: {
  tone?: 'level' | 'phrase';
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx('kn-badge', `kn-badge-${tone}`, tone === 'level' && 'body-small', className)}
    >
      {children}
    </span>
  );
}
