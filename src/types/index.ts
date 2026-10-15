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
  seatLimit: number | null; // null = unlimited
  isPopular: boolean;
  isCurrent: boolean;
}

export interface Subscription {
  id: string;
  plan: Plan;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
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

// Analytics

export type DateRange = '7d' | '30d' | '90d' | '12m';

export interface TrafficPoint {
  label: string;
  visitors: number;
  signups: number;
}

export interface RevenueByPlanPoint {
  label: string;
  starter: number;
  growth: number;
  enterprise: number;
}

export interface TrafficSource {
  name: string;
  visitors: number;
}

export interface TopPage {
  path: string;
  views: number;
  avgTimeSeconds: number;
  bounceRate: number;
}

export interface PlanBreakdown {
  plan: Plan['name'];
  customers: number;
  revenue: number;
  share: number;
  churnRate: number;
}

export interface AnalyticsData {
  periodLabel: string;
  metrics: MetricCard[];
  traffic: TrafficPoint[];
  revenueByPlan: RevenueByPlanPoint[];
  trafficSources: TrafficSource[];
  topPages: TopPage[];
  planBreakdown: PlanBreakdown[];
}

// User management

export interface UserFilterValues {
  search: string;
  status: User['status'] | 'all';
  role: User['role'] | 'all';
}

// Notifications

export interface Notification {
  id: string;
  type: 'user' | 'billing' | 'alert' | 'report';
  title: string;
  message: string;
  createdAt: string; // ISO date-time
  read: boolean;
  link?: string; // route to open when the notification is clicked
}
