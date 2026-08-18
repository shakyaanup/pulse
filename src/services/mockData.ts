import { MetricCard, User } from '../types';

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
