import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Activity, Search, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

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

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(200);
      setLogs(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = logs.filter(l =>
    !search || l.action.toLowerCase().includes(search.toLowerCase()) || (l.details || '').toLowerCase().includes(search.toLowerCase()) || (l.user_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">System Activity</h1>
        <Badge variant="secondary">{logs.length} logs</Badge>
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
                  <div className="flex items-start gap-3 min-w-0">
                    <Badge className={`text-[10px] shrink-0 ${actionColor[log.action] || 'bg-muted text-muted-foreground'}`}>{log.action}</Badge>
                    <div className="min-w-0"><p className="text-sm text-foreground truncate">{log.details}</p><p className="text-xs text-muted-foreground">by {log.user_name || 'System'}</p></div>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{(() => { try { return format(parseISO(log.timestamp), 'dd MMM HH:mm'); } catch { return ''; } })()}</span>
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
