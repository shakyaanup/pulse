import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '.';
import { AuthProvider } from '../../context/AuthContext';
import { DEMO_PASSWORD, mockCurrentUser } from '../../services/mockData';

const mockNavigate = jest.fn();
let mockLocationState: unknown = null;

jest.mock(
  'react-router-dom',
  () => ({
    Navigate: ({ to }: { to: string }) => <p>Redirect to {to}</p>,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/login', state: mockLocationState }),
  }),
  { virtual: true }
);

beforeEach(() => {
  mockNavigate.mockClear();
  mockLocationState = null;
});

const renderLogin = () =>
  render(
    <AuthProvider>
      <Login />
    </AuthProvider>
  );

const email = () => screen.getByLabelText('Email');
const password = () => screen.getByLabelText('Password');
const signIn = () => screen.getByRole('button', { name: 'Sign in' });

test('asks for both fields before sending anything', () => {
  renderLogin();

  userEvent.click(signIn());

  expect(screen.getByRole('alert')).toHaveTextContent(
    'Enter your email and password.'
  );
  expect(email()).toHaveAttribute('aria-invalid', 'true');
});

test('shows an error for a wrong password', async () => {
  renderLogin();

  userEvent.type(email(), mockCurrentUser.email);
  userEvent.type(password(), 'wrong-password');
  userEvent.click(signIn());

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Incorrect email or password.'
  );
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('the demo account signs in and returns to the page you wanted', async () => {
  mockLocationState = { from: { pathname: '/billing' } };
  renderLogin();

  userEvent.click(screen.getByRole('button', { name: 'Fill in demo account' }));
  expect(email()).toHaveValue(mockCurrentUser.email);
  expect(password()).toHaveValue(DEMO_PASSWORD);

  userEvent.click(signIn());

  await screen.findByText('Redirect to /billing'); // now signed in
  expect(mockNavigate).toHaveBeenCalledWith('/billing', { replace: true });
});

test('already signed in: goes straight to the dashboard', () => {
  render(
    <AuthProvider initialUser={mockCurrentUser}>
      <Login />
    </AuthProvider>
  );

  expect(screen.getByText('Redirect to /')).toBeInTheDocument();
});
