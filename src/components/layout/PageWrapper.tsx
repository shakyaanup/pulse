import { useCallback, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface PageWrapperProps {
  pageTitle: string;
  children: React.ReactNode;
}

const PageWrapper = ({ pageTitle, children }: PageWrapperProps) => {
  // Only used on phones, where the sidebar becomes a slide-out drawer.
  // Each page renders its own PageWrapper, so navigating closes the drawer.
  const [isNavOpen, setIsNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeNav = useCallback(() => {
    setIsNavOpen(false);
    menuButtonRef.current?.focus(); // back to the ☰ button that opened it
  }, []);

  return (
    <div className="layout">
      <Sidebar isOpen={isNavOpen} onClose={closeNav} />
      {isNavOpen && (
        <div
          className="layout__overlay"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}
      <div className="layout__main">
        <Navbar
          pageTitle={pageTitle}
          isNavOpen={isNavOpen}
          onMenuClick={() => setIsNavOpen(true)}
          menuButtonRef={menuButtonRef}
        />
        <main className="layout__content">{children}</main>
      </div>
    </div>
  );
};

export default PageWrapper;
