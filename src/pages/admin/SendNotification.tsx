import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send, Bell, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface SentNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

const SendNotification = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSent();
  }, []);

  const fetchSent = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setSentNotifications(data);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }
    if (!user) return;

    setSending(true);
    try {
      // 1. Insert notification
      const { data: notif, error: notifErr } = await supabase
        .from('notifications')
        .insert({ title: title.trim(), message: message.trim(), sent_by: user.id })
        .select()
        .single();

      if (notifErr) throw notifErr;

      // 2. Get all approved users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('status', 'approved');

      if (profiles && profiles.length > 0) {
        const userNotifs = profiles.map(p => ({
          notification_id: notif.id,
          user_id: p.user_id,
        }));

        const { error: insertErr } = await supabase
          .from('user_notifications')
          .insert(userNotifs);

        if (insertErr) throw insertErr;
      }

      // 3. Log
      await supabase.from('system_logs').insert({
        action: 'notification_sent',
        details: `Notification "${title}" sent to ${profiles?.length || 0} users`,
        user_id: user.id,
        user_name: user.email,
      });

      toast.success(`Notification sent to ${profiles?.length || 0} users!`);
      setTitle('');
      setMessage('');
      fetchSent();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Send Notification</h1>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            Broadcast to All Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              placeholder="e.g. System Update, New Feature..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              placeholder="Write your notification message here..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/500</p>
          </div>
          <Button onClick={handleSend} disabled={sending} className="w-full">
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send to All Users
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Sent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : sentNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No notifications sent yet</p>
          ) : (
            <div className="space-y-3">
              {sentNotifications.map(n => (
                <div key={n.id} className="p-3 rounded-lg bg-muted/50 border border-border/30">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {format(new Date(n.created_at), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SendNotification;
