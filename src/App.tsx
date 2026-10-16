import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { routeConfig } from './config/routes';
import { ROUTES } from './constants';
import RequireAuth from './components/auth/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { SubscriptionProvider } from './context/SubscriptionContext';

const Login = lazy(() => import('./pages/Login'));

export default function App() {
  return (
    <div className="app">
      <AuthProvider>
        <SubscriptionProvider>
          <NotificationsProvider>
            <Suspense fallback={<div className="page-loader">Loading...</div>}>
              <Routes>
                <Route path={ROUTES.LOGIN} element={<Login />} />

                {/* Every page inside this route needs a signed-in user */}
                <Route element={<RequireAuth />}>
                  {routeConfig.map(({ path, component: Component }) => (
                    <Route key={path} path={path} element={<Component />} />
                  ))}
                  <Route
                    path="*"
                    element={<Navigate to={ROUTES.DASHBOARD} replace />}
                  />
                </Route>
              </Routes>
            </Suspense>
          </NotificationsProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </div>
  );
}
