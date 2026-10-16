import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, Logo } from '../../components/common';
import { APP_NAME, ROUTES } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { DEMO_PASSWORD, mockCurrentUser } from '../../services/mockData';

interface LocationState {
  from?: { pathname: string };
}

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Where RequireAuth was trying to take the visitor, if anywhere
  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ??
    ROUTES.DASHBOARD;

  // Already signed in (e.g. typed /login in the address bar)
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Stop the browser's default full-page form submission
    event.preventDefault();

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      // replace: the Back button shouldn't return to the login form
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail(mockCurrentUser.email);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  return (
    <main className="login">
      <div className="login__card">
        <div className="login__brand">
          <Logo />
          <span>{APP_NAME}</span>
        </div>

        <h1 className="login__title">Sign in</h1>
        <p className="login__subtitle">
          Welcome back. Sign in to your dashboard.
        </p>

        {/* noValidate: we show our own error messages instead of the
            browser's built-in bubbles, so they match the design */}
        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span className="form-field__label">Email</span>
            <input
              className="form-field__input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Password</span>
            <input
              className="form-field__input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </label>

          {error && (
            <p id="login-error" className="form-error" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <div className="login__demo">
          <p>
            <strong>Demo account</strong>
            <br />
            {mockCurrentUser.email} / {DEMO_PASSWORD}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={fillDemoAccount}
          >
            Fill in demo account
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Login;
