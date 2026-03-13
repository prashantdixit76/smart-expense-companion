import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TicketPlus, Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'bg-yellow-500/20 text-yellow-600', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-600', icon: AlertCircle },
  resolved: { label: 'Resolved', color: 'bg-green-500/20 text-green-600', icon: CheckCircle2 },
};

export default function RaiseTicket() {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: tickets, refetch } = useQuery({
    queryKey: ['my-tickets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
        source: 'dashboard',
      } as any);
      if (error) throw error;
      toast.success('Ticket raised successfully!');
      setSubject('');
      setMessage('');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-28 md:pb-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <TicketPlus className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Raise a Ticket</h1>
          <p className="text-xs text-muted-foreground">Report any issue to the admin</p>
        </div>
      </div>

      <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Submit Your Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" maxLength={100} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" maxLength={255} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number (optional)" maxLength={20} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject *</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief subject of your issue" maxLength={200} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Describe your issue *</label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Explain your problem in detail..." rows={4} maxLength={2000} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full gap-2">
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {tickets && tickets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Your Tickets</h2>
          {tickets.map((t: any) => {
            const sc = statusConfig[t.status] || statusConfig.open;
            const Icon = sc.icon;
            return (
              <Card key={t.id} className="border-border/30 bg-card/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm text-foreground">{t.subject}</h3>
                    <Badge className={`${sc.color} text-[10px] shrink-0 gap-1`}>
                      <Icon className="w-3 h-3" /> {sc.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.message}</p>
                  {t.admin_reply && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
                      <p className="text-[10px] font-semibold text-primary mb-1">Admin Reply:</p>
                      <p className="text-xs text-foreground">{t.admin_reply}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
