import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export interface CourseCardProps {
  title: string;
  description?: ReactNode;
  tone?: 'yellow' | 'blue' | 'green';
  /** About 111px square. Not available yet: the tint panel shows empty. */
  image?: string;
  /** Left meta line, for example "3 of 22 learned". */
  courses?: ReactNode;
  /** Right meta line, for example "5 mins". */
  duration?: ReactNode;
  onClick?: () => void;
  /** Shown but not usable. Says so in words, not only by style. */
  locked?: boolean;
  className?: string;
}

/** Port of the design system's CourseCard, with a locked state added. */
export function CourseCard({
  title,
  description,
  tone = 'yellow',
  image,
  courses,
  duration,
  onClick,
  locked = false,
  className,
}: CourseCardProps) {
  const body = (
    <>
      <span className="kn-course-panel">{image ? <img src={image} alt="" /> : null}</span>
      <span className="kn-course-text">
        <span className="kn-course-title h3-bold">{title}</span>
        {description ? <span className="kn-course-desc body-small">{description}</span> : null}
      </span>
      <span className="kn-course-meta caption">
        {courses != null ? (
          <span>
            <span className="kn-course-tile">
              <Icon name="global-learning" size={8} />
            </span>
            {courses}
          </span>
        ) : (
          <span />
        )}
        {duration ? (
          <span>
            <Icon name="time-fill" size={13} className="kn-course-clock" />
            {duration}
          </span>
        ) : null}
      </span>
    </>
  );
  const classes = cx(
    'kn-reset-btn',
    'kn-course',
    `kn-course-${tone}`,
    locked && 'is-locked',
    className,
  );
  if (onClick && !locked) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {body}
      </button>
    );
  }
  return (
    <div className={classes} aria-disabled={locked || undefined}>
      {body}
    </div>
  );
}
