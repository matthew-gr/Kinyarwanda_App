import { useRef, useState } from 'react';
import { CourseCard } from '../components/CourseCard';
import { PageDots } from '../components/PageDots';

export interface ModuleCard {
  title: string;
  description: string;
  /** Left meta line; "Coming soon" for modules not built yet. */
  meta: string;
  /** Right meta line, next to the clock. */
  detail?: string;
  onClick?: () => void;
}

const TONES = ['yellow', 'blue', 'green'] as const;
/** Card width plus the gap, from the design system's CourseCard and carousel. */
const STEP = 220 + 9;

/** The eight modules as a swipeable row of course cards, with page dots under it. */
export function ModuleCarousel({ cards }: { cards: ModuleCard[] }) {
  const [active, setActive] = useState(0);
  const row = useRef<HTMLDivElement>(null);

  return (
    <div className="module-carousel">
      <div
        ref={row}
        className="kn-carousel"
        role="list"
        aria-label="Modules"
        onScroll={() => {
          const el = row.current;
          if (!el) return;
          const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
          setActive(atEnd ? cards.length - 1 : Math.round(el.scrollLeft / STEP));
        }}
      >
        {cards.map((c, i) => (
          <div key={c.title} role="listitem">
            <CourseCard
              title={c.title}
              description={c.description}
              tone={TONES[i % TONES.length]}
              courses={c.meta}
              duration={c.detail}
              onClick={c.onClick}
              locked={!c.onClick}
            />
          </div>
        ))}
      </div>
      <PageDots count={cards.length} active={active} />
    </div>
  );
}
