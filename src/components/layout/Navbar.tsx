import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';
import { mockCurrentUser, mockSubscription } from '../../services/mockData';

interface NavbarProps {
  pageTitle: string;
}

const Navbar = ({ pageTitle }: NavbarProps) => {
  return (
    <div className="navbar">
      <h1 className="navbar__title">{pageTitle}</h1>

      <div className="navbar__actions">
        <NotificationBell />
        <ProfileMenu
          user={mockCurrentUser}
          planName={mockSubscription.plan.name}
        />
      </div>
    </div>
  );
};

export default Navbar;
