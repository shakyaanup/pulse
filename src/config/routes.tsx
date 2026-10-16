import { lazy } from 'react';
import { ROUTES } from '../constants';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Billing = lazy(() => import('../pages/Billing'));
const UserManagement = lazy(() => import('../pages/UserManagement'));

export interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType>;
}

export const routeConfig: RouteConfig[] = [
  {
    path: ROUTES.DASHBOARD,
    component: Dashboard,
  },
  {
    path: ROUTES.ANALYTICS,
    component: Analytics,
  },
  {
    path: ROUTES.BILLING,
    component: Billing,
  },
  {
    path: ROUTES.USERS,
    component: UserManagement,
  },
];
