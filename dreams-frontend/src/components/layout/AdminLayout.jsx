import { SidebarProvider } from '../../context/SidebarContext';
import { PageTransition, SkipLinks, KeyboardShortcuts, ScreenReaderAnnouncements } from '../features';

const AdminLayout = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <SkipLinks />
        <KeyboardShortcuts />
        <ScreenReaderAnnouncements />
        <div id="admin-content" tabIndex={-1}>
          <PageTransition variant="fade">
            {children}
          </PageTransition>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;

