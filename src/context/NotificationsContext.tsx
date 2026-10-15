import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Notification } from '../types';
import { mockNotifications } from '../services/mockData';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

interface NotificationsProviderProps {
  children: ReactNode;
  initialNotifications?: Notification[];
}

// Lives above the routes in App.tsx, so read/unread state survives page
// changes (each page renders its own Navbar, which would otherwise reset)
export const NotificationsProvider = ({
  children,
  initialNotifications = mockNotifications,
}: NotificationsProviderProps) => {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  const markAsRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
  }, []);

  // Memoised so consumers only re-render when the notifications change
  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, markAsRead, markAllAsRead]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextValue => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used inside <NotificationsProvider>'
    );
  }
  return context;
};
