import { Outlet, Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { AdminSidebar } from '@/components/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const AdminLayout = () => {
  const { adminAuthenticated } = useAppStore();

  if (!adminAuthenticated) return <Navigate to="/admin" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/50 px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30 md:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-3" />
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
