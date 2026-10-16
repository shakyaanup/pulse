import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { APP_NAME, NAV_ITEMS } from '../../constants';
import { Logo } from '../common';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Must match $bp-mobile in variables.scss
const DESKTOP_DRAWER_QUERY = '(min-width: 768px)';

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // While the phone drawer is open: move focus into it, close on Escape,
  // stop the page behind it from scrolling, and close it if the screen is
  // resized past the phone breakpoint (e.g. rotating a tablet)
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const wideScreen = window.matchMedia?.(DESKTOP_DRAWER_QUERY);
    const handleResize = () => {
      if (wideScreen?.matches) onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    wideScreen?.addEventListener('change', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      wideScreen?.removeEventListener('change', handleResize);
    };
  }, [isOpen, onClose]);

  return (
    <aside
      id="app-sidebar"
      className={clsx('sidebar', isOpen && 'sidebar--open')}
    >
      <div className="sidebar__logo">
        <Logo />
        <span className="sidebar__app-name">{APP_NAME}</span>
        <button
          ref={closeButtonRef}
          type="button"
          className="sidebar__close"
          aria-label="Close menu"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              onClick={isOpen ? onClose : undefined}
              className={({ isActive }) =>
                isActive
                  ? 'sidebar__link sidebar__link--active'
                  : 'sidebar__link'
              }
            >
              <Icon size={18} />
              <span className="sidebar__label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
