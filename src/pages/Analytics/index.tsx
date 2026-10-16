import { useMemo, useState } from 'react';
import { PageWrapper } from '../../components/layout';
import {
  Badge,
  Card,
  Column,
  DataTable,
  MetricCard,
} from '../../components/common';
import {
  DATE_RANGE_OPTIONS,
  DateRangePicker,
  RevenueByPlanChart,
  TrafficChart,
  TrafficSourcesChart,
} from '../../components/analytics';
import { getAnalyticsData } from '../../services/analyticsMockData';
import { DateRange, PlanBreakdown, TopPage } from '../../types';
import { formatCurrency } from '../../utils';

const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;

const topPageColumns: Column<TopPage>[] = [
  {
    key: 'path',
    header: 'Page',
    render: (row) => <span className="analytics__path">{row.path}</span>,
  },
  {
    key: 'views',
    header: 'Views',
    align: 'right',
    render: (row) => row.views.toLocaleString(),
  },
  {
    key: 'avgTimeSeconds',
    header: 'Avg. time',
    align: 'right',
    render: (row) => formatDuration(row.avgTimeSeconds),
  },
  {
    key: 'bounceRate',
    header: 'Bounce',
    align: 'right',
    render: (row) => `${row.bounceRate}%`,
  },
];

const planColumns: Column<PlanBreakdown>[] = [
  {
    key: 'plan',
    header: 'Plan',
    render: (row) => <span className="analytics__plan">{row.plan}</span>,
  },
  {
    key: 'customers',
    header: 'Customers',
    align: 'right',
    render: (row) => row.customers.toLocaleString(),
  },
  {
    key: 'revenue',
    header: 'Revenue',
    align: 'right',
    render: (row) => formatCurrency(row.revenue),
  },
  {
    key: 'share',
    header: 'Share',
    align: 'right',
    render: (row) => `${row.share}%`,
  },
  {
    key: 'churnRate',
    header: 'Churn',
    align: 'right',
    render: (row) => (
      <Badge
        label={`${row.churnRate}%`}
        variant={row.churnRate >= 10 ? 'danger' : 'neutral'}
      />
    ),
  },
];

const Analytics = () => {
  // The one piece of state on the page: everything below is derived from it
  const [range, setRange] = useState<DateRange>('30d');

  // Recompute only when the range changes, not on every render
  const data = useMemo(() => getAnalyticsData(range), [range]);

  const rangeDescription = DATE_RANGE_OPTIONS.find(
    (option) => option.value === range
  )?.description;

  return (
    <PageWrapper pageTitle="Analytics">
      <div className="analytics">
        <div className="analytics__header">
          <div>
            <h2 className="analytics__title">{rangeDescription}</h2>
            <p className="analytics__period">{data.periodLabel}</p>
          </div>
          <DateRangePicker value={range} onChange={setRange} />
        </div>

        <div
          className="analytics__metrics"
          role="region"
          aria-label="Key metrics"
          tabIndex={0}
        >
          {data.metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              metric={metric}
              comparisonLabel="vs previous period"
            />
          ))}
        </div>

        <div className="analytics__grid">
          <Card title="Visitors & Sign-ups">
            <TrafficChart data={data.traffic} />
          </Card>
          <Card title="Traffic Sources">
            <TrafficSourcesChart data={data.trafficSources} />
          </Card>
        </div>

        <Card title="Revenue by Plan">
          <RevenueByPlanChart data={data.revenueByPlan} />
        </Card>

        <div className="analytics__grid analytics__grid--even">
          <Card title="Top Pages">
            <DataTable
              columns={topPageColumns}
              rows={data.topPages}
              rowKey="path"
              initialSort={{ key: 'views', direction: 'desc' }}
            />
          </Card>
          <Card title="Plan Breakdown">
            <DataTable
              columns={planColumns}
              rows={data.planBreakdown}
              rowKey="plan"
              initialSort={{ key: 'revenue', direction: 'desc' }}
            />
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Analytics;
