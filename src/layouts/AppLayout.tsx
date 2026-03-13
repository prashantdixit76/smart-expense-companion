import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from '@/components/AppSidebar';
import { BottomNav } from '@/components/BottomNav';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { InstallButton } from '@/components/InstallButton';
import { Loader2, Wallet } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';

const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25 animate-float">
          <Wallet className="w-7 h-7 text-primary-foreground" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/30 px-4 bg-card/70 backdrop-blur-xl sticky top-0 z-30 md:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-1 hidden md:flex" />
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
                <Wallet className="w-4 h-4 text-primary-foreground" />
              </div>
              <h2 className="text-base font-bold text-foreground truncate">Smart Expense Tracker</h2>
            </div>
            <div className="flex items-center gap-2">
              <InstallButton />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
            <Outlet />
          </main>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
