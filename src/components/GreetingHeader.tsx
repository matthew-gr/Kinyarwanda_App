import { Avatar } from './Avatar';
import { cx } from './cx';
import { Icon } from './Icon';

export interface GreetingHeaderProps {
  name: string;
  greeting?: string;
  avatarSrc?: string;
  onNotifications?: () => void;
  className?: string;
}

export function GreetingHeader({
  name,
  greeting = 'welcome',
  avatarSrc,
  onNotifications,
  className,
}: GreetingHeaderProps) {
  return (
    <div className={cx('kn-greeting', className)}>
      <Avatar src={avatarSrc} name={name} size={63} />
      <div className="kn-greeting-text">
        <span className="kn-greeting-hello h3-bold">{greeting}</span>
        {/* yellow-name is decorative at 1.5:1; nothing the learner must read goes here. */}
        <span className="kn-greeting-name body">{name}</span>
      </div>
      <button
        type="button"
        className="kn-reset-btn kn-greeting-bell"
        onClick={onNotifications}
        aria-label="Notifications"
      >
        <Icon name="notification" size={30} />
      </button>
    </div>
  );
}
