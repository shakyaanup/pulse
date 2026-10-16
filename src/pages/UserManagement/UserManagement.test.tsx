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

describe('editing a user', () => {
  const openEditFor = async (name: string) => {
    await renderPage();
    userEvent.click(screen.getByRole('button', { name: `Edit ${name}` }));
    return screen.getByRole('dialog', { name: 'Edit user' });
  };

  test('opens with the user’s current details', async () => {
    const dialog = await openEditFor('Sarah Connor');

    expect(within(dialog).getByLabelText('Name')).toHaveValue('Sarah Connor');
    expect(within(dialog).getByLabelText('Email')).toHaveValue(
      'sarah@acme.com'
    );
    expect(within(dialog).getByLabelText('Role')).toHaveValue('admin');
  });

  test('saves changes to the list and closes', async () => {
    const dialog = await openEditFor('Sarah Connor');

    const name = within(dialog).getByLabelText('Name');
    userEvent.clear(name);
    userEvent.type(name, 'Sarah J. Connor');
    userEvent.selectOptions(within(dialog).getByLabelText('Role'), 'viewer');
    userEvent.click(
      within(dialog).getByRole('button', { name: 'Save changes' })
    );

    expect(await screen.findByText('Sarah J. Connor')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const row = screen.getByText('Sarah J. Connor').closest('tr');
    expect(row).toHaveTextContent('Viewer');
  });

  test('checks the fields before saving', async () => {
    const dialog = await openEditFor('Sarah Connor');

    userEvent.clear(within(dialog).getByLabelText('Name'));
    const email = within(dialog).getByLabelText('Email');
    userEvent.clear(email);
    userEvent.type(email, 'not-an-email');
    userEvent.click(
      within(dialog).getByRole('button', { name: 'Save changes' })
    );

    expect(within(dialog).getByText('Enter a name.')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Enter a valid email address/)
    ).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
  });

  test('shows the server’s error for an email that is taken', async () => {
    const dialog = await openEditFor('Sarah Connor');

    const email = within(dialog).getByLabelText('Email');
    userEvent.clear(email);
    userEvent.type(email, 'john@initech.com');
    userEvent.click(
      within(dialog).getByRole('button', { name: 'Save changes' })
    );

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Another user already has that email address.'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument(); // still open
  });

  test('Cancel closes without saving', async () => {
    const dialog = await openEditFor('Sarah Connor');

    userEvent.type(within(dialog).getByLabelText('Name'), ' Changed');
    userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
  });
});

test('suspensions are saved and survive a reload', async () => {
  const { unmount } = render(<UserManagement />);
  await screen.findByText('Sarah Connor');
  const row = screen.getByText('Sarah Connor').closest('tr') as HTMLElement;
  userEvent.click(within(row).getByRole('button', { name: 'Suspend' }));
  // Let the background save finish before "reloading"
  await new Promise((resolve) => setTimeout(resolve, 500));
  unmount();

  render(<UserManagement />);
  await screen.findByText('Sarah Connor');
  const reloadedRow = screen.getByText('Sarah Connor').closest('tr');
  expect(reloadedRow).toHaveTextContent('suspended');
});
