import { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileMenu from './ProfileMenu';
import { User } from '../../types';

// CRA's Jest can't load React Router v7 -- a plain <a> is enough here
jest.mock(
  'react-router-dom',
  () => ({
    Link: ({
      to,
      children,
      ...rest
    }: {
      to: string;
      children: ReactNode;
      [key: string]: unknown;
    }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

const user: User = {
  id: 'me',
  name: 'Jane Doe',
  email: 'jane.doe@pulse.dev',
  role: 'admin',
  status: 'active',
  createdAt: '2023-11-02',
  avatarUrl: 'https://example.com/jane.jpg',
};

const renderMenu = (overrides: Partial<User> = {}) => {
  const { container } = render(
    <>
      <ProfileMenu user={{ ...user, ...overrides }} planName="Starter" />
      <p>Outside</p>
    </>
  );
  return { container };
};

const trigger = () =>
  screen.getByRole('button', { name: 'Account menu for Jane Doe' });

test('shows the photo when the user has one', () => {
  const { container } = renderMenu();

  const img = container.querySelector('img');
  expect(img).toHaveAttribute('src', 'https://example.com/jane.jpg');
  expect(trigger()).not.toHaveTextContent('JD');
});

test('shows initials when there is no photo', () => {
  const { container } = renderMenu({ avatarUrl: '' });

  expect(container.querySelector('img')).not.toBeInTheDocument();
  expect(trigger()).toHaveTextContent('JD');
});

test('falls back to initials when the photo fails to load', () => {
  const { container } = renderMenu();

  fireEvent.error(container.querySelector('img') as HTMLImageElement);
  expect(trigger()).toHaveTextContent('JD');
});

test('opens with the user details', () => {
  renderMenu();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  userEvent.click(trigger());

  expect(screen.getByRole('dialog', { name: 'Account' })).toBeInTheDocument();
  expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  expect(screen.getByText('jane.doe@pulse.dev')).toBeInTheDocument();
  expect(screen.getByText('Admin')).toBeInTheDocument();
  expect(screen.getByText('Starter')).toBeInTheDocument();
  expect(screen.getByText('Nov 2, 2023')).toBeInTheDocument();
});

test('links go to the right pages and close the menu', () => {
  renderMenu();

  userEvent.click(trigger());
  expect(screen.getByRole('link', { name: /Billing & plan/ })).toHaveAttribute(
    'href',
    '/billing'
  );
  expect(screen.getByRole('link', { name: /Team members/ })).toHaveAttribute(
    'href',
    '/users'
  );

  userEvent.click(screen.getByRole('link', { name: /Team members/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('log out closes the menu', () => {
  renderMenu();

  userEvent.click(trigger());
  userEvent.click(screen.getByRole('button', { name: /Log out/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('closes on Escape and on a click outside', () => {
  renderMenu();

  userEvent.click(trigger());
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger()).toHaveFocus();

  userEvent.click(trigger());
  userEvent.click(screen.getByText('Outside'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
