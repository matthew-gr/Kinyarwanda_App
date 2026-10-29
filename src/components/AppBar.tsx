import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export interface AppBarProps {
  title: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  trailing?: ReactNode;
  className?: string;
}

export function AppBar({ title, onBack, backLabel = 'Back', trailing, className }: AppBarProps) {
  return (
    <header className={cx('kn-appbar', className)}>
      <button
        type="button"
        className="kn-reset-btn kn-appbar-back"
        onClick={onBack}
        aria-label={backLabel}
      >
        <Icon name="chevron" size={16} rotate={-90} />
      </button>
      <h1 className="kn-appbar-title appbar-title">{title}</h1>
      <div className="kn-appbar-trailing">{trailing}</div>
    </header>
  );
}
