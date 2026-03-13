import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Mail, Phone, Calendar, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  selected_plan: string | null;
  plan_price: number | null;
  plan_duration: string | null;
}

const SignupRequests = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPendingUsers((data || []) as PendingUser[]);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (user: PendingUser) => {
    await supabase.from('profiles').update({ status: 'approved' }).eq('id', user.id);
    await supabase.from('system_logs').insert({ action: 'User Approved', details: `${user.full_name} (${user.email}) approved`, user_name: 'Admin' });
    toast.success(`${user.full_name} approved!`);
    fetchPending();
  };

  const handleReject = async (user: PendingUser) => {
    await supabase.from('profiles').update({ status: 'rejected' }).eq('id', user.id);
    await supabase.from('system_logs').insert({ action: 'User Rejected', details: `${user.full_name} (${user.email}) rejected`, user_name: 'Admin' });
    toast.info(`${user.full_name} rejected.`);
    fetchPending();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Signup Requests</h1>
        <Badge variant={pendingUsers.length > 0 ? 'destructive' : 'secondary'}>
          {pendingUsers.length} pending
        </Badge>
      </div>

      {pendingUsers.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-income mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground">No pending signup requests.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingUsers.map((u) => (
            <Card key={u.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{u.full_name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</span>
                      {u.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {(() => { try { return format(parseISO(u.created_at), 'dd MMM yyyy'); } catch { return 'N/A'; } })()}
                      </span>
                    </div>
                    {u.selected_plan && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1">
                          <Crown className="w-3 h-3" />
                          <span className="capitalize">{u.selected_plan}</span> — ₹{u.plan_price} / {u.plan_duration}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1" onClick={() => handleApprove(u)}>
                      <CheckCircle className="w-3 h-3" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleReject(u)}>
                      <XCircle className="w-3 h-3" /> Reject
                    </Button>
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

export default SignupRequests;
