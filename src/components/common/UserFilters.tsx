import { Search } from 'lucide-react';
import { UserFilterValues } from '../../types';
import Button from './Button';

interface UserFiltersProps {
  filters: UserFilterValues;
  onChange: (filters: UserFilterValues) => void;
  onReset: () => void;
  stats: { total: number; active: number; suspended: number } | null;
}

const UserFilters = ({
  filters,
  onChange,
  onReset,
  stats,
}: UserFiltersProps) => {
  const hasActiveFilters =
    filters.search !== '' || filters.status !== 'all' || filters.role !== 'all';

  // Shows a dash until the users have loaded
  const statValue = (value?: number) => (stats ? value : '–');

  return (
    <div className="user-filters">
      <div className="user-filters__stats">
        <div className="user-filters__stat">
          <span className="user-filters__stat-value">
            {statValue(stats?.total)}
          </span>
          <span className="user-filters__stat-label">Total users</span>
        </div>
        <div className="user-filters__stat">
          <span className="user-filters__stat-value">
            {statValue(stats?.active)}
          </span>
          <span className="user-filters__stat-label">Active</span>
        </div>
        <div className="user-filters__stat">
          <span className="user-filters__stat-value">
            {statValue(stats?.suspended)}
          </span>
          <span className="user-filters__stat-label">Suspended</span>
        </div>
      </div>
      {/* Controls row */}
      <div className="user-filters__controls">
        {/* Search input */}
        <div className="user-filters__search">
          <Search size={15} className="user-filters__search-icon" />
          <input
            type="search"
            placeholder="Search by name or email..."
            aria-label="Search users"
            className="user-filters__input"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>
        <select
          className="user-filters__select"
          aria-label="Filter by status"
          value={filters.status}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as UserFilterValues['status'],
            })
          }
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          className="user-filters__select"
          aria-label="Filter by role"
          value={filters.role}
          onChange={(e) =>
            onChange({
              ...filters,
              role: e.target.value as UserFilterValues['role'],
            })
          }
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
        {hasActiveFilters && (
          <Button variant="secondary" size="sm" onClick={onReset}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserFilters;
