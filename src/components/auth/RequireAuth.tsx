import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants';

// A "layout route" that guards every page nested inside it in App.tsx.
// Signed in: render the page (<Outlet />). Signed out: go to the login page,
// remembering where the visitor was heading so they can be sent back.
const RequireAuth = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
