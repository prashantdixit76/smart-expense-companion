import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Search, Loader2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface LogEntry { id: string; action: string; user_id: string | null; user_name: string | null; details: string | null; timestamp: string; }

const actionColor: Record<string, string> = {
  'User Signup': 'bg-primary/10 text-primary',
  'User Login': 'bg-income/10 text-income',
  'User Approved': 'bg-income/10 text-income',
  'User Rejected': 'bg-expense/10 text-expense',
  'User Disabled': 'bg-owe/10 text-owe',
  'User Enabled': 'bg-income/10 text-income',
  'User Deleted': 'bg-expense/10 text-expense',
};

const SystemActivity = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchLogs = async () => {
    const { data } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(200);
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleClearAll = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('system_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      toast.success('All activity logs cleared!');
      setLogs([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear logs');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    try {
      const { error } = await supabase.from('system_logs').delete().eq('id', id);
      if (error) throw error;
      setLogs(prev => prev.filter(l => l.id !== id));
      toast.success('Log deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filtered = logs.filter(l =>
    !search || l.action.toLowerCase().includes(search.toLowerCase()) || (l.details || '').toLowerCase().includes(search.toLowerCase()) || (l.user_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">System Activity</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{logs.length} logs</Badge>
          {logs.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all activity logs?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone. All system activity logs will be permanently deleted.</AlertDialogDescription>
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
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

      {filtered.length === 0 ? (
        <Card className="border-border/50"><CardContent className="py-12 text-center"><Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No activity logs yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <Card key={log.id} className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Badge className={`text-[10px] shrink-0 ${actionColor[log.action] || 'bg-muted text-muted-foreground'}`}>{log.action}</Badge>
                    <div className="min-w-0"><p className="text-sm text-foreground truncate">{log.details}</p><p className="text-xs text-muted-foreground">by {log.user_name || 'System'}</p></div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{(() => { try { return format(parseISO(log.timestamp), 'dd MMM HH:mm'); } catch { return ''; } })()}</span>
                    <button onClick={() => handleDeleteOne(log.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SystemActivity;
