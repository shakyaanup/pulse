import { RefObject } from 'react';
import { Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { clearAppStorage } from '../../services/storage';

interface NavbarProps {
  pageTitle: string;
  isNavOpen: boolean;
  onMenuClick: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}

const Navbar = ({
  pageTitle,
  isNavOpen,
  onMenuClick,
  menuButtonRef,
}: NavbarProps) => {
  const { subscription } = useSubscription();
  const { user, logout } = useAuth();

  // Wipes everything the demo has saved and starts again from the mock data
  // (this also signs you out)
  const handleResetDemo = () => {
    clearAppStorage();
    window.location.reload();
  };

  return (
    <div className="navbar">
      <div className="navbar__start">
        {/* Only shown on phones (see layout.scss) */}
        <button
          ref={menuButtonRef}
          type="button"
          className="navbar__icon-btn navbar__menu-btn"
          aria-label="Open menu"
          aria-controls="app-sidebar"
          aria-expanded={isNavOpen}
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
        <h1 className="navbar__title">{pageTitle}</h1>
      </div>

      <div className="navbar__actions">
        <NotificationBell />
        {user && (
          <ProfileMenu
            user={user}
            planName={subscription.plan.name}
            onLogout={logout}
            onResetDemo={handleResetDemo}
          />
        )}
      </div>
    </div>
  );
};

export default Navbar;
