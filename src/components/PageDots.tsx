import { cx } from './cx';

/** Port of the design system's PageDots: which page of a carousel is in view. */
export function PageDots({
  count,
  active,
  className,
}: {
  count: number;
  active: number;
  className?: string;
}) {
  return (
    <div
      className={cx('kn-dots', className)}
      role="img"
      aria-label={`Page ${active + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={cx('kn-dot', i === active && 'is-active')} />
      ))}
    </div>
  );
}
