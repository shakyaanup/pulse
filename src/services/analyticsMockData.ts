import {
  AnalyticsData,
  DateRange,
  MetricCard,
  PlanBreakdown,
  RevenueByPlanPoint,
  TopPage,
  TrafficPoint,
  TrafficSource,
} from '../types';

// Mock analytics data. getAnalyticsData() stands in for a real API call such as
// apiClient.get<AnalyticsData>(`/analytics?range=${range}`), so the page will not
// need to change when a backend exists.

// The mock "today" -- lines up with the other mock data, which ends in Dec 2024
const END_DATE = new Date(2024, 11, 31);

type BucketUnit = 'day' | 'week' | 'month';

const RANGE_CONFIG: Record<DateRange, { points: number; unit: BucketUnit }> = {
  '7d': { points: 7, unit: 'day' },
  '30d': { points: 30, unit: 'day' },
  '90d': { points: 13, unit: 'week' },
  '12m': { points: 12, unit: 'month' },
};

const DAYS_PER_BUCKET: Record<BucketUnit, number> = {
  day: 1,
  week: 7,
  month: 30,
};

// % change vs the previous period of the same length
const PERIOD_CHANGE: Record<
  DateRange,
  { visitors: number; signups: number; conversion: number; revenue: number }
> = {
  '7d': { visitors: 4.3, signups: 6.1, conversion: 1.7, revenue: 3.2 },
  '30d': { visitors: 9.8, signups: 12.4, conversion: 2.4, revenue: 12.5 },
  '90d': { visitors: 18.2, signups: 15.7, conversion: -2.1, revenue: 21.3 },
  '12m': { visitors: 64.5, signups: 71.2, conversion: 4.1, revenue: 88.9 },
};

const CHURN_RATE: Record<DateRange, Record<PlanBreakdown['plan'], number>> = {
  '7d': { Starter: 0.8, Growth: 0.4, Enterprise: 0.1 },
  '30d': { Starter: 3.1, Growth: 1.8, Enterprise: 0.6 },
  '90d': { Starter: 8.7, Growth: 5.2, Enterprise: 1.9 },
  '12m': { Starter: 24.5, Growth: 14.8, Enterprise: 5.3 },
};

const SOURCE_SHARES: { name: string; share: number }[] = [
  { name: 'Organic Search', share: 0.38 },
  { name: 'Direct', share: 0.24 },
  { name: 'Referral', share: 0.16 },
  { name: 'Social', share: 0.13 },
  { name: 'Email', share: 0.09 },
];

const PAGES: {
  path: string;
  share: number;
  avgTimeSeconds: number;
  bounceRate: number;
}[] = [
  { path: '/', share: 0.52, avgTimeSeconds: 48, bounceRate: 41.2 },
  { path: '/pricing', share: 0.31, avgTimeSeconds: 96, bounceRate: 28.5 },
  { path: '/features', share: 0.24, avgTimeSeconds: 74, bounceRate: 33.9 },
  { path: '/docs', share: 0.19, avgTimeSeconds: 212, bounceRate: 18.4 },
  { path: '/blog', share: 0.15, avgTimeSeconds: 138, bounceRate: 56.7 },
  { path: '/signup', share: 0.09, avgTimeSeconds: 65, bounceRate: 22.1 },
];

// Paying customers are a snapshot, not a total over the range
const CUSTOMERS: Record<PlanBreakdown['plan'], number> = {
  Starter: 1240,
  Growth: 410,
  Enterprise: 62,
};

// Deterministic "noise" so every range has a believable, repeatable shape
const wave = (i: number, seed: number) =>
  1 + 0.15 * Math.sin(i * 0.9 + seed) + 0.1 * Math.sin(i * 0.37 + seed * 2);

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

const round1 = (value: number) => Math.round(value * 10) / 10;

const shortDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const longDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

// The date bucket i is labelled with (i = 0 is the oldest): the day itself,
// the last day of the week, or the 1st of the month
const bucketDate = (range: DateRange, i: number): Date => {
  const { points, unit } = RANGE_CONFIG[range];
  const stepsBack = points - 1 - i;

  if (unit === 'month') {
    return new Date(END_DATE.getFullYear(), END_DATE.getMonth() - stepsBack, 1);
  }

  const date = new Date(END_DATE);
  date.setDate(date.getDate() - stepsBack * DAYS_PER_BUCKET[unit]);
  return date;
};

const bucketLabel = (range: DateRange, date: Date): string => {
  const { unit } = RANGE_CONFIG[range];
  if (unit === 'month') {
    return date.toLocaleDateString('en-US', { month: 'short' });
  }
  if (range === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return shortDate(date);
};

const buildTraffic = (range: DateRange): TrafficPoint[] => {
  const { points, unit } = RANGE_CONFIG[range];
  const days = DAYS_PER_BUCKET[unit];

  return Array.from({ length: points }, (_, i) => {
    const growth = 1 + (i / points) * 0.25;
    const visitors = Math.round(900 * days * wave(i, 0) * growth);
    const conversion = 0.035 + 0.005 * Math.sin(i * 0.5);

    return {
      label: bucketLabel(range, bucketDate(range, i)),
      visitors,
      signups: Math.round(visitors * conversion),
    };
  });
};

const buildRevenueByPlan = (range: DateRange): RevenueByPlanPoint[] => {
  const { points, unit } = RANGE_CONFIG[range];
  const days = DAYS_PER_BUCKET[unit];

  return Array.from({ length: points }, (_, i) => {
    const growth = 1 + (i / points) * 0.2;
    const revenue = (dailyBase: number, seed: number) =>
      Math.round(dailyBase * days * wave(i, seed) * growth);

    return {
      label: bucketLabel(range, bucketDate(range, i)),
      starter: revenue(320, 1),
      growth: revenue(720, 2),
      enterprise: revenue(560, 3),
    };
  });
};

export const getAnalyticsData = (range: DateRange): AnalyticsData => {
  const traffic = buildTraffic(range);
  const revenueByPlan = buildRevenueByPlan(range);
  const change = PERIOD_CHANGE[range];

  const totalVisitors = sum(traffic.map((p) => p.visitors));
  const totalSignups = sum(traffic.map((p) => p.signups));

  const planRevenue: Record<PlanBreakdown['plan'], number> = {
    Starter: sum(revenueByPlan.map((p) => p.starter)),
    Growth: sum(revenueByPlan.map((p) => p.growth)),
    Enterprise: sum(revenueByPlan.map((p) => p.enterprise)),
  };
  const totalRevenue = sum(Object.values(planRevenue));

  const metrics: MetricCard[] = [
    {
      label: 'Visitors',
      value: totalVisitors,
      change: change.visitors,
      trend: change.visitors >= 0 ? 'up' : 'down',
      format: 'number',
    },
    {
      label: 'Sign-ups',
      value: totalSignups,
      change: change.signups,
      trend: change.signups >= 0 ? 'up' : 'down',
      format: 'number',
    },
    {
      label: 'Conversion Rate',
      value: round1((totalSignups / totalVisitors) * 100),
      change: change.conversion,
      trend: change.conversion >= 0 ? 'up' : 'down',
      format: 'percentage',
    },
    {
      label: 'Revenue',
      value: totalRevenue,
      change: change.revenue,
      trend: change.revenue >= 0 ? 'up' : 'down',
      format: 'currency',
    },
  ];

  const trafficSources: TrafficSource[] = SOURCE_SHARES.map(
    ({ name, share }) => ({
      name,
      visitors: Math.round(totalVisitors * share),
    })
  );

  // Each visitor views ~1.8 pages, so page views add up to more than visitors
  const topPages: TopPage[] = PAGES.map(
    ({ path, share, avgTimeSeconds, bounceRate }) => ({
      path,
      views: Math.round(totalVisitors * share * 1.8),
      avgTimeSeconds,
      bounceRate,
    })
  );

  const planBreakdown: PlanBreakdown[] = (
    Object.keys(planRevenue) as PlanBreakdown['plan'][]
  ).map((plan) => ({
    plan,
    customers: CUSTOMERS[plan],
    revenue: planRevenue[plan],
    share: round1((planRevenue[plan] / totalRevenue) * 100),
    churnRate: CHURN_RATE[range][plan],
  }));

  const { points, unit } = RANGE_CONFIG[range];
  const periodStart =
    unit === 'month'
      ? bucketDate(range, 0)
      : new Date(
          END_DATE.getFullYear(),
          END_DATE.getMonth(),
          END_DATE.getDate() - (points * DAYS_PER_BUCKET[unit] - 1)
        );

  return {
    periodLabel: `${longDate(periodStart)} – ${longDate(END_DATE)}`,
    metrics,
    traffic,
    revenueByPlan,
    trafficSources,
    topPages,
    planBreakdown,
  };
};
