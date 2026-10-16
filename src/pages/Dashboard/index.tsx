import { useEffect, useState } from 'react';
import { PageWrapper } from '../../components/layout';
import {
  Card,
  MetricCard,
  RevenueChart,
  RecentUsers,
} from '../../components/common';
import { mockMetrics, mockRevenueChart } from '../../services/mockData';
import { fetchUsers } from '../../services/usersService';
import { User } from '../../types';

const RECENT_USER_COUNT = 5;

const Dashboard = () => {
  // Loaded from the same service as the Users page, so edits and
  // suspensions made there show up here too
  const [recentUsers, setRecentUsers] = useState<User[] | null>(null);

  useEffect(() => {
    let ignore = false;
    fetchUsers().then((users) => {
      if (!ignore) setRecentUsers(users.slice(0, RECENT_USER_COUNT));
    });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <PageWrapper pageTitle="Dashboard">
      <div className="dashboard">
        <div
          className="dashboard__metrics"
          role="region"
          aria-label="Key metrics"
          tabIndex={0}
        >
          {mockMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
        <div className="dashboard__grid">
          <Card title="Revenue vs Target">
            <RevenueChart data={mockRevenueChart} />
          </Card>

          <Card title="Recent Users">
            {recentUsers ? (
              <RecentUsers users={recentUsers} />
            ) : (
              <p className="dashboard__loading">Loading users...</p>
            )}
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
