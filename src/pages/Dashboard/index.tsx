import { PageWrapper } from '../../components/layout';
import {
  Card,
  MetricCard,
  RevenueChart,
  RecentUsers,
} from '../../components/common';
import {
  mockMetrics,
  mockRevenueChart,
  mockRecentUsers,
} from '../../services/mockData';

const Dashboard = () => {
  return (
    <PageWrapper pageTitle="Dashboard">
      <div className="dashboard">
        <div className="dashboard__metrics">
          {mockMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
        <div className="dashboard__grid">
          <Card title="Renenue vs Target">
            <RevenueChart data={mockRevenueChart} />
          </Card>

          <Card title="Recent Users">
            <RecentUsers users={mockRecentUsers} />
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
