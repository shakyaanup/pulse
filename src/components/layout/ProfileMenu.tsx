import { Link } from 'react-router-dom';
import { CreditCard, LogOut, RotateCcw, Users } from 'lucide-react';
import { Avatar, Badge } from '../common';
import { ROUTES } from '../../constants';
import { useDropdown } from '../../hooks/useDropdown';
import { User } from '../../types';
import { capitalize, formatDate } from '../../utils';

interface ProfileMenuProps {
  user: User;
  planName: string;
  onLogout: () => void;
  onResetDemo: () => void;
}

const ProfileMenu = ({
  user,
  planName,
  onLogout,
  onResetDemo,
}: ProfileMenuProps) => {
  const { isOpen, toggle, close, containerRef, triggerRef } = useDropdown();

  // Signing out clears the user, and RequireAuth then sends the visitor to
  // the login page -- no navigation needed here
  const handleLogout = () => {
    close();
    onLogout();
  };

  return (
    <div className="profile-menu" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="profile-menu__trigger"
        aria-label={`Account menu for ${user.name}`}
        aria-haspopup="dialog"
        aria-controls="profile-menu-panel"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <Avatar name={user.name} src={user.avatarUrl} size="sm" />
      </button>

      {isOpen && (
        <div
          id="profile-menu-panel"
          className="profile-menu__panel"
          role="dialog"
          aria-label="Account"
        >
          <div className="profile-menu__header">
            <Avatar name={user.name} src={user.avatarUrl} size="lg" />
            <div className="profile-menu__identity">
              <span className="profile-menu__name">{user.name}</span>
              <span className="profile-menu__email">{user.email}</span>
              <Badge label={capitalize(user.role)} variant="neutral" />
            </div>
          </div>

          <dl className="profile-menu__details">
            <div className="profile-menu__detail">
              <dt>Plan</dt>
              <dd>{planName}</dd>
            </div>
            <div className="profile-menu__detail">
              <dt>Member since</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
          </dl>

          <nav className="profile-menu__links" aria-label="Account">
            <Link
              to={ROUTES.USERS}
              className="profile-menu__link"
              onClick={close}
            >
              <Users size={16} />
              Team members
            </Link>
            <Link
              to={ROUTES.BILLING}
              className="profile-menu__link"
              onClick={close}
            >
              <CreditCard size={16} />
              Billing &amp; plan
            </Link>
          </nav>

          <div className="profile-menu__footer">
            <button
              type="button"
              className="profile-menu__link"
              onClick={onResetDemo}
            >
              <RotateCcw size={16} />
              Reset demo data
            </button>
            <button
              type="button"
              className="profile-menu__link profile-menu__link--danger"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
