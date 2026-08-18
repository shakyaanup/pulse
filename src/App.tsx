import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { routeConfig } from './config/routes';
import { ROUTES } from './constants';

export default function App() {
  return (
    <div className="app">
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
    </div>
  );
}
