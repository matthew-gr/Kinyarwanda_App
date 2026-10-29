import { cx } from './cx';

export interface ProgressBarProps {
  /** 0 to 1. */
  value: number;
  size?: 'mini' | 'session';
  label: string;
  className?: string;
}

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

export function ProgressBar({ value, size = 'session', label, className }: ProgressBarProps) {
  const v = clamp01(value);
  return (
    <div
      className={cx('kn-progress', `kn-progress-${size}`, className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      aria-label={label}
    >
      <span className="kn-progress-fill" style={{ width: `${v * 100}%` }} />
    </div>
  );
}
