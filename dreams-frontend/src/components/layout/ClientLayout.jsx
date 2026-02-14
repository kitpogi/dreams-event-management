import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import { PageTransition, SkipLinks, KeyboardShortcuts, ScreenReaderAnnouncements } from '../features';
import ClientSidebar from './ClientSidebar';
import DashboardHeader from './DashboardHeader';
import DashboardBottomNavigation from './DashboardBottomNavigation';

const ClientLayoutContent = ({ children }) => {
    const { mainContentMargin, mainContentWidth, isMobile } = useSidebar();

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50/20 dark:from-[#0b1121] dark:via-[#0d1529] dark:to-[#0b1121] bg-fixed transition-colors duration-300 overflow-hidden relative">
            {/* Global Background Elements for seamless blending */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/20 dark:bg-blue-900/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-300/20 dark:bg-cyan-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-200/10 dark:bg-blue-900/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            <SkipLinks />
            <KeyboardShortcuts />
            <ScreenReaderAnnouncements />
            <DashboardHeader />
            <div className="flex flex-1 overflow-hidden relative z-10">
                <ClientSidebar />
                <main
                    id="client-content"
                    tabIndex={-1}
                    className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out relative pb-16 lg:pb-0 no-scrollbar"
                    style={{
                        marginLeft: isMobile ? 0 : mainContentMargin,
                        width: isMobile ? '100%' : mainContentWidth,
                        marginTop: '4rem' // Offset for fixed h-16 header
                    }}
                >
                    <PageTransition variant="fade">
                        {children}
                    </PageTransition>
                </main>
            </div>
            <DashboardBottomNavigation />
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
