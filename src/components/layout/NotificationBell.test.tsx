import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from './NotificationBell';
import { NotificationsProvider } from '../../context/NotificationsContext';
import { Notification } from '../../types';

// CRA's Jest can't load React Router v7, and we only need to know that the
// bell asks to navigate -- so replace the router with a fake useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), {
  virtual: true,
});

const notifications: Notification[] = [
  {
    id: 'a',
    type: 'alert',
    title: 'Payment failed',
    message: 'Update your card.',
    createdAt: new Date().toISOString(),
    read: false,
    link: '/billing',
  },
  {
    id: 'b',
    type: 'user',
    title: 'New team member',
    message: 'Someone joined.',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 'c',
    type: 'report',
    title: 'Weekly report ready',
    message: 'Traffic is up.',
    createdAt: new Date().toISOString(),
    read: true,
  },
];

const renderBell = (initial = notifications) =>
  render(
    <NotificationsProvider initialNotifications={initial}>
      <NotificationBell />
      <p>Outside</p>
    </NotificationsProvider>
  );

const bell = () => screen.getByRole('button', { name: /^Notifications/ });

beforeEach(() => mockNavigate.mockClear());

test('shows the unread count on the bell', () => {
  renderBell();

  expect(bell()).toHaveAccessibleName('Notifications, 2 unread');
  expect(bell()).toHaveTextContent('2');
});

test('hides the badge when everything is read', () => {
  renderBell(notifications.map((n) => ({ ...n, read: true })));

  expect(bell()).toHaveAccessibleName('Notifications');
  expect(bell()).not.toHaveTextContent(/\d/);
});

test('opens and closes the dropdown from the bell', () => {
  renderBell();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  userEvent.click(bell());
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(bell()).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('Payment failed')).toBeInTheDocument();

  userEvent.click(bell());
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('closes on Escape and on a click outside', () => {
  renderBell();

  userEvent.click(bell());
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(bell()).toHaveFocus();

  userEvent.click(bell());
  userEvent.click(screen.getByText('Outside'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('clicking a notification marks it read and opens its link', () => {
  renderBell();

  userEvent.click(bell());
  userEvent.click(screen.getByRole('button', { name: /Payment failed/ }));

  expect(mockNavigate).toHaveBeenCalledWith('/billing');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(bell()).toHaveAccessibleName('Notifications, 1 unread');
});

test('"Mark all as read" clears the badge', () => {
  renderBell();

  userEvent.click(bell());
  userEvent.click(screen.getByRole('button', { name: /Mark all as read/ }));

  expect(bell()).toHaveAccessibleName('Notifications');
  expect(
    screen.queryByRole('button', { name: /Mark all as read/ })
  ).not.toBeInTheDocument();
});

test('read notifications stay read after a reload', () => {
  const { unmount } = renderBell();
  userEvent.click(bell());
  userEvent.click(screen.getByRole('button', { name: /Mark all as read/ }));
  unmount();

  renderBell(); // same starting data, but saved state wins
  expect(bell()).toHaveAccessibleName('Notifications');
});
