import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function ImportantMessages() {
  const [deleting, setDeleting] = useState(false);

  const { data: messages, isLoading, refetch } = useQuery({
    queryKey: ['admin-important-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_important', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleDeleteOne = async (id: string) => {
    try {
      await supabase.from('user_notifications').delete().eq('notification_id', id);
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      toast.success('Message deleted');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleClearAll = async () => {
    setDeleting(true);
    try {
      const ids = messages?.map(m => m.id) || [];
      if (ids.length > 0) {
        for (const id of ids) {
          await supabase.from('user_notifications').delete().eq('notification_id', id);
        }
        const { error } = await supabase.from('notifications').delete().in('id', ids);
        if (error) throw error;
      }
      toast.success('All important messages cleared!');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Important Messages</h1>
            <p className="text-xs text-muted-foreground">{messages?.length || 0} important messages sent</p>
          </div>
        </div>
        {(messages?.length || 0) > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all important messages?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Yes, delete all'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {!messages || messages.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">No important messages sent yet</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m: any) => (
            <Card key={m.id} className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                      {m.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{m.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {format(new Date(m.created_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteOne(m.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
