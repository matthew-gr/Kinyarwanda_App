import { cx } from './cx';
import { Icon, type IconName } from './Icon';

export interface BottomNavItem {
  id: string;
  icon: IconName;
  label: string;
}

const NAV: BottomNavItem[] = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'search', icon: 'search', label: 'Search' },
  { id: 'history', icon: 'clock', label: 'History' },
  { id: 'profile', icon: 'user', label: 'Profile' },
];

export interface BottomNavProps {
  items?: BottomNavItem[];
  active?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export function BottomNav({ items = NAV, active, onSelect, className }: BottomNavProps) {
  return (
    <nav className={cx('kn-nav', className)} aria-label="Main">
      <div className="kn-nav-list">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            className="kn-reset-btn kn-nav-item"
            aria-label={it.label}
            aria-current={active === it.id ? 'page' : undefined}
            onClick={() => onSelect?.(it.id)}
          >
            <Icon name={it.icon} size={24} />
          </button>
        ))}
      </div>
    </nav>
  );
}
