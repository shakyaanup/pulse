import NotificationBell from './NotificationBell';

interface NavbarProps {
  pageTitle: string;
}

const Navbar = ({ pageTitle }: NavbarProps) => {
  return (
    <div className="navbar">
      <h1 className="navbar__title">{pageTitle}</h1>

      <div className="navbar__actions">
        <NotificationBell />
        <div className="navbar__avatar">
          <span>JD</span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
