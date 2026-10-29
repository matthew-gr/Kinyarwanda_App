import type { ReactNode } from 'react';
import { cx } from './cx';

export interface HeroBannerProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** The mascot. Not available yet: the band shows without it. */
  image?: string;
  imageAlt?: string;
  children?: ReactNode;
  className?: string;
}

export function HeroBanner({
  title,
  subtitle,
  image,
  imageAlt = '',
  children,
  className,
}: HeroBannerProps) {
  return (
    <div className={cx('kn-hero', !image && 'kn-hero-noimg', className)}>
      <div className="kn-hero-band">
        <p className="kn-hero-title h2-bold">{title}</p>
        {subtitle ? <p className="kn-hero-sub body-small">{subtitle}</p> : null}
        {children}
      </div>
      {image ? <img className="kn-hero-img" src={image} alt={imageAlt} /> : null}
    </div>
  );
}
