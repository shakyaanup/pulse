import { User } from '../../types';
import { USER_STATUS_BADGE } from '../../constants';
import { capitalize, formatDate, getInitials } from '../../utils';
import Badge from './Badge';
import Button from './Button';

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onToggleSuspend: (userId: string) => void;
  emptyMessage?: string;
}

const COLUMN_COUNT = 5;

const UserTable = ({
  users,
  isLoading,
  onToggleSuspend,
  emptyMessage = 'No users found.',
}: UserTableProps) => {
  return (
    <table className="user-table">
      <thead>
        <tr>
          <th>User</th>
          <th>Role</th>
          <th>Status</th>
          <th>Joined</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          <tr>
            <td colSpan={COLUMN_COUNT} className="user-table__empty">
              Loading users...
            </td>
          </tr>
        ) : users.length === 0 ? (
          <tr>
            <td colSpan={COLUMN_COUNT} className="user-table__empty">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          users.map((user) => {
            const isSuspended = user.status === 'suspended';

            return (
              <tr key={user.id}>
                <td className="user-table__cell--user">
                  <div className="user-table__user-cell">
                    <div className="user-table__avatar">
                      {getInitials(user.name)}
                    </div>
                    <div className="user-table__user-info">
                      <span className="user-table__name">{user.name}</span>
                      <span className="user-table__email">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="user-table__cell--role">
                  <span className="user-table__role">
                    {capitalize(user.role)}
                  </span>
                </td>
                <td className="user-table__cell--status">
                  <Badge
                    label={user.status}
                    variant={USER_STATUS_BADGE[user.status]}
                  />
                </td>
                <td className="user-table__cell--date">
                  <span className="user-table__date">
                    {formatDate(user.createdAt)}
                  </span>
                </td>
                <td className="user-table__cell--actions">
                  <div className="user-table__actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      title="Editing is coming soon"
                    >
                      Edit
                    </Button>
                    <Button
                      variant={isSuspended ? 'secondary' : 'danger'}
                      size="sm"
                      onClick={() => onToggleSuspend(user.id)}
                    >
                      {isSuspended ? 'Reactivate' : 'Suspend'}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
};

export default UserTable;
