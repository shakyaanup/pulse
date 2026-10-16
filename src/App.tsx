import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { routeConfig } from './config/routes';
import { ROUTES } from './constants';
import { NotificationsProvider } from './context/NotificationsContext';
import { SubscriptionProvider } from './context/SubscriptionContext';

export default function App() {
  return (
    <div className="app">
      <SubscriptionProvider>
        <NotificationsProvider>
          <Suspense fallback={<div className="page-loader">Loading...</div>}>
            <Routes>
              {routeConfig.map(({ path, component: Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))}
              <Route
                path="*"
                element={<Navigate to={ROUTES.DASHBOARD} replace />}
              />
            </Routes>
          </Suspense>
        </NotificationsProvider>
      </SubscriptionProvider>
    </div>
  );
}
