import { render, screen } from '@testing-library/react';
import RequireAuth from './RequireAuth';
import { AuthProvider } from '../../context/AuthContext';
import { mockCurrentUser } from '../../services/mockData';

// Stand-ins that show what the router *would* do
jest.mock(
  'react-router-dom',
  () => ({
    Navigate: ({ to, state }: { to: string; state?: unknown }) => (
      <p>
        Redirect to {to} from {JSON.stringify(state)}
      </p>
    ),
    Outlet: () => <p>Protected page</p>,
    useLocation: () => ({ pathname: '/billing' }),
  }),
  { virtual: true }
);

test('signed out: redirects to /login, remembering the page', () => {
  render(
    <AuthProvider>
      <RequireAuth />
    </AuthProvider>
  );

  expect(screen.getByText(/Redirect to \/login/)).toHaveTextContent(
    '"pathname":"/billing"'
  );
  expect(screen.queryByText('Protected page')).not.toBeInTheDocument();
});

test('signed in: shows the page', () => {
  render(
    <AuthProvider initialUser={mockCurrentUser}>
      <RequireAuth />
    </AuthProvider>
  );

  expect(screen.getByText('Protected page')).toBeInTheDocument();
});
