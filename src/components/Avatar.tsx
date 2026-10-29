import { cx } from './cx';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
}

/** A round photo, or the learner's initials until a photo exists. */
export function Avatar({ src, name = '', size = 32, className }: AvatarProps) {
  if (src) {
    return (
      <img className={cx('kn-avatar', className)} src={src} alt={name} width={size} height={size} />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((s) => s.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={cx('kn-avatar', 'kn-avatar-fallback', className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      role="img"
      aria-label={name || 'Profile picture'}
    >
      {initials}
    </span>
  );
}
