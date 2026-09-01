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
  features: string[];
  isPopular: boolean;
  isCurrent: boolean;
}

export interface Subscription {
  id: string;
  plan: Plan;
  status: 'active' | 'past_due' | 'cancelled' | 'trailing';
  currentPeriodEnd: string;
  nextBillingDate: string;
  seats: number;
}

export interface MetricCard {
  label: string;
  value: number;
  change: number; // percentage, positive or negative
  trend: 'up' | 'down' | 'neutral';
  format: 'currency' | 'percentage' | 'number';
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  planName: string;
  downloadUrl: string;
}