import {
  LayoutDashboard, UserCheck, Users, ShieldCheck, Activity, Settings, LogOut, Bell
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAppStore } from '@/store/useAppStore';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const menuItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Signup Requests', url: '/admin/requests', icon: UserCheck },
  { title: 'User Management', url: '/admin/users', icon: Users },
  { title: 'Roles & Permissions', url: '/admin/roles', icon: ShieldCheck },
  { title: 'System Activity', url: '/admin/activity', icon: Activity },
  { title: 'Notifications', url: '/admin/notifications', icon: Activity },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { adminLogout, adminUser, users } = useAppStore();
  const navigate = useNavigate();
  const pendingCount = users.filter(u => u.status === 'pending').length;

  const handleLogout = () => {
    adminLogout();
    navigate('/admin');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            {!collapsed && 'Admin Menu'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <span className="flex items-center gap-2">
                          {item.title}
                          {item.title === 'Signup Requests' && pendingCount > 0 && (
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">{pendingCount}</Badge>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && adminUser && (
          <div className="px-4 py-3 mt-auto">
            <p className="text-xs text-sidebar-foreground/70 truncate">{adminUser.fullName}</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">{adminUser.email}</p>
            <Badge variant="secondary" className="mt-1 text-[10px] capitalize">{adminUser.role.replace('_', ' ')}</Badge>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          {!collapsed && 'Logout'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
