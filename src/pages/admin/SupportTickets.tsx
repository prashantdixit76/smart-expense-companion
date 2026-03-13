import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TicketCheck, Clock, AlertCircle, CheckCircle2, MessageSquare, User, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'bg-yellow-500/20 text-yellow-600', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-600', icon: AlertCircle },
  resolved: { label: 'Resolved', color: 'bg-green-500/20 text-green-600', icon: CheckCircle2 },
};

export default function SupportTickets() {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const { data: tickets, refetch } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filteredTickets = tickets?.filter((t: any) => filter === 'all' || t.status === filter) || [];

  const openCount = tickets?.filter((t: any) => t.status === 'open').length || 0;

  const handleUpdate = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      const updates: any = {};
      if (reply.trim()) updates.admin_reply = reply.trim();
      if (newStatus) updates.status = newStatus;
      if (Object.keys(updates).length === 0) {
        toast.error('No changes to save');
        setSaving(false);
        return;
      }
      const { error } = await supabase.from('support_tickets').update(updates).eq('id', selectedTicket.id);
      if (error) throw error;
      toast.success('Ticket updated!');
      setSelectedTicket(null);
      setReply('');
      setNewStatus('');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TicketCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Support Tickets</h1>
            <p className="text-xs text-muted-foreground">{openCount} open tickets</p>
          </div>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTickets.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">No tickets found</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((t: any) => {
            const sc = statusConfig[t.status] || statusConfig.open;
            const Icon = sc.icon;
            return (
              <Card key={t.id} className="border-border/30 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => { setSelectedTicket(t); setReply(t.admin_reply || ''); setNewStatus(t.status); }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm text-foreground">{t.subject}</h3>
                    <Badge className={`${sc.color} text-[10px] shrink-0 gap-1`}>
                      <Icon className="w-3 h-3" /> {sc.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.message}</p>
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {t.name}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {t.email}</span>
                    {t.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {t.phone}</span>}
                    {(t as any).source && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {(t as any).source === 'login_page' ? '📍 Login Page' : '📍 Dashboard'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="w-4 h-4" /> Ticket Details
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Subject</p>
                <p className="text-sm font-semibold">{selectedTicket.subject}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Message</p>
                <p className="text-sm">{selectedTicket.message}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div><p className="text-muted-foreground">Name</p><p className="font-medium">{selectedTicket.name}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selectedTicket.email}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{selectedTicket.phone || '-'}</p></div>
                <div><p className="text-muted-foreground">Source</p><p className="font-medium">{(selectedTicket as any).source === 'login_page' ? '📍 Login Page' : '📍 Dashboard'}</p></div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Admin Reply</label>
                <Textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Write a reply..." maxLength={2000} />
              </div>
              <Button onClick={handleUpdate} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Update Ticket'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
