import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface PageWrapperProps {
  pageTitle: string;
  children: React.ReactNode;
}

const PageWrapper = ({ pageTitle, children }: PageWrapperProps) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout__main">
        <Navbar pageTitle={pageTitle} />
        <main className="layout__content">{children}</main>
      </div>
    </div>
  );
};

export default PageWrapper;
