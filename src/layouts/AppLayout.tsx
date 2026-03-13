import { Outlet, Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { AppSidebar } from '@/components/AppSidebar';
import { BottomNav } from '@/components/BottomNav';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

const AppLayout = () => {
  const { isAuthenticated } = useAppStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/50 px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30 md:px-6">
            <div className="flex items-center">
              <SidebarTrigger className="mr-3 hidden md:flex" />
              <h2 className="text-lg font-semibold text-foreground truncate">Smart Expense Tracker</h2>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
            <Outlet />
          </main>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
