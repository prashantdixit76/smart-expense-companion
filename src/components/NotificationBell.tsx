import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface Notification {
  id: string;
  notification_id: string;
  read: boolean;
  created_at: string;
  notification: {
    title: string;
    message: string;
    created_at: string;
  };
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_notifications')
      .select('id, notification_id, read, created_at, notification:notifications(title, message, created_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data as unknown as Notification[]);
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from('user_notifications')
      .update({ read: true })
      .in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      markAllRead();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border/50">
          <h4 className="font-semibold text-sm">Notifications</h4>
        </div>
        <ScrollArea className="max-h-72">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                >
                  <p className="font-medium text-sm text-foreground">{n.notification?.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.notification?.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {n.notification?.created_at ? format(new Date(n.notification.created_at), 'MMM dd, hh:mm a') : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
