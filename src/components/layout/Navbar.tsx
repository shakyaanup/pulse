import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';
import { useSubscription } from '../../context/SubscriptionContext';
import { mockCurrentUser } from '../../services/mockData';

interface NavbarProps {
  pageTitle: string;
}

const Navbar = ({ pageTitle }: NavbarProps) => {
  const { subscription } = useSubscription();

  return (
    <div className="navbar">
      <h1 className="navbar__title">{pageTitle}</h1>

      <div className="navbar__actions">
        <NotificationBell />
        <ProfileMenu user={mockCurrentUser} planName={subscription.plan.name} />
      </div>
    </div>
  );
};

export default Navbar;
