import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import { PageTransition, SkipLinks, KeyboardShortcuts, ScreenReaderAnnouncements } from '../features';
import ClientSidebar from './ClientSidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

const ClientLayoutContent = ({ children }) => {
    const { mainContentMargin, mainContentWidth } = useSidebar();

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
            <SkipLinks />
            <KeyboardShortcuts />
            <ScreenReaderAnnouncements />
            <Header />
            <div className="flex flex-1 pt-20 lg:pt-0">
                <ClientSidebar />
                <main
                    id="client-content"
                    tabIndex={-1}
                    className="flex-1 min-h-screen transition-all duration-300 ease-in-out relative overflow-hidden pb-16 lg:pb-0"
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
            <BottomNavigation />
        </div>
    );
};

const ClientLayout = ({ children }) => {
    return (
        <SidebarProvider>
            <ClientLayoutContent>
                {children}
            </ClientLayoutContent>
        </SidebarProvider>
    );
};

export default ClientLayout;
