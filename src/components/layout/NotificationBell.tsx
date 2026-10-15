import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CheckCheck,
  CreditCard,
  TriangleAlert,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { useNotifications } from '../../context/NotificationsContext';
import { Notification } from '../../types';
import { formatRelativeTime } from '../../utils';

const TYPE_ICON: Record<Notification['type'], LucideIcon> = {
  user: UserPlus,
  billing: CreditCard,
  alert: TriangleAlert,
  report: BarChart3,
};

// Above this, the badge shows "9+" so it stays a small circle
const MAX_BADGE_COUNT = 9;

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // While open: close on a click outside, or on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        bellRef.current?.focus(); // give keyboard users their place back
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    // Cleanup runs when the dropdown closes or the component unmounts
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (notification: Notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const badgeText =
    unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : `${unreadCount}`;

  return (
    <div className="notifications" ref={containerRef}>
      <button
        ref={bellRef}
        type="button"
        className="navbar__icon-btn notifications__bell"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        aria-haspopup="dialog"
        aria-controls="notifications-panel"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notifications__badge" aria-hidden="true">
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="notifications-panel"
          className="notifications__panel"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="notifications__header">
            <span className="notifications__title">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notifications__mark-all"
                onClick={markAllAsRead}
              >
                <CheckCheck size={14} />
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="notifications__empty">You&apos;re all caught up.</p>
          ) : (
            <ul className="notifications__list">
              {notifications.map((notification) => {
                const Icon = TYPE_ICON[notification.type];

                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={clsx(
                        'notifications__item',
                        !notification.read && 'notifications__item--unread'
                      )}
                      onClick={() => handleSelect(notification)}
                    >
                      <span
                        className={clsx(
                          'notifications__icon',
                          `notifications__icon--${notification.type}`
                        )}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="notifications__content">
                        <span className="notifications__item-title">
                          {notification.title}
                          {!notification.read && (
                            <span className="notifications__unread-dot">
                              <span className="visually-hidden">(unread)</span>
                            </span>
                          )}
                        </span>
                        <span className="notifications__message">
                          {notification.message}
                        </span>
                        <span className="notifications__time">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
