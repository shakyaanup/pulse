// Global TypeScript for Pulse

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  avatarUrl?: string;
}

export interface Plan {
  id: string;
  name: 'Starter' | 'Growth' | 'Enterprise';
  price: number;
  interval: 'monthly' | 'yearly';
}

export interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  status: 'active' | 'past_due' | 'cancelled' | 'trailing';
  currentPeriodEnd: string;
}

export interface MetricCard {
  label: string;
  value: number;
  change: number; // percentage, positive or negative
  trend: 'up' | 'down' | 'neutral';
  format: 'currency' | 'percentage' | 'number';
}
