import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import UserManagement from '.';

// The sidebar/navbar aren't under test (and need a router), so render the
// page content without them
jest.mock('../../components/layout', () => ({
  PageWrapper: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const renderPage = async () => {
  render(<UserManagement />);
  // Wait for the mock request to finish
  await screen.findByText('Sarah Connor');
};

const tableRows = () => screen.getAllByRole('row').slice(1); // skip header

test('shows a loading state, then the users', async () => {
  render(<UserManagement />);
  expect(screen.getByText('Loading users...')).toBeInTheDocument();

  await screen.findByText('Sarah Connor');
  expect(tableRows()).toHaveLength(10);
  expect(screen.getByText('Showing 10 of 10 users')).toBeInTheDocument();
});

test('searches by name or email', async () => {
  await renderPage();

  userEvent.type(screen.getByLabelText('Search users'), 'shield');

  expect(tableRows()).toHaveLength(2); // Natasha + Steve, matched by email
  expect(screen.getByText('Showing 2 of 10 users')).toBeInTheDocument();
});

test('filters by status and role, and clears filters', async () => {
  await renderPage();

  userEvent.selectOptions(screen.getByLabelText('Filter by status'), 'active');
  userEvent.selectOptions(screen.getByLabelText('Filter by role'), 'admin');
  expect(tableRows()).toHaveLength(3); // Sarah, Bruce, Tony

  userEvent.type(screen.getByLabelText('Search users'), 'nobody');
  expect(screen.getByText('No users match your filters.')).toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(tableRows()).toHaveLength(10);
});

test('suspends and reactivates a user, updating the stats', async () => {
  await renderPage();
  const row = screen.getByText('Sarah Connor').closest('tr');
  if (!row) throw new Error('Row for Sarah Connor not found');
  const activeStat = () =>
    screen.getByText('Active', { selector: '.user-filters__stat-label' })
      .previousSibling;

  expect(activeStat()).toHaveTextContent('6');

  userEvent.click(within(row).getByRole('button', { name: 'Suspend' }));
  expect(within(row).getByText('suspended')).toBeInTheDocument();
  expect(activeStat()).toHaveTextContent('5');

  userEvent.click(within(row).getByRole('button', { name: 'Reactivate' }));
  expect(within(row).getByText('active')).toBeInTheDocument();
  expect(activeStat()).toHaveTextContent('6');
});
