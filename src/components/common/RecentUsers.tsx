import { formatDate } from '../../utils';
import Badge from './Badge';

type UserStatus = 'active' | 'inactive' | 'suspended';
type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

const statusVariantMap: Record<UserStatus, BadgeVariant> = {
  active: 'success',
  inactive: 'warning',
  suspended: 'danger',
};

interface RecentUsersProps {
  users: {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
    createdAt: string;
  }[];
}

const RecentUsers = ({ users }: RecentUsersProps) => {
  return (
    <div className="recent-users">
      {users.map((user) => (
        <div key={user.id} className="recent-users__row">
          <div className="recent-users__avatar">{user.name.charAt(0)}</div>
          <div className="recent-users__info">
            <span className="recent-users__name">{user.name}</span>
            <span className="recent-users__email">{user.email}</span>
          </div>
          <span className="recent-users__date">
            {formatDate(user.createdAt)}
          </span>
          <Badge label={user.status} variant={statusVariantMap[user.status]} />
        </div>
      ))}
    </div>
  );
};

export default RecentUsers;
