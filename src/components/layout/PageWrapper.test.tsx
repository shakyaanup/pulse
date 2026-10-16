import { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageWrapper from './PageWrapper';
import { NotificationsProvider } from '../../context/NotificationsContext';
import { SubscriptionProvider } from '../../context/SubscriptionContext';

// Names starting with "mock" may be used inside jest.mock() factories
type MockLinkProps = {
  to: string;
  children: ReactNode;
  className?: string | ((state: { isActive: boolean }) => string);
  [key: string]: unknown;
};

// CRA's Jest can't load React Router v7, so fake the three pieces the
// layout uses
jest.mock(
  'react-router-dom',
  () => {
    const Link = ({ to, children, className, ...rest }: MockLinkProps) => (
      <a
        href={to}
        className={
          typeof className === 'function'
            ? className({ isActive: to === '/' })
            : className
        }
        {...rest}
      >
        {children}
      </a>
    );
    return { NavLink: Link, Link, useNavigate: () => jest.fn() };
  },
  { virtual: true }
);

const renderLayout = () =>
  render(
    <SubscriptionProvider>
      <NotificationsProvider>
        <PageWrapper pageTitle="Dashboard">
          <p>Page content</p>
        </PageWrapper>
      </NotificationsProvider>
    </SubscriptionProvider>
  );

const menuButton = () => screen.getByRole('button', { name: 'Open menu' });
const sidebar = () => document.getElementById('app-sidebar') as HTMLElement;
const overlay = () => document.querySelector('.layout__overlay');

afterEach(() => {
  document.body.style.overflow = '';
});

test('the menu button opens the drawer and moves focus into it', () => {
  renderLayout();
  expect(sidebar()).not.toHaveClass('sidebar--open');
  expect(menuButton()).toHaveAttribute('aria-expanded', 'false');

  userEvent.click(menuButton());

  expect(sidebar()).toHaveClass('sidebar--open');
  expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('button', { name: 'Close menu' })).toHaveFocus();
  expect(overlay()).toBeInTheDocument();
});

test('the page behind the open drawer cannot scroll', () => {
  renderLayout();

  userEvent.click(menuButton());
  expect(document.body.style.overflow).toBe('hidden');

  userEvent.click(screen.getByRole('button', { name: 'Close menu' }));
  expect(document.body.style.overflow).toBe('');
});

test('Escape closes the drawer and returns focus to the menu button', () => {
  renderLayout();

  userEvent.click(menuButton());
  fireEvent.keyDown(document, { key: 'Escape' });

  expect(sidebar()).not.toHaveClass('sidebar--open');
  expect(menuButton()).toHaveFocus();
});

test('clicking the overlay closes the drawer', () => {
  renderLayout();

  userEvent.click(menuButton());
  userEvent.click(overlay() as HTMLElement);

  expect(sidebar()).not.toHaveClass('sidebar--open');
  expect(overlay()).not.toBeInTheDocument();
});

test('choosing a page closes the drawer', () => {
  renderLayout();

  userEvent.click(menuButton());
  userEvent.click(screen.getByRole('link', { name: 'Billing' }));

  expect(sidebar()).not.toHaveClass('sidebar--open');
});
