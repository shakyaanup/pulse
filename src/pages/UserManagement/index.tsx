import { PageWrapper } from '../../components/layout';
import { Card, UserTable, UserFilters } from '../../components/common';

const UserManagement = () => {
  return (
    <PageWrapper pageTitle="Users">
      <div className="user-management">
        <UserFilters />
        <Card>
          <UserTable />
        </Card>
      </div>
    </PageWrapper>
  );
};

export default UserManagement;
