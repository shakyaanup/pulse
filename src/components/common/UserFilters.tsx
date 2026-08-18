import { Search } from 'lucide-react';

const UserFilters = () => {
  return (
    <div className="user-filters">
      <div className="user-filters__stats">
        <div className="user-filters__stat">
          <span className="user-filters__stat-value">20</span>
          <span className="user-filters__stat-label">Total users</span>
        </div>
        <div className="user-filters__stat">
          <span className="user-filters__stat-value">10</span>
          <span className="user-filters__stat-label">Active users</span>
        </div>
      </div>
      {/* Controls row */}
      <div className="user-filters__controls">
        {/* Search input */}
        <div className="user-filters__search">
          <Search size={15} className="user-filters__search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="user-filters__input"
          />
        </div>
        <select className="user-filters__select">
          <option>All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Viewer</option>
        </select>
        <select className="user-filters__select">
          <option>Admin</option>
          <option>Member</option>
          <option>Viewer</option>
        </select>
      </div>
    </div>
  );
};

export default UserFilters;
