import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { User } from '../types';
import { login as loginRequest } from '../services/authService';
import { usePersistentState } from '../hooks/usePersistentState';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export const AuthProvider = ({
  children,
  initialUser = null,
}: AuthProviderProps) => {
  // The "session": saved, so you stay signed in across reloads. A real app
  // would store a token (ideally in an httpOnly cookie), not the user object.
  const [user, setUser] = usePersistentState<User | null>(
    'session',
    initialUser
  );

  // Errors from the service (wrong password) are passed on to the caller,
  // which shows them in the form
  const login = useCallback(
    async (email: string, password: string) => {
      setUser(await loginRequest(email, password));
    },
    [setUser]
  );

  const logout = useCallback(() => setUser(null), [setUser]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
};
