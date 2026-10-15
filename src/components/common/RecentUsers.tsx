import { USER_STATUS_BADGE } from '../../constants';
import { formatDate } from '../../utils';
import Badge from './Badge';

type UserStatus = keyof typeof USER_STATUS_BADGE;

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
          <Badge label={user.status} variant={USER_STATUS_BADGE[user.status]} />
        </div>
      ))}
    </div>
  );
};

export default RecentUsers;
