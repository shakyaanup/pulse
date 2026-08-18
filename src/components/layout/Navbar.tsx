import { Bell } from 'lucide-react';

interface NavbarProps {
  pageTitle: string;
}

const Navbar = ({ pageTitle }: NavbarProps) => {
  return (
    <div className="navbar">
      <h1 className="navbar__title">{pageTitle}</h1>

      <div className="navbar__actions">
        <button className="navbar__icon-btn" aria-label="Notification">
          <Bell size={18} />
        </button>
        <div className="navbar__avatar">
          <span>JD</span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
