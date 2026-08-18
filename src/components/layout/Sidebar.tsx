import { NavLink } from 'react-router-dom';
import { APP_NAME, NAV_ITEMS } from '../../constants';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="20" y="20" width="160" height="160" rx="32" ry="32" />
          <path
            id="pulsePath"
            d="M40 100 L70 100 L85 75 L100 135 L120 65 L140 100 L160 100"
            strokeDasharray="300"
            strokeDashoffset="300"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="300"
              to="0"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
          <circle cx="160" cy="100" r="5">
            <animate
              attributeName="r"
              values="5;8;5"
              dur="1.2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="1;0.6;1"
              dur="1.2s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
        <span>{APP_NAME}</span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? 'sidebar__link sidebar__link--active'
                  : 'sidebar__link'
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
