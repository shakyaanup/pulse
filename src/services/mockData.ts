import { ROUTES } from '../constants';
import {
  MetricCard,
  User,
  Plan,
  Subscription,
  Invoice,
  Notification,
} from '../types';

export const mockMetrics: MetricCard[] = [
  {
    label: 'Monthly Recurring Revenue',
    value: 48250,
    change: 12.5,
    trend: 'up',
    format: 'currency',
  },
  {
    label: 'Active Users',
    value: 2847,
    change: 8.2,
    trend: 'up',
    format: 'number',
  },
  {
    label: 'Churn Rate',
    value: 2.4,
    change: -0.5,
    trend: 'down',
    format: 'percentage',
  },
  {
    label: 'Avg Revenue Per User',
    value: 16.95,
    change: -1.2,
    trend: 'down',
    format: 'currency',
  },
];

export const mockRevenueChart = [
  { month: 'Jan', revenue: 4200, target: 2400 },
  { month: 'Feb', revenue: 3800, target: 2200 },
  { month: 'Mar', revenue: 5100, target: 2800 },
  { month: 'Apr', revenue: 4600, target: 2600 },
  { month: 'May', revenue: 5400, target: 3000 },
  { month: 'Jun', revenue: 7200, target: 3200 },
  { month: 'Jul', revenue: 6100, target: 3400 },
  { month: 'Aug', revenue: 7500, target: 3100 },
  { month: 'Sep', revenue: 6800, target: 3300 },
  { month: 'Oct', revenue: 8200, target: 3600 },
  { month: 'Nov', revenue: 9100, target: 3800 },
  { month: 'Dec', revenue: 10400, target: 4200 },
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Connor',
    email: 'sarah@acme.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-12',
    avatarUrl: '',
  },
  {
    id: '2',
    name: 'John Reese',
    email: 'john@initech.com',
    role: 'member',
    status: 'active',
    createdAt: '2024-02-08',
    avatarUrl: '',
  },
  {
    id: '3',
    name: 'Amy Pond',
    email: 'amy@umbrella.com',
    role: 'viewer',
    status: 'inactive',
    createdAt: '2024-03-15',
    avatarUrl: '',
  },
  {
    id: '4',
    name: 'Bruce Wayne',
    email: 'bruce@wayne.inc',
    role: 'admin',
    status: 'active',
    createdAt: '2024-03-22',
    avatarUrl: '',
  },
  {
    id: '5',
    name: 'Diana Prince',
    email: 'diana@themyscira.io',
    role: 'member',
    status: 'suspended',
    createdAt: '2024-04-01',
    avatarUrl: '',
  },
  {
    id: '6',
    name: 'Tony Stark',
    email: 'tony@stark.industries',
    role: 'admin',
    status: 'active',
    createdAt: '2024-04-18',
    avatarUrl: '',
  },
  {
    id: '7',
    name: 'Natasha Romanoff',
    email: 'natasha@shield.gov',
    role: 'member',
    status: 'active',
    createdAt: '2024-05-03',
    avatarUrl: '',
  },
  {
    id: '8',
    name: 'Peter Parker',
    email: 'peter@bugle.com',
    role: 'viewer',
    status: 'inactive',
    createdAt: '2024-05-19',
    avatarUrl: '',
  },
  {
    id: '9',
    name: 'Steve Rogers',
    email: 'steve@shield.gov',
    role: 'member',
    status: 'active',
    createdAt: '2024-06-07',
    avatarUrl: '',
  },
  {
    id: '10',
    name: 'Wanda Maximoff',
    email: 'wanda@avengers.io',
    role: 'viewer',
    status: 'suspended',
    createdAt: '2024-06-25',
    avatarUrl: '',
  },
];

//Array of 5 users for the dashboard
export const mockRecentUsers: Pick<
  User,
  'id' | 'name' | 'email' | 'status' | 'createdAt'
>[] = mockUsers.slice(0, 5);

export const mockPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'monthly',
    features: [
      'Up to 5 team members',
      '10,000 tracked events/mo',
      'Basic analytics dashboard',
      '7-day data retention',
      'Email support',
    ],
    seatLimit: 5,
    isPopular: false,
    isCurrent: true,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 79,
    interval: 'monthly',
    features: [
      'Up to 25 team members',
      '100,000 tracked events/mo',
      'Advanced analytics + charts',
      '90-day data retention',
      'Priority email support',
      'CSV exports',
      'Custom dashboards',
    ],
    seatLimit: 25,
    isPopular: true,
    isCurrent: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'monthly',
    features: [
      'Unlimited team members',
      'Unlimited tracked events',
      'Full analytics suite',
      '365-day data retention',
      'Dedicated account manager',
      'SSO & SAML',
      'Custom integrations',
      'SLA guarantee',
    ],
    seatLimit: null,
    isPopular: false,
    isCurrent: false,
  },
];

export const mockSubscription: Subscription = {
  id: 'sub_abc123',
  plan: mockPlans[0],
  status: 'active',
  currentPeriodEnd: '2025-01-31',
  nextBillingDate: '2025-02-01',
  seats: 4,
};

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-2024-012',
    date: '2024-12-01',
    amount: 79,
    status: 'paid',
    planName: 'Growth',
    downloadUrl: '#',
  },
  {
    id: 'INV-2024-011',
    date: '2024-11-01',
    amount: 79,
    status: 'paid',
    planName: 'Growth',
    downloadUrl: '#',
  },
  {
    id: 'INV-2024-010',
    date: '2024-10-01',
    amount: 79,
    status: 'paid',
    planName: 'Growth',
    downloadUrl: '#',
  },
  {
    id: 'INV-2024-009',
    date: '2024-09-01',
    amount: 79,
    status: 'failed',
    planName: 'Growth',
    downloadUrl: '#',
  },
  {
    id: 'INV-2024-008',
    date: '2024-08-01',
    amount: 29,
    status: 'paid',
    planName: 'Starter',
    downloadUrl: '#',
  },
  {
    id: 'INV-2024-007',
    date: '2024-07-01',
    amount: 29,
    status: 'paid',
    planName: 'Starter',
    downloadUrl: '#',
  },
];

// Timestamps are relative to when the app loads, so the dropdown always shows
// recent-looking times like "12 minutes ago"
const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'alert',
    title: 'Payment failed',
    message:
      "We couldn't charge your card. Update your payment method to avoid interruption.",
    createdAt: minutesAgo(12),
    read: false,
    link: ROUTES.BILLING,
  },
  {
    id: 'n2',
    type: 'user',
    title: 'New team member',
    message: 'Natasha Romanoff joined your workspace.',
    createdAt: minutesAgo(60),
    read: false,
    link: ROUTES.USERS,
  },
  {
    id: 'n3',
    type: 'billing',
    title: 'Seat limit almost reached',
    message: "You're using 4 of 5 seats on the Starter plan.",
    createdAt: minutesAgo(3 * 60),
    read: false,
    link: ROUTES.BILLING,
  },
  {
    id: 'n4',
    type: 'report',
    title: 'Weekly report ready',
    message: 'Visitors are up 9.8% compared with last week.',
    createdAt: minutesAgo(26 * 60),
    read: true,
    link: ROUTES.ANALYTICS,
  },
  {
    id: 'n5',
    type: 'user',
    title: 'User suspended',
    message: "Diana Prince's account was suspended by an admin.",
    createdAt: minutesAgo(2 * 24 * 60),
    read: true,
    link: ROUTES.USERS,
  },
  {
    id: 'n6',
    type: 'billing',
    title: 'Invoice paid',
    message: 'Your December invoice was paid. Thank you!',
    createdAt: minutesAgo(5 * 24 * 60),
    read: true,
    link: ROUTES.BILLING,
  },
];
