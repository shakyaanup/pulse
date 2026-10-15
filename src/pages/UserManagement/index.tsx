import { useEffect, useMemo, useState } from 'react';
import { PageWrapper } from '../../components/layout';
import { Button, Card, UserTable, UserFilters } from '../../components/common';
import { fetchUsers } from '../../services/usersService';
import { User, UserFilterValues } from '../../types';

const DEFAULT_FILTERS: UserFilterValues = {
  search: '',
  status: 'all',
  role: 'all',
};

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilterValues>(DEFAULT_FILTERS);
  // Bumping this number re-runs the effect below, which re-fetches
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // If the page unmounts (or the effect re-runs) before the request
    // finishes, ignore the stale response instead of setting state
    let ignore = false;

    fetchUsers()
      .then((data) => {
        if (!ignore) setUsers(data);
      })
      .catch(() => {
        if (!ignore) setError('Could not load users.');
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  // Derived data: recalculated from users + filters, never stored in state
  const filteredUsers = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return users.filter(
      (user) =>
        (query === '' ||
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)) &&
        (filters.status === 'all' || user.status === filters.status) &&
        (filters.role === 'all' || user.role === filters.role)
    );
  }, [users, filters]);

  const stats = useMemo(
    () =>
      isLoading || error
        ? null
        : {
            total: users.length,
            active: users.filter((u) => u.status === 'active').length,
            suspended: users.filter((u) => u.status === 'suspended').length,
          },
    [users, isLoading, error]
  );

  // Reset loading/error here, in the event handler, rather than inside the
  // effect -- the effect only talks to the "server"
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  };

  // Mock data only lives in memory; with a backend this would also send a
  // request such as apiClient.patch(`/users/${userId}`, { status })
  const handleToggleSuspend = (userId: string) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === 'suspended' ? 'active' : 'suspended',
            }
          : user
      )
    );
  };

  return (
    <PageWrapper pageTitle="Users">
      <div className="user-management">
        <UserFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          stats={stats}
        />
        <Card>
          {error ? (
            <div className="user-management__error">
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={handleRetry}>
                Try again
              </Button>
            </div>
          ) : (
            <>
              <UserTable
                users={filteredUsers}
                isLoading={isLoading}
                onToggleSuspend={handleToggleSuspend}
                emptyMessage="No users match your filters."
              />
              {!isLoading && (
                <p className="user-management__count">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
              )}
            </>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
};

export default UserManagement;
