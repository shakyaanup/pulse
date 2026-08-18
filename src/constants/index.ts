import { LayoutDashboard, BarChart2, CreditCard, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const APP_NAME = 'Pulse';

export const ROUTES = {
  DASHBOARD: '/',
  ANALYTICS: '/analytics',
  BILLING: '/billing',
  USERS: '/users',
} as const;

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Analytics', path: ROUTES.ANALYTICS, icon: BarChart2 },
  { label: 'Billing', path: ROUTES.BILLING, icon: CreditCard },
  { label: 'Users', path: ROUTES.USERS, icon: Users },
];
