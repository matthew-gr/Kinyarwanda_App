import { Avatar } from './Avatar';
import { cx } from './cx';
import { Icon } from './Icon';

export interface GreetingHeaderProps {
  name: string;
  greeting?: string;
  avatarSrc?: string;
  /** Opens where the name and picture are edited. */
  onAvatar?: () => void;
  onNotifications?: () => void;
  className?: string;
}

export function GreetingHeader({
  name,
  greeting = 'welcome',
  avatarSrc,
  onAvatar,
  onNotifications,
  className,
}: GreetingHeaderProps) {
  return (
    <div className={cx('kn-greeting', className)}>
      {onAvatar ? (
        <button
          type="button"
          className="kn-reset-btn kn-greeting-avatar"
          onClick={onAvatar}
          aria-label="Edit your name and picture"
        >
          <Avatar src={avatarSrc} name={name} size={63} />
        </button>
      ) : (
        <Avatar src={avatarSrc} name={name} size={63} />
      )}
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
