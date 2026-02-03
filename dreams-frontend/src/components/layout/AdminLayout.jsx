import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import { PageTransition, SkipLinks, KeyboardShortcuts, ScreenReaderAnnouncements } from '../features';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';

const AdminLayoutContent = ({ children }) => {
  const { mainContentMargin, mainContentWidth } = useSidebar();

  return (
    <div className="flex">
      <AdminSidebar />
      <AdminNavbar />
      <main 
        id="admin-content"
        tabIndex={-1}
        className="flex-1 min-h-screen transition-all duration-300 ease-in-out pt-16 relative overflow-hidden"
        style={{ 
          marginLeft: mainContentMargin,
          width: mainContentWidth
        }}
      >
        <PageTransition variant="fade">
          {children}
        </PageTransition>
      </main>
    </div>
  );
};

const AdminLayout = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <SkipLinks />
        <KeyboardShortcuts />
        <ScreenReaderAnnouncements />
        <AdminLayoutContent>
            {children}
        </AdminLayoutContent>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;

